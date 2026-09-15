<template>
  <div class="app-container pon-settings-app">
    <PonPageShell :title="t('pon.settingsTitle')" :subtitle="device?.name" @back="goToDeviceHome">
      <template #action>
        <span class="connection-badge" :class="{ online: isOnline }">{{ isOnline ? t('pon.online') : t('pon.offline') }}</span>
      </template>

      <template #footer>
        <PonFunctionNav :device-id="deviceId" active="settings" />
      </template>

      <div class="settings-page">
        <DeviceSettingsList :sections="settingSections" @select="openSetting" />
      </div>

      <DeviceSettingDialog
        :open="activeDialog !== null"
        :title="dialogTitle"
        :description="dialogDescription"
        :show-footer="activeDialog !== 'info'"
        :confirm-text="dialogConfirmText"
        :danger="activeDialog === 'bluetooth' && isOnline"
        :busy="isConnecting"
        @close="activeDialog = null"
        @confirm="confirmSetting"
      >
        <div v-if="activeDialog === 'language'" class="setting-options">
          <button v-for="option in languageOptions" :key="option.value" class="setting-option" :class="{ active: draftLanguage === option.value }" type="button" @click="draftLanguage = option.value">
            {{ option.label }}
          </button>
        </div>

        <div v-else-if="activeDialog === 'shutdown'" class="setting-options">
          <button v-for="option in shutdownOptions" :key="option.value" class="setting-option" :class="{ active: draftShutdown === option.value }" type="button" @click="draftShutdown = option.value">
            {{ option.label }}
          </button>
        </div>

        <dl v-else-if="activeDialog === 'bluetooth'" class="setting-info-list">
          <div><dt>{{ t('pon.bluetoothControl') }}</dt><dd>{{ isOnline ? t('pon.connected') : t('pon.disconnected') }}</dd></div>
          <div><dt>{{ t('pon.battery') }}</dt><dd>{{ device?.batteryPercent ?? 86 }}% · {{ device?.batteryCharging ? t('pon.charging') : t('pon.notCharging') }}</dd></div>
          <div><dt>VFL</dt><dd>{{ vflModeLabel }}</dd></div>
          <div><dt>LED</dt><dd>{{ state.persisted.flashlightOn ? t('pon.enabled') : t('pon.disabled') }}</dd></div>
        </dl>

        <dl v-else-if="activeDialog === 'info'" class="setting-info-list">
          <div><dt>{{ t('pon.model') }}</dt><dd>{{ device?.model || 'PON-OPM' }}</dd></div>
          <div><dt>{{ t('pon.serialNumber') }}</dt><dd>{{ device?.serialNumber || '--' }}</dd></div>
          <div><dt>{{ t('pon.productBatch') }}</dt><dd>{{ device?.productBatch || 'PON-202607-A01' }}</dd></div>
          <div><dt>{{ t('pon.measurementRange') }}</dt><dd>{{ powerRangeLabel }}</dd></div>
          <div><dt>{{ t('pon.measurementAccuracyLabel') }}</dt><dd>{{ opmAccuracyLabel }}</dd></div>
          <div><dt>{{ t('pon.ponAccuracy') }}</dt><dd>{{ ponAccuracyLabel }}</dd></div>
          <div><dt>{{ t('pon.isolation') }}</dt><dd>{{ ponIsolationLabel }}</dd></div>
          <div><dt>{{ t('pon.powerSupply') }}</dt><dd>{{ t('pon.lithiumTypeC') }}</dd></div>
          <div><dt>{{ t('pon.workingTemperature') }}</dt><dd>-10 ~ 60°C</dd></div>
          <div><dt>{{ t('pon.softwareVersion') }}</dt><dd>V1.0.0</dd></div>
        </dl>
      </DeviceSettingDialog>

      <div v-if="feedback" class="settings-toast" role="status">{{ feedback }}</div>
    </PonPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DeviceSettingsList, { type DeviceSettingSection } from '../components/DeviceSettingsList.vue'
import DeviceSettingDialog from '../components/DeviceSettingDialog.vue'
import PonFunctionNav from './PonFunctionNav.vue'
import PonPageShell from './PonPageShell.vue'
import { usePonDevice } from './usePonDevice'
import { usePonPowerMeterState, type PonAutoShutdownMinutes, type PonDeviceLanguage } from './usePonPowerMeterState'
import bluetoothIcon from '@/assets/icons/pon-meter/ui/bluetooth.png'
import languageIcon from '@/assets/icons/pon-meter/ui/language.png'
import timerIcon from '@/assets/icons/pon-meter/ui/timer.png'
import infoIcon from '@/assets/icons/pon-meter/ui/info.png'

type SettingDialog = 'bluetooth' | 'language' | 'shutdown' | 'info'

const { t } = useI18n()
const router = useRouter()
const { deviceId, device, updateDevice } = usePonDevice()
const state = usePonPowerMeterState(deviceId.value)
const activeDialog = ref<SettingDialog | null>(null)
const draftLanguage = ref<PonDeviceLanguage>(state.persisted.deviceLanguage)
const draftShutdown = ref<PonAutoShutdownMinutes>(state.persisted.autoShutdownMinutes)
const isConnecting = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined

const isOnline = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const goToDeviceHome = () => router.replace(`/device/${deviceId.value}`)
const powerRangeLabel = computed(() => device.value?.ponPowerRange === 'high' ? '-50 ~ +26 dBm' : '-70 ~ +10 dBm')
const formatAccuracy = (db?: number, percent?: number) => {
  const values: string[] = []
  if (Number.isFinite(db)) values.push(`±${Number(db)} dB`)
  if (Number.isFinite(percent)) values.push(`${Number(percent)}%`)
  return values.join(' / ') || t('pon.probeSpecification')
}
const opmAccuracyLabel = computed(() => formatAccuracy(device.value?.ponOpmAccuracyDb ?? 0.2, device.value?.ponOpmAccuracyPercent ?? 5))
const ponAccuracyLabel = computed(() => formatAccuracy(device.value?.ponMeasurementAccuracyDb))
const ponIsolationLabel = computed(() => Number.isFinite(device.value?.ponIsolationDb)
  ? `≥ ${Number(device.value?.ponIsolationDb)} dB`
  : t('pon.probeSpecification'))
const languageOptions = computed<Array<{ value: PonDeviceLanguage; label: string }>>(() => [
  { value: 'zh-CN', label: t('pon.simplifiedChinese') },
  { value: 'en', label: 'English' }
])
const shutdownOptions = computed<Array<{ value: PonAutoShutdownMinutes; label: string }>>(() => [
  { value: 0, label: t('pon.never') },
  ...([1, 5, 10, 30, 60] as PonAutoShutdownMinutes[]).map(value => ({ value, label: t('pon.minutes', { count: value }) }))
])
const languageLabel = computed(() => languageOptions.value.find(item => item.value === state.persisted.deviceLanguage)?.label || '--')
const shutdownLabel = computed(() => shutdownOptions.value.find(item => item.value === state.persisted.autoShutdownMinutes)?.label || '--')
const vflModeLabel = computed(() => state.persisted.vflMode === 'off' ? t('pon.outputOff') : state.persisted.vflMode === 'steady' ? t('pon.modeSteady') : state.persisted.vflMode === 'cw' ? 'CW' : state.persisted.vflMode === '1hz' ? '1Hz' : '2Hz')

const settingSections = computed<DeviceSettingSection[]>(() => [
  {
    key: 'device', title: t('pon.hardwareMenu'), items: [
      { key: 'shutdown', label: t('pon.autoShutdown'), description: t('pon.autoShutdownHint'), value: shutdownLabel.value, icon: timerIcon },
      { key: 'language', label: t('pon.deviceLanguage'), description: t('pon.deviceLanguageHint'), value: languageLabel.value, icon: languageIcon }
    ]
  },
  {
    key: 'connection', title: t('pon.bluetoothControl'), items: [
      { key: 'bluetooth', label: t('pon.bluetoothControl'), description: device.value?.name || '', icon: bluetoothIcon, badge: isOnline.value ? t('pon.online') : t('pon.offline'), badgeTone: isOnline.value ? 'success' : 'warning' }
    ]
  },
  {
    key: 'information', title: t('pon.deviceInformation'), items: [
      { key: 'info', label: t('pon.aboutDevice'), description: `${device.value?.model || 'PON-OPM'} · ${device.value?.productBatch || 'PON-202607-A01'}`, value: 'V1.0.0', icon: infoIcon }
    ]
  }
])

const dialogTitle = computed(() => activeDialog.value === 'bluetooth' ? t('pon.bluetoothControl') : activeDialog.value === 'language' ? t('pon.deviceLanguage') : activeDialog.value === 'shutdown' ? t('pon.autoShutdown') : t('pon.aboutDevice'))
const dialogDescription = computed(() => activeDialog.value === 'bluetooth' ? (isOnline.value ? t('pon.disconnectConfirmMessage') : t('pon.bluetoothControl')) : activeDialog.value === 'language' ? t('pon.deviceLanguageHint') : activeDialog.value === 'shutdown' ? t('pon.autoShutdownHint') : '')
const dialogConfirmText = computed(() => activeDialog.value === 'bluetooth' ? (isOnline.value ? t('pon.disconnect') : t('common.connect')) : t('common.confirm'))

const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}

const openSetting = (key: string) => {
  activeDialog.value = key as SettingDialog
  draftLanguage.value = state.persisted.deviceLanguage
  draftShutdown.value = state.persisted.autoShutdownMinutes
}

const confirmSetting = async () => {
  if (activeDialog.value === 'language') {
    state.persisted.deviceLanguage = draftLanguage.value
    showFeedback(t('pon.deviceLanguageSaved'))
  } else if (activeDialog.value === 'shutdown') {
    state.persisted.autoShutdownMinutes = draftShutdown.value
    showFeedback(t('pon.autoShutdownSaved'))
  } else if (activeDialog.value === 'bluetooth') {
    if (isOnline.value) {
      state.setBluetooth(false)
      if (device.value) { updateDevice(device.value.id, { status: 'disconnected' }); device.value.status = 'disconnected' }
      showFeedback(t('pon.bluetoothDisconnected'))
    } else {
      isConnecting.value = true
      await new Promise(resolve => window.setTimeout(resolve, 700))
      state.setBluetooth(true)
      if (device.value) { updateDevice(device.value.id, { status: 'connected', lastConnected: new Date().toISOString() }); device.value.status = 'connected' }
      isConnecting.value = false
      showFeedback(t('pon.connectionRestored'))
    }
  }
  activeDialog.value = null
}

onUnmounted(() => { if (feedbackTimer) window.clearTimeout(feedbackTimer) })
</script>

<style scoped lang="scss">
@use './ponUi.scss' as ui;
@use '../components/deviceSettingsControls.scss';

.pon-settings-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$pon-bg; }
.settings-page { @include ui.page-surface; padding-bottom: 22px; }
.connection-badge { min-width: 42px; padding: 4px 6px; border-radius: 999px; background: #fef3c7; color: #b45309; font-size: 11px; font-weight: 700; text-align: center; }
.connection-badge.online { background: #dcfce7; color: #15803d; }
</style>
