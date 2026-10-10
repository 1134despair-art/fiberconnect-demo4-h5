<template>
  <div class="multi-opm-vfl-app app-container">
    <MultiOpmPageShell title="VFL光源" :subtitle="device.name" @back="goHome">
      <template #footer><MultiOpmFunctionNav :device-id="device.id" active="vfl" /></template>

      <main class="vfl-page">
        <section v-if="!isOnline" class="offline-band" role="status"><strong>设备离线</strong><span>重新连接后可控制光源输出</span></section>

        <section class="source-status" :class="[{ active: isOutputOn }, colorClass]" aria-label="VFL输出状态">
          <div class="source-icon"><img :src="vflIcon" alt="" /></div>
          <div class="source-wavelength"><strong>650</strong><span>nm</span></div>
          <small>{{ isOutputOn ? modeLabel : '输出关闭' }}</small>
        </section>

        <section class="control-section">
          <header><strong>光源颜色</strong><span>当前设备为{{ colorLabel }}版本</span></header>
          <div class="color-option" :class="colorClass"><i></i><strong>{{ colorLabel }}</strong></div>
        </section>

        <section class="control-section">
          <header><strong>输出模式</strong><span>设备支持常亮与闪烁</span></header>
          <div class="mode-grid">
            <button type="button" :class="{ active: state.persisted.vflMode === 'steady' }" :disabled="!isOnline" @click="requestMode('steady')">
              <img :src="steadyIcon" alt="" /><strong>常亮</strong>
            </button>
            <button type="button" :class="{ active: state.persisted.vflMode === 'blink' }" :disabled="!isOnline" @click="requestMode('blink')">
              <img :src="blinkIcon" alt="" /><strong>闪烁</strong>
            </button>
          </div>
        </section>

        <button class="close-output" type="button" :disabled="!isOnline || !isOutputOn" @click="closeOutput">
          <img :src="powerIcon" alt="" />关闭输出
        </button>

        <aside class="safety-note"><strong>激光安全</strong><span>输出开启时请勿直视端口或将光束对准他人。</span></aside>
      </main>

      <DeviceSettingDialog
        :open="pendingMode !== null"
        title="确认开启激光输出"
        :description="`将以${pendingMode === 'steady' ? '常亮' : '闪烁'}模式开启${colorLabel}。`"
        confirm-text="确认开启"
        danger
        @close="pendingMode = null"
        @confirm="confirmMode"
      >
        <div class="laser-confirm"><strong>LASER</strong><p>请确认端口未朝向人员，现场人员已知晓激光正在工作。</p></div>
      </DeviceSettingDialog>

      <div v-if="feedback" class="settings-toast" role="status">{{ feedback }}</div>
    </MultiOpmPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Device } from '@/composables/useAuth'
import vflIcon from '@/assets/icons/iconfont/device/vfl.svg'
import steadyIcon from '@/assets/icons/iconfont/device/output.svg'
import blinkIcon from '@/assets/icons/iconfont/device/wave.svg'
import powerIcon from '@/assets/icons/iconfont/device/poweroff.svg'
import DeviceSettingDialog from '../components/DeviceSettingDialog.vue'
import MultiOpmFunctionNav from './MultiOpmFunctionNav.vue'
import MultiOpmPageShell from './MultiOpmPageShell.vue'
import { type MultiOpmVflMode, useMultiOpmState } from './useMultiOpmState'

const props = defineProps<{ device: Device }>()
const router = useRouter()
const state = useMultiOpmState(props.device.id)
const pendingMode = ref<Exclude<MultiOpmVflMode, 'off'> | null>(null)
const feedback = ref('')
let feedbackTimer: number | undefined

const isOnline = computed(() => props.device.status === 'connected' && state.persisted.bluetoothEnabled)
const isOutputOn = computed(() => state.persisted.vflMode !== 'off')
const colorLabel = computed(() => props.device.lightSourceColor === 'green' ? '绿光' : '红光')
const colorClass = computed(() => props.device.lightSourceColor === 'green' ? 'green' : 'red')
const modeLabel = computed(() => state.persisted.vflMode === 'steady' ? `${colorLabel.value}常亮` : `${colorLabel.value}闪烁`)
const goHome = () => router.replace(`/device/${props.device.id}`)
const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}
const requestMode = (mode: Exclude<MultiOpmVflMode, 'off'>) => {
  if (state.persisted.vflMode !== 'off') {
    state.persisted.vflMode = mode
    return showFeedback(`已切换为${mode === 'steady' ? '常亮' : '闪烁'}模式`)
  }
  pendingMode.value = mode
}
const confirmMode = () => {
  if (!pendingMode.value) return
  state.persisted.vflMode = pendingMode.value
  pendingMode.value = null
  showFeedback('激光输出已开启')
}
const closeOutput = () => { state.persisted.vflMode = 'off'; showFeedback('激光输出已关闭') }

onUnmounted(() => { if (feedbackTimer) window.clearTimeout(feedbackTimer) })
</script>

<style scoped lang="scss">
@use './multiOpmUi.scss' as ui;
@use '../components/deviceSettingsControls.scss';

.multi-opm-vfl-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$bg; }
.vfl-page { @include ui.page-surface; display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px; }
.offline-band { display: flex; justify-content: space-between; gap: 8px; padding: 9px 12px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; color: #9a3412; font-size: 11px; }
.offline-band span { color: #c2410c; }
.source-status { min-height: 190px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 1px solid ui.$border; }
.source-icon { width: 56px; height: 56px; display: grid; place-items: center; }
.source-icon img { width: 48px; height: 48px; opacity: .32; filter: grayscale(1); }
.source-status.active .source-icon img { opacity: 1; filter: none; }
.source-status.active.green .source-icon img { filter: hue-rotate(82deg) saturate(1.2); }
.source-wavelength { display: flex; align-items: baseline; gap: 7px; margin-top: 8px; color: ui.$text; }
.source-wavelength strong { font-size: 32px; @include ui.metric-number; }
.source-wavelength span { font-size: 12px; }
.source-status small { margin-top: 7px; padding: 5px 14px; border-radius: 999px; background: #eef2f7; color: ui.$text-sub; font-size:12px; }
.source-status.active.red small { background: #fee2e2; color: #b91c1c; }
.source-status.active.green small { background: #dcfce7; color: #15803d; }
.control-section header strong, .control-section header span { display: block; }
.control-section header strong { color: ui.$text; font-size: 13px; }
.control-section header span { margin-top: 3px; color: ui.$text-sub; font-size:12px; }
.color-option { min-height: 54px; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 10px; border: 1px solid #93c5fd; border-radius: 9px; background: ui.$primary-soft; color: ui.$primary-dark; }
.color-option i { width: 11px; height: 11px; border-radius: 50%; background: #ef4444; }
.color-option.green i { background: #22c55e; }
.color-option strong { font-size: 12px; }
.mode-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
.mode-grid button { @include ui.secondary-button; min-height: 82px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
.mode-grid button.active { border-color: #60a5fa; background: ui.$primary-soft; color: ui.$primary-dark; }
.mode-grid img { width: 28px; height: 28px; object-fit: contain; }
.mode-grid strong { font-size: 12px; }
.close-output { @include ui.secondary-button; width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px; color: ui.$danger; }
.close-output img { width: 20px; height: 20px; }
.safety-note { display: grid; grid-template-columns: 58px 1fr; align-items: center; gap: 10px; padding: 12px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; }
.safety-note strong { color: #b91c1c; font-size: 11px; }
.safety-note span { color: #b91c1c; font-size:12px; line-height: 1.45; }
.laser-confirm { display: flex; gap: 12px; align-items: flex-start; }
.laser-confirm strong { flex: 0 0 auto; padding: 5px 7px; border: 2px solid #dc2626; border-radius: 999px; color: #dc2626; font-size:12px; }
.laser-confirm p { margin: 0; color: ui.$text-sub; font-size: 12px; line-height: 1.6; }
.settings-toast { bottom: 94px; }
</style>
