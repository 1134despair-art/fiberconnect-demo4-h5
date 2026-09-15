<template>
  <StableSourcePageShell :title="t('stableSource.deviceSubtitle')" :subtitle="device.name" @back="goToAppHome">
    <template #action>
      <button
        class="header-tool"
        :class="{ active: state.persisted.flashlightOn }"
        type="button"
        :aria-label="t('stableSource.flashlightTitle')"
        :aria-pressed="state.persisted.flashlightOn"
        @click="toggleFlashlight"
      >
        <img :src="flashlightIcon" alt="" />
      </button>
    </template>

    <template #footer>
      <StableSourceFunctionNav :device-id="device.id" active="home" />
    </template>

    <main class="source-home">
      <section v-if="!connected" class="offline-band" role="status">
        <div>
          <strong>{{ t('stableSource.disconnected') }}</strong>
          <span>{{ t('stableSource.reconnectHint') }}</span>
        </div>
        <button type="button" :disabled="reconnecting" @click="reconnect">
          {{ reconnecting ? t('stableSource.reconnecting') : t('stableSource.reconnect') }}
        </button>
      </section>

      <button class="home-meter" type="button" @click="openControl">
        <header>
          <strong>{{ t('stableSource.controlTitle') }}</strong>
          <span class="meter-channel">{{ state.persisted.selectedWavelength }} <small>nm</small></span>
        </header>
        <div class="meter-wavelength">{{ state.persisted.selectedWavelength }} nm</div>
        <div class="meter-reading">
          <strong>{{ correctedPower }}</strong><span>dBm</span>
        </div>
        <div class="meter-status" :class="{ emitting: state.runtime.outputStatus === 'emitting' }">
          <i></i><span>{{ outputStateText }}</span>
        </div>
        <footer>
          <span>{{ t('stableSource.frequencyMode') }}</span>
          <strong>{{ outputModeLabel }}</strong>
        </footer>
      </button>

      <section class="parameter-grid" :aria-label="t('stableSource.controlTitle')">
        <button type="button" @click="openControl">
          <span>{{ t('stableSource.wavelength') }}</span>
          <strong>{{ state.persisted.selectedWavelength }}nm</strong>
        </button>
        <button type="button" @click="openControl">
          <span>{{ t('stableSource.targetPower') }}</span>
          <strong>{{ signedPower }}dBm</strong>
        </button>
        <button type="button" @click="openControl">
          <span>{{ t('stableSource.frequencyMode') }}</span>
          <strong>{{ outputModeLabel }}</strong>
        </button>
      </section>

      <section class="spec-strip" aria-label="Device capabilities">
        <div><span>{{ t('stableSource.wavelengthCapability') }}</span><strong>{{ wavelengthCapability }}</strong></div>
        <div><span>{{ t('stableSource.powerRange') }}</span><strong>{{ powerRangeLabel }}</strong></div>
        <div><span>{{ t('stableSource.powerStep') }}</span><strong>{{ state.capabilities.powerRange.step }}dBm</strong></div>
      </section>

      <section class="device-status-strip" aria-label="Device status">
        <button type="button" @click="openSettings">
          <img :src="bluetoothIcon" alt="" />
          <span>BLE</span>
          <strong>{{ connected ? t('stableSource.connectedShort') : t('stableSource.disconnectedShort') }}</strong>
        </button>
        <button type="button" :class="{ active: state.persisted.flashlightOn }" @click="toggleFlashlight">
          <img :src="flashlightIcon" alt="" />
          <span>{{ t('stableSource.flashlightTitle') }}</span>
          <strong>{{ state.persisted.flashlightOn ? t('stableSource.on') : t('stableSource.off') }}</strong>
        </button>
        <div :class="{ low: batteryPercent <= 20 }">
          <img :src="batteryIcon" alt="" />
          <span>{{ t('stableSource.battery') }}</span>
          <strong>{{ batteryPercent }}%</strong>
          <small>{{ batteryStateText }}</small>
        </div>
      </section>

      <div v-if="feedback" class="feedback-toast" role="status">{{ feedback }}</div>
    </main>
  </StableSourcePageShell>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth, type Device } from '@/composables/useAuth'
import flashlightIcon from '@/assets/icons/pon-meter/ui/flashlight.png'
import bluetoothIcon from '@/assets/icons/pon-meter/ui/bluetooth.png'
import batteryIcon from '@/assets/icons/pon-meter/ui/battery.png'
import StableSourceFunctionNav from './StableSourceFunctionNav.vue'
import StableSourcePageShell from './StableSourcePageShell.vue'
import { formatStableSourceMode, resolveStableSourceCapabilities, useStableSourceState } from './useStableSourceState'

const props = defineProps<{ device: Device }>()
const router = useRouter()
const { t } = useI18n()
const { updateDevice } = useAuth()
const state = useStableSourceState(props.device.id, resolveStableSourceCapabilities(props.device))
const reconnecting = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined

const connected = computed(() => props.device.status === 'connected' && state.persisted.bluetoothEnabled)
const correctedPower = computed(() => (
  state.persisted.outputPowerDbm + state.persisted.calibrationOffsets[state.persisted.selectedWavelength]
).toFixed(1))
const signedPower = computed(() => `${state.persisted.outputPowerDbm > 0 ? '+' : ''}${state.persisted.outputPowerDbm.toFixed(1)}`)
const outputModeLabel = computed(() => formatStableSourceMode(state.persisted.outputMode))
const outputStateText = computed(() => state.runtime.outputStatus === 'emitting' ? t('stableSource.on') : t('stableSource.idle'))
const batteryPercent = computed(() => Math.min(100, Math.max(0, props.device.batteryPercent ?? 0)))
const batteryStateText = computed(() => props.device.batteryCharging ? t('stableSource.chargingNow') : t('stableSource.notCharging'))
const wavelengthCapability = computed(() => `${state.capabilities.wavelengths.join(' / ')}nm`)
const powerRangeLabel = computed(() => {
  const { min, max } = state.capabilities.powerRange
  return `${min} ~ ${max > 0 ? '+' : ''}${max}dBm`
})

const goToAppHome = () => router.replace('/')
const openControl = () => router.push(`/device/${props.device.id}/stable-source-control`)
const openSettings = () => router.push(`/device/${props.device.id}/stable-source-settings`)

const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}

const reconnect = async () => {
  reconnecting.value = true
  await state.reconnectBluetooth()
  updateDevice(props.device.id, { status: 'connected' })
  props.device.status = 'connected'
  reconnecting.value = false
  showFeedback(t('stableSource.connectionRestored'))
}

const toggleFlashlight = () => {
  if (!state.toggleFlashlight()) return showFeedback(t('stableSource.connectBeforeControl'))
  showFeedback(state.persisted.flashlightOn ? t('stableSource.on') : t('stableSource.off'))
}

onUnmounted(() => {
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
})
</script>

<style scoped lang="scss">
@use './stableSourceUi.scss' as ui;

.source-home { @include ui.page-padding; display: flex; flex-direction: column; gap: 12px; padding-bottom: 18px; }
.header-tool { @include ui.button-reset; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; }
.header-tool img { width: 22px; height: 22px; opacity: .72; }
.header-tool.active { background: ui.$source-primary-soft; }
.header-tool.active img { opacity: 1; }

.offline-band { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; }
.offline-band strong, .offline-band span { display: block; }
.offline-band strong { color: #9a3412; font-size: 12px; }
.offline-band span { margin-top: 2px; color: #c2410c; font-size: 10px; }
.offline-band button { @include ui.button-reset; min-height: 38px; padding: 0 10px; border: 1px solid #fed7aa; border-radius: 8px; background: #fff; color: #9a3412; font-size: 11px; font-weight: 700; }

.home-meter { @include ui.button-reset; width: 100%; overflow: hidden; padding: 0; border: 1px solid #dbe7f5; border-radius: 12px; background: #fff; color: ui.$source-text; box-shadow: 0 8px 22px rgba(37, 99, 235, .08); text-align: initial; }
.home-meter > header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #e7eef8; }
.home-meter > header > strong { color: #1d4ed8; font-size: 13px; }
.home-meter > header .meter-channel { color: ui.$source-primary; font-size: 20px; font-weight: 700; @include ui.numeric; }
.home-meter > header .meter-channel small { font-size: 12px; }
.meter-wavelength { padding-top: 14px; color: ui.$source-primary; font-size: 15px; text-align: center; @include ui.numeric; }
.meter-reading { min-height: 72px; display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; column-gap: 7px; }
.meter-reading strong { grid-column: 2; justify-self: center; color: #1d4ed8; font-size: 45px; line-height: 1; text-align: center; @include ui.numeric; }
.meter-reading span { grid-column: 3; justify-self: start; font-size: 18px; }
.meter-status { min-height: 34px; display: flex; align-items: flex-start; justify-content: center; gap: 7px; padding-bottom: 10px; box-sizing: border-box; color: ui.$source-text-sub; font-size: 12px; }
.meter-status i { width: 7px; height: 7px; margin-top: 4px; border-radius: 50%; background: #94a3b8; }
.meter-status.emitting { color: #b45309; }
.meter-status.emitting i { background: ui.$source-amber; box-shadow: 0 0 0 4px rgba(245,158,11,.12); }
.home-meter > footer { min-height: 46px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-top: 1px solid #e7eef8; color: ui.$source-primary; }
.home-meter > footer span { font-size: 12px; }
.home-meter > footer strong { font-size: 13px; @include ui.numeric; }

.parameter-grid, .spec-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.parameter-grid { gap: 8px; }
.parameter-grid button { @include ui.button-reset; min-width: 0; min-height: 66px; padding: 8px 4px; border: 1px solid #e3ebf6; border-radius: 10px; background: #fff; box-shadow: ui.$source-shadow; }
.parameter-grid span, .parameter-grid strong { display: block; }
.parameter-grid span { color: ui.$source-primary; font-size: 11px; }
.parameter-grid strong { margin-top: 5px; color: ui.$source-text; font-size: 13px; @include ui.numeric; }
.parameter-grid button:active { border-color: #93c5fd; background: ui.$source-primary-soft; }
.spec-strip { overflow: hidden; border: 1px solid ui.$source-border; border-radius: 10px; background: #fff; }
.spec-strip div { min-width: 0; padding: 9px 5px; border-right: 1px solid ui.$source-border; text-align: center; }
.spec-strip div:last-child { border-right: 0; }
.spec-strip span, .spec-strip strong { display: block; }
.spec-strip span { color: ui.$source-text-sub; font-size: 9px; }
.spec-strip strong { margin-top: 4px; font-size: 11px; @include ui.numeric; }

.device-status-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow: hidden; border: 1px solid ui.$source-border; border-radius: 10px; background: #fff; }
.device-status-strip button, .device-status-strip > div { @include ui.button-reset; position: relative; min-width: 0; min-height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 6px 4px; border-right: 1px solid ui.$source-border; text-align: center; }
.device-status-strip > :last-child { border-right: 0; }
.device-status-strip img { width: 19px; height: 19px; object-fit: contain; }
.device-status-strip span { color: ui.$source-text-sub; font-size: 9px; }
.device-status-strip strong { max-width: 100%; overflow: hidden; color: ui.$source-primary; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.device-status-strip small { position: absolute; right: 6px; bottom: 4px; color: ui.$source-text-sub; font-size: 9px; }
.device-status-strip button.active { background: ui.$source-primary-soft; }
.device-status-strip .low strong { color: #c2410c; }
.feedback-toast { position: fixed; left: 50%; bottom: 28px; z-index: 95; max-width: 300px; transform: translateX(-50%); padding: 9px 13px; border-radius: 8px; background: rgba(15,23,42,.94); color: #fff; font-size: 11px; text-align: center; }

@media (max-width: 340px) {
  .meter-reading strong { font-size: 39px; }
}
</style>
