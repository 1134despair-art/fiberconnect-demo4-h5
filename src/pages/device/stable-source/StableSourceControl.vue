<template>
  <StableSourcePageShell standalone :title="t('stableSource.outputPageTitle')" :subtitle="device?.name" @back="goToDeviceHome">
    <template #footer>
      <StableSourceFunctionNav :device-id="deviceId" active="output" />
    </template>

    <div v-if="loading" class="loading-state" aria-live="polite">
      <span></span><span></span><span></span>
    </div>

    <div v-else class="control-page">
      <section v-if="!connected" class="offline-panel" role="status">
        <img :src="bluetoothIcon" alt="" />
        <h2>{{ t('stableSource.disconnected') }}</h2>
        <p>{{ t('stableSource.reconnectHint') }}</p>
        <button type="button" :disabled="reconnecting" @click="reconnect">
          {{ reconnecting ? t('stableSource.reconnecting') : t('stableSource.reconnect') }}
        </button>
      </section>

      <template v-else>
        <section class="output-display" :class="{ emitting: state.runtime.outputStatus === 'emitting' }">
          <div class="display-topline">
            <strong>{{ t('stableSource.controlTitle') }}</strong>
            <span><i></i>{{ outputStatusText }}</span>
          </div>
          <div class="display-wavelength">
            <b>{{ state.persisted.selectedWavelength }}</b><small>nm</small>
          </div>
          <div class="display-reading">
            <b>{{ correctedPower }}</b><small>dBm</small>
          </div>
          <div class="display-frequency">
            <span>{{ t('stableSource.frequencyMode') }}</span>
            <strong>{{ formatStableSourceMode(state.persisted.outputMode) }}</strong>
          </div>
        </section>

        <section class="parameter-section">
          <header><h2>{{ t('stableSource.wavelength') }}</h2><span>{{ wavelengthCapability }}</span></header>
          <div class="wavelength-control" role="group" :aria-label="t('stableSource.wavelength')">
            <button
              v-for="wavelength in state.capabilities.wavelengths"
              :key="wavelength"
              type="button"
              :class="{ active: state.persisted.selectedWavelength === wavelength }"
              @click="state.selectWavelength(wavelength)"
            >
              <strong>{{ wavelength }}</strong><span>nm</span>
            </button>
          </div>
        </section>

        <section class="parameter-section">
          <header><h2>{{ t('stableSource.powerSetting') }}</h2><span>{{ powerRangeLabel }}</span></header>
          <div class="power-stepper">
            <button type="button" :aria-label="`-${state.capabilities.powerRange.step}dBm`" :disabled="state.persisted.outputPowerDbm <= state.capabilities.powerRange.min" @click="adjustPower(-state.capabilities.powerRange.step)">−</button>
            <div><strong>{{ signedPower }}</strong><span>dBm</span><small>{{ t('stableSource.powerStep') }} {{ state.capabilities.powerRange.step }}dBm</small></div>
            <button type="button" :aria-label="`+${state.capabilities.powerRange.step}dBm`" :disabled="state.persisted.outputPowerDbm >= state.capabilities.powerRange.max" @click="adjustPower(state.capabilities.powerRange.step)">+</button>
          </div>
        </section>

        <section class="parameter-section">
          <header><h2>{{ t('stableSource.frequencyMode') }}</h2><span>{{ outputModesLabel }}</span></header>
          <div class="mode-control" role="group" :aria-label="t('stableSource.frequencyMode')">
            <button
              v-for="mode in state.capabilities.outputModes"
              :key="mode"
              type="button"
              :class="{ active: state.persisted.outputMode === mode }"
              @click="state.setOutputMode(mode)"
            >{{ formatStableSourceMode(mode) }}</button>
          </div>
        </section>

        <section class="correction-strip">
          <div><span>{{ t('stableSource.calibrationOffset') }}</span><strong>{{ signedOffset }}dBm</strong></div>
          <div><span>{{ t('stableSource.gain') }}</span><strong>{{ state.persisted.gainPercent }}%</strong></div>
        </section>

        <button class="output-action" :class="{ stop: state.runtime.outputStatus === 'emitting' }" type="button" :disabled="busy" @click="handleOutputAction">
          {{ actionText }}
        </button>
      </template>
    </div>

    <div v-if="confirmingStart" class="dialog-backdrop" role="presentation" @click.self="confirmingStart = false">
      <section class="confirm-dialog" role="alertdialog" aria-modal="true" :aria-label="t('stableSource.laserConfirmTitle')">
        <span class="laser-mark">LASER</span>
        <h2>{{ t('stableSource.laserConfirmTitle') }}</h2>
        <p>{{ t('stableSource.laserConfirmText') }}</p>
        <div>
          <button type="button" @click="confirmingStart = false">{{ t('common.cancel') }}</button>
          <button class="confirm" type="button" @click="confirmStart">{{ t('stableSource.confirmStart') }}</button>
        </div>
      </section>
    </div>

    <div v-if="feedback" class="feedback" role="status">{{ feedback }}</div>
  </StableSourcePageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import StableSourceFunctionNav from './StableSourceFunctionNav.vue'
import StableSourcePageShell from './StableSourcePageShell.vue'
import { useStableSourceDevice } from './useStableSourceDevice'
import {
  formatStableSourceMode,
  resolveStableSourceCapabilities,
  useStableSourceState
} from './useStableSourceState'
import bluetoothIcon from '@/assets/icons/pon-meter/ui/bluetooth.png'

const router = useRouter()
const { t } = useI18n()
const { updateDevice } = useAuth()
const { deviceId, device } = useStableSourceDevice()
const state = useStableSourceState(deviceId.value, resolveStableSourceCapabilities(device.value))
const loading = ref(true)
const reconnecting = ref(false)
const confirmingStart = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined

const goToDeviceHome = () => router.replace(`/device/${deviceId.value}`)

const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const correctedPower = computed(() => (state.persisted.outputPowerDbm + state.persisted.calibrationOffsets[state.persisted.selectedWavelength]).toFixed(1))
const signedPower = computed(() => `${state.persisted.outputPowerDbm > 0 ? '+' : ''}${state.persisted.outputPowerDbm.toFixed(1)}`)
const currentOffset = computed(() => state.persisted.calibrationOffsets[state.persisted.selectedWavelength])
const signedOffset = computed(() => `${currentOffset.value > 0 ? '+' : ''}${currentOffset.value.toFixed(1)}`)
const wavelengthCapability = computed(() => `${state.capabilities.wavelengths.join(' / ')}nm`)
const outputModesLabel = computed(() => state.capabilities.outputModes.map(formatStableSourceMode).join(' / '))
const powerRangeLabel = computed(() => {
  const { min, max } = state.capabilities.powerRange
  return `${min.toFixed(1)} ~ ${max > 0 ? '+' : ''}${max.toFixed(1)}dBm`
})
const busy = computed(() => ['starting', 'stopping'].includes(state.runtime.outputStatus))
const outputStatusText = computed(() => t(`stableSource.${{
  idle: 'outputStandby', starting: 'outputStarting', emitting: 'outputEmitting', stopping: 'outputStopping', disconnected: 'outputDisconnected', error: 'outputError'
}[state.runtime.outputStatus]}`))
const actionText = computed(() => {
  if (state.runtime.outputStatus === 'starting') return t('stableSource.outputStarting')
  if (state.runtime.outputStatus === 'stopping') return t('stableSource.outputStopping')
  return state.runtime.outputStatus === 'emitting' ? t('stableSource.stopOutput') : t('stableSource.startOutput')
})

onMounted(() => window.setTimeout(() => { loading.value = false }, 320))
onBeforeUnmount(() => { state.stopOutput() })

const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}

const reconnect = async () => {
  reconnecting.value = true
  await state.reconnectBluetooth()
  updateDevice(deviceId.value, { status: 'connected' })
  reconnecting.value = false
  showFeedback(t('stableSource.connectionRestored'))
}

const adjustPower = (delta: number) => state.setOutputPower(state.persisted.outputPowerDbm + delta)

const handleOutputAction = async () => {
  if (state.runtime.outputStatus === 'emitting') {
    await state.stopOutput()
    showFeedback(t('stableSource.outputStopped'))
  } else {
    confirmingStart.value = true
  }
}

const confirmStart = async () => {
  confirmingStart.value = false
  const started = await state.startOutput()
  showFeedback(started ? t('stableSource.outputStarted') : t('stableSource.connectBeforeControl'))
}
</script>

<style scoped lang="scss">
@use './stableSourceUi.scss' as ui;

.control-page { @include ui.page-padding; display: flex; flex-direction: column; gap: 9px; padding-bottom: 14px; }
.loading-state { height: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; }
.loading-state span { width: 7px; height: 7px; border-radius: 50%; background: ui.$source-primary; animation: pulse 1s ease-in-out infinite; }
.loading-state span:nth-child(2) { animation-delay: .12s; }.loading-state span:nth-child(3) { animation-delay: .24s; }
@keyframes pulse { 50% { opacity: .3; transform: translateY(-4px); } }
.offline-panel { padding: 60px 24px; text-align: center; }
.offline-panel img { width: 42px; height: 42px; }.offline-panel h2 { margin: 14px 0 6px; font-size: 17px; }.offline-panel p { margin: 0; color: ui.$source-text-sub; font-size: 12px; }
.offline-panel button { @include ui.primary-button; width: 100%; margin-top: 22px; }

.output-display { overflow: hidden; border: 1px solid #dbe7f5; border-radius: 12px; background: #fff; color: ui.$source-text; box-shadow: 0 8px 22px rgba(37, 99, 235, .08); }
.display-topline { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #e7eef8; }
.display-topline strong { color: #1d4ed8; font-size: 13px; }.display-topline span { display: flex; align-items: center; gap: 6px; color: ui.$source-text-sub; font-size: 10px; }
.display-topline i { width: 7px; height: 7px; border-radius: 50%; background: #64748b; }.emitting .display-topline i { background: ui.$source-amber; box-shadow: 0 0 0 4px rgba(245,158,11,.14); }
.display-wavelength { padding: 14px 16px 0; text-align: center; }.display-wavelength b { @include ui.numeric; color: ui.$source-primary; font-size: 16px; }.display-wavelength small { margin-left: 5px; color: ui.$source-primary; font-size: 11px; }
.display-reading { min-height: 86px; display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; column-gap: 7px; padding: 0 16px; }.display-reading b { grid-column: 2; justify-self: center; @include ui.numeric; color: #1d4ed8; font-size: 46px; line-height: 1; text-align: center; }.display-reading small { grid-column: 3; justify-self: start; color: ui.$source-text; font-size: 18px; }
.display-frequency { min-height: 45px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-top: 1px solid #e7eef8; color: ui.$source-primary; font-size: 11px; }
.display-frequency strong { font-size: 12px; @include ui.numeric; }

.parameter-section > header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 5px; }
.parameter-section h2 { margin: 0; color: ui.$source-text; font-size: 13px; }.parameter-section header span { color: ui.$source-text-sub; font-size: 10px; }
.wavelength-control, .mode-control { display: grid; gap: 7px; padding: 4px; border: 1px solid ui.$source-border; border-radius: 12px; background: #e8eef6; }
.wavelength-control { grid-template-columns: 1fr 1fr; }.mode-control { grid-template-columns: repeat(4, 1fr); }
.wavelength-control button, .mode-control button { @include ui.button-reset; min-height: 44px; border-radius: 9px; color: ui.$source-text-sub; font-size: 10px; font-weight: 700; }
.wavelength-control button.active, .mode-control button.active { background: #fff; color: ui.$source-primary; box-shadow: 0 2px 7px rgba(15,23,42,.1); }
.wavelength-control button:focus-visible, .mode-control button:focus-visible { @include ui.focus-ring; }
.wavelength-control strong { @include ui.numeric; font-size: 15px; }.wavelength-control span { margin-left: 3px; font-size: 11px; }

.power-stepper { @include ui.surface; display: grid; grid-template-columns: 48px minmax(0,1fr) 48px; align-items: center; padding: 6px 8px; box-shadow: none; }
.power-stepper button { @include ui.button-reset; width: 40px; height: 40px; border-radius: 10px; background: ui.$source-primary-soft; color: ui.$source-primary; font-size: 24px; font-weight: 500; }
.power-stepper button:disabled { color: ui.$source-disabled; background: #f1f5f9; }.power-stepper button:focus-visible { @include ui.focus-ring; }
.power-stepper div { text-align: center; }.power-stepper strong { @include ui.numeric; color: ui.$source-text; font-size: 22px; }.power-stepper span { margin-left: 4px; color: ui.$source-text-sub; font-size: 10px; }.power-stepper small { display: block; margin-top: 1px; color: ui.$source-text-sub; font-size: 9px; }
.correction-strip { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid ui.$source-border; border-radius: 12px; background: #fff; }
.correction-strip div { padding: 7px 10px; }.correction-strip div + div { border-left: 1px solid ui.$source-border; }.correction-strip span { display: block; color: ui.$source-text-sub; font-size: 9px; }.correction-strip strong { display: block; margin-top: 2px; color: ui.$source-text; font-size: 10px; @include ui.numeric; }
.output-action { @include ui.primary-button; width: 100%; }.output-action.stop { background: ui.$source-danger; box-shadow: 0 8px 18px rgba(220,38,38,.18); }

.dialog-backdrop { position: absolute; inset: 0; z-index: 50; display: grid; place-items: center; padding: 20px; background: rgba(5,12,22,.62); }
.confirm-dialog { width: min(100%, 310px); padding: 20px; border-radius: 16px; background: #fff; text-align: center; box-shadow: 0 24px 55px rgba(0,0,0,.28); }
.laser-mark { display: inline-block; padding: 4px 8px; border: 1px solid #fca5a5; border-radius: 6px; color: ui.$source-danger; font-size: 11px; font-weight: 800; }.confirm-dialog h2 { margin: 12px 0 7px; color: ui.$source-text; font-size: 17px; }.confirm-dialog p { margin: 0; color: ui.$source-text-sub; font-size: 12px; line-height: 1.55; }
.confirm-dialog div { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 18px; }.confirm-dialog button { @include ui.button-reset; min-height: 44px; border-radius: 11px; background: #eef2f7; color: ui.$source-text; font-size: 13px; font-weight: 700; }.confirm-dialog button.confirm { background: ui.$source-danger; color: #fff; }.confirm-dialog button:focus-visible { @include ui.focus-ring; }
.feedback { position: absolute; left: 50%; bottom: 96px; z-index: 55; transform: translateX(-50%); padding: 9px 13px; border-radius: 8px; background: rgba(15,23,42,.94); color: #fff; font-size: 11px; white-space: nowrap; }

@media (max-width: 340px) { .mode-control { grid-template-columns: 1fr 1fr; } }
</style>
