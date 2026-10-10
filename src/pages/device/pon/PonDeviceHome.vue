<template>
  <PonPageShell :title="t('pon.deviceSubtitle')" :subtitle="device.name" @back="goToAppHome">
    <template #action>
      <button
        class="header-tool"
        :class="{ active: state.persisted.flashlightOn }"
        type="button"
        :aria-label="t('pon.flashlightTitle')"
        :aria-pressed="state.persisted.flashlightOn"
        @click="toggleFlashlight"
      >
        <img :src="flashlightIcon" alt="" />
      </button>
    </template>

    <template #footer>
      <PonFunctionNav :device-id="device.id" active="opm" />
    </template>

    <main class="pon-home-page">
      <section v-if="!isOnline" class="offline-band" role="status">
        <div><strong>{{ t('pon.offlineTitle') }}</strong><span>{{ t('pon.offlineHint') }}</span></div>
        <button type="button" :disabled="isConnecting" @click="connectDevice">
          {{ isConnecting ? t('pon.connecting') : t('pon.reconnect') }}
        </button>
      </section>

      <section class="home-meter" aria-label="普通光功率计实时读数">
        <header>
          <strong>{{ t('pon.opmMeasurementTitle') }}</strong>
          <button type="button" @click="openOpmPanel('wavelength')">
            {{ state.persisted.selectedWavelength }} <small>nm</small>
          </button>
        </header>
                <div class="meter-reading">
          <strong>{{ state.runtime.opmDbm.toFixed(2) }}</strong><span>dBm</span>
        </div>
        <div class="meter-linear">{{ linearPower }}</div>
        <footer>
          <span>{{ t('pon.frequencyRecognition') }}</span>
          <strong>{{ frequencyLabel }}</strong>
        </footer>
      </section>

      <section class="parameter-grid" aria-label="测量参数">
        <button type="button" @click="openOpmPanel('wavelength')">
          <span>{{ t('pon.wavelength') }}</span><strong>{{ state.persisted.selectedWavelength }}nm</strong>
        </button>
        <button type="button" @click="openOpmPanel('frequency')">
          <span>{{ t('pon.frequency') }}</span><strong>{{ frequencyLabel }}</strong>
        </button>
        <button type="button" @click="openOpmPanel('unit')">
          <span>{{ t('pon.displayUnit') }}</span><strong>{{ state.persisted.displayUnit }}</strong>
        </button>
      </section>

      <section class="spec-strip" aria-label="测量能力">
        <div><span>{{ t('pon.powerRange') }}</span><strong>{{ powerRangeLabel }}</strong></div>
        <div><span>{{ t('pon.resolution') }}</span><strong>0.01dBm</strong></div>
        <div><span>{{ t('pon.measurementAccuracyLabel') }}</span><strong>{{ opmAccuracyLabel }}</strong></div>
      </section>

      <section class="home-tools">
        <button type="button" :class="{ active: state.persisted.flashlightOn }" @click="toggleFlashlight">
          <span class="tool-icon"><img :src="flashlightIcon" alt="" /></span>
          <span><strong>{{ t('pon.flashlightTitle') }}</strong><small>{{ state.persisted.flashlightOn ? t('pon.enabled') : t('pon.disabled') }}</small></span>
          <i class="mini-switch" :class="{ active: state.persisted.flashlightOn }"><b></b></i>
        </button>
        <button type="button" @click="router.push(`/device/${device.id}/pon-history`)">
          <span class="tool-icon"><img :src="historyIcon" alt="" /></span>
          <span><strong>{{ t('pon.historyTitle') }}</strong><small>{{ t('pon.recordCount', { count: records.length }) }}</small></span>
          <i class="tool-chevron">›</i>
        </button>
      </section>

      <div v-if="feedback" class="feedback-toast" role="status">{{ feedback }}</div>
    </main>
  </PonPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Device } from '@/composables/useAuth'
import { useAuth } from '@/composables/useAuth'
import flashlightIcon from '@/assets/icons/iconfont/smart-otdr/flashlight.svg'
import historyIcon from '@/assets/icons/iconfont/smart-otdr/timer.svg'
import PonFunctionNav from './PonFunctionNav.vue'
import PonPageShell from './PonPageShell.vue'
import { dbmToMilliwatts, formatPonFrequency, usePonPowerMeterState } from './usePonPowerMeterState'

const props = defineProps<{ device: Device }>()
const { t } = useI18n()
const router = useRouter()
const { updateDevice } = useAuth()
const state = usePonPowerMeterState(props.device.id)
const records = state.records
const isConnecting = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined

const isOnline = computed(() => props.device.status === 'connected' && state.persisted.bluetoothEnabled)
const powerRangeLabel = computed(() => props.device.ponPowerRange === 'high' ? '-50~+26' : '-70~+10')
const opmAccuracyLabel = computed(() => {
  const values: string[] = []
  values.push(`±${Number(props.device.ponOpmAccuracyDb ?? 0.2)}dB`)
  values.push(`${Number(props.device.ponOpmAccuracyPercent ?? 5)}%`)
  return values.join(' / ') || t('pon.probeSpecification')
})
const frequencyLabel = computed(() => state.persisted.frequencyMode === 0 ? t('pon.frequencyDisabled') : formatPonFrequency(state.runtime.opmFrequency))
const linearPower = computed(() => {
  const microwatts = dbmToMilliwatts(state.runtime.opmDbm) * 1000
  return microwatts >= 1000 ? `${(microwatts / 1000).toFixed(3)} mW` : `${microwatts.toFixed(3)} uW`
})

const goToAppHome = () => router.replace('/')

const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}

const connectDevice = async () => {
  if (isConnecting.value) return
  isConnecting.value = true
  await new Promise(resolve => window.setTimeout(resolve, 700))
  state.setBluetooth(true)
  updateDevice(props.device.id, { status: 'connected', lastConnected: new Date().toISOString() })
  props.device.status = 'connected'
  state.startLiveMeasurement()
  isConnecting.value = false
  showFeedback(t('pon.connectionRestored'))
}

const openOpmPanel = (panel?: 'wavelength' | 'frequency' | 'unit') => {
  if (!isOnline.value) return showFeedback(t('pon.connectBeforeControl'))
  router.push({ path: `/device/${props.device.id}/pon-opm`, query: panel ? { panel } : undefined })
}

const toggleFlashlight = () => {
  const enabled = !state.persisted.flashlightOn
  if (!state.setFlashlight(enabled)) return showFeedback(t('pon.connectBeforeControl'))
  showFeedback(enabled ? t('pon.flashlightEnabled') : t('pon.flashlightDisabled'))
}

onMounted(() => {
  state.setMeasurementMode('opm')
  if (isOnline.value) state.startLiveMeasurement()
})

onUnmounted(() => {
  state.stopLiveMeasurement()
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
})
</script>

<style scoped lang="scss">
@use './ponUi.scss' as ui;

.pon-home-page { @include ui.page-surface; display: flex; flex-direction: column; gap: 12px; padding-bottom: 18px; }
.header-tool { @include ui.button-reset; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; background: transparent; }
.header-tool img { width: 22px; height: 22px; opacity: .72; }
.header-tool.active { background: ui.$pon-primary-soft; }
.header-tool.active img { opacity: 1; }
.offline-band { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; }
.offline-band strong, .offline-band span { display: block; }
.offline-band strong { color: #9a3412; font-size: 12px; }
.offline-band span { margin-top: 2px; color: #c2410c; font-size:12px; }
.offline-band button { @include ui.secondary-button; min-height: 38px; padding: 0 10px; color: #9a3412; font-size: 11px; }
.home-meter { overflow: hidden; border: 1px solid #dbe7f5; border-radius: 12px; background: #ffffff; box-shadow: 0 8px 22px rgba(37, 99, 235, .08); }
.home-meter > header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #e7eef8; }
.home-meter > header strong { color: ui.$pon-primary-dark; font-size: 13px; }
.home-meter > header button { @include ui.button-reset; min-height: 44px; padding: 0; background: transparent; color: ui.$pon-primary; font-size: 20px; font-weight: 700; }
.home-meter > header small { font-size: 12px; }
.meter-wavelength { padding-top: 14px; color: ui.$pon-primary; font-size: 15px; text-align: center; @include ui.metric-number; }
.meter-reading { min-height: 72px; display: flex; align-items: center; justify-content: center; gap: 7px; color: ui.$pon-primary-dark; }
.meter-reading strong { width: 190px; max-width: calc(100% - 58px); font-size: 45px; line-height: 1; text-align: right; @include ui.metric-number; }
.meter-reading span { min-width: 44px; color: ui.$pon-text; font-size: 18px; }
.meter-linear { padding-bottom: 14px; color: ui.$pon-text; font-size: 20px; text-align: center; @include ui.metric-number; }
.home-meter > footer { min-height: 46px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-top: 1px solid #e7eef8; color: ui.$pon-primary; }
.home-meter > footer span { font-size: 12px; }
.home-meter > footer strong { font-size: 13px; @include ui.metric-number; }
.parameter-grid, .spec-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.parameter-grid button { @include ui.button-reset; min-width: 0; min-height: 66px; padding: 8px 4px; border: 1px solid #e3ebf6; border-radius: 10px; background: #ffffff; color: ui.$pon-text; box-shadow: ui.$pon-shadow; }
.parameter-grid span, .parameter-grid strong { display: block; }
.parameter-grid span { color: ui.$pon-primary; font-size: 11px; }
.parameter-grid strong { margin-top: 5px; font-size: 13px; @include ui.metric-number; }
.parameter-grid button:active { border-color: #93c5fd; background: ui.$pon-primary-soft; }
.spec-strip { gap: 0; overflow: hidden; border: 1px solid ui.$pon-border; border-radius: 10px; background: #ffffff; }
.spec-strip div { min-width: 0; padding: 9px 5px; border-right: 1px solid ui.$pon-border; text-align: center; }
.spec-strip div:last-child { border-right: 0; }
.spec-strip span, .spec-strip strong { display: block; }
.spec-strip span { color: ui.$pon-text-sub; font-size:12px; }
.spec-strip strong { margin-top: 4px; color: ui.$pon-text; font-size: 11px; @include ui.metric-number; }
.home-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.home-tools button { @include ui.button-reset; position: relative; min-width: 0; min-height: 64px; display: grid; grid-template-columns: 34px minmax(0, 1fr); align-items: center; gap: 9px; padding: 8px 40px 8px 10px; border: 1px solid ui.$pon-border; border-radius: 10px; background: #ffffff; color: ui.$pon-text; text-align: left; }
.home-tools button.active { border-color: #93c5fd; background: ui.$pon-primary-soft; }
.tool-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; background: ui.$pon-primary-soft; }
.tool-icon img { width: 20px; height: 20px; }
.home-tools strong, .home-tools small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.home-tools strong { font-size: 11px; }
.home-tools small { margin-top: 3px; color: ui.$pon-text-sub; font-size:12px; }
.mini-switch { position: absolute; right: 9px; width: 30px; height: 18px; padding: 2px; box-sizing: border-box; border-radius: 9px; background: #cbd5e1; }
.mini-switch b { display: block; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; transition: transform .18s ease; }
.mini-switch.active { background: ui.$pon-primary; }
.mini-switch.active b { transform: translateX(12px); }
.tool-chevron { position: absolute; right: 12px; color: ui.$pon-text-sub; font-size: 20px; font-style: normal; }
.feedback-toast { position: fixed; left: 50%; bottom: 28px; z-index: 95; max-width: 300px; transform: translateX(-50%); padding: 9px 13px; border-radius: 8px; background: rgba(15,23,42,.94); color: #ffffff; font-size: 11px; text-align: center; }
@media (max-width: 340px) { .meter-reading strong { font-size: 39px; } .home-tools { grid-template-columns: 1fr; } }
</style>
