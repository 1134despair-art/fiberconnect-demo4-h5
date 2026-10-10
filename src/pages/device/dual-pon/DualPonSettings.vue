<template>
  <DualPonPageShell :title="t('dualPon.settingsTitle')" :subtitle="device?.name" standalone @back="router.push(`/device/${deviceId}`)">
    <template #action><span class="connection-badge" :class="{ online: connected }">{{ connected ? t('dualPon.connectedShort') : t('dualPon.disconnected') }}</span></template>
    <template #footer><DualPonFunctionNav :device-id="deviceId" active="settings" /></template>
    <div class="settings-page">
      <DeviceSettingsList :sections="settingSections" @select="openSetting" />
    </div>

    <DeviceSettingDialog
      contained
      :open="activeDialog !== null"
      :title="dialogTitle"
      :description="dialogDescription"
      :show-footer="activeDialog !== 'update' && activeDialog !== 'info'"
      :confirm-text="dialogConfirmText"
      :danger="(activeDialog === 'bluetooth' && connected) || activeDialog === 'reset'"
      :busy="reconnecting"
      @close="activeDialog = null"
      @confirm="confirmSetting"
    >
      <dl v-if="activeDialog === 'bluetooth'" class="setting-info-list">
        <div><dt>{{ t('dualPon.bluetooth') }}</dt><dd>{{ connected ? t('dualPon.connected') : t('dualPon.disconnected') }}</dd></div>
        <div><dt>VFL</dt><dd>{{ state.persisted.vflMode.toUpperCase() }}</dd></div>
        <div><dt>LED</dt><dd>{{ state.persisted.flashlightOn ? t('dualPon.on') : t('dualPon.off') }}</dd></div>
        <div><dt>{{ t('dualPon.battery') }}</dt><dd>{{ device?.batteryPercent ?? 82 }}%</dd></div>
      </dl>

      <div v-else-if="activeDialog === 'brightness'" class="setting-slider">
        <header><span>{{ t('dualPon.screenBrightness') }}</span><strong>{{ draftBrightness }}%</strong></header>
        <input v-model.number="draftBrightness" type="range" min="20" max="100" step="10" />
      </div>

      <div v-else-if="activeDialog === 'buzzer'" class="setting-options">
        <button class="setting-option" :class="{ active: draftBuzzer }" :aria-pressed="draftBuzzer" type="button" @click="draftBuzzer = true">{{ t('dualPon.on') }}</button>
        <button class="setting-option" :class="{ active: !draftBuzzer }" :aria-pressed="!draftBuzzer" type="button" @click="draftBuzzer = false">{{ t('dualPon.off') }}</button>
      </div>

      <div v-else-if="activeDialog === 'shutdown'" class="setting-options">
        <button v-for="value in shutdownOptions" :key="value" class="setting-option" :class="{ active: draftShutdown === value }" :aria-pressed="draftShutdown === value" type="button" @click="draftShutdown = value">
          {{ value === 0 ? t('dualPon.never') : value === 60 ? t('dualPon.oneHour') : t('dualPon.minutes', { count: value }) }}
        </button>
      </div>

      <div v-else-if="activeDialog === 'language'" class="setting-options">
        <button v-for="language in languages" :key="language.value" class="setting-option" :class="{ active: draftLanguage === language.value }" :aria-pressed="draftLanguage === language.value" type="button" @click="draftLanguage = language.value">{{ language.label }}</button>
      </div>

      <div v-else-if="activeDialog === 'datetime'" class="date-time-fields">
        <label class="date-time-field"><span>{{ t('dualPon.deviceDate') }}</span><input v-model="draftDate" type="date" /></label>
        <label class="date-time-field"><span>{{ t('dualPon.deviceTime') }}</span><input v-model="draftTime" type="time" /></label>
      </div>

      <div v-else-if="activeDialog === 'update'" class="update-dialog">
        <dl class="setting-info-list">
          <div><dt>{{ t('dualPon.deviceUpdate') }}</dt><dd>{{ updateHint }}</dd></div>
          <div><dt>{{ t('dualPon.bluetooth') }}</dt><dd>{{ connected ? t('dualPon.connected') : t('dualPon.disconnected') }}</dd></div>
          <div><dt>{{ t('dualPon.model') }}</dt><dd>{{ device?.model || 'DPON-300' }}</dd></div>
          <div><dt>{{ t('dualPon.deviceUpdate') }}</dt><dd>V1.0.0</dd></div>
        </dl>
        <div v-if="state.runtime.upgradeStatus === 'upgrading'" class="setting-progress"><div><i :style="{ width: `${state.runtime.upgradeProgress}%` }"></i></div><span>{{ state.runtime.upgradeProgress }}%</span></div>
        <button class="setting-inline-action" type="button" :disabled="!connected || state.runtime.upgradeStatus === 'checking' || state.runtime.upgradeStatus === 'upgrading'" @click="handleUpdate">{{ updateAction }}</button>
      </div>

      <dl v-else-if="activeDialog === 'info'" class="setting-info-list">
        <div><dt>{{ t('dualPon.model') }}</dt><dd>{{ device?.model || 'DPON-300' }}</dd></div>
        <div><dt>{{ t('dualPon.productBatch') }}</dt><dd>{{ device?.productBatch || 'DPON-202607-A01' }}</dd></div>
        <div><dt>{{ t('dualPon.powerRange') }}</dt><dd>{{ powerRangeLabel }}</dd></div>
        <div><dt>{{ t('dualPon.chargingInterface') }}</dt><dd>Type-C</dd></div>
        <div><dt>{{ t('dualPon.temperature') }}</dt><dd>-10 ~ 60°C</dd></div>
        <div><dt>{{ t('dualPon.deviceUpdate') }}</dt><dd>V1.0.0</dd></div>
      </dl>

      <div v-else-if="activeDialog === 'reset'" class="reset-message">
        <p>{{ t('dualPon.factoryResetText') }}</p>
      </div>
    </DeviceSettingDialog>

    <div v-if="feedback" class="settings-toast" role="status">{{ feedback }}</div>
  </DualPonPageShell>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import DeviceSettingsList, { type DeviceSettingSection } from '../components/DeviceSettingsList.vue'
import DeviceSettingDialog from '../components/DeviceSettingDialog.vue'
import DualPonPageShell from './DualPonPageShell.vue'
import DualPonFunctionNav from './DualPonFunctionNav.vue'
import { useDualPonState, type DualPonDeviceLanguage } from './useDualPonState'
import { useDualPonDevice } from './useDualPonDevice'

type SettingDialog = 'bluetooth' | 'brightness' | 'buzzer' | 'shutdown' | 'language' | 'datetime' | 'update' | 'info' | 'reset'
type ShutdownValue = 0 | 5 | 15 | 30 | 60

const router = useRouter()
const { t } = useI18n()
const { updateDevice } = useAuth()
const { deviceId, device } = useDualPonDevice()
const state = useDualPonState(deviceId.value)
const shutdownOptions: ShutdownValue[] = [0, 5, 15, 30, 60]
const languages: Array<{ value: DualPonDeviceLanguage; label: string }> = [
  { value: 'zh-CN', label: '简体中文' }, { value: 'en', label: 'English' }, { value: 'vi', label: 'Tiếng Việt' }, { value: 'pt', label: 'Português' }, { value: 'es', label: 'Español' }
]
const activeDialog = ref<SettingDialog | null>(null)
const feedback = ref('')
const reconnecting = ref(false)
const draftBrightness = ref(state.persisted.brightness)
const draftBuzzer = ref(state.persisted.buzzerEnabled)
const draftShutdown = ref<ShutdownValue>(state.persisted.autoShutdownMinutes)
const draftLanguage = ref<DualPonDeviceLanguage>(state.persisted.deviceLanguage)
const draftDate = ref(state.persisted.deviceDate)
const draftTime = ref(state.persisted.deviceTime)
watchEffect(() => state.configureCapabilities({ powerRange: device.value?.dualPonPowerRange, supportedVflColors: device.value?.supportedVflColors }))

const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const shutdownLabel = computed(() => state.persisted.autoShutdownMinutes === 0 ? t('dualPon.never') : state.persisted.autoShutdownMinutes === 60 ? t('dualPon.oneHour') : t('dualPon.minutes', { count: state.persisted.autoShutdownMinutes }))
const languageLabel = computed(() => languages.find(item => item.value === state.persisted.deviceLanguage)?.label || '简体中文')
const powerRangeLabel = computed(() => { const bounds = state.powerBounds(); return `${bounds.min} ~ +${bounds.max} dBm` })
const updateHint = computed(() => state.runtime.upgradeStatus === 'completed' ? t('dualPon.updateCompleted') : state.runtime.upgradeStatus === 'ready' ? t('dualPon.updateReady') : state.runtime.upgradeStatus === 'checking' ? t('dualPon.checkingUpdate') : t('dualPon.updateHint'))
const updateAction = computed(() => state.runtime.upgradeStatus === 'ready' ? t('dualPon.startUpdate') : state.runtime.upgradeStatus === 'completed' ? t('dualPon.checkAgain') : state.runtime.upgradeStatus === 'upgrading' ? t('dualPon.updating') : t('dualPon.checkUpdate'))

const settingSections = computed<DeviceSettingSection[]>(() => [
  { key: 'device', title: t('dualPon.hardwareMenu'), items: [
    { key: 'shutdown', label: t('dualPon.autoShutdown'), value: shutdownLabel.value, iconName: 'timer' },
    { key: 'brightness', label: t('dualPon.screenBrightness'), value: `${state.persisted.brightness}%`, iconName: 'brightness' },
    { key: 'buzzer', label: t('dualPon.buzzer'), value: state.persisted.buzzerEnabled ? t('dualPon.on') : t('dualPon.off'), iconName: 'buzzer' },
    { key: 'language', label: t('dualPon.deviceLanguage'), description: t('dualPon.deviceLanguageHint'), value: languageLabel.value, iconName: 'translate' }
  ] },
  { key: 'connection', title: t('dualPon.bluetoothControl'), items: [
    { key: 'bluetooth', label: t('dualPon.bluetooth'), description: device.value?.name || '', iconName: 'bluetooth', badge: connected.value ? t('dualPon.connectedShort') : t('dualPon.disconnected'), badgeTone: connected.value ? 'success' : 'warning' }
  ] },
  { key: 'information', title: t('dualPon.deviceInformation'), items: [
    { key: 'datetime', label: t('dualPon.dateTime'), description: t('dualPon.dateTimeHint'), value: `${state.persisted.deviceDate} ${state.persisted.deviceTime}`, iconName: 'calendar' },
    { key: 'info', label: t('dualPon.aboutDevice'), description: `${device.value?.model || 'DPON-300'} · ${device.value?.productBatch || 'DPON-202607-A01'}`, value: 'V1.0.0', iconName: 'info' }
  ] },
  { key: 'maintenance', title: t('dualPon.deviceMaintenance'), items: [
    { key: 'update', label: t('dualPon.deviceUpdate'), description: updateHint.value, value: 'V1.0.0', iconName: 'upload', badge: state.runtime.upgradeStatus === 'ready' ? t('dualPon.updateReady') : undefined, badgeTone: 'warning' },
    { key: 'reset', label: t('dualPon.factoryReset'), description: t('dualPon.factoryResetHint'), iconName: 'restore', tone: 'danger' }
  ] }
])

const dialogTitle = computed(() => activeDialog.value === 'bluetooth' ? t('dualPon.bluetooth') : activeDialog.value === 'brightness' ? t('dualPon.screenBrightness') : activeDialog.value === 'buzzer' ? t('dualPon.buzzer') : activeDialog.value === 'shutdown' ? t('dualPon.autoShutdown') : activeDialog.value === 'language' ? t('dualPon.deviceLanguage') : activeDialog.value === 'datetime' ? t('dualPon.dateTime') : activeDialog.value === 'update' ? t('dualPon.deviceUpdate') : activeDialog.value === 'reset' ? t('dualPon.factoryResetTitle') : t('dualPon.aboutDevice'))
const dialogDescription = computed(() => activeDialog.value === 'bluetooth' ? (connected.value ? t('dualPon.disconnectText') : t('dualPon.bluetoothControl')) : activeDialog.value === 'buzzer' ? t('dualPon.buzzerHint') : activeDialog.value === 'datetime' ? t('dualPon.dateTimeHint') : activeDialog.value === 'update' ? t('dualPon.updateHint') : activeDialog.value === 'reset' ? t('dualPon.factoryResetText') : '')
const dialogConfirmText = computed(() => activeDialog.value === 'bluetooth' ? (connected.value ? t('common.confirm') : t('dualPon.reconnect')) : t('common.confirm'))

const showFeedback = (message: string) => { feedback.value = message; window.setTimeout(() => { feedback.value = '' }, 1600) }
const openSetting = (key: string) => {
  activeDialog.value = key as SettingDialog
  draftBrightness.value = state.persisted.brightness
  draftBuzzer.value = state.persisted.buzzerEnabled
  draftShutdown.value = state.persisted.autoShutdownMinutes
  draftLanguage.value = state.persisted.deviceLanguage
  draftDate.value = state.persisted.deviceDate
  draftTime.value = state.persisted.deviceTime
}
const confirmSetting = async () => {
  if (activeDialog.value === 'bluetooth') {
    if (connected.value) { state.setBluetooth(false); updateDevice(deviceId.value, { status: 'disconnected' }); showFeedback(t('dualPon.disconnected')) }
    else { reconnecting.value = true; await state.reconnectBluetooth(); updateDevice(deviceId.value, { status: 'connected' }); reconnecting.value = false; showFeedback(t('dualPon.connectionRestored')) }
  } else if (activeDialog.value === 'brightness') state.persisted.brightness = draftBrightness.value
  else if (activeDialog.value === 'buzzer') state.persisted.buzzerEnabled = draftBuzzer.value
  else if (activeDialog.value === 'shutdown') state.persisted.autoShutdownMinutes = draftShutdown.value
  else if (activeDialog.value === 'language') state.persisted.deviceLanguage = draftLanguage.value
  else if (activeDialog.value === 'datetime') { state.persisted.deviceDate = draftDate.value; state.persisted.deviceTime = draftTime.value }
  else if (activeDialog.value === 'reset') { state.resetFactory(); showFeedback(t('dualPon.factoryResetDone')) }
  activeDialog.value = null
}
const handleUpdate = () => state.runtime.upgradeStatus === 'ready' ? state.startUpgrade() : state.checkUpdate()
</script>

<style scoped lang="scss">
@use './dualPonUi.scss' as ui;
@use '../components/deviceSettingsControls.scss';
.settings-page { min-height: 100%; padding: 14px 14px 22px; box-sizing: border-box; background: #f7f9fc; color: ui.$text; }
.connection-badge { min-width: 42px; padding: 4px 6px; border-radius: 999px; background: #fef3c7; color: #b45309; font-size: 11px; font-weight: 700; text-align: center; white-space: nowrap; }
.connection-badge.online { background: #dcfce7; color: #15803d; }
.reset-message { padding: 12px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; }
.reset-message p { margin: 0; color: #991b1b; font-size: 12px; line-height: 1.55; }
.date-time-fields { display: grid; gap: 12px; }
.date-time-field { display: grid; gap: 8px; }.date-time-field span { color: ui.$sub; font-size: 11px; }.date-time-field input { width: 100%; min-height: 48px; padding: 0 12px; border: 1px solid ui.$border; border-radius: 8px; background: #f8fafc; color: ui.$text; font-size: 14px; outline: 0; }.date-time-field input:focus { border-color: ui.$primary; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
</style>
