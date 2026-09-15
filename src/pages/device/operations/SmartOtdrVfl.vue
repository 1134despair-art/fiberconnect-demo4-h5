<template>
  <div class="app-container smart-otdr-vfl-app">
    <SmartOtdrPageShell
      title="VFL红光源"
      :subtitle="device.name"
      @back="goToDeviceHome"
    >
      <template #footer>
        <SmartOtdrFunctionNav :device-id="device.id" />
      </template>

      <main class="smart-vfl-page">
        <section v-if="!connected" class="smart-vfl-offline" role="status">
          <div><strong>设备连接已断开</strong><span>重新连接后可控制VFL输出</span></div>
          <button type="button" @click="router.push(`/device/${device.id}/system`)">设备设置</button>
        </section>

        <section class="smart-laser-stage" :class="[{ active: mode !== 'off' }, selectedColor]" aria-live="polite">
          <span class="smart-laser-mark"><img :src="vflIcon" alt="" /></span>
          <strong v-if="selectedColor === 'red'">650 <small>nm</small></strong>
          <strong v-else>绿光 <small>模式</small></strong>
          <span class="smart-output-status">{{ modeLabel }}</span>
        </section>

        <section v-if="availableColors.length > 1" class="smart-color-section" aria-label="VFL光源颜色">
          <h2>光源颜色</h2>
          <div>
            <button v-for="color in availableColors" :key="color" type="button" :class="{ active: selectedColor === color }" @click="selectedColor = color">
              <i :class="color"></i>{{ color === 'red' ? '红光' : '绿光' }}
            </button>
          </div>
        </section>

        <section class="smart-mode-section">
          <h2>输出模式</h2>
          <p>CW / 1Hz / 2Hz</p>
          <div class="smart-mode-grid" role="radiogroup" aria-label="VFL输出模式">
            <button
              v-for="item in outputModes"
              :key="item"
              type="button"
              role="radio"
              :aria-checked="mode === item"
              :class="{ active: mode === item }"
              :disabled="!connected"
              @click="requestMode(item)"
            >
              <span class="smart-mode-symbol"><img :src="modeIcons[item]" alt="" /></span>
              <strong>{{ formatMode(item) }}</strong>
            </button>
          </div>
        </section>

        <button class="smart-power-off" type="button" :disabled="mode === 'off'" @click="requestMode('off')">
          <img :src="powerIcon" alt="" /><span>关闭</span>
        </button>

        <p class="smart-vfl-note">激光输出时请勿直视端口，也不要将光束对准他人。</p>

        <div v-if="feedback" class="smart-vfl-feedback" role="status">{{ feedback }}</div>
      </main>

      <div v-if="pendingMode" class="smart-confirm-layer" role="presentation">
        <button class="smart-confirm-mask" type="button" aria-label="取消" @click="pendingMode = null"></button>
        <section role="alertdialog" aria-modal="true" aria-label="确认开启激光输出">
          <span>LASER</span>
          <h2>确认开启激光输出</h2>
          <p>请确认端口未朝向人眼，且现场人员已知晓激光正在工作。</p>
          <div>
            <button type="button" @click="pendingMode = null">取消</button>
            <button class="danger" type="button" @click="confirmMode">确认开启</button>
          </div>
        </section>
      </div>
    </SmartOtdrPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Device } from '@/composables/useAuth'
import vflIcon from '@/assets/icons/pon-meter/ui/vfl.png'
import powerIcon from '@/assets/icons/pon-meter/ui/power-off.png'
import pulse1HzIcon from '@/assets/icons/pon-meter/ui/pulse-1hz.png'
import pulse2HzIcon from '@/assets/icons/pon-meter/ui/pulse-2hz.png'
import continuousWaveIcon from '@/assets/icons/pon-meter/ui/continuous-wave.png'
import SmartOtdrFunctionNav from '../components/SmartOtdrFunctionNav.vue'
import SmartOtdrPageShell from '../components/SmartOtdrPageShell.vue'

type SmartVflMode = 'off' | 'cw' | '1hz' | '2hz'
type SmartVflColor = 'red' | 'green'

const props = defineProps<{ device: Device }>()
const router = useRouter()
const mode = ref<SmartVflMode>('off')
const pendingMode = ref<Exclude<SmartVflMode, 'off'> | null>(null)
const feedback = ref('')
let feedbackTimer: number | undefined

const outputModes: Exclude<SmartVflMode, 'off'>[] = ['cw', '1hz', '2hz']
const availableColors = computed<SmartVflColor[]>(() => {
  const colors = props.device.supportedVflColors?.filter((color): color is SmartVflColor => color === 'red' || color === 'green')
  if (colors?.length) return colors
  return [props.device.lightSourceColor === 'green' ? 'green' : 'red']
})
const selectedColor = ref<SmartVflColor>(availableColors.value[0])
const modeIcons: Record<Exclude<SmartVflMode, 'off'>, string> = {
  cw: continuousWaveIcon,
  '1hz': pulse1HzIcon,
  '2hz': pulse2HzIcon
}

const connected = computed(() => props.device.status === 'connected')
const formatMode = (value: SmartVflMode) => value === '1hz'
    ? '1Hz'
    : value === '2hz'
      ? '2Hz'
      : value === 'cw'
        ? 'CW'
        : '关闭'
const modeLabel = computed(() => mode.value === 'off' ? '输出关闭' : `${formatMode(mode.value)} · 输出中`)

const goToDeviceHome = () => router.replace(`/device/${props.device.id}`)

const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}

const requestMode = (nextMode: SmartVflMode) => {
  if (nextMode === 'off') {
    mode.value = 'off'
    showFeedback('VFL输出已关闭')
    return
  }
  if (!connected.value) {
    showFeedback('请先连接设备')
    return
  }
  if (mode.value === 'off') {
    pendingMode.value = nextMode
    return
  }
  mode.value = nextMode
  showFeedback(`已切换为${formatMode(nextMode)}`)
}

const confirmMode = () => {
  if (!pendingMode.value) return
  mode.value = pendingMode.value
  pendingMode.value = null
  showFeedback('VFL输出已开启')
}

watch(connected, isConnected => {
  if (!isConnected) mode.value = 'off'
})

onBeforeUnmount(() => {
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  mode.value = 'off'
})
</script>

<style scoped lang="scss">
@use '../pon/ponUi.scss' as ui;

.smart-otdr-vfl-app {
  width: min(375px, calc(100vw - 24px));
  max-width: 375px;
  box-sizing: border-box;
  border-radius: 22px;
  background: ui.$pon-bg;
}

.smart-vfl-page {
  @include ui.page-surface;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 14px 18px 22px;
}

.smart-vfl-offline { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; }
.smart-vfl-offline strong,
.smart-vfl-offline span { display: block; }
.smart-vfl-offline strong { color: #9a3412; font-size: 11px; }
.smart-vfl-offline span { margin-top: 2px; color: #c2410c; font-size: 10px; }
.smart-vfl-offline button { @include ui.secondary-button; min-height: 38px; padding: 0 8px; color: #9a3412; font-size: 10px; }

.smart-laser-stage { min-height: 218px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 1px solid #e6edf7; }
.smart-laser-mark { width: 72px; height: 72px; display: grid; place-items: center; }
.smart-laser-mark img { width: 58px; height: 58px; filter: grayscale(1) opacity(0.38); transition: filter 0.18s ease, transform 0.18s ease; }
.smart-laser-stage.active .smart-laser-mark img { filter: brightness(0) saturate(100%) invert(26%) sepia(98%) saturate(3117%) hue-rotate(348deg) brightness(101%) contrast(91%); transform: scale(1.04); }
.smart-laser-stage.active.green .smart-laser-mark img { filter: brightness(0) saturate(100%) invert(55%) sepia(77%) saturate(601%) hue-rotate(90deg) brightness(91%) contrast(89%); }
.smart-laser-stage > strong { margin-top: 8px; color: ui.$pon-text; font-size: 24px; line-height: 1; @include ui.metric-number; }
.smart-laser-stage > strong small { font-size: 12px; font-weight: 500; }
.smart-output-status { min-width: 96px; margin-top: 12px; padding: 5px 10px; border-radius: 999px; background: #eef2f7; color: ui.$pon-text-sub; font-size: 10px; text-align: center; }
.smart-laser-stage.active .smart-output-status { background: #fef2f2; color: #dc2626; }
.smart-laser-stage.active.green .smart-output-status { background: #f0fdf4; color: #16a34a; }

.smart-color-section h2 { margin: 0 0 10px; color: ui.$pon-text; font-size: 14px; }
.smart-color-section > div { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.smart-color-section button { min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #d8e2ef; border-radius: 8px; background: #fff; font-weight: 700; }
.smart-color-section button.active { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
.smart-color-section i { width: 9px; height: 9px; border-radius: 50%; background: #ef4444; }
.smart-color-section i.green { background: #22c55e; }

.smart-mode-section h2,
.smart-mode-section p { margin: 0; }
.smart-mode-section h2 { color: ui.$pon-text; font-size: 14px; }
.smart-mode-section p { margin-top: 4px; color: ui.$pon-text-sub; font-size: 10px; }
.smart-mode-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.smart-mode-grid button { @include ui.button-reset; min-width: 0; min-height: 86px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border: 1px solid #e1e9f4; border-radius: 10px; background: #ffffff; color: ui.$pon-text; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.05); }
.smart-mode-grid button.active { border-color: ui.$pon-primary; background: ui.$pon-primary; color: #ffffff; box-shadow: 0 8px 18px rgba(37, 99, 235, 0.2); }
.smart-mode-grid strong { font-size: 12px; }
.smart-mode-symbol { width: 34px; height: 28px; display: flex; align-items: center; justify-content: center; }
.smart-mode-symbol img { width: 30px; height: 30px; object-fit: contain; }
.smart-mode-grid button.active .smart-mode-symbol img { filter: brightness(0) invert(1); }

.smart-power-off { @include ui.secondary-button; min-height: 50px; display: flex; align-items: center; justify-content: center; gap: 9px; background: #f2f6fb; font-size: 14px; }
.smart-power-off img { width: 21px; height: 21px; }
.smart-vfl-note { margin: -8px 0 0; color: ui.$pon-text-sub; font-size: 10px; line-height: 1.5; text-align: center; }

.smart-confirm-layer { position: absolute; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; }
.smart-confirm-mask { position: absolute; inset: 0; border: 0; background: rgba(15, 23, 42, 0.55); }
.smart-confirm-layer section { position: relative; width: min(100%, 320px); box-sizing: border-box; padding: 20px; border-radius: 12px; background: #ffffff; text-align: center; box-shadow: 0 20px 48px rgba(15, 23, 42, 0.24); }
.smart-confirm-layer section > span { display: inline-grid; min-width: 58px; height: 28px; place-items: center; border: 2px solid #dc2626; border-radius: 999px; color: #dc2626; font-size: 10px; font-weight: 800; }
.smart-confirm-layer h2 { margin: 12px 0 0; font-size: 16px; }
.smart-confirm-layer p { margin: 7px 0 17px; color: ui.$pon-text-sub; font-size: 11px; line-height: 1.5; }
.smart-confirm-layer section > div { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.smart-confirm-layer section button { @include ui.secondary-button; }
.smart-confirm-layer section button.danger { border-color: ui.$pon-danger; background: ui.$pon-danger; color: #ffffff; }
.smart-vfl-feedback { position: fixed; left: 50%; bottom: 28px; z-index: 110; max-width: 300px; transform: translateX(-50%); padding: 9px 13px; border-radius: 8px; background: rgba(15, 23, 42, 0.94); color: #ffffff; font-size: 11px; text-align: center; }

@media (max-width: 340px) {
  .smart-vfl-page { gap: 16px; padding-inline: 14px; }
  .smart-laser-stage { min-height: 190px; }
  .smart-mode-grid { gap: 7px; }
  .smart-mode-grid button { min-height: 78px; }
}
</style>
