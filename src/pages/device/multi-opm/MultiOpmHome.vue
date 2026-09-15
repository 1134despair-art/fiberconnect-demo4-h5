<template>
  <MultiOpmPageShell title="多功能光功率计" :subtitle="device.name" @back="router.replace('/')">
    <template #action>
      <button class="header-tool" :class="{ active: state.persisted.flashlightOn }" type="button" aria-label="照明" @click="toggleFlashlight">
        <img :src="flashlightIcon" alt="" />
      </button>
    </template>
    <template #footer><MultiOpmFunctionNav :device-id="device.id" active="home" /></template>

    <main class="multi-opm-home">
      <section v-if="!isOnline" class="offline-band" role="status">
        <div><strong>设备未连接</strong><span>连接后可使用测量与控制功能</span></div>
        <button type="button" :disabled="isConnecting" @click="connectDevice">{{ isConnecting ? '连接中' : '重新连接' }}</button>
      </section>

      <section class="home-meter" aria-label="光功率实时读数">
        <header>
          <strong>普通光功率计</strong>
          <button type="button" @click="openMeasure('wavelength')">{{ state.persisted.wavelength }} <small>nm</small></button>
        </header>
        <button class="meter-action" type="button" @click="openMeasure()">
          <span>{{ state.persisted.wavelength }} nm</span>
          <div><strong>{{ displayReading }}</strong><small>{{ state.persisted.unit }}</small></div>
          <p>{{ linearPower }}</p>
        </button>
        <footer><span>频率识别</span><strong>{{ frequencyLabel }}</strong></footer>
      </section>

      <section class="parameter-grid" aria-label="测量参数">
        <button type="button" @click="openMeasure('wavelength')"><span>测量波长</span><strong>{{ state.persisted.wavelength }}nm</strong></button>
        <button type="button" @click="openMeasure('frequency')"><span>频率</span><strong>{{ frequencyLabel }}</strong></button>
        <button type="button" @click="openMeasure('unit')"><span>显示单位</span><strong>{{ state.persisted.unit }}</strong></button>
      </section>

      <section class="spec-strip" aria-label="测量能力">
        <div><span>测量范围</span><strong>-70~+10</strong></div>
        <div><span>分辨率</span><strong>0.01dBm</strong></div>
        <div><span>波长数量</span><strong>10种</strong></div>
      </section>

      <section class="home-tools" aria-label="辅助工具">
        <button type="button" :class="{ active: state.persisted.flashlightOn }" @click="toggleFlashlight">
          <span class="tool-icon"><img :src="flashlightIcon" alt="" /></span>
          <span><strong>照明</strong><small>{{ state.persisted.flashlightOn ? '已开启' : '已关闭' }}</small></span>
          <i class="mini-switch" :class="{ active: state.persisted.flashlightOn }"><b></b></i>
        </button>
        <button type="button" @click="router.push(`/device/${device.id}/mopm?focus=history`)">
          <span class="tool-icon"><img :src="historyIcon" alt="" /></span>
          <span><strong>测量记录</strong><small>{{ state.records.value.length }} 条记录</small></span>
          <i class="tool-chevron">›</i>
        </button>
        <button type="button" @click="router.push(`/device/${device.id}/wiremap`)">
          <span class="tool-icon"><img :src="wiremapIcon" alt="" /></span>
          <span><strong>网线对线</strong><small>T568A / T568B</small></span>
          <i class="tool-chevron">›</i>
        </button>
        <button type="button" @click="router.push(`/device/${device.id}/seek`)">
          <span class="tool-icon"><img :src="seekIcon" alt="" /></span>
          <span><strong>网线寻线</strong><small>远端线缆定位</small></span>
          <i class="tool-chevron">›</i>
        </button>
      </section>

      <div v-if="feedback" class="feedback-toast" role="status">{{ feedback }}</div>
    </main>
  </MultiOpmPageShell>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Device } from '@/composables/useAuth'
import { useAuth } from '@/composables/useAuth'
import flashlightIcon from '@/assets/icons/pon-meter/ui/flashlight.png'
import historyIcon from '@/assets/icons/pon-meter/ui/history.png'
import wiremapIcon from '@/assets/app/icons/device/wiremap.png'
import seekIcon from '@/assets/app/icons/device/network-test.png'
import MultiOpmFunctionNav from './MultiOpmFunctionNav.vue'
import MultiOpmPageShell from './MultiOpmPageShell.vue'
import { formatMultiOpmFrequency, formatMultiOpmReading, multiOpmDbmToMw, useMultiOpmState } from './useMultiOpmState'

const props = defineProps<{ device: Device }>()
const router = useRouter()
const { updateDevice } = useAuth()
const state = useMultiOpmState(props.device.id)
const readingDbm = -18.86
const isConnecting = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined

const isOnline = computed(() => props.device.status === 'connected' && state.persisted.bluetoothEnabled)
const frequencyLabel = computed(() => formatMultiOpmFrequency(state.persisted.frequency))
const displayReading = computed(() => formatMultiOpmReading(readingDbm, state.persisted.unit))
const linearPower = computed(() => {
  const microwatts = multiOpmDbmToMw(readingDbm) * 1000
  return microwatts >= 1000 ? `${(microwatts / 1000).toFixed(3)} mW` : `${microwatts.toFixed(3)} uW`
})
const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}
const connectDevice = async () => {
  if (isConnecting.value) return
  isConnecting.value = true
  await new Promise(resolve => window.setTimeout(resolve, 700))
  state.persisted.bluetoothEnabled = true
  updateDevice(props.device.id, { status: 'connected', lastConnected: new Date().toISOString() })
  props.device.status = 'connected'
  isConnecting.value = false
  showFeedback('设备已连接')
}
const toggleFlashlight = () => {
  if (!isOnline.value) return showFeedback('请先连接设备')
  state.persisted.flashlightOn = !state.persisted.flashlightOn
  showFeedback(state.persisted.flashlightOn ? '照明已开启' : '照明已关闭')
}
const openMeasure = (panel?: 'wavelength' | 'frequency' | 'unit') => {
  if (!isOnline.value) return showFeedback('请先连接设备')
  router.push({ path: `/device/${props.device.id}/mopm`, query: panel ? { panel } : undefined })
}

onUnmounted(() => { if (feedbackTimer) window.clearTimeout(feedbackTimer) })
</script>

<style scoped lang="scss">
@use './multiOpmUi.scss' as ui;

.multi-opm-home { @include ui.page-surface; display: flex; flex-direction: column; gap: 12px; padding-bottom: 18px; }
.header-tool { @include ui.button-reset; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; background: transparent; }
.header-tool img { width: 22px; height: 22px; opacity: .72; }
.header-tool.active { background: ui.$primary-soft; }
.header-tool.active img { opacity: 1; }
.offline-band { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; }
.offline-band strong, .offline-band span { display: block; }
.offline-band strong { color: #9a3412; font-size: 12px; }
.offline-band span { margin-top: 2px; color: #c2410c; font-size: 10px; }
.offline-band button { @include ui.secondary-button; min-height: 38px; padding: 0 10px; color: #9a3412; font-size: 11px; }
.home-meter { overflow: hidden; border: 1px solid #dbe7f5; border-radius: 12px; background: #fff; box-shadow: 0 8px 22px rgba(37, 99, 235, .08); }
.home-meter > header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #e7eef8; }
.home-meter > header strong { color: ui.$primary-dark; font-size: 13px; }
.home-meter > header button { @include ui.button-reset; min-height: 36px; padding: 0 4px; background: transparent; color: ui.$primary; font-size: 14px; font-weight: 700; }
.home-meter > header small { font-size: 10px; }
.meter-action { @include ui.button-reset; width: 100%; min-height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; color: ui.$primary; }
.meter-action > span { font-size: 13px; }
.meter-action > div { min-height: 70px; display: flex; align-items: baseline; gap: 7px; }
.meter-action strong { font-size: 48px; line-height: 1; @include ui.metric-number; }
.meter-action small { color: ui.$text; font-size: 16px; font-weight: 700; }
.meter-action p { margin: 0; color: ui.$text; font-size: 18px; @include ui.metric-number; }
.home-meter > footer { min-height: 46px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-top: 1px solid #e7eef8; color: ui.$primary; }
.home-meter > footer span { font-size: 12px; }
.home-meter > footer strong { font-size: 13px; }
.parameter-grid, .spec-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.parameter-grid button { @include ui.button-reset; min-width: 0; min-height: 66px; padding: 8px 4px; border: 1px solid #e3ebf6; border-radius: 10px; background: #fff; color: ui.$text; box-shadow: ui.$shadow; }
.parameter-grid span, .parameter-grid strong { display: block; }
.parameter-grid span { color: ui.$primary; font-size: 11px; }
.parameter-grid strong { margin-top: 5px; font-size: 13px; @include ui.metric-number; }
.spec-strip { gap: 0; overflow: hidden; border: 1px solid ui.$border; border-radius: 10px; background: #fff; }
.spec-strip div { min-width: 0; padding: 9px 4px; border-right: 1px solid ui.$border; text-align: center; }
.spec-strip div:last-child { border-right: 0; }
.spec-strip span, .spec-strip strong { display: block; }
.spec-strip span { color: ui.$text-sub; font-size: 9px; }
.spec-strip strong { margin-top: 4px; color: ui.$text; font-size: 11px; @include ui.metric-number; }
.home-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.home-tools button { @include ui.button-reset; position: relative; min-width: 0; min-height: 64px; display: grid; grid-template-columns: 34px minmax(0, 1fr); align-items: center; gap: 9px; padding: 8px 38px 8px 10px; border: 1px solid ui.$border; border-radius: 10px; background: #fff; color: ui.$text; text-align: left; }
.home-tools button.active { border-color: #93c5fd; background: ui.$primary-soft; }
.tool-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; background: ui.$primary-soft; }
.tool-icon img { width: 20px; height: 20px; object-fit: contain; }
.home-tools strong, .home-tools small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.home-tools strong { font-size: 11px; }
.home-tools small { margin-top: 3px; color: ui.$text-sub; font-size: 9px; }
.mini-switch { position: absolute; right: 9px; width: 30px; height: 18px; padding: 2px; box-sizing: border-box; border-radius: 9px; background: #cbd5e1; }
.mini-switch b { display: block; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform .18s ease; }
.mini-switch.active { background: ui.$primary; }
.mini-switch.active b { transform: translateX(12px); }
.tool-chevron { position: absolute; right: 12px; color: ui.$text-sub; font-size: 20px; font-style: normal; }
.feedback-toast { position: absolute; left: 50%; bottom: 92px; z-index: 95; max-width: 300px; transform: translateX(-50%); padding: 9px 13px; border-radius: 8px; background: rgba(15,23,42,.94); color: #fff; font-size: 11px; text-align: center; }
@media (max-width: 340px) { .meter-action strong { font-size: 42px; } .home-tools { grid-template-columns: 1fr; } }
</style>
