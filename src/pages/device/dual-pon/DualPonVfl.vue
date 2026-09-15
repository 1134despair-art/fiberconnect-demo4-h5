<template>
  <DualPonPageShell :title="t('dualPon.vflTitle')" :subtitle="device?.name" standalone @back="goBack">
    <template #footer><DualPonFunctionNav :device-id="deviceId" active="home" /></template>
    <DeviceVflControl
      :connected="connected"
      :reconnecting="reconnecting"
      :color="state.persisted.vflColor"
      :mode="state.persisted.vflMode"
      :pending-mode="pendingMode"
      :supported-modes="supportedModes"
      :supports-green="supportsGreen"
      :feedback="feedback"
      :copy="vflCopy"
      @offline-action="reconnect"
      @color-change="setColor"
      @mode-request="requestMode"
      @cancel-confirm="pendingMode = null"
      @confirm="confirmOutput"
    />
  </DualPonPageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import DeviceVflControl, { type DeviceVflColor, type DeviceVflCopy, type DeviceVflMode } from '../components/DeviceVflControl.vue'
import DualPonPageShell from './DualPonPageShell.vue'
import DualPonFunctionNav from './DualPonFunctionNav.vue'
import { useDualPonState, type DualPonVflMode } from './useDualPonState'
import { useDualPonDevice } from './useDualPonDevice'

const router = useRouter()
const { t } = useI18n()
const { updateDevice } = useAuth()
const { deviceId, device } = useDualPonDevice()
const state = useDualPonState(deviceId.value)
const pendingMode = ref<Exclude<DualPonVflMode, 'off'> | null>(null)
const reconnecting = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined

const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
watchEffect(() => state.configureCapabilities({ powerRange: device.value?.dualPonPowerRange, supportedVflColors: device.value?.supportedVflColors }))
const supportsGreen = computed(() => state.capabilities.supportedVflColors.includes('green'))
const supportedModes: DeviceVflMode[] = ['off', 'cw', '1hz', '2hz']
const vflCopy = computed<DeviceVflCopy>(() => ({
  offlineTitle: t('dualPon.disconnected'),
  offlineText: t('dualPon.connectFirst'),
  offlineAction: t('dualPon.reconnect'),
  outputOff: t('dualPon.outputOff'),
  outputActive: t('dualPon.outputActive'),
  readyHint: t('dualPon.outputOff'),
  activeHint: t('dualPon.laserWarning'),
  colorTitle: t('dualPon.outputColor'),
  colorHint: t('dualPon.vflModeHint'),
  redLabel: t('dualPon.red'),
  greenLabel: t('dualPon.green'),
  modeTitle: t('dualPon.outputMode'),
  modeHint: t('dualPon.vflModeHint'),
  startLabel: t('dualPon.on'),
  stopLabel: t('dualPon.outputOff'),
  safetyTitle: t('dualPon.laserConfirmTitle'),
  safetyText: t('dualPon.laserWarning'),
  confirmTitle: t('dualPon.laserConfirmTitle'),
  confirmText: t('dualPon.laserConfirmText'),
  confirmAction: t('dualPon.confirmOutput'),
  cancelLabel: t('common.cancel')
}))

const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}

const setColor = (color: DeviceVflColor) => {
  state.persisted.vflColor = color
}

const requestMode = (mode: DualPonVflMode) => {
  if (mode === 'off') {
    state.setVfl('off')
    showFeedback(t('dualPon.outputOff'))
    return
  }
  if (!connected.value) {
    showFeedback(t('dualPon.connectFirst'))
    return
  }
  if (state.persisted.vflMode === 'off') {
    pendingMode.value = mode
    return
  }
  state.setVfl(mode)
  showFeedback(t('dualPon.outputActive'))
}

const confirmOutput = () => {
  if (!pendingMode.value) return
  state.setVfl(pendingMode.value)
  pendingMode.value = null
  showFeedback(t('dualPon.outputActive'))
}

const reconnect = async () => {
  reconnecting.value = true
  await state.reconnectBluetooth()
  updateDevice(deviceId.value, { status: 'connected' })
  reconnecting.value = false
  showFeedback(t('dualPon.connectionRestored'))
}

const goBack = () => {
  state.setVfl('off')
  router.push(`/device/${deviceId.value}`)
}

onBeforeUnmount(() => {
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  state.setVfl('off')
})
</script>
