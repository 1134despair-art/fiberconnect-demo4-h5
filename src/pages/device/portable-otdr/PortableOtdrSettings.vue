<template>
  <div class="portable-settings-app app-container">
    <PortableOtdrPageShell title="设备设置" :subtitle="device.name" @back="goHome">
      <template #action><span class="connection-badge" :class="{ online: isOnline }">{{ isOnline ? '在线' : '离线' }}</span></template>
      <template #footer><PortableOtdrFunctionNav :device-id="device.id" active="settings" /></template>

      <div class="settings-page"><DeviceSettingsList :sections="sections" @select="openSetting" /></div>

      <DeviceSettingDialog
        :open="activeDialog !== null"
        :title="dialogTitle"
        :description="dialogDescription"
        :show-footer="activeDialog !== 'info'"
        :confirm-text="activeDialog === 'bluetooth' ? (isOnline ? '断开连接' : '重新连接') : '保存'"
        :danger="activeDialog === 'bluetooth' && isOnline"
        :busy="busy"
        @close="activeDialog = null"
        @confirm="confirmSetting"
      >
        <div v-if="activeDialog === 'shutdown'" class="setting-options">
          <button v-for="option in shutdownOptions" :key="option" class="setting-option" type="button" :class="{ active: draftValue === option }" @click="draftValue = option">{{ option }}</button>
        </div>
        <div v-else-if="activeDialog === 'language'" class="setting-options">
          <button v-for="option in languageOptions" :key="option" class="setting-option" type="button" :class="{ active: draftValue === option }" @click="draftValue = option">{{ option }}</button>
        </div>
        <dl v-else-if="activeDialog === 'bluetooth'" class="setting-info-list">
          <div><dt>连接状态</dt><dd>{{ isOnline ? '蓝牙已连接' : '蓝牙未连接' }}</dd></div>
          <div><dt>设备名称</dt><dd>{{ device.name }}</dd></div>
          <div><dt>电量</dt><dd>{{ device.batteryPercent ?? 82 }}%</dd></div>
        </dl>
        <dl v-else class="setting-info-list">
          <div><dt>设备型号</dt><dd>{{ device.model }}</dd></div>
          <div><dt>序列号</dt><dd>{{ device.serialNumber }}</dd></div>
          <div><dt>测量波长</dt><dd>1550nm</dd></div>
          <div><dt>最大量程</dt><dd>20km</dd></div>
          <div><dt>固件版本</dt><dd>V1.0.0</dd></div>
        </dl>
      </DeviceSettingDialog>

      <div v-if="feedback" class="settings-toast" role="status">{{ feedback }}</div>
    </PortableOtdrPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Device } from '@/composables/useAuth'
import { useAuth } from '@/composables/useAuth'
import DeviceSettingDialog from '../components/DeviceSettingDialog.vue'
import DeviceSettingsList, { type DeviceSettingSection } from '../components/DeviceSettingsList.vue'
import bluetoothIcon from '@/assets/icons/iconfont/device/bluetooth.svg'
import timerIcon from '@/assets/icons/iconfont/device/timer.svg'
import languageIcon from '@/assets/icons/iconfont/device/language.svg'
import infoIcon from '@/assets/icons/iconfont/device/info.svg'
import PortableOtdrFunctionNav from './PortableOtdrFunctionNav.vue'
import PortableOtdrPageShell from './PortableOtdrPageShell.vue'
import { usePortableOtdrState } from './usePortableOtdrState'

type DialogKey = 'bluetooth' | 'shutdown' | 'language' | 'info'
const props = defineProps<{ device: Device }>()
const router = useRouter()
const { updateDevice } = useAuth()
const state = usePortableOtdrState(props.device.id)
const activeDialog = ref<DialogKey | null>(null)
const draftValue = ref('')
const busy = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined
const shutdownOptions = ['从不', '1分钟', '5分钟', '10分钟', '30分钟', '60分钟']
const languageOptions = ['简体中文', 'English']
const isOnline = computed(() => props.device.status === 'connected' && state.bluetoothEnabled)
const sections = computed<DeviceSettingSection[]>(() => [
  { key: 'hardware', title: '硬件菜单', items: [
    { key: 'shutdown', label: '自动关机', description: '无操作后自动关闭设备', value: state.autoShutdown, icon: timerIcon },
    { key: 'language', label: '设备语言', description: '修改设备屏幕语言', value: state.language, icon: languageIcon }
  ] },
  { key: 'connection', title: '蓝牙控制', items: [
    { key: 'bluetooth', label: '蓝牙连接', description: props.device.name, icon: bluetoothIcon, badge: isOnline.value ? '在线' : '离线', badgeTone: isOnline.value ? 'success' : 'warning' }
  ] },
  { key: 'information', title: '设备信息', items: [
    { key: 'info', label: '关于本机', description: `${props.device.model} · ${props.device.serialNumber}`, value: 'V1.0.0', icon: infoIcon }
  ] }
])
const dialogTitle = computed(() => activeDialog.value === 'bluetooth' ? '蓝牙连接' : activeDialog.value === 'shutdown' ? '自动关机' : activeDialog.value === 'language' ? '设备语言' : '关于本机')
const dialogDescription = computed(() => activeDialog.value === 'bluetooth' ? (isOnline.value ? '断开后将停止测量与设备控制。' : '重新连接附近的便携OTDR。') : activeDialog.value === 'shutdown' ? '选择无操作后的自动关机时间。' : activeDialog.value === 'language' ? '仅修改设备屏幕显示语言。' : '')
const goHome = () => router.replace(`/device/${props.device.id}`)
const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}
const openSetting = (key: string) => {
  activeDialog.value = key as DialogKey
  draftValue.value = key === 'shutdown' ? state.autoShutdown : key === 'language' ? state.language : ''
}
const confirmSetting = async () => {
  if (activeDialog.value === 'shutdown') {
    state.autoShutdown = draftValue.value
    showFeedback('自动关机设置已保存')
  } else if (activeDialog.value === 'language') {
    state.language = draftValue.value
    showFeedback('设备语言已保存')
  } else if (activeDialog.value === 'bluetooth') {
    if (isOnline.value) {
      state.bluetoothEnabled = false
      updateDevice(props.device.id, { status: 'disconnected' })
      props.device.status = 'disconnected'
      showFeedback('蓝牙已断开')
    } else {
      busy.value = true
      await new Promise(resolve => window.setTimeout(resolve, 700))
      state.bluetoothEnabled = true
      updateDevice(props.device.id, { status: 'connected', lastConnected: new Date().toISOString() })
      props.device.status = 'connected'
      busy.value = false
      showFeedback('设备已连接')
    }
  }
  activeDialog.value = null
}

onUnmounted(() => { if (feedbackTimer) window.clearTimeout(feedbackTimer) })
</script>

<style scoped lang="scss">
@use './portableOtdrUi.scss' as ui;
@use '../components/deviceSettingsControls.scss';

.portable-settings-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$bg; }
.settings-page { @include ui.page-surface; padding-bottom: 22px; }
.connection-badge { min-width: 42px; padding: 4px 6px; border-radius: 999px; background: #fef3c7; color: #b45309; font-size: 11px; font-weight: 700; text-align: center; }
.connection-badge.online { background: #dcfce7; color: #15803d; }
.settings-toast { position: absolute; left: 50%; bottom: 94px; z-index: 125; max-width: 300px; transform: translateX(-50%); padding: 9px 13px; border-radius: 8px; background: rgba(15,23,42,.94); color: #fff; font-size: 11px; text-align: center; white-space: nowrap; }
</style>
