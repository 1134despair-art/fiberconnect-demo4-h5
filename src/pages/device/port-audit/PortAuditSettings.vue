<template>
  <PortAuditPageShell standalone :title="t('portAudit.settingsTitle')" :subtitle="device?.name" @back="goHome">
    <template #action>
      <span class="connection-badge" :class="{ online: connected }">{{ connected ? t('pon.online') : t('pon.offline') }}</span>
    </template>

    <div class="settings-page">
      <DeviceSettingsList :sections="settingSections" @select="openSetting" />
    </div>

    <DeviceSettingDialog
      :open="activeDialog !== null"
      :title="dialogTitle"
      :description="dialogDescription"
      :show-footer="activeDialog !== 'upgrade' && activeDialog !== 'info'"
      :confirm-text="dialogConfirmText"
      :danger="activeDialog === 'bluetooth' && connected"
      @close="activeDialog = null"
      @confirm="confirmSetting"
    >
      <dl v-if="activeDialog === 'bluetooth'" class="setting-info-list">
        <div><dt>{{ t('portAudit.bluetooth') }}</dt><dd>{{ connected ? t('portAudit.connected') : t('portAudit.disconnected') }}</dd></div>
        <div><dt>FID</dt><dd>{{ state.runtime.fidStatus }}</dd></div>
        <div><dt>ONU</dt><dd>{{ state.runtime.onuStatus }}</dd></div>
        <div><dt>VFL</dt><dd>{{ state.persisted.vflMode.toUpperCase() }}</dd></div>
      </dl>

      <div v-else-if="activeDialog === 'buzzer'" class="setting-options">
        <button class="setting-option" :class="{ active: draftToggle }" type="button" @click="draftToggle = true">{{ t('portAudit.outputOn') }}</button>
        <button class="setting-option" :class="{ active: !draftToggle }" type="button" @click="draftToggle = false">{{ t('portAudit.outputOff') }}</button>
      </div>

      <div v-else-if="activeDialog === 'shutdown'" class="setting-options">
        <button v-for="minutes in autoOptions" :key="minutes" class="setting-option" :class="{ active: draftShutdown === minutes }" type="button" @click="draftShutdown = minutes">
          {{ minutes === 0 ? t('portAudit.never') : t('portAudit.minutes', { count: minutes }) }}
        </button>
      </div>

      <div v-else-if="activeDialog === 'language'" class="setting-options">
        <button class="setting-option" :class="{ active: draftLanguage === 'zh-CN' }" type="button" @click="draftLanguage = 'zh-CN'">{{ t('portAudit.simplifiedChinese') }}</button>
        <button class="setting-option" :class="{ active: draftLanguage === 'en' }" type="button" @click="draftLanguage = 'en'">{{ t('portAudit.english') }}</button>
      </div>

      <div v-else-if="activeDialog === 'upgrade'" class="upgrade-dialog">
        <dl class="setting-info-list">
          <div><dt>{{ t('portAudit.version') }}</dt><dd>{{ currentVersion }}</dd></div>
          <div><dt>{{ t('portAudit.bluetooth') }}</dt><dd>{{ connected ? t('portAudit.connected') : t('portAudit.disconnected') }}</dd></div>
          <div><dt>{{ t('portAudit.bluetoothUpgrade') }}</dt><dd>{{ upgradeButtonText }}</dd></div>
        </dl>
        <div v-if="state.runtime.upgradeStatus === 'upgrading'" class="setting-progress"><div><i :style="{ width: `${state.runtime.upgradeProgress}%` }"></i></div><span>{{ t('portAudit.upgrading', { progress: state.runtime.upgradeProgress }) }}</span></div>
        <p v-else class="upgrade-note">{{ state.runtime.upgradeStatus === 'ready' ? t('portAudit.upgradeSafety') : t('portAudit.upgradeHint') }}</p>
        <button class="setting-inline-action" type="button" :disabled="!connected || state.runtime.upgradeStatus === 'checking' || state.runtime.upgradeStatus === 'upgrading'" @click="upgradeAction">{{ upgradeButtonText }}</button>
      </div>

      <dl v-else-if="activeDialog === 'info'" class="setting-info-list">
        <div><dt>{{ t('portAudit.model') }}</dt><dd>{{ device?.model || 'PCA-100' }}</dd></div>
        <div><dt>{{ t('portAudit.productBatch') }}</dt><dd>{{ device?.productBatch || 'PCA-202607-A01' }}</dd></div>
        <div><dt>{{ t('portAudit.batteryCapacity') }}</dt><dd>{{ device?.batteryCapacityMah || 1000 }}mAh</dd></div>
        <div><dt>{{ t('portAudit.charging') }}</dt><dd>USB Type-C · 5V/1A</dd></div>
        <div><dt>{{ t('portAudit.screen') }}</dt><dd>2&quot; · 128×160</dd></div>
        <div><dt>{{ t('portAudit.version') }}</dt><dd>{{ currentVersion }}</dd></div>
      </dl>
    </DeviceSettingDialog>

    <div v-if="feedback" class="settings-toast" role="status">{{ feedback }}</div>
    <template #footer><PortAuditFunctionNav :device-id="deviceId" active="settings" /></template>
  </PortAuditPageShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import DeviceSettingsList, { type DeviceSettingSection } from '../components/DeviceSettingsList.vue'
import DeviceSettingDialog from '../components/DeviceSettingDialog.vue'
import PortAuditPageShell from './PortAuditPageShell.vue'
import PortAuditFunctionNav from './PortAuditFunctionNav.vue'
import { usePortAuditDevice } from './usePortAuditDevice'
import { usePortAuditState, type PortAuditAutoShutdown } from './usePortAuditState'
import bluetoothIcon from '@/assets/icons/port-audit/bluetooth.svg'
import networkIcon from '@/assets/icons/port-audit/network.svg'
import buzzerIcon from '@/assets/icons/port-audit/buzzer.svg'
import timerIcon from '@/assets/app/icons/device/timer.png'
import languageIcon from '@/assets/app/icons/profile/language.png'
import uploadIcon from '@/assets/icons/port-audit/upload.svg'
import infoIcon from '@/assets/app/icons/profile/info.png'

type SettingDialog = 'bluetooth' | 'buzzer' | 'shutdown' | 'language' | 'upgrade' | 'info'

const router = useRouter()
const { t } = useI18n()
const { updateDevice } = useAuth()
const { deviceId, device } = usePortAuditDevice()
const state = usePortAuditState(deviceId.value)
const goHome = () => router.push(`/device/${deviceId.value}`)
const activeDialog = ref<SettingDialog | null>(null)
const feedback = ref('')
const autoOptions: PortAuditAutoShutdown[] = [0, 1, 5, 10, 30, 60]
const draftToggle = ref(false)
const draftShutdown = ref<PortAuditAutoShutdown>(state.persisted.autoShutdownMinutes)
const draftLanguage = ref<'zh-CN' | 'en'>(state.persisted.deviceLanguage)
let feedbackTimer: number | undefined

const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const currentVersion = computed(() => state.runtime.upgradeStatus === 'completed' ? 'V1.0.1' : 'V1.0.0')
const languageLabel = computed(() => state.persisted.deviceLanguage === 'en' ? t('portAudit.english') : t('portAudit.simplifiedChinese'))
const shutdownLabel = computed(() => state.persisted.autoShutdownMinutes === 0 ? t('portAudit.never') : t('portAudit.minutes', { count: state.persisted.autoShutdownMinutes }))
const upgradeButtonText = computed(() => state.runtime.upgradeStatus === 'checking' ? t('portAudit.reconnecting') : state.runtime.upgradeStatus === 'ready' ? t('portAudit.startUpgrade') : state.runtime.upgradeStatus === 'upgrading' ? t('portAudit.upgrading', { progress: state.runtime.upgradeProgress }) : state.runtime.upgradeStatus === 'completed' ? t('portAudit.upgradeCompleted') : t('portAudit.checkUpdate'))

const settingSections = computed<DeviceSettingSection[]>(() => [
  { key: 'hardware', title: t('pon.hardwareMenu'), items: [
    { key: 'shutdown', label: t('portAudit.autoShutdown'), value: shutdownLabel.value, icon: timerIcon },
    { key: 'language', label: t('portAudit.deviceLanguage'), value: languageLabel.value, icon: languageIcon },
    { key: 'cellular', label: t('portAudit.cellularSettings'), description: t('portAudit.cellularHint'), value: state.persisted.cellularEnabled ? t('portAudit.outputOn') : t('portAudit.outputOff'), icon: networkIcon },
    { key: 'buzzer', label: t('portAudit.buzzer'), description: t('portAudit.buzzerHint'), value: state.persisted.buzzerEnabled ? t('portAudit.outputOn') : t('portAudit.outputOff'), icon: buzzerIcon }
  ] },
  { key: 'connection', title: t('pon.bluetoothControl'), items: [
    { key: 'bluetooth', label: t('portAudit.bluetooth'), description: device.value?.name || '', icon: bluetoothIcon, badge: connected.value ? t('pon.online') : t('pon.offline'), badgeTone: connected.value ? 'success' : 'warning' }
  ] },
  { key: 'information', title: t('pon.deviceInformation'), items: [
    { key: 'upgrade', label: t('portAudit.bluetoothUpgrade'), description: t('portAudit.upgradeHint'), value: currentVersion.value, icon: uploadIcon, badge: state.runtime.upgradeStatus === 'ready' ? t('portAudit.updateReady') : undefined, badgeTone: 'warning' },
    { key: 'info', label: t('portAudit.productInfo'), description: `${device.value?.model || 'PCA-100'} · ${device.value?.productBatch || 'PCA-202607-A01'}`, value: currentVersion.value, icon: infoIcon }
  ] }
])

const dialogTitle = computed(() => activeDialog.value === 'bluetooth' ? t('portAudit.bluetooth') : activeDialog.value === 'buzzer' ? t('portAudit.buzzer') : activeDialog.value === 'shutdown' ? t('portAudit.autoShutdown') : activeDialog.value === 'language' ? t('portAudit.deviceLanguage') : activeDialog.value === 'upgrade' ? t('portAudit.bluetoothUpgrade') : t('portAudit.productInfo'))
const dialogDescription = computed(() => activeDialog.value === 'bluetooth' ? (connected.value ? t('portAudit.disconnectText') : t('portAudit.bluetoothHint')) : activeDialog.value === 'buzzer' ? t('portAudit.buzzerHint') : activeDialog.value === 'upgrade' ? t('portAudit.upgradeHint') : '')
const dialogConfirmText = computed(() => activeDialog.value === 'bluetooth' ? (connected.value ? t('portAudit.disconnect') : t('portAudit.reconnect')) : t('common.confirm'))

const showSaved = () => { feedback.value = t('portAudit.settingsSaved'); if (feedbackTimer) window.clearTimeout(feedbackTimer); feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1500) }
const openSetting = (key: string) => {
  if (key === 'cellular') {
    router.push(`/device/${deviceId.value}/port-remote`)
    return
  }
  activeDialog.value = key as SettingDialog
  draftToggle.value = state.persisted.buzzerEnabled
  draftShutdown.value = state.persisted.autoShutdownMinutes
  draftLanguage.value = state.persisted.deviceLanguage
}
const confirmSetting = async () => {
  if (activeDialog.value === 'bluetooth') {
    if (connected.value) { state.disconnectBluetooth(); updateDevice(deviceId.value, { status: 'disconnected' }) }
    else { await state.reconnectBluetooth(); updateDevice(deviceId.value, { status: 'connected' }) }
  } else if (activeDialog.value === 'buzzer') state.persisted.buzzerEnabled = draftToggle.value
  else if (activeDialog.value === 'shutdown') state.persisted.autoShutdownMinutes = draftShutdown.value
  else if (activeDialog.value === 'language') state.persisted.deviceLanguage = draftLanguage.value
  activeDialog.value = null
  showSaved()
}
const upgradeAction = () => {
  if (state.runtime.upgradeStatus === 'ready') { state.startUpgrade(); return }
  if (state.runtime.upgradeStatus === 'idle' || state.runtime.upgradeStatus === 'completed') {
    state.runtime.upgradeStatus = 'checking'
    window.setTimeout(() => { state.runtime.upgradeStatus = 'ready' }, 650)
  }
}
</script>

<style scoped lang="scss">
@use './portAuditUi.scss' as ui;
@use '../components/deviceSettingsControls.scss';
.settings-page { @include ui.page-padding; padding-bottom: 22px; }
.connection-badge { min-width: 42px; padding: 4px 6px; border-radius: 999px; background: #fef3c7; color: #b45309; font-size: 10px; font-weight: 700; text-align: center; white-space: nowrap; }
.connection-badge.online { background: #dcfce7; color: #15803d; }
.settings-toast { bottom: 92px; }
.upgrade-note { margin: 12px 0 0; color: ui.$audit-sub; font-size: 11px; line-height: 1.5; }
</style>
