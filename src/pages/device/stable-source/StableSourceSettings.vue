<template>
  <StableSourcePageShell standalone :title="t('stableSource.settingsPageTitle')" :subtitle="device?.name" @back="goToDeviceHome">
    <template #action>
      <span class="connection-badge" :class="{ online: connected }">
        {{ connected ? t('stableSource.online') : t('stableSource.offline') }}
      </span>
    </template>

    <template #footer>
      <StableSourceFunctionNav :device-id="deviceId" active="settings" />
    </template>

    <div class="settings-page">
      <DeviceSettingsList :sections="settingSections" @select="openSetting" />
    </div>

    <DeviceSettingDialog
      contained
      :open="activeDialog !== null"
      :title="dialogTitle"
      :description="dialogDescription"
      :show-footer="activeDialog !== 'info'"
      :confirm-text="dialogConfirmText"
      :danger="activeDialog === 'bluetooth' && connected"
      :busy="connecting"
      @close="activeDialog = null"
      @confirm="confirmSetting"
    >
      <dl v-if="activeDialog === 'bluetooth'" class="setting-info-list">
        <div><dt>{{ t('stableSource.bluetooth') }}</dt><dd>{{ connected ? t('stableSource.connected') : t('stableSource.disconnected') }}</dd></div>
        <div><dt>{{ t('stableSource.outputStatus') }}</dt><dd>{{ state.runtime.outputStatus }}</dd></div>
        <div><dt>VFL</dt><dd>{{ state.persisted.vflMode.toUpperCase() }}</dd></div>
        <div><dt>LED</dt><dd>{{ state.persisted.flashlightOn ? t('stableSource.on') : t('stableSource.off') }}</dd></div>
      </dl>

      <div v-else-if="activeDialog === 'calibration'" class="calibration-dialog">
        <div v-for="wavelength in state.capabilities.wavelengths" :key="wavelength" class="calibration-item">
          <header><strong>{{ wavelength }}nm</strong><button type="button" @click="draftOffsets[wavelength] = 0">{{ t('stableSource.restoreWavelength') }}</button></header>
          <div class="setting-stepper">
            <button type="button" :disabled="draftOffsets[wavelength] <= state.capabilities.calibrationRange.min" @click="adjustDraftOffset(wavelength, -state.capabilities.calibrationRange.step)">−</button>
            <strong>{{ formatOffset(draftOffsets[wavelength]) }}<small>dBm</small></strong>
            <button type="button" :disabled="draftOffsets[wavelength] >= state.capabilities.calibrationRange.max" @click="adjustDraftOffset(wavelength, state.capabilities.calibrationRange.step)">+</button>
          </div>
        </div>
        <button class="setting-inline-action secondary" type="button" @click="resetDraftOffsets">{{ t('stableSource.restoreAll') }}</button>
      </div>

      <div v-else-if="activeDialog === 'gain'" class="setting-stepper">
        <button type="button" :disabled="draftGain <= state.capabilities.gainRange.min" @click="adjustDraftGain(-state.capabilities.gainRange.step)">−</button>
        <strong>{{ draftGain }}<small>%</small></strong>
        <button type="button" :disabled="draftGain >= state.capabilities.gainRange.max" @click="adjustDraftGain(state.capabilities.gainRange.step)">+</button>
      </div>

      <div v-else-if="activeDialog === 'language'" class="setting-options">
        <button v-for="language in state.capabilities.languages" :key="language" class="setting-option" :class="{ active: draftLanguage === language }" :aria-pressed="draftLanguage === language" type="button" @click="draftLanguage = language">
          {{ language === 'en' ? t('stableSource.english') : t('stableSource.simplifiedChinese') }}
        </button>
      </div>

      <div v-else-if="activeDialog === 'shutdown'" class="setting-options">
        <button v-for="minutes in shutdownOptions" :key="minutes" class="setting-option" :class="{ active: draftShutdown === minutes }" :aria-pressed="draftShutdown === minutes" type="button" @click="draftShutdown = minutes">
          {{ minutes === 0 ? t('stableSource.never') : t('stableSource.minutes', { count: minutes }) }}
        </button>
      </div>

      <dl v-else-if="activeDialog === 'info'" class="setting-info-list">
        <div><dt>{{ t('stableSource.model') }}</dt><dd>{{ device?.model || 'SLS-1315' }}</dd></div>
        <div><dt>{{ t('stableSource.productBatch') }}</dt><dd>{{ device?.productBatch || 'SLS-202607-A01' }}</dd></div>
        <div><dt>{{ t('stableSource.version') }}</dt><dd>V1.0.0</dd></div>
        <div><dt>{{ t('stableSource.charging') }}</dt><dd>USB Type-C</dd></div>
        <div><dt>{{ t('stableSource.deviceBattery') }}</dt><dd>{{ device?.batteryPercent ?? 0 }}%</dd></div>
        <div><dt>{{ t('stableSource.chargeStatus') }}</dt><dd>{{ device?.batteryCharging ? t('stableSource.chargingNow') : t('stableSource.notCharging') }}</dd></div>
        <div><dt>{{ t('stableSource.workTemperature') }}</dt><dd>-10 ~ 60°C</dd></div>
      </dl>
    </DeviceSettingDialog>

    <div v-if="feedback" class="settings-toast" role="status">{{ feedback }}</div>
  </StableSourcePageShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import DeviceSettingsList, { type DeviceSettingSection } from '../components/DeviceSettingsList.vue'
import DeviceSettingDialog from '../components/DeviceSettingDialog.vue'
import StableSourceFunctionNav from './StableSourceFunctionNav.vue'
import StableSourcePageShell from './StableSourcePageShell.vue'
import { useStableSourceDevice } from './useStableSourceDevice'
import { resolveStableSourceCapabilities, useStableSourceState, type StableSourceAutoShutdown, type StableSourceDeviceLanguage, type StableSourceWavelength } from './useStableSourceState'

type SettingDialog = 'bluetooth' | 'calibration' | 'gain' | 'language' | 'shutdown' | 'info'

const router = useRouter()
const { t } = useI18n()
const { updateDevice } = useAuth()
const { deviceId, device } = useStableSourceDevice()
const state = useStableSourceState(deviceId.value, resolveStableSourceCapabilities(device.value))
const activeDialog = ref<SettingDialog | null>(null)
const connecting = ref(false)
const feedback = ref('')
const shutdownOptions = computed(() => state.capabilities.autoShutdownOptions)
const draftOffsets = reactive<Record<StableSourceWavelength, number>>({ 1310: 0, 1550: 0 })
const draftGain = ref(100)
const draftLanguage = ref<StableSourceDeviceLanguage>('zh-CN')
const draftShutdown = ref<StableSourceAutoShutdown>(5)
let feedbackTimer: number | undefined

const goToDeviceHome = () => router.replace(`/device/${deviceId.value}`)

const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const languageLabel = computed(() => state.persisted.deviceLanguage === 'en' ? 'English' : t('stableSource.simplifiedChinese'))
const shutdownLabel = computed(() => state.persisted.autoShutdownMinutes === 0 ? t('stableSource.never') : t('stableSource.minutes', { count: state.persisted.autoShutdownMinutes }))
const calibrationSummary = computed(() => `${formatOffset(state.persisted.calibrationOffsets[1310])} / ${formatOffset(state.persisted.calibrationOffsets[1550])} dBm`)
const calibrationHint = computed(() => t('stableSource.manualCalibrationRangeHint', { step: state.capabilities.calibrationRange.step }))
const gainHint = computed(() => t('stableSource.gainRangeHint', {
  min: state.capabilities.gainRange.min,
  max: state.capabilities.gainRange.max,
  step: state.capabilities.gainRange.step
}))

const settingSections = computed<DeviceSettingSection[]>(() => [
  { key: 'connection', title: t('stableSource.bluetooth'), items: [
    { key: 'bluetooth', label: t('stableSource.bluetooth'), description: t('stableSource.bluetoothHint'), iconName: 'bluetooth', badge: connected.value ? t('stableSource.connected') : t('stableSource.disconnected'), badgeTone: connected.value ? 'success' : 'warning' }
  ] },
  { key: 'calibration', title: t('stableSource.manualCalibration'), items: [
    { key: 'calibration', label: t('stableSource.manualCalibration'), description: calibrationHint.value, value: calibrationSummary.value, iconName: 'calibration' },
    { key: 'gain', label: t('stableSource.gainCoefficient'), description: gainHint.value, value: `${state.persisted.gainPercent}%`, iconName: 'settings' }
  ] },
  { key: 'preferences', title: t('stableSource.settingsTitle'), items: [
    { key: 'language', label: t('stableSource.deviceLanguage'), description: t('stableSource.appLanguageUnaffected'), value: languageLabel.value, iconName: 'translate' },
    { key: 'shutdown', label: t('stableSource.autoShutdown'), value: shutdownLabel.value, iconName: 'timer' }
  ] },
  { key: 'information', title: t('stableSource.productInfo'), items: [
    { key: 'info', label: t('stableSource.productInfo'), description: `${device.value?.model || 'SLS-1315'} · ${device.value?.productBatch || 'SLS-202607-A01'}`, value: 'V1.0.0', iconName: 'info' }
  ] }
])

const dialogTitle = computed(() => activeDialog.value === 'bluetooth' ? t('stableSource.bluetooth') : activeDialog.value === 'calibration' ? t('stableSource.manualCalibration') : activeDialog.value === 'gain' ? t('stableSource.gainCoefficient') : activeDialog.value === 'language' ? t('stableSource.deviceLanguage') : activeDialog.value === 'shutdown' ? t('stableSource.autoShutdown') : t('stableSource.productInfo'))
const dialogDescription = computed(() => activeDialog.value === 'bluetooth' ? (connected.value ? t('stableSource.disconnectText') : t('stableSource.bluetoothHint')) : activeDialog.value === 'calibration' ? calibrationHint.value : activeDialog.value === 'gain' ? gainHint.value : activeDialog.value === 'language' ? t('stableSource.appLanguageUnaffected') : '')
const dialogConfirmText = computed(() => activeDialog.value === 'bluetooth' ? (connected.value ? t('stableSource.disconnect') : t('stableSource.reconnect')) : t('common.confirm'))

const showSaved = () => {
  feedback.value = t('stableSource.settingsSaved')
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1600)
}

const formatOffset = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}`
const openSetting = (key: string) => {
  activeDialog.value = key as SettingDialog
  draftOffsets[1310] = state.persisted.calibrationOffsets[1310]
  draftOffsets[1550] = state.persisted.calibrationOffsets[1550]
  draftGain.value = state.persisted.gainPercent
  draftLanguage.value = state.persisted.deviceLanguage
  draftShutdown.value = state.persisted.autoShutdownMinutes
}
const adjustDraftOffset = (wavelength: StableSourceWavelength, delta: number) => {
  const { min, max, step } = state.capabilities.calibrationRange
  draftOffsets[wavelength] = Number((Math.round(Math.min(max, Math.max(min, draftOffsets[wavelength] + delta)) / step) * step).toFixed(2))
}
const adjustDraftGain = (delta: number) => {
  const { min, max, step } = state.capabilities.gainRange
  draftGain.value = Number((Math.round(Math.min(max, Math.max(min, draftGain.value + delta)) / step) * step).toFixed(2))
}
const resetDraftOffsets = () => { draftOffsets[1310] = 0; draftOffsets[1550] = 0 }

const confirmSetting = async () => {
  if (activeDialog.value === 'bluetooth') {
    if (connected.value) { await state.disconnectBluetooth(); updateDevice(deviceId.value, { status: 'disconnected' }) }
    else { connecting.value = true; await state.reconnectBluetooth(); updateDevice(deviceId.value, { status: 'connected' }); connecting.value = false }
  } else if (activeDialog.value === 'calibration') {
    state.capabilities.wavelengths.forEach(wavelength => state.setCalibrationOffset(wavelength, draftOffsets[wavelength]))
  } else if (activeDialog.value === 'gain') state.setGainPercent(draftGain.value)
  else if (activeDialog.value === 'language') state.persisted.deviceLanguage = draftLanguage.value
  else if (activeDialog.value === 'shutdown') state.persisted.autoShutdownMinutes = draftShutdown.value
  activeDialog.value = null
  showSaved()
}
</script>

<style scoped lang="scss">
@use './stableSourceUi.scss' as ui;
@use '../components/deviceSettingsControls.scss';
.settings-page { @include ui.page-padding; padding-bottom: 22px; }
.connection-badge { min-width: 42px; padding: 4px 6px; border-radius: 999px; background: #fef3c7; color: #b45309; font-size:12px; font-weight: 700; text-align: center; white-space: nowrap; }
.connection-badge.online { background: #dcfce7; color: #15803d; }
.settings-toast { bottom: 96px; }
.calibration-dialog { display: flex; flex-direction: column; gap: 14px; }
.calibration-item > header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
.calibration-item header strong { color: ui.$source-text; font-size: 13px; }
.calibration-item header button { min-height: 32px; border: 0; background: transparent; color: ui.$source-primary; font-size: 11px; }
</style>
