<template>
  <div class="multi-opm-settings-app app-container">
    <MultiOpmPageShell title="设备设置" :subtitle="device.name" @back="goHome">
      <template #action><span class="connection-badge" :class="{ online: isOnline }">{{ isOnline ? '在线' : '离线' }}</span></template>
      <template #footer><MultiOpmFunctionNav :device-id="device.id" active="settings" /></template>

      <div class="settings-page"><DeviceSettingsList :sections="sections" @select="openSetting" /></div>

      <DeviceSettingDialog
        :open="activeDialog !== null"
        :title="dialogTitle"
        :description="dialogDescription"
        :show-footer="activeDialog !== 'info'"
        :confirm-text="confirmText"
        :danger="activeDialog === 'remoteShutdown' || (activeDialog === 'bluetooth' && isOnline)"
        :busy="busy"
        :confirm-disabled="activeDialog === 'server' && !serverValid"
        @close="activeDialog = null"
        @confirm="confirmSetting"
      >
        <div v-if="activeDialog === 'shutdown'" class="setting-options">
          <button v-for="option in shutdownOptions" :key="option" class="setting-option" type="button" :class="{ active: draftValue === option }" @click="draftValue = option">{{ option }}</button>
        </div>
        <div v-else-if="activeDialog === 'language'" class="setting-options">
          <button v-for="option in languageOptions" :key="option" class="setting-option" type="button" :class="{ active: draftValue === option }" @click="draftValue = option">{{ option }}</button>
        </div>
        <div v-else-if="activeDialog === 'network'" class="setting-options">
          <button class="setting-option" type="button" :class="{ active: draftBool }" @click="draftBool = true">开启4G</button>
          <button class="setting-option" type="button" :class="{ active: !draftBool }" @click="draftBool = false">关闭4G</button>
        </div>
        <div v-else-if="activeDialog === 'server'" class="server-form">
          <label>服务器 IP<input v-model.trim="draftServerIp" inputmode="decimal" /></label>
          <label>服务器端口<input v-model.number="draftServerPort" type="number" min="1" max="65535" /></label>
          <span v-if="!serverValid">请输入有效的 IPv4 地址和端口。</span>
        </div>
        <dl v-else-if="activeDialog === 'bluetooth'" class="setting-info-list">
          <div><dt>连接状态</dt><dd>{{ isOnline ? '蓝牙已连接' : '蓝牙未连接' }}</dd></div>
          <div><dt>设备名称</dt><dd>{{ device.name }}</dd></div>
          <div><dt>电量</dt><dd>{{ device.batteryPercent ?? 86 }}%</dd></div>
        </dl>
        <dl v-else-if="activeDialog === 'info'" class="setting-info-list">
          <div><dt>设备型号</dt><dd>{{ device.model }}</dd></div>
          <div><dt>序列号</dt><dd>{{ device.serialNumber }}</dd></div>
          <div><dt>测量波长</dt><dd>10种</dd></div>
          <div><dt>固件版本</dt><dd>V1.0.0</dd></div>
        </dl>
        <p v-else class="danger-message">设备将停止当前测量并关闭，需在硬件端重新开机。</p>
      </DeviceSettingDialog>

      <div v-if="feedback" class="settings-toast" role="status">{{ feedback }}</div>
    </MultiOpmPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Device } from '@/composables/useAuth'
import { useAuth } from '@/composables/useAuth'
import bluetoothIcon from '@/assets/icons/iconfont/device/bluetooth.svg'
import timerIcon from '@/assets/icons/iconfont/device/timer.svg'
import languageIcon from '@/assets/icons/iconfont/device/language.svg'
import infoIcon from '@/assets/icons/iconfont/device/info.svg'
import networkIcon from '@/assets/icons/iconfont/device/cellular.svg'
import settingsIcon from '@/assets/icons/iconfont/device/settings.svg'
import powerIcon from '@/assets/icons/iconfont/device/poweroff.svg'
import DeviceSettingDialog from '../components/DeviceSettingDialog.vue'
import DeviceSettingsList, { type DeviceSettingSection } from '../components/DeviceSettingsList.vue'
import MultiOpmFunctionNav from './MultiOpmFunctionNav.vue'
import MultiOpmPageShell from './MultiOpmPageShell.vue'
import { useMultiOpmState } from './useMultiOpmState'

type DialogKey = 'bluetooth' | 'network' | 'server' | 'shutdown' | 'language' | 'info' | 'remoteShutdown'
const props = defineProps<{ device: Device }>()
const router = useRouter()
const { updateDevice } = useAuth()
const state = useMultiOpmState(props.device.id)
const activeDialog = ref<DialogKey | null>(null)
const draftValue = ref('')
const draftBool = ref(false)
const draftServerIp = ref('')
const draftServerPort = ref(9000)
const busy = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined
const shutdownOptions = ['从不', '1分钟', '5分钟', '10分钟', '30分钟', '60分钟']
const languageOptions = ['简体中文', 'English']
const isOnline = computed(() => props.device.status === 'connected' && state.persisted.bluetoothEnabled)
const isValidIp = (value: string) => {
  const parts = value.split('.')
  return parts.length === 4 && parts.every(part => /^\d+$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
}
const serverValid = computed(() => isValidIp(draftServerIp.value) && draftServerPort.value >= 1 && draftServerPort.value <= 65535)
const sections = computed<DeviceSettingSection[]>(() => [
  { key: 'connection', title: '连接与控制', items: [
    { key: 'bluetooth', label: '蓝牙连接', description: props.device.name, icon: bluetoothIcon, badge: isOnline.value ? '在线' : '离线', badgeTone: isOnline.value ? 'success' : 'warning' },
    { key: 'network', label: '4G网络', description: '远程查看与上传数据', value: state.persisted.networkEnabled ? '已开启' : '已关闭', icon: networkIcon },
    { key: 'server', label: '服务器配置', description: `${state.persisted.serverIp}:${state.persisted.serverPort}`, value: '编辑', icon: settingsIcon }
  ] },
  { key: 'hardware', title: '硬件菜单', items: [
    { key: 'shutdown', label: '自动关机', description: '无操作后自动关闭设备', value: state.persisted.autoShutdown, icon: timerIcon },
    { key: 'language', label: '设备语言', description: '修改设备屏幕语言', value: state.persisted.language, icon: languageIcon }
  ] },
  { key: 'information', title: '设备信息', items: [
    { key: 'info', label: '关于本机', description: `${props.device.model} · ${props.device.serialNumber}`, value: 'V1.0.0', icon: infoIcon },
    { key: 'remoteShutdown', label: '远程关机', description: '停止测量并关闭设备', icon: powerIcon, tone: 'danger' }
  ] }
])
const dialogTitle = computed(() => activeDialog.value === 'bluetooth' ? '蓝牙连接' : activeDialog.value === 'network' ? '4G网络' : activeDialog.value === 'server' ? '服务器配置' : activeDialog.value === 'shutdown' ? '自动关机' : activeDialog.value === 'language' ? '设备语言' : activeDialog.value === 'remoteShutdown' ? '远程关机' : '关于本机')
const dialogDescription = computed(() => activeDialog.value === 'bluetooth' ? (isOnline.value ? '断开后将停止近场测量与控制。' : '重新连接附近的多功能光功率计。') : activeDialog.value === 'network' ? '设置设备4G远程连接状态。' : activeDialog.value === 'server' ? '配置远程数据服务地址。' : activeDialog.value === 'shutdown' ? '选择无操作后的自动关机时间。' : activeDialog.value === 'language' ? '仅修改设备屏幕显示语言。' : '')
const confirmText = computed(() => activeDialog.value === 'bluetooth' ? (isOnline.value ? '断开连接' : '重新连接') : activeDialog.value === 'remoteShutdown' ? '确认关机' : '保存')
const goHome = () => router.replace(`/device/${props.device.id}`)
const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}
const openSetting = (key: string) => {
  activeDialog.value = key as DialogKey
  draftValue.value = key === 'shutdown' ? state.persisted.autoShutdown : key === 'language' ? state.persisted.language : ''
  draftBool.value = state.persisted.networkEnabled
  draftServerIp.value = state.persisted.serverIp
  draftServerPort.value = state.persisted.serverPort
}
const confirmSetting = async () => {
  if (activeDialog.value === 'shutdown') state.persisted.autoShutdown = draftValue.value
  if (activeDialog.value === 'language') state.persisted.language = draftValue.value
  if (activeDialog.value === 'network') state.persisted.networkEnabled = draftBool.value
  if (activeDialog.value === 'server' && serverValid.value) {
    state.persisted.serverIp = draftServerIp.value
    state.persisted.serverPort = draftServerPort.value
  }
  if (activeDialog.value === 'bluetooth') {
    if (isOnline.value) {
      state.persisted.bluetoothEnabled = false
      updateDevice(props.device.id, { status: 'disconnected' })
      props.device.status = 'disconnected'
    } else {
      busy.value = true
      await new Promise(resolve => window.setTimeout(resolve, 700))
      state.persisted.bluetoothEnabled = true
      updateDevice(props.device.id, { status: 'connected', lastConnected: new Date().toISOString() })
      props.device.status = 'connected'
      busy.value = false
    }
  }
  if (activeDialog.value === 'remoteShutdown') {
    state.persisted.isEnabled = false
    updateDevice(props.device.id, { status: 'disconnected' })
    props.device.status = 'disconnected'
  }
  showFeedback(activeDialog.value === 'remoteShutdown' ? '关机指令已发送' : '设置已保存')
  activeDialog.value = null
}

onUnmounted(() => { if (feedbackTimer) window.clearTimeout(feedbackTimer) })
</script>

<style scoped lang="scss">
@use './multiOpmUi.scss' as ui;
@use '../components/deviceSettingsControls.scss';

.multi-opm-settings-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$bg; }
.settings-page { @include ui.page-surface; padding-bottom: 22px; }
.connection-badge { min-width: 42px; padding: 4px 6px; border-radius: 999px; background: #fef3c7; color: #b45309; font-size: 11px; font-weight: 700; text-align: center; }
.connection-badge.online { background: #dcfce7; color: #15803d; }
.server-form { display: flex; flex-direction: column; gap: 12px; }
.server-form label { display: flex; flex-direction: column; gap: 6px; color: ui.$text-sub; font-size: 11px; }
.server-form input { min-height: 44px; box-sizing: border-box; padding: 0 12px; border: 1px solid ui.$border; border-radius: 8px; background: #fff; color: ui.$text; font: inherit; font-size: 13px; }
.server-form span { color: ui.$danger; font-size:12px; }
.danger-message { margin: 0; color: #991b1b; font-size: 12px; line-height: 1.6; }
.settings-toast { bottom: 94px; }
</style>
