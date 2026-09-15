<template>
  <PortAuditPageShell standalone :title="t('portAudit.vflPageTitle')" :subtitle="device?.name" @back="goHome">
    <DeviceVflControl
      :connected="connected"
      :reconnecting="reconnecting"
      :color="state.persisted.vflColor"
      :mode="state.persisted.vflMode"
      :pending-mode="pendingMode"
      :supported-modes="supportedModes"
      :feedback="feedback"
      :copy="vflCopy"
      @offline-action="reconnect"
      @color-change="setColor"
      @mode-request="selectMode"
      @cancel-confirm="pendingMode = null"
      @confirm="confirmMode"
    />
    <template #footer><PortAuditFunctionNav :device-id="deviceId" active="audit" /></template>
  </PortAuditPageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import DeviceVflControl, { type DeviceVflColor, type DeviceVflCopy, type DeviceVflMode } from '../components/DeviceVflControl.vue'
import PortAuditPageShell from './PortAuditPageShell.vue'
import PortAuditFunctionNav from './PortAuditFunctionNav.vue'
import { usePortAuditDevice } from './usePortAuditDevice'
import { usePortAuditState, type PortAuditVflMode } from './usePortAuditState'

const router = useRouter()
const { t } = useI18n()
const { updateDevice } = useAuth()
const { deviceId, device } = usePortAuditDevice()
const state = usePortAuditState(deviceId.value)
const goHome = () => router.push(`/device/${deviceId.value}`)
const reconnecting = ref(false)
const pendingMode = ref<Exclude<PortAuditVflMode, 'off'> | null>(null)
const feedback = ref('')
let feedbackTimer: number | undefined

const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const supportedModes: DeviceVflMode[] = ['off', 'cw', '1hz', '2hz']
const vflCopy = computed<DeviceVflCopy>(() => ({
  offlineTitle: t('portAudit.disconnected'),
  offlineText: t('portAudit.connectFirst'),
  offlineAction: t('portAudit.reconnect'),
  outputOff: t('portAudit.vflOff'),
  outputActive: t('portAudit.vflActive'),
  readyHint: t('portAudit.vflOff'),
  activeHint: t('portAudit.laserConfirmText'),
  colorTitle: t('portAudit.vflColor'),
  colorHint: 'VFL',
  redLabel: t('portAudit.red'),
  greenLabel: t('portAudit.green'),
  modeTitle: t('portAudit.vflMode'),
  modeHint: 'CW / 1Hz / 2Hz',
  startLabel: t('portAudit.outputOn'),
  stopLabel: t('portAudit.vflOff'),
  safetyTitle: t('portAudit.laserConfirmTitle'),
  safetyText: t('portAudit.laserConfirmText'),
  confirmTitle: t('portAudit.laserConfirmTitle'),
  confirmText: t('portAudit.laserConfirmText'),
  confirmAction: t('portAudit.confirmStart'),
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

const selectMode = (mode: PortAuditVflMode) => {
  if (mode === 'off') {
    state.setVflMode('off')
    showFeedback(t('portAudit.vflOff'))
    return
  }
  if (!connected.value) {
    showFeedback(t('portAudit.connectFirst'))
    return
  }
  if (state.persisted.vflMode === 'off') {
    pendingMode.value = mode
    return
  }
  state.setVflMode(mode)
  showFeedback(t('portAudit.vflActive'))
}

const confirmMode = () => {
  if (!pendingMode.value) return
  state.setVflMode(pendingMode.value)
  pendingMode.value = null
  showFeedback(t('portAudit.vflActive'))
}

const reconnect = async () => {
  reconnecting.value = true
  await state.reconnectBluetooth()
  updateDevice(deviceId.value, { status: 'connected' })
  reconnecting.value = false
  showFeedback(t('portAudit.connected'))
}

onBeforeUnmount(() => {
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  state.setVflMode('off')
})
</script>
