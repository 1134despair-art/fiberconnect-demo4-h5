<template>
  <MultiOpmWiremap v-if="isMultiOpm && currentDevice" :device="currentDevice" />
  <div v-else class="app-container legacy-operation-page">
    <header class="header">
      <button @click="goBack" class="back-btn">
        <DeviceIcon name="back" style="font-size: 18px; vertical-align: middle" /> {{ t('common.back') }}
      </button>
      <div class="page-title">{{ t('deviceDetail.cableWiremap') }}</div>
    </header>

    <div class="content-flex hide-scrollbar">
      <div class="p-4">
        <div class="card mb-4">
          <h3 class="section-title">{{ t('deviceDetail.cableWiremap') }}</h3>

          <div v-if="isSmartOtdr" class="status-tip mt-3">
            <div class="tip-title">智能 OTDR 适配</div>
            <div class="tip-desc">当前页面沿用已有对线结构，仅补充智能 OTDR 入口适配，不额外创建新页面风格。</div>
          </div>

          <div class="row mt-3">
            <div class="label">{{ t('deviceDetail.cableStandard') }}</div>
            <div class="controls">
              <button class="seg-btn" :class="{ active: standard === 'T568B' }" @click="standard = 'T568B'">
                T568B
              </button>
              <button class="seg-btn" :class="{ active: standard === 'T568A' }" @click="standard = 'T568A'">
                T568A
              </button>
            </div>
          </div>

          <div class="rj45-card mt-3">
            <div class="rj45-title">RJ45</div>
            <div class="rj45-lines">
              <div v-for="pin in currentPinout" :key="pin.index" class="rj45-line">
                <div class="pin-index">{{ pin.index }}</div>
                <div class="pin-bar" :style="{ background: pin.bg }"></div>
                <div class="pin-status" :class="statusClass(pin.index)"></div>
              </div>
            </div>
          </div>

          <div class="legend mt-3">
            <div class="legend-item">
              <span class="legend-dot ok"></span>
              <span class="legend-text">连通</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot fail"></span>
              <span class="legend-text">断线</span>
            </div>
          </div>

          <div class="actions mt-3">
            <button class="primary-btn" @click="startTest">
              {{ t('deviceDetail.runTest') }}
            </button>
          </div>

          <div class="result-box mt-3">
            <div class="result-line">{{ resultText }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DeviceIcon from '@/components/DeviceIcon.vue'
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth, type Device } from '@/composables/useAuth'
import MultiOpmWiremap from '../multi-opm/MultiOpmWiremap.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { user } = useAuth()

const deviceId = computed(() => route.params.id as string)
const currentDevice = computed<Device | null>(() => user.value?.devices?.find(d => d.id === deviceId.value) || null)
const isSmartOtdr = computed(() => currentDevice.value?.deviceType === 'smart_otdr')
const isMultiOpm = computed(() => currentDevice.value?.deviceType === 'multi_opm_meter')
const standard = ref<'T568A' | 'T568B'>('T568B')

const stripeBg = (base: string, stripe: string) => {
  return `repeating-linear-gradient(45deg, ${base} 0px, ${base} 6px, ${stripe} 6px, ${stripe} 10px)`
}

const COLOR_WHITE = '#FFFFFF'
const COLOR_ORANGE = '#F59E0B'
const COLOR_GREEN = '#10B981'
const COLOR_BLUE = '#3B82F6'
const COLOR_BROWN = '#92400E'

const pinoutMap: Record<'T568A' | 'T568B', { index: number; bg: string }[]> = {
  T568B: [
    { index: 1, bg: stripeBg(COLOR_WHITE, COLOR_ORANGE) },
    { index: 2, bg: COLOR_ORANGE },
    { index: 3, bg: stripeBg(COLOR_WHITE, COLOR_GREEN) },
    { index: 4, bg: COLOR_BLUE },
    { index: 5, bg: stripeBg(COLOR_WHITE, COLOR_BLUE) },
    { index: 6, bg: COLOR_GREEN },
    { index: 7, bg: stripeBg(COLOR_WHITE, COLOR_BROWN) },
    { index: 8, bg: COLOR_BROWN }
  ],
  T568A: [
    { index: 1, bg: stripeBg(COLOR_WHITE, COLOR_GREEN) },
    { index: 2, bg: COLOR_GREEN },
    { index: 3, bg: stripeBg(COLOR_WHITE, COLOR_ORANGE) },
    { index: 4, bg: COLOR_BLUE },
    { index: 5, bg: stripeBg(COLOR_WHITE, COLOR_BLUE) },
    { index: 6, bg: COLOR_ORANGE },
    { index: 7, bg: stripeBg(COLOR_WHITE, COLOR_BROWN) },
    { index: 8, bg: COLOR_BROWN }
  ]
}

const currentPinout = computed(() => pinoutMap[standard.value])

type LineResult = 'unknown' | 'ok' | 'fail'
const lineResults = ref<Record<number, LineResult>>({
  1: 'unknown',
  2: 'unknown',
  3: 'unknown',
  4: 'unknown',
  5: 'unknown',
  6: 'unknown',
  7: 'unknown',
  8: 'unknown'
})

const resultText = computed(() => {
  const values = Object.values(lineResults.value)
  if (values.every(v => v === 'unknown')) return '未连接'
  if (values.some(v => v === 'fail')) return '对线失败'
  return '对线成功'
})

const storageKey = computed(() => `multi_opm_wire_result_${deviceId.value}_${standard.value}`)

const loadFromStorage = () => {
  const raw = sessionStorage.getItem(storageKey.value)
  if (!raw) {
    lineResults.value = { 1: 'unknown', 2: 'unknown', 3: 'unknown', 4: 'unknown', 5: 'unknown', 6: 'unknown', 7: 'unknown', 8: 'unknown' }
    return
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, LineResult>
    const next: Record<number, LineResult> = { 1: 'unknown', 2: 'unknown', 3: 'unknown', 4: 'unknown', 5: 'unknown', 6: 'unknown', 7: 'unknown', 8: 'unknown' }
    for (const k of Object.keys(next)) {
      const key = String(k)
      const v = parsed[key]
      if (v === 'ok' || v === 'fail' || v === 'unknown') next[Number(k)] = v
    }
    lineResults.value = next
  } catch {
    lineResults.value = { 1: 'unknown', 2: 'unknown', 3: 'unknown', 4: 'unknown', 5: 'unknown', 6: 'unknown', 7: 'unknown', 8: 'unknown' }
  }
}

watch(
  () => standard.value,
  () => {
    loadFromStorage()
  },
  { immediate: true }
)

const statusClass = (index: number) => {
  const v = lineResults.value[index]
  if (v === 'ok') return 'is-ok'
  if (v === 'fail') return 'is-fail'
  return 'is-unknown'
}

const startTest = () => {
  router.push(`/device/${deviceId.value}/seek?from=wiremap&standard=${standard.value}`)
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%);
  overflow: hidden;
}

.content-flex {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  height: 56px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #E5E7EB;
  position: relative;
  z-index: 10;
}

.back-btn {
  position: absolute;
  left: 16px;
  background: none;
  border: none;
  font-size: 16px;
  color: #2563EB;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  padding: 8px;
  border-radius: 6px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
}

.p-4 {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-3 {
  margin-top: 12px;
}

.card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.label {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.status-tip {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.tip-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.tip-desc {
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

.controls {
  display: flex;
  gap: 10px;
}

.seg-btn {
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
  color: #6B7280;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.seg-btn.active {
  background: #2563EB;
  border-color: #2563EB;
  color: #FFFFFF;
}

.rj45-card {
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 12px;
}

.rj45-title {
  font-size: 14px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 10px;
}

.rj45-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rj45-line {
  display: grid;
  grid-template-columns: 18px 1fr 18px;
  gap: 10px;
  align-items: center;
}

.pin-index {
  font-size: 12px;
  font-weight: 800;
  color: #6B7280;
  text-align: center;
}

.pin-bar {
  height: 10px;
  border-radius: 999px;
  border: 1px solid #D1D5DB;
}

.pin-status {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid #D1D5DB;
  background: #F3F4F6;
}

.pin-status.is-ok {
  background: #10B981;
  border-color: #10B981;
}

.pin-status.is-fail {
  background: #EF4444;
  border-color: #EF4444;
}

.legend {
  display: flex;
  gap: 14px;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.legend-dot.ok {
  background: #10B981;
}

.legend-dot.fail {
  background: #EF4444;
}

.legend-text {
  font-size: 12px;
  font-weight: 700;
  color: #6B7280;
}

.actions {
  display: flex;
}

.primary-btn {
  height: 44px;
  border-radius: 10px;
  border: none;
  background: #2563EB;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 800;
  padding: 0 18px;
  cursor: pointer;
}

.result-box {
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 12px;
}

.result-line {
  font-size: 13px;
  font-weight: 700;
  color: #6B7280;
}

</style>
