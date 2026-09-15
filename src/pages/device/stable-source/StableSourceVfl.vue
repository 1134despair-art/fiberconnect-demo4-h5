<template>
  <StableSourcePageShell standalone :title="pageTitle" :subtitle="device?.name" @back="goToDeviceHome">
    <template #footer>
      <StableSourceFunctionNav :device-id="deviceId" active="vfl" />
    </template>

    <main class="vfl-page">
      <section v-if="!connected" class="offline-banner" role="status">
        <div>
          <strong>{{ t('stableSource.disconnected') }}</strong>
          <span>{{ t('stableSource.reconnectHint') }}</span>
        </div>
        <button type="button" :disabled="reconnecting" @click="reconnect">
          {{ reconnecting ? t('stableSource.reconnecting') : t('stableSource.reconnect') }}
        </button>
      </section>

      <section class="laser-stage" :class="{ active: state.persisted.vflMode !== 'off', green: state.persisted.vflColor === 'green' }" aria-live="polite">
        <span class="laser-mark"><img :src="vflIcon" alt="" /></span>
        <strong v-if="state.persisted.vflColor === 'red'">650 <small>nm</small></strong>
        <strong v-else>{{ t('stableSource.greenLightMode') }}</strong>
        <span class="output-status">{{ modeLabel }}</span>
      </section>

      <section v-if="availableColors.length > 1" class="color-section">
        <h2>{{ t('stableSource.vflColor') }}</h2>
        <p>{{ t('stableSource.vflColorHint') }}</p>
        <div class="color-control" role="radiogroup" :aria-label="t('stableSource.vflColor')">
          <button
            v-for="color in availableColors"
            :key="color"
            type="button"
            role="radio"
            :aria-checked="state.persisted.vflColor === color"
            :class="{ active: state.persisted.vflColor === color }"
            @click="selectColor(color)"
          >
            <i :class="color"></i>
            <strong>{{ color === 'red' ? t('stableSource.redLight') : t('stableSource.greenLight') }}</strong>
          </button>
        </div>
      </section>

      <section class="mode-section">
        <h2>{{ t('stableSource.vflMode') }}</h2>
        <p>{{ t('stableSource.vflModeHint') }}</p>
        <div class="mode-grid" role="radiogroup" :aria-label="t('stableSource.vflMode')">
          <button
            v-for="mode in modes"
            :key="mode"
            type="button"
            role="radio"
            :aria-checked="state.persisted.vflMode === mode"
            :class="{ active: state.persisted.vflMode === mode }"
            :disabled="!connected"
            @click="requestMode(mode)"
          >
            <span class="mode-symbol"><img :src="modeIcons[mode]" alt="" /></span>
            <strong>{{ formatVflMode(mode) }}</strong>
          </button>
        </div>
      </section>

      <button class="power-off" type="button" :disabled="state.persisted.vflMode === 'off'" @click="requestMode('off')">
        <img :src="powerIcon" alt="" />
        <span>{{ t('stableSource.off') }}</span>
      </button>

      <div v-if="feedback" class="feedback-toast" role="status">{{ feedback }}</div>
    </main>

    <div v-if="pendingMode" class="confirm-layer" role="presentation">
      <button class="confirm-mask" type="button" :aria-label="t('common.cancel')" @click="pendingMode = null"></button>
      <section role="alertdialog" aria-modal="true" :aria-label="t('stableSource.vflSafetyTitle')">
        <span>LASER</span>
        <h2>{{ t('stableSource.vflSafetyTitle') }}</h2>
        <p>{{ t('stableSource.vflSafetyText') }}</p>
        <div>
          <button type="button" @click="pendingMode = null">{{ t('common.cancel') }}</button>
          <button class="danger" type="button" @click="confirmMode">{{ t('stableSource.confirmStart') }}</button>
        </div>
      </section>
    </div>
  </StableSourcePageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import vflIcon from '@/assets/icons/pon-meter/ui/vfl.png'
import powerIcon from '@/assets/icons/pon-meter/ui/power-off.png'
import pulse1HzIcon from '@/assets/icons/pon-meter/ui/pulse-1hz.png'
import pulse2HzIcon from '@/assets/icons/pon-meter/ui/pulse-2hz.png'
import continuousWaveIcon from '@/assets/icons/pon-meter/ui/continuous-wave.png'
import StableSourceFunctionNav from './StableSourceFunctionNav.vue'
import StableSourcePageShell from './StableSourcePageShell.vue'
import { useStableSourceDevice } from './useStableSourceDevice'
import {
  useStableSourceState,
  resolveStableSourceCapabilities,
  type StableSourceVflColor,
  type StableSourceVflMode
} from './useStableSourceState'

const router = useRouter()
const { t } = useI18n()
const { updateDevice } = useAuth()
const { deviceId, device } = useStableSourceDevice()
const state = useStableSourceState(deviceId.value, resolveStableSourceCapabilities(device.value))
const modes: Exclude<StableSourceVflMode, 'off'>[] = ['steady', '1hz', '2hz', 'cw']
const modeIcons: Record<Exclude<StableSourceVflMode, 'off'>, string> = {
  steady: vflIcon,
  cw: continuousWaveIcon,
  '1hz': pulse1HzIcon,
  '2hz': pulse2HzIcon
}
const reconnecting = ref(false)
const pendingMode = ref<Exclude<StableSourceVflMode, 'off'> | null>(null)
const feedback = ref('')
let feedbackTimer: number | undefined

const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const availableColors = computed(() => state.capabilities.vflColors)
const pageTitle = computed(() => availableColors.value.length > 1
  ? t('stableSource.vflSourceTitle')
  : state.persisted.vflColor === 'green'
    ? t('stableSource.vflGreenTitle')
    : t('stableSource.vflPageTitle'))
const formatVflMode = (mode: Exclude<StableSourceVflMode, 'off'>) => mode === 'steady'
  ? t('stableSource.vflSteady')
  : mode === '1hz'
    ? '1Hz'
    : mode === '2hz'
      ? '2Hz'
      : 'CW'
const modeLabel = computed(() => state.persisted.vflMode === 'off'
  ? t('stableSource.vflInactive')
  : `${formatVflMode(state.persisted.vflMode)} · ${t('stableSource.vflActive')}`)
const goToDeviceHome = () => router.replace(`/device/${deviceId.value}`)

const selectColor = (color: StableSourceVflColor) => {
  if (color === state.persisted.vflColor) return
  state.setVflColor(color)
  showFeedback(color === 'red' ? t('stableSource.redLightSelected') : t('stableSource.greenLightSelected'))
}

const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}

const reconnect = async () => {
  reconnecting.value = true
  await state.reconnectBluetooth()
  updateDevice(deviceId.value, { status: 'connected' })
  if (device.value) device.value.status = 'connected'
  reconnecting.value = false
  showFeedback(t('stableSource.connectionRestored'))
}

const requestMode = (mode: StableSourceVflMode) => {
  if (mode === 'off') {
    state.setVflMode('off')
    return showFeedback(t('stableSource.vflInactive'))
  }
  if (!connected.value) return showFeedback(t('stableSource.connectBeforeControl'))
  if (state.persisted.vflMode === 'off') {
    pendingMode.value = mode
    return
  }
  state.setVflMode(mode)
  showFeedback(t('stableSource.vflActive'))
}

const confirmMode = () => {
  if (!pendingMode.value) return
  state.setVflMode(pendingMode.value)
  pendingMode.value = null
  showFeedback(t('stableSource.vflActive'))
}

onBeforeUnmount(() => {
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  state.setVflMode('off')
})
</script>

<style scoped lang="scss">
@use './stableSourceUi.scss' as ui;

.vfl-page { @include ui.page-padding; min-height: 100%; display: flex; flex-direction: column; gap: 14px; padding: 10px 18px 16px; }
.offline-banner { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; }
.offline-banner strong, .offline-banner span { display: block; }
.offline-banner strong { color: #9a3412; font-size: 11px; }
.offline-banner span { margin-top: 2px; color: #c2410c; font-size: 10px; }
.offline-banner button { @include ui.button-reset; min-height: 38px; padding: 0 8px; border: 1px solid #fed7aa; border-radius: 8px; background: #fff; color: #9a3412; font-size: 10px; font-weight: 700; }

.laser-stage { min-height: 156px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 1px solid #e6edf7; background: transparent; }
.laser-mark { width: 58px; height: 58px; display: grid; place-items: center; }
.laser-mark img { width: 48px; height: 48px; filter: grayscale(1) opacity(.38); transition: filter .18s ease, transform .18s ease; }
.laser-stage.active .laser-mark img { filter: brightness(0) saturate(100%) invert(26%) sepia(98%) saturate(3117%) hue-rotate(348deg) brightness(101%) contrast(91%); transform: scale(1.04); }
.laser-stage.active.green .laser-mark img { filter: brightness(0) saturate(100%) invert(57%) sepia(95%) saturate(407%) hue-rotate(93deg) brightness(90%) contrast(91%); }
.laser-stage > strong { margin-top: 8px; color: ui.$source-text; font-size: 24px; line-height: 1; @include ui.numeric; }
.laser-stage > strong small { font-size: 12px; font-weight: 500; }
.output-status { min-width: 106px; margin-top: 12px; padding: 5px 10px; border-radius: 999px; background: #eef2f7; color: ui.$source-text-sub; font-size: 10px; text-align: center; }
.laser-stage.active .output-status { background: #fef2f2; color: #dc2626; }
.laser-stage.active.green .output-status { background: #f0fdf4; color: #15803d; }

.color-section h2, .color-section p { margin: 0; }
.color-section h2 { color: ui.$source-text; font-size: 14px; }
.color-section p { margin-top: 4px; color: ui.$source-text-sub; font-size: 10px; }
.color-control { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.color-control button { @include ui.button-reset; min-height: 52px; display: flex; align-items: center; justify-content: center; gap: 9px; border: 1px solid #e1e9f4; border-radius: 10px; background: #fff; color: ui.$source-text; font-size: 12px; }
.color-control button.active { border-color: ui.$source-primary; background: ui.$source-primary-soft; color: ui.$source-primary; }
.color-control i { width: 11px; height: 11px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 0 4px rgba(239,68,68,.10); }
.color-control i.green { background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.10); }

.mode-section h2, .mode-section p { margin: 0; }
.mode-section h2 { color: ui.$source-text; font-size: 14px; }
.mode-section p { margin-top: 4px; color: ui.$source-text-sub; font-size: 10px; }
.mode-grid { display: grid; gap: 10px; margin-top: 12px; }
.mode-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; }
.mode-grid button { @include ui.button-reset; min-width: 0; border: 1px solid #e1e9f4; border-radius: 10px; background: #fff; color: ui.$source-text; font-size: 12px; font-weight: 700; box-shadow: 0 4px 12px rgba(37,99,235,.05); }
.mode-grid button { min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
.mode-grid button.active { border-color: ui.$source-primary; background: ui.$source-primary; color: #fff; box-shadow: 0 8px 18px rgba(37,99,235,.2); }
.mode-symbol { width: 34px; height: 28px; display: grid; place-items: center; }
.mode-symbol img { width: 30px; height: 30px; object-fit: contain; }
.mode-grid button.active .mode-symbol img { filter: brightness(0) invert(1); }
.power-off { @include ui.button-reset; min-height: 50px; display: flex; align-items: center; justify-content: center; gap: 9px; border: 1px solid ui.$source-border; border-radius: 10px; background: #f2f6fb; color: ui.$source-text; font-size: 14px; }
.power-off img { width: 21px; height: 21px; }
.power-off:disabled { color: ui.$source-disabled; opacity: .62; }
.feedback-toast { position: absolute; left: 50%; bottom: 96px; z-index: 95; transform: translateX(-50%); padding: 9px 13px; border-radius: 8px; background: rgba(15,23,42,.94); color: #fff; font-size: 11px; white-space: nowrap; }

.confirm-layer { position: absolute; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; }
.confirm-mask { position: absolute; inset: 0; width: 100%; border: 0; background: rgba(15,23,42,.55); }
.confirm-layer section { position: relative; width: min(100%, 320px); box-sizing: border-box; padding: 20px; border-radius: 12px; background: #fff; text-align: center; box-shadow: 0 20px 48px rgba(15,23,42,.24); }
.confirm-layer section > span { display: inline-grid; min-width: 58px; height: 28px; place-items: center; border: 2px solid #dc2626; border-radius: 999px; color: #dc2626; font-size: 10px; font-weight: 800; }
.confirm-layer h2 { margin: 12px 0 0; font-size: 16px; }
.confirm-layer p { margin: 7px 0 17px; color: ui.$source-text-sub; font-size: 11px; line-height: 1.5; }
.confirm-layer section > div { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.confirm-layer section button { @include ui.button-reset; min-height: 44px; border-radius: 8px; background: #eef2f7; font-size: 13px; font-weight: 700; }
.confirm-layer section button.danger { background: ui.$source-danger; color: #fff; }

@media (max-width: 340px) {
  .vfl-page { gap: 12px; padding-inline: 14px; }
  .laser-stage { min-height: 142px; }
  .mode-grid { gap: 5px; }
  .mode-grid button { min-height: 68px; font-size: 11px; }
  .mode-symbol img { width: 26px; height: 26px; }
}
</style>
