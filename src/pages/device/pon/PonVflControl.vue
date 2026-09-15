<template>
  <div class="app-container pon-vfl-app">
    <PonPageShell :title="t('pon.vflRedTitle')" @back="goToDeviceHome">
      <template #footer>
        <PonFunctionNav :device-id="deviceId" active="vfl" />
      </template>

      <main class="vfl-page">
        <section v-if="!isOnline" class="offline-banner" role="status">
          <div><strong>{{ t('pon.connectionLost') }}</strong><span>{{ t('pon.vflOfflineHint') }}</span></div>
          <button type="button" @click="router.push(`/device/${deviceId}/pon-settings`)">{{ t('pon.openSettings') }}</button>
        </section>

        <section class="laser-stage" :class="{ active: state.persisted.vflMode !== 'off' }" aria-live="polite">
          <span class="laser-mark"><img :src="vflIcon" alt="" /></span>
          <strong>650 <small>nm</small></strong>
          <span class="output-status">{{ modeLabel }}</span>
        </section>

        <section class="mode-section">
          <h2>{{ t('pon.outputMode') }}</h2>
          <p>{{ t('pon.outputModeHint') }}</p>
          <div class="mode-grid" role="radiogroup" :aria-label="t('pon.outputMode')">
            <button
              v-for="mode in modes"
              :key="mode"
              type="button"
              role="radio"
              :aria-checked="state.persisted.vflMode === mode"
              :class="{ active: state.persisted.vflMode === mode }"
              :disabled="!isOnline"
              @click="requestMode(mode)"
            >
              <span class="mode-symbol"><img :src="modeIcons[mode]" alt="" /></span>
              <strong>{{ formatMode(mode) }}</strong>
            </button>
          </div>
        </section>

        <button class="power-off" type="button" :disabled="state.persisted.vflMode === 'off'" @click="requestMode('off')">
          <img :src="powerIcon" alt="" /><span>{{ t('pon.modeOff') }}</span>
        </button>

        <div v-if="feedback" class="feedback-toast" role="status">{{ feedback }}</div>
      </main>

      <div v-if="pendingMode" class="confirm-layer" role="presentation">
        <button class="confirm-mask" type="button" :aria-label="t('common.cancel')" @click="pendingMode = null"></button>
        <section role="alertdialog" aria-modal="true" :aria-label="t('pon.safetyConfirmTitle')">
          <span>LASER</span>
          <h2>{{ t('pon.safetyConfirmTitle') }}</h2>
          <p>{{ t('pon.safetyConfirmMessage') }}</p>
          <div>
            <button type="button" @click="pendingMode = null">{{ t('common.cancel') }}</button>
            <button class="danger" type="button" @click="confirmMode">{{ t('pon.confirmOutput') }}</button>
          </div>
        </section>
      </div>
    </PonPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import vflIcon from '@/assets/icons/pon-meter/ui/vfl.png'
import powerIcon from '@/assets/icons/pon-meter/ui/power-off.png'
import pulse1HzIcon from '@/assets/icons/pon-meter/ui/pulse-1hz.png'
import pulse2HzIcon from '@/assets/icons/pon-meter/ui/pulse-2hz.png'
import continuousWaveIcon from '@/assets/icons/pon-meter/ui/continuous-wave.png'
import PonFunctionNav from './PonFunctionNav.vue'
import PonPageShell from './PonPageShell.vue'
import { usePonDevice } from './usePonDevice'
import { usePonPowerMeterState, type PonVflMode } from './usePonPowerMeterState'

const { t } = useI18n()
const router = useRouter()
const { deviceId, device } = usePonDevice()
const state = usePonPowerMeterState(deviceId.value)
const modes: PonVflMode[] = ['steady', '1hz', '2hz', 'cw']
const modeIcons: Record<PonVflMode, string> = {
  off: powerIcon,
  steady: vflIcon,
  '1hz': pulse1HzIcon,
  '2hz': pulse2HzIcon,
  cw: continuousWaveIcon
}
const pendingMode = ref<PonVflMode | null>(null)
const feedback = ref('')
let feedbackTimer: number | undefined

const isOnline = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const formatMode = (mode: PonVflMode) => mode === 'steady' ? t('pon.modeSteady') : mode === '1hz' ? '1Hz' : mode === '2hz' ? '2Hz' : mode === 'cw' ? 'CW' : t('pon.modeOff')
const modeLabel = computed(() => state.persisted.vflMode === 'off' ? t('pon.outputOff') : `${formatMode(state.persisted.vflMode)} · ${t('pon.outputActive')}`)
const goToDeviceHome = () => router.replace(`/device/${deviceId.value}`)

const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}

const requestMode = (mode: PonVflMode) => {
  if (mode === 'off') {
    state.setVflMode('off')
    return showFeedback(t('pon.outputStopped'))
  }
  if (!isOnline.value) return showFeedback(t('pon.connectBeforeControl'))
  if (state.persisted.vflMode === 'off') {
    pendingMode.value = mode
    return
  }
  state.setVflMode(mode)
  showFeedback(t('pon.outputModeUpdated'))
}

const confirmMode = () => {
  if (!pendingMode.value) return
  state.setVflMode(pendingMode.value)
  pendingMode.value = null
  showFeedback(t('pon.outputStarted'))
}

watch(isOnline, online => { if (!online) state.setVflMode('off') })
onUnmounted(() => { if (feedbackTimer) window.clearTimeout(feedbackTimer) })
</script>

<style scoped lang="scss">
@use './ponUi.scss' as ui;

.pon-vfl-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$pon-bg; }
.vfl-page { @include ui.page-surface; min-height: 100%; display: flex; flex-direction: column; gap: 20px; padding: 14px 18px 22px; }
.offline-banner { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; }
.offline-banner strong, .offline-banner span { display: block; }
.offline-banner strong { color: #9a3412; font-size: 11px; }
.offline-banner span { margin-top: 2px; color: #c2410c; font-size: 10px; }
.offline-banner button { @include ui.secondary-button; min-height: 38px; padding: 0 8px; color: #9a3412; font-size: 10px; }

.laser-stage { min-height: 218px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 1px solid #e6edf7; background: transparent; }
.laser-mark { width: 72px; height: 72px; display: grid; place-items: center; }
.laser-mark img { width: 58px; height: 58px; filter: grayscale(1) opacity(.38); transition: filter .18s ease, transform .18s ease; }
.laser-stage.active .laser-mark img { filter: brightness(0) saturate(100%) invert(26%) sepia(98%) saturate(3117%) hue-rotate(348deg) brightness(101%) contrast(91%); transform: scale(1.04); }
.laser-stage > strong { margin-top: 8px; color: ui.$pon-text; font-size: 24px; line-height: 1; @include ui.metric-number; }
.laser-stage > strong small { font-size: 12px; font-weight: 500; }
.output-status { min-width: 96px; margin-top: 12px; padding: 5px 10px; border-radius: 999px; background: #eef2f7; color: ui.$pon-text-sub; font-size: 10px; text-align: center; }
.laser-stage.active .output-status { background: #fef2f2; color: #dc2626; }

.mode-section h2, .mode-section p { margin: 0; }
.mode-section h2 { color: ui.$pon-text; font-size: 14px; }
.mode-section p { margin-top: 4px; color: ui.$pon-text-sub; font-size: 10px; }
.mode-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.mode-grid button { @include ui.button-reset; min-width: 0; min-height: 86px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border: 1px solid #e1e9f4; border-radius: 10px; background: #ffffff; color: ui.$pon-text; box-shadow: 0 4px 12px rgba(37,99,235,.05); }
.mode-grid button:last-child { grid-column: 2; }
.mode-grid button.active { border-color: ui.$pon-primary; background: ui.$pon-primary; color: #ffffff; box-shadow: 0 8px 18px rgba(37,99,235,.2); }
.mode-grid strong { font-size: 12px; }
.mode-symbol { width: 34px; height: 28px; display: flex; align-items: center; justify-content: center; gap: 3px; }
.mode-symbol img { width: 30px; height: 30px; object-fit: contain; }
.mode-grid button.active .mode-symbol img { filter: brightness(0) invert(1); }

.power-off { @include ui.secondary-button; min-height: 50px; display: flex; align-items: center; justify-content: center; gap: 9px; background: #f2f6fb; font-size: 14px; }
.power-off img { width: 21px; height: 21px; }
.confirm-layer { position: absolute; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; }
.confirm-mask { position: absolute; inset: 0; border: 0; background: rgba(15,23,42,.55); }
.confirm-layer section { position: relative; width: min(100%, 320px); box-sizing: border-box; padding: 20px; border-radius: 12px; background: #ffffff; text-align: center; box-shadow: 0 20px 48px rgba(15,23,42,.24); }
.confirm-layer section > span { display: inline-grid; min-width: 58px; height: 28px; place-items: center; border: 2px solid #dc2626; border-radius: 999px; color: #dc2626; font-size: 10px; font-weight: 800; }
.confirm-layer h2 { margin: 12px 0 0; font-size: 16px; }
.confirm-layer p { margin: 7px 0 17px; color: ui.$pon-text-sub; font-size: 11px; line-height: 1.5; }
.confirm-layer section > div { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.confirm-layer section button { @include ui.secondary-button; }
.confirm-layer section button.danger { border-color: ui.$pon-danger; background: ui.$pon-danger; color: #ffffff; }
.feedback-toast { position: fixed; left: 50%; bottom: 28px; z-index: 110; max-width: 300px; transform: translateX(-50%); padding: 9px 13px; border-radius: 8px; background: rgba(15,23,42,.94); color: #ffffff; font-size: 11px; text-align: center; }
@media (max-width: 340px) { .vfl-page { gap: 16px; padding-inline: 14px; }.laser-stage { min-height: 190px; }.mode-grid { gap: 7px; }.mode-grid button { min-height: 78px; } }
</style>
