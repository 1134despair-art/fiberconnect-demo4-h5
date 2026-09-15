<template>
  <LightSourceOperationMultiOpm v-if="!isSmartOtdr" />

  <div v-else class="app-container">
    <SmartOtdrPageShell
      :title="t('deviceDetail.lightSource')"
      :subtitle="currentDevice?.name || ''"
      @back="goBack"
    >
      <main class="page-body">
        <section class="panel-card status-card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">{{ t('deviceDetail.lightSource') }}</h3>
              <div class="section-desc">{{ pageDescription }}</div>
            </div>
            <div class="status-badge" :class="{ on: lightState.isEnabled }">
              {{ lightState.isEnabled ? '开启' : '关闭' }}
            </div>
          </div>

          <div class="light-screen" :class="{ active: lightState.isEnabled }">
            <div class="screen-head">
              <span>LS</span>
              <span>{{ lightState.isEnabled ? lightState.frequencyMode : '关闭' }}</span>
            </div>

            <div class="screen-body">
              <div class="laser-graphic" :class="{ active: lightState.isEnabled }">
                <span class="laser-dot"></span>
                <span class="laser-line"></span>
              </div>

              <div class="screen-reading">
                <span class="reading-wave">{{ lightState.isEnabled ? lightState.wavelength : '--' }}</span>
                <span v-if="lightState.isEnabled" class="reading-unit">nm</span>
              </div>
            </div>

            <div class="screen-warning">
              {{ lightState.isEnabled ? '激光发射中，请勿直射人眼！' : '光源已关闭，开启后开始输出。' }}
            </div>
          </div>
        </section>

        <section class="panel-card action-card">
          <div class="card-title-row action-head">
            <div>
              <h3 class="section-title">功能操作</h3>
              <div class="section-desc">支持独立开启、切换波长和频率模式。</div>
            </div>
          </div>

          <div class="action-grid">
            <button class="action-btn primary" type="button" @click="toggleLightSource">
              {{ lightState.isEnabled ? '关闭' : '开启' }}
            </button>
            <button class="action-btn" type="button" @click="cycleWavelength">
              波长切换
            </button>
            <button class="action-btn" type="button" @click="cycleFrequency">
              频率切换
            </button>
          </div>

        </section>
      </main>
    </SmartOtdrPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth, type Device } from '@/composables/useAuth'
import LightSourceOperationMultiOpm from './LightSourceOperationMultiOpm.vue'
import SmartOtdrPageShell from '../components/SmartOtdrPageShell.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { user } = useAuth()

const wavelengthOptions = [1310, 1550]
const frequencyOptions = ['270Hz', '330Hz', '1KHz', '2KHz', 'CW']

const currentDevice = computed<Device | null>(() => {
  const deviceId = route.params.id as string
  if (!deviceId) return null
  return user.value?.devices?.find(d => d.id === deviceId) || null
})

const isSmartOtdr = computed(() => currentDevice.value?.deviceType === 'smart_otdr')

const lightState = reactive({
  isEnabled: false,
  wavelength: 1310,
  frequencyMode: '270Hz'
})

const pageDescription = computed(() => (
  lightState.isEnabled
    ? '已开启，可继续切换当前波长与频率模式。'
    : '默认关闭，开启后开始输出当前光源。'
))

const goBack = () => {
  router.push(`/device/${String(route.params.id || '')}`)
}

const toggleLightSource = () => {
  lightState.isEnabled = !lightState.isEnabled
}

const cycleWavelength = () => {
  const currentIndex = wavelengthOptions.indexOf(lightState.wavelength)
  const nextIndex = (currentIndex + 1) % wavelengthOptions.length
  lightState.wavelength = wavelengthOptions[nextIndex]
}

const cycleFrequency = () => {
  const currentIndex = frequencyOptions.indexOf(lightState.frequencyMode)
  const nextIndex = (currentIndex + 1) % frequencyOptions.length
  lightState.frequencyMode = frequencyOptions[nextIndex]
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(10px);
}

.back-btn {
  position: absolute;
  left: 16px;
  border: none;
  background: none;
  color: #2563eb;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.content-flex {
  flex: 1;
  overflow-y: auto;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.page-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(37, 99, 235, 0.08);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.card-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.section-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}

.status-badge {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.status-badge.on {
  background: #dcfce7;
  color: #047857;
}

.light-screen {
  margin-top: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #07162f 0%, #0b2144 100%);
  color: #dbe7ff;
  padding: 16px;
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.12);
}

.light-screen.active {
  box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.2);
}

.screen-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: rgba(219, 231, 255, 0.78);
}

.screen-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 24px 0 20px;
}

.laser-graphic {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 110px;
}

.laser-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(248, 113, 113, 0.6);
  box-shadow: 0 0 0 6px rgba(248, 113, 113, 0.12);
}

.laser-line {
  flex: 1;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(248, 113, 113, 0.9) 0%, rgba(248, 113, 113, 0.25) 100%);
}

.laser-graphic.active .laser-dot {
  background: #ef4444;
  box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.18);
}

.laser-graphic.active .laser-line {
  background: linear-gradient(90deg, rgba(248, 113, 113, 1) 0%, rgba(248, 113, 113, 0.45) 100%);
}

.screen-reading {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 6px;
}

.reading-wave {
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
  color: #f8fbff;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

.reading-unit {
  font-size: 16px;
  font-weight: 700;
  color: #7dd3fc;
}

.screen-warning {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.2);
  color: #fde68a;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.action-head {
  margin-bottom: 14px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.action-btn {
  min-height: 48px;
  border-radius: 14px;
  border: 1px solid #dbeafe;
  background: #f8fbff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.action-btn.primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

@media (max-width: 768px) {
  .card-title-row,
  .screen-body {
    flex-direction: column;
    align-items: flex-start;
  }

  .laser-graphic,
  .screen-reading {
    width: 100%;
  }

  .screen-reading {
    justify-content: flex-start;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }
}

/* Keep the source control in the same quiet, compact shell as 10GPON. */
.app-container { background: #f7f9fc; }
.page-body { gap: 12px; padding: 14px; }
.panel-card { padding: 12px; border: 1px solid #d8e2ef; border-radius: 12px; background: #ffffff; box-shadow: none; }
.status-card { padding: 0; overflow: hidden; }
.status-card > .card-title-row { min-height: 44px; align-items: center; padding: 0 14px; border-bottom: 1px solid #e6edf7; }
.status-card .section-title { color: #1d4ed8; font-size: 13px; }
.status-card .section-desc { display: none; }
.status-badge { padding: 4px 9px; border-radius: 6px; font-size: 10px; }
.light-screen { margin: 0; padding: 0; border-radius: 0; background: #ffffff; color: #0f172a; box-shadow: none; }
.light-screen.active { box-shadow: none; }
.screen-head { min-height: 38px; padding: 0 14px; color: #2563eb; }
.screen-body { min-height: 108px; justify-content: center; gap: 18px; padding: 12px 14px; }
.laser-graphic { max-width: 110px; }
.reading-wave { color: #1d4ed8; font-size: 42px; letter-spacing: 0; }
.reading-unit { color: #0f172a; font-size: 14px; }
.screen-warning { margin: 0 14px 14px; padding: 9px 10px; border-radius: 8px; background: #fff7ed; color: #9a3412; font-size: 10px; }
.action-card .section-title { font-size: 14px; }
.action-card .section-desc { font-size: 10px; line-height: 1.5; }
.action-grid { gap: 8px; }
.action-btn { min-height: 44px; border-radius: 8px; font-size: 12px; }

@media (max-width: 768px) {
  .status-card > .card-title-row,
  .screen-body { flex-direction: row; align-items: center; }
  .screen-reading { width: auto; justify-content: flex-start; }
  .action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .action-btn.primary { grid-column: 1 / -1; }
}
</style>
