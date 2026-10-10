<template>
  <PortableOtdrSettings v-if="device?.deviceType === 'portable_otdr'" :device="device" />
  <MultiOpmSettings v-else-if="device?.deviceType === 'multi_opm_meter'" :device="device" />
  <div v-else class="legacy-settings-page app-container legacy-operation-page">
    <header class="legacy-header">
      <button class="back-button" aria-label="返回设备首页" @click="goBack">‹</button>
      <div class="header-title">
        <strong>{{ pageTitle }}</strong>
        <span>{{ device?.model || '设备未识别' }}</span>
      </div>
      <span class="connection-badge" :class="{ offline: device?.status !== 'connected' }">
        {{ device?.status === 'connected' ? '在线' : '离线' }}
      </span>
    </header>

    <main v-if="device" class="settings-content">
      <section v-for="section in settingSections" :key="section.title" class="setting-section">
        <h2>{{ section.title }}</h2>
        <div class="setting-list">
          <button
            v-for="item in section.items"
            :key="item.key"
            class="setting-row"
            :class="{ danger: item.danger }"
            @click="openSetting(item.key)"
          >
            <span class="setting-icon"><img :src="item.icon" alt="" /></span>
            <span class="setting-copy">
              <strong>{{ item.label }}</strong>
              <small>{{ item.description }}</small>
            </span>
            <span class="setting-value">{{ item.value }}</span>
            <span class="chevron">›</span>
          </button>
        </div>
      </section>
    </main>

    <main v-else class="settings-content empty-state">
      <strong>未找到设备</strong>
      <span>请返回首页重新选择设备。</span>
      <button @click="router.replace('/')">返回首页</button>
    </main>

    <div v-if="dialog.visible" class="dialog-mask" @click.self="closeDialog">
      <section class="setting-dialog" role="dialog" aria-modal="true" :aria-label="dialog.title">
        <header>
          <strong>{{ dialog.title }}</strong>
          <button aria-label="关闭" @click="closeDialog">×</button>
        </header>

        <div class="dialog-body">
          <p v-if="dialog.description" class="dialog-description">{{ dialog.description }}</p>

          <div v-if="dialog.kind === 'toggle'" class="choice-list">
            <button :class="{ active: dialog.boolValue }" @click="dialog.boolValue = true">开启</button>
            <button :class="{ active: !dialog.boolValue }" @click="dialog.boolValue = false">关闭</button>
          </div>

          <div v-else-if="dialog.kind === 'select'" class="choice-list vertical">
            <button
              v-for="option in dialog.options"
              :key="option"
              :class="{ active: dialog.value === option }"
              @click="dialog.value = option"
            >
              {{ option }}
            </button>
          </div>

          <div v-else-if="dialog.kind === 'brightness'" class="stepper-card">
            <span>屏幕亮度</span>
            <div class="stepper">
              <button @click="dialog.numberValue = Math.max(1, dialog.numberValue - 1)">−</button>
              <strong>{{ dialog.numberValue }}</strong>
              <button @click="dialog.numberValue = Math.min(10, dialog.numberValue + 1)">＋</button>
            </div>
          </div>

          <div v-else-if="dialog.kind === 'server'" class="server-form">
            <label>服务器 IP<input v-model.trim="dialog.serverIp" inputmode="decimal" /></label>
            <label>服务器端口<input v-model.number="dialog.serverPort" type="number" min="1" max="65535" /></label>
            <span v-if="dialog.error" class="field-error">{{ dialog.error }}</span>
          </div>

          <dl v-else-if="dialog.kind === 'info'" class="info-list">
            <div><dt>设备型号</dt><dd>{{ device?.model || '--' }}</dd></div>
            <div><dt>序列号</dt><dd>{{ device?.serialNumber || '--' }}</dd></div>
            <div><dt>固件版本</dt><dd>V1.0.0</dd></div>
            <div><dt>授权状态</dt><dd>{{ device?.activationStatus === 'activated' ? '已激活' : '未激活' }}</dd></div>
          </dl>

          <p v-else class="confirm-message">{{ dialog.confirmText }}</p>
        </div>

        <footer>
          <button class="secondary" @click="closeDialog">取消</button>
          <button :class="{ destructive: dialog.kind === 'confirm' }" @click="saveDialog">
            {{ dialog.kind === 'confirm' ? '确认执行' : '保存' }}
          </button>
        </footer>
      </section>
    </div>

    <div v-if="toast" class="toast" role="status">{{ toast }}</div>
    <FusionFunctionNav />
  </div>
</template>

<script setup lang="ts">
import FusionFunctionNav from '../components/FusionFunctionNav.vue'
import brightnessIcon from '@/assets/icons/iconfont/device/brightness.svg'
import buzzerIcon from '@/assets/icons/iconfont/device/buzzer.svg'
import powerOffIcon from '@/assets/icons/iconfont/device/poweroff.svg'
import infoIcon from '@/assets/icons/iconfont/device/info.svg'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import bluetoothIcon from '@/assets/icons/iconfont/device/bluetooth.svg'
import networkIcon from '@/assets/icons/iconfont/device/cellular.svg'
import timerIcon from '@/assets/icons/iconfont/device/timer.svg'
import languageIcon from '@/assets/icons/iconfont/device/language.svg'


import PortableOtdrSettings from '../portable-otdr/PortableOtdrSettings.vue'
import MultiOpmSettings from '../multi-opm/MultiOpmSettings.vue'

type SettingKey = 'brightness' | 'tone' | 'bluetooth' | 'sleep' | 'shutdown' | 'language' | 'network' | 'server' | 'remoteShutdown' | 'info' | 'firmware' | 'registration' | 'authorization'
type DialogKind = 'toggle' | 'select' | 'brightness' | 'server' | 'info' | 'confirm'

interface SettingItem {
  key: SettingKey
  label: string
  description: string
  value: string
  icon: string
  danger?: boolean
}

interface SettingSection {
  title: string
  items: SettingItem[]
}

const route = useRoute()
const router = useRouter()
const { user, updateDevice } = useAuth()
const device = computed(() => user.value?.devices?.find(item => item.id === String(route.params.id)) || null)
const storageKey = computed(() => `legacy-device-settings:v1:${route.params.id}`)

const defaults = {
  brightness: 8,
  tone: true,
  bluetooth: true,
  sleep: true,
  shutdown: '5分钟',
  language: '简体中文',
  network: true,
  serverIp: '192.168.1.100',
  serverPort: 9000
}

const loadState = () => {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey.value) || '{}') }
  } catch {
    return { ...defaults }
  }
}

const state = reactive(loadState())
const toast = ref('')
let toastTimer: number | undefined

const showToast = (message: string) => {
  toast.value = message
  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 1800)
}

const pageTitle = computed(() => {
  if (device.value?.deviceType === 'fusion_splicer') return '熔接机系统设置'
  if (device.value?.deviceType === 'portable_otdr') return '便携 OTDR 设置'
  return '多功能光功率计设置'
})

const baseItems = computed<SettingItem[]>(() => [
  { key: 'bluetooth', label: '蓝牙', description: '设备近场连接', value: state.bluetooth ? '开启' : '关闭', icon: bluetoothIcon },
  { key: 'shutdown', label: '自动关机', description: '无操作后自动关闭', value: state.shutdown, icon: timerIcon },
  { key: 'language', label: '设备语言', description: '仅修改硬件界面语言', value: state.language, icon: languageIcon }
])

const settingSections = computed<SettingSection[]>(() => {
  const commonInfo: SettingItem[] = [
    { key: 'info', label: '系统信息', description: '型号、序列号与版本', value: 'V1.0.0', icon: infoIcon },
    { key: 'firmware', label: '固件版本', description: '当前版本信息', value: 'V1.0.0', icon: infoIcon }
  ]

  if (device.value?.deviceType === 'fusion_splicer') {
    return [
      { title: '基础设置', items: [
        { key: 'brightness', label: '屏幕亮度', description: '调整设备屏幕亮度', value: `${state.brightness}`, icon: brightnessIcon },
        { key: 'tone', label: '触屏提示音', description: '按键操作提示', value: state.tone ? '开启' : '关闭', icon: buzzerIcon },
        ...baseItems.value.slice(0, 1),
        { key: 'sleep', label: '休眠', description: '降低待机功耗', value: state.sleep ? '开启' : '关闭', icon: timerIcon },
        ...baseItems.value.slice(1)
      ] },
      { title: '系统信息', items: [
        ...commonInfo,
        { key: 'registration', label: '注册信息', description: '设备激活记录', value: device.value.activationStatus === 'activated' ? '已激活' : '未激活', icon: infoIcon },
        { key: 'authorization', label: '设备授权', description: '查看授权有效期', value: device.value.authorizationExpiry || '--', icon: infoIcon }
      ] }
    ]
  }

  if (device.value?.deviceType === 'multi_opm_meter') {
    return [
      { title: '连接与控制', items: [
        baseItems.value[0],
        { key: 'network', label: '4G 网络', description: '远程查看与控制', value: state.network ? '开启' : '关闭', icon: networkIcon },
        { key: 'server', label: '服务器配置', description: `${state.serverIp}:${state.serverPort}`, value: '编辑', icon: networkIcon },
        ...baseItems.value.slice(1)
      ] },
      { title: '设备信息', items: [...commonInfo, { key: 'remoteShutdown', label: '远程关机', description: '停止测量并关闭设备', value: '', icon: powerOffIcon, danger: true }] }
    ]
  }

  return [
    { title: '设备设置', items: baseItems.value },
    { title: '设备信息', items: commonInfo }
  ]
})

const dialog = reactive({
  visible: false,
  key: 'info' as SettingKey,
  title: '',
  description: '',
  kind: 'info' as DialogKind,
  boolValue: false,
  value: '',
  numberValue: 8,
  options: [] as string[],
  serverIp: '',
  serverPort: 0,
  confirmText: '',
  error: ''
})

const openSetting = (key: SettingKey) => {
  dialog.visible = true
  dialog.key = key
  dialog.error = ''
  const map: Record<SettingKey, Partial<typeof dialog>> = {
    brightness: { title: '屏幕亮度', kind: 'brightness', numberValue: state.brightness },
    tone: { title: '触屏提示音', kind: 'toggle', boolValue: state.tone },
    bluetooth: { title: '蓝牙', kind: 'toggle', boolValue: state.bluetooth, description: '关闭后设备将停止近场控制。' },
    sleep: { title: '休眠', kind: 'toggle', boolValue: state.sleep },
    shutdown: { title: '自动关机', kind: 'select', value: state.shutdown, options: ['从不', '1分钟', '5分钟', '10分钟', '30分钟', '60分钟'] },
    language: { title: '设备语言', kind: 'select', value: state.language, options: ['简体中文', 'English'] },
    network: { title: '4G 网络', kind: 'toggle', boolValue: state.network, description: '关闭后远程数据与控制不可用。' },
    server: { title: '服务器配置', kind: 'server', serverIp: state.serverIp, serverPort: state.serverPort },
    remoteShutdown: { title: '远程关机', kind: 'confirm', confirmText: '确认停止当前测量并关闭设备？' },
    info: { title: '系统信息', kind: 'info' },
    firmware: { title: '固件版本', kind: 'info' },
    registration: { title: '注册信息', kind: 'info' },
    authorization: { title: '设备授权', kind: 'info' }
  }
  Object.assign(dialog, map[key])
}

const isValidIp = (value: string) => {
  const parts = value.split('.')
  return parts.length === 4 && parts.every(part => /^\d+$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
}

const saveDialog = () => {
  if (dialog.kind === 'server') {
    if (!isValidIp(dialog.serverIp) || dialog.serverPort < 1 || dialog.serverPort > 65535) {
      dialog.error = '请输入有效的 IPv4 地址和 1–65535 端口。'
      return
    }
    state.serverIp = dialog.serverIp
    state.serverPort = dialog.serverPort
  } else if (dialog.kind === 'toggle') {
    ;(state as Record<string, unknown>)[dialog.key] = dialog.boolValue
    if (dialog.key === 'bluetooth' && !dialog.boolValue && device.value) {
      updateDevice(device.value.id, { status: 'disconnected' })
      device.value.status = 'disconnected'
    }
  } else if (dialog.kind === 'select') {
    ;(state as Record<string, unknown>)[dialog.key] = dialog.value
  } else if (dialog.kind === 'brightness') {
    state.brightness = dialog.numberValue
  } else if (dialog.kind === 'confirm') {
    if (device.value) {
      updateDevice(device.value.id, { status: 'disconnected' })
      device.value.status = 'disconnected'
    }
    showToast('远程关机指令已发送（演示）')
    closeDialog()
    return
  }

  localStorage.setItem(storageKey.value, JSON.stringify(state))
  showToast('设置已保存')
  closeDialog()
}

const closeDialog = () => {
  dialog.visible = false
}

const goBack = () => router.replace(`/device/${route.params.id}`)
</script>

<style scoped>
.legacy-settings-page { min-height: 100%; background: #F5F7FA; color: #252B36; }
.legacy-header { height: 64px; padding: 0 14px; display: grid; grid-template-columns: 44px 1fr auto; align-items: center; background: #FFF; border-bottom: 1px solid #E5E7EB; }
.back-button { width: 44px; height: 44px; border: 0; background: none; color: #2F80ED; font-size: 32px; text-align: left; }
.header-title { display: flex; flex-direction: column; align-items: center; min-width: 0; }
.header-title strong { font-size: 18px; line-height: 24px; }
.header-title span { color: #64748B; font-size: 11px; }
.connection-badge { padding: 5px 9px; border-radius: 999px; background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 700; }
.connection-badge.offline { background: #F1F5F9; color: #64748B; }
.settings-content { flex: 1; min-height: 0; padding: 14px 14px 28px; overflow-y: auto; }
.setting-section + .setting-section { margin-top: 18px; }
.setting-section h2 { margin: 0 0 8px 2px; color: #64748B; font-size: 12px; font-weight: 700; }
.setting-list { overflow: hidden; border: 1px solid #D8E2EF; border-radius: 12px; background: #FFF; box-shadow: 0 3px 10px rgba(15, 23, 42, .04); }
.setting-row { width: 100%; min-height: 68px; padding: 10px 12px; display: grid; grid-template-columns: 40px minmax(0,1fr) auto 18px; gap: 10px; align-items: center; border: 0; border-bottom: 1px solid #E6EDF5; background: #FFF; text-align: left; color: inherit; }
.setting-row:last-child { border-bottom: 0; }
.setting-row:active { background: #F8FAFC; }
.setting-row.danger strong { color: #DC2626; }
.setting-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 9px; background: #EFF6FF; }
.setting-icon img { width: 22px; height: 22px; object-fit: contain; }
.setting-copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.setting-copy strong { font-size: 14px; }
.setting-copy small { overflow: hidden; color: #64748B; font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }
.setting-value { max-width: 92px; color: #475569; font-size: 12px; text-align: right; }
.chevron { color: #2F80ED; font-size: 22px; }
.empty-state { min-height: 480px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #64748B; }
.empty-state button { height: 44px; padding: 0 20px; border: 0; border-radius: 8px; background: #2F80ED; color: #FFF; }
.dialog-mask { position: absolute; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(15,23,42,.45); }
.setting-dialog { width: 100%; max-width: 330px; overflow: hidden; border-radius: 12px; background: #FFF; box-shadow: 0 16px 38px rgba(15,23,42,.24); }
.setting-dialog > header { height: 54px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; }
.setting-dialog > header strong { font-size: 17px; }
.setting-dialog > header button { width: 44px; height: 44px; border: 0; background: none; color: #64748B; font-size: 24px; }
.dialog-body { padding: 16px; }
.dialog-description, .confirm-message { margin: 0 0 14px; color: #475569; font-size: 13px; line-height: 1.6; }
.choice-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.choice-list.vertical { grid-template-columns: 1fr; }
.choice-list button { min-height: 46px; border: 1px solid #D8E2EF; border-radius: 8px; background: #F8FAFC; color: #334155; font-weight: 700; }
.choice-list button.active { border-color: #2F80ED; background: #EFF6FF; color: #1D4ED8; }
.stepper-card { display: flex; align-items: center; justify-content: space-between; }
.stepper { display: grid; grid-template-columns: 44px 54px 44px; align-items: center; text-align: center; }
.stepper button { width: 44px; height: 44px; border: 0; border-radius: 8px; background: #F1F5F9; color: #2563EB; font-size: 20px; }
.server-form { display: grid; gap: 12px; }
.server-form label { display: grid; gap: 6px; color: #475569; font-size: 12px; }
.server-form input { height: 44px; padding: 0 12px; border: 1px solid #D8E2EF; border-radius: 8px; font-size: 14px; }
.field-error { color: #DC2626; font-size: 11px; }
.info-list { margin: 0; }
.info-list div { min-height: 42px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; }
.info-list dt { color: #64748B; font-size: 12px; }
.info-list dd { margin: 0; font-size: 13px; font-weight: 700; }
.setting-dialog > footer { padding: 0 16px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.setting-dialog > footer button { height: 44px; border: 0; border-radius: 8px; background: #2F80ED; color: #FFF; font-weight: 700; }
.setting-dialog > footer .secondary { background: #F1F5F9; color: #334155; }
.setting-dialog > footer .destructive { background: #DC2626; }
.toast { position: absolute; left: 50%; bottom: 24px; z-index: 100; transform: translateX(-50%); padding: 10px 14px; border-radius: 8px; background: #0F172A; color: #FFF; font-size: 12px; white-space: nowrap; }
</style>
