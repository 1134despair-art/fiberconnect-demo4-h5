<template>
  <PortableOtdrPageShell title="便携OTDR" :subtitle="device.name" @back="router.replace('/')">
    <template #action>
      <button class="header-tool" :class="{ active: state.flashlightOn }" type="button" aria-label="照明" @click="toggleFlashlight">
        <img :src="flashlightIcon" alt="" />
      </button>
    </template>

    <template #footer>
      <PortableOtdrFunctionNav :device-id="device.id" active="home" />
    </template>

    <main class="portable-home-page">
      <section v-if="!isOnline" class="offline-band" role="status">
        <div><strong>设备未连接</strong><span>连接后可使用测量与控制功能</span></div>
        <button type="button" :disabled="isConnecting" @click="connectDevice">{{ isConnecting ? '连接中' : '重新连接' }}</button>
      </section>

      <section class="home-meter" aria-label="OTDR链路测试状态">
        <header>
          <strong>OTDR链路测试</strong>
          <span class="ready-state" :class="{ online: isOnline }"><i></i>{{ isOnline ? '已就绪' : '离线' }}</span>
        </header>
        <button class="meter-action" type="button" :disabled="!isOnline" @click="router.push(`/device/${device.id}/otdr`)">
          <span>测量波长</span>
          <div><strong>1550</strong><small>nm</small></div>
          <p>{{ isOnline ? '点击开始OTDR测量' : '连接设备后可开始测量' }}</p>
        </button>
        <footer><span>测量状态</span><strong>{{ isOnline ? '待测' : '不可用' }}</strong></footer>
      </section>

      <section class="parameter-grid" aria-label="OTDR关键参数">
        <button type="button" @click="openMeasure"><span>测量波长</span><strong>1550nm</strong></button>
        <button type="button" @click="openMeasure"><span>测量范围</span><strong>20km</strong></button>
        <button type="button" @click="openMeasure"><span>测量脉宽</span><strong>100ns</strong></button>
      </section>

      <section class="spec-strip" aria-label="设备能力">
        <div><span>连接方式</span><strong>蓝牙</strong></div>
        <div><span>电池容量</span><strong>{{ device.batteryCapacityMah || 900 }}mAh</strong></div>
        <div><span>授权状态</span><strong>{{ device.activationStatus === 'activated' ? '已激活' : '未激活' }}</strong></div>
      </section>

      <section class="home-tools">
        <button type="button" :class="{ active: state.flashlightOn }" @click="toggleFlashlight">
          <span class="tool-icon"><img :src="flashlightIcon" alt="" /></span>
          <span><strong>照明</strong><small>{{ state.flashlightOn ? '已开启' : '已关闭' }}</small></span>
          <i class="mini-switch" :class="{ active: state.flashlightOn }"><b></b></i>
        </button>
        <button type="button" @click="router.push(`/device/${device.id}/otdr?section=records`)">
          <span class="tool-icon"><img :src="historyIcon" alt="" /></span>
          <span><strong>测量记录</strong><small>3 条测试记录</small></span>
          <i class="tool-chevron">›</i>
        </button>
      </section>

      <div v-if="feedback" class="feedback-toast" role="status">{{ feedback }}</div>
    </main>
  </PortableOtdrPageShell>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Device } from '@/composables/useAuth'
import { useAuth } from '@/composables/useAuth'
import flashlightIcon from '@/assets/icons/iconfont/device/flashlight.svg'
import historyIcon from '@/assets/icons/iconfont/device/timer.svg'
import PortableOtdrFunctionNav from './PortableOtdrFunctionNav.vue'
import PortableOtdrPageShell from './PortableOtdrPageShell.vue'
import { usePortableOtdrState } from './usePortableOtdrState'

const props = defineProps<{ device: Device }>()
const router = useRouter()
const { updateDevice } = useAuth()
const state = usePortableOtdrState(props.device.id)
const isConnecting = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined

const isOnline = computed(() => props.device.status === 'connected' && state.bluetoothEnabled)
const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}
const connectDevice = async () => {
  if (isConnecting.value) return
  isConnecting.value = true
  await new Promise(resolve => window.setTimeout(resolve, 700))
  state.bluetoothEnabled = true
  updateDevice(props.device.id, { status: 'connected', lastConnected: new Date().toISOString() })
  props.device.status = 'connected'
  isConnecting.value = false
  showFeedback('设备已连接')
}
const toggleFlashlight = () => {
  if (!isOnline.value) return showFeedback('请先连接设备')
  state.flashlightOn = !state.flashlightOn
  showFeedback(state.flashlightOn ? '照明已开启' : '照明已关闭')
}
const openMeasure = () => {
  if (!isOnline.value) return showFeedback('请先连接设备')
  router.push(`/device/${props.device.id}/otdr?settings=1`)
}

onUnmounted(() => { if (feedbackTimer) window.clearTimeout(feedbackTimer) })
</script>

<style scoped lang="scss">
@use './portableOtdrUi.scss' as ui;

.portable-home-page { @include ui.page-surface; display: flex; flex-direction: column; gap: 12px; padding-bottom: 18px; }
.header-tool { @include ui.button-reset; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; background: transparent; }
.header-tool img { width: 22px; height: 22px; opacity: .72; }
.header-tool.active { background: ui.$primary-soft; }
.header-tool.active img { opacity: 1; }
.offline-band { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; }
.offline-band strong, .offline-band span { display: block; }
.offline-band strong { color: #9a3412; font-size: 12px; }
.offline-band span { margin-top: 2px; color: #c2410c; font-size:12px; }
.offline-band button { @include ui.secondary-button; min-height: 38px; padding: 0 10px; color: #9a3412; font-size: 11px; }
.home-meter { overflow: hidden; border: 1px solid #dbe7f5; border-radius: 12px; background: #fff; box-shadow: 0 8px 22px rgba(37, 99, 235, .08); }
.home-meter > header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #e7eef8; }
.home-meter > header strong { color: ui.$primary-dark; font-size: 13px; }
.ready-state { display: flex; align-items: center; gap: 5px; color: ui.$text-sub; font-size: 11px; }
.ready-state i { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; }
.ready-state.online { color: ui.$success; }
.ready-state.online i { background: ui.$success; }
.meter-action { @include ui.button-reset; width: 100%; min-height: 136px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; color: ui.$primary; }
.meter-action > span { font-size: 11px; }
.meter-action > div { min-height: 62px; display: flex; align-items: baseline; gap: 7px; }
.meter-action strong { font-size: 48px; line-height: 1; @include ui.metric-number; }
.meter-action small { color: ui.$primary; font-size: 14px; font-weight: 700; }
.meter-action p { margin: 0; color: ui.$text-sub; font-size: 11px; }
.home-meter > footer { min-height: 46px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-top: 1px solid #e7eef8; color: ui.$primary; }
.home-meter > footer span { font-size: 12px; }
.home-meter > footer strong { font-size: 13px; }
.parameter-grid, .spec-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.parameter-grid button { @include ui.button-reset; min-width: 0; min-height: 66px; padding: 8px 4px; border: 1px solid #e3ebf6; border-radius: 10px; background: #fff; color: ui.$text; box-shadow: ui.$shadow; }
.parameter-grid span, .parameter-grid strong { display: block; }
.parameter-grid span { color: ui.$primary; font-size: 11px; }
.parameter-grid strong { margin-top: 5px; font-size: 13px; @include ui.metric-number; }
.spec-strip { gap: 0; overflow: hidden; border: 1px solid ui.$border; border-radius: 10px; background: #fff; }
.spec-strip div { min-width: 0; padding: 9px 4px; border-right: 1px solid ui.$border; text-align: center; }
.spec-strip div:last-child { border-right: 0; }
.spec-strip span, .spec-strip strong { display: block; }
.spec-strip span { color: ui.$text-sub; font-size:12px; }
.spec-strip strong { margin-top: 4px; color: ui.$text; font-size: 11px; @include ui.metric-number; }
.home-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.home-tools button { @include ui.button-reset; position: relative; min-width: 0; min-height: 64px; display: grid; grid-template-columns: 34px minmax(0, 1fr); align-items: center; gap: 9px; padding: 8px 40px 8px 10px; border: 1px solid ui.$border; border-radius: 10px; background: #fff; color: ui.$text; text-align: left; }
.home-tools button.active { border-color: #93c5fd; background: ui.$primary-soft; }
.tool-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; background: ui.$primary-soft; }
.tool-icon img { width: 20px; height: 20px; }
.home-tools strong, .home-tools small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.home-tools strong { font-size: 11px; }
.home-tools small { margin-top: 3px; color: ui.$text-sub; font-size:12px; }
.mini-switch { position: absolute; right: 9px; width: 30px; height: 18px; padding: 2px; box-sizing: border-box; border-radius: 9px; background: #cbd5e1; }
.mini-switch b { display: block; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform .18s ease; }
.mini-switch.active { background: ui.$primary; }
.mini-switch.active b { transform: translateX(12px); }
.tool-chevron { position: absolute; right: 12px; color: ui.$text-sub; font-size: 20px; font-style: normal; }
.feedback-toast { position: absolute; left: 50%; bottom: 92px; z-index: 95; max-width: 300px; transform: translateX(-50%); padding: 9px 13px; border-radius: 8px; background: rgba(15,23,42,.94); color: #fff; font-size: 11px; text-align: center; }
@media (max-width: 340px) { .meter-action strong { font-size: 42px; } .home-tools { grid-template-columns: 1fr; } }
</style>

