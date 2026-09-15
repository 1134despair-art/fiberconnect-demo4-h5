<template>
  <div class="portable-measure-app app-container">
    <PortableOtdrPageShell title="OTDR测量" :subtitle="device.name" @back="goHome">
      <template #action>
        <button class="header-action" type="button" aria-label="测量设置" @click="settingsOpen = true"><img :src="settingsIcon" alt="" /></button>
      </template>
      <template #footer><PortableOtdrFunctionNav :device-id="device.id" active="measure" /></template>

      <main class="measure-page">
        <section v-if="!isOnline" class="offline-band" role="status"><strong>设备离线</strong><span>连接后可开始OTDR测量</span></section>

        <section class="trace-card" aria-label="OTDR测量曲线">
          <header>
            <strong>链路曲线</strong>
            <span :class="{ measuring: isMeasuring }"><i></i>{{ isMeasuring ? '测量中' : '待测' }}</span>
          </header>
          <div class="trace-meta"><b>{{ wavelength }}</b><b>{{ range }}</b><b>{{ pulseWidth }}</b></div>
          <div class="canvas-wrap"><canvas ref="canvasRef"></canvas><span class="cursor-label">A {{ cursorDistance }}</span></div>
          <div class="trace-scale"><span>0km</span><span>{{ halfRange }}</span><span>{{ range }}</span></div>
          <dl class="result-strip">
            <div><dt>链路长度</dt><dd>{{ hasResult ? '0.742km' : '--' }}</dd></div>
            <div><dt>链路损耗</dt><dd>{{ hasResult ? '3.21dB' : '--' }}</dd></div>
            <div><dt>平均损耗</dt><dd>{{ hasResult ? '0.32dB/km' : '--' }}</dd></div>
          </dl>
        </section>

        <button class="measure-button" :class="{ stop: isMeasuring }" type="button" :disabled="!isOnline" @click="toggleMeasurement">
          {{ isMeasuring ? '停止测量' : '开始测量' }}
        </button>

        <section class="parameter-card" aria-label="测量参数">
          <button type="button" @click="settingsOpen = true"><span>测量波长</span><strong>{{ wavelength }}</strong></button>
          <button type="button" @click="settingsOpen = true"><span>测量范围</span><strong>{{ range }}</strong></button>
          <button type="button" @click="settingsOpen = true"><span>测量脉宽</span><strong>{{ pulseWidth }}</strong></button>
          <button type="button" @click="settingsOpen = true"><span>测量模式</span><strong>{{ mode === 'realtime' ? '实时' : '平均' }}</strong></button>
        </section>

        <section ref="recordsRef" class="records-card">
          <header><strong>测量记录</strong><span>{{ records.length }} 条</span></header>
          <button v-for="record in records" :key="record.name" type="button">
            <span class="record-icon"><img :src="historyIcon" alt="" /></span>
            <span><strong>{{ record.name }}</strong><small>{{ record.time }}</small></span>
            <i>›</i>
          </button>
        </section>
      </main>

      <DeviceSettingDialog :open="settingsOpen" title="测量参数" description="选择本次OTDR测量参数。" confirm-text="应用参数" @close="settingsOpen = false" @confirm="settingsOpen = false">
        <div class="setting-groups">
          <section><strong>测量波长</strong><div class="setting-options"><button v-for="item in wavelengthOptions" :key="item" class="setting-option" :class="{ active: wavelength === item }" @click="wavelength = item">{{ item }}</button></div></section>
          <section><strong>测量范围</strong><div class="option-grid"><button v-for="item in rangeOptions" :key="item" :class="{ active: range === item }" @click="range = item">{{ item }}</button></div></section>
          <section><strong>测量脉宽</strong><div class="option-grid"><button v-for="item in pulseOptions" :key="item" :class="{ active: pulseWidth === item }" @click="pulseWidth = item">{{ item }}</button></div></section>
          <section><strong>测量模式</strong><div class="option-grid two"><button :class="{ active: mode === 'realtime' }" @click="mode = 'realtime'">实时模式</button><button :class="{ active: mode === 'average' }" @click="mode = 'average'">平均模式</button></div></section>
        </div>
      </DeviceSettingDialog>
    </PortableOtdrPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Device } from '@/composables/useAuth'
import DeviceSettingDialog from '../components/DeviceSettingDialog.vue'
import settingsIcon from '@/assets/icons/pon-meter/ui/settings.png'
import historyIcon from '@/assets/icons/pon-meter/ui/history.png'
import PortableOtdrFunctionNav from './PortableOtdrFunctionNav.vue'
import PortableOtdrPageShell from './PortableOtdrPageShell.vue'
import { usePortableOtdrState } from './usePortableOtdrState'

const props = defineProps<{ device: Device }>()
const router = useRouter()
const route = useRoute()
const state = usePortableOtdrState(props.device.id)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const recordsRef = ref<HTMLElement | null>(null)
const settingsOpen = ref(false)
const isMeasuring = ref(false)
const hasResult = ref(true)
const wavelength = ref('1550nm')
const range = ref('20km')
const pulseWidth = ref('100ns')
const mode = ref<'realtime' | 'average'>('realtime')
const wavelengthOptions = ['1550nm']
const rangeOptions = ['0.1km', '0.5km', '1km', '2.5km', '5km', '10km', '20km']
const pulseOptions = ['25ns', '50ns', '100ns', '250ns', '500ns', '1μs']
const records = [
  { name: 'OTDR_20260903_1015.sor', time: '2026-09-03 10:15' },
  { name: 'OTDR_20260902_1642.sor', time: '2026-09-02 16:42' },
  { name: 'OTDR_20260901_0930.sor', time: '2026-09-01 09:30' }
]
let measureTimer: number | undefined
let resizeObserver: ResizeObserver | undefined
const isOnline = computed(() => props.device.status === 'connected' && state.bluetoothEnabled)
const halfRange = computed(() => `${Number.parseFloat(range.value) / 2}km`)
const cursorDistance = computed(() => hasResult.value ? '0.742km' : '0.000km')
const goHome = () => router.replace(`/device/${props.device.id}`)

const drawTrace = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#0b1423'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = 'rgba(148,163,184,.16)'
  ctx.lineWidth = 1
  for (let i = 1; i < 5; i += 1) { const x = width * i / 5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke() }
  for (let i = 1; i < 4; i += 1) { const y = height * i / 4; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke() }
  if (!hasResult.value) return
  const points = [[0,.17],[.11,.2],[.24,.24],[.31,.49],[.35,.52],[.52,.58],[.61,.61],[.66,.45],[.69,.62],[.82,.67],[.9,.69],[.94,.55],[.96,.9],[1,.92]]
  ctx.beginPath()
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 2
  points.forEach(([x, y], index) => index ? ctx.lineTo(x * width, y * height) : ctx.moveTo(x * width, y * height))
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,.78)'
  ctx.setLineDash([3, 4])
  ctx.beginPath(); ctx.moveTo(width * .61, 0); ctx.lineTo(width * .61, height); ctx.stroke(); ctx.setLineDash([])
}
const toggleMeasurement = () => {
  if (isMeasuring.value) {
    isMeasuring.value = false
    if (measureTimer) window.clearTimeout(measureTimer)
    drawTrace()
    return
  }
  isMeasuring.value = true
  hasResult.value = false
  drawTrace()
  measureTimer = window.setTimeout(() => { isMeasuring.value = false; hasResult.value = true; drawTrace() }, mode.value === 'average' ? 2200 : 1200)
}

watch([range, pulseWidth, wavelength], () => nextTick(drawTrace))
onMounted(() => {
  nextTick(() => {
    drawTrace()
    if (canvasRef.value && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(drawTrace)
      resizeObserver.observe(canvasRef.value)
    }
    if (route.query.settings === '1') settingsOpen.value = true
    if (route.query.section === 'records') recordsRef.value?.scrollIntoView({ block: 'start' })
  })
})
onUnmounted(() => { if (measureTimer) window.clearTimeout(measureTimer); resizeObserver?.disconnect() })
</script>

<style scoped lang="scss">
@use './portableOtdrUi.scss' as ui;
@use '../components/deviceSettingsControls.scss';

.portable-measure-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$bg; }
.header-action { @include ui.button-reset; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; background: transparent; }
.header-action img { width: 21px; height: 21px; }
.measure-page { @include ui.page-surface; display: flex; flex-direction: column; gap: 12px; padding-bottom: 18px; }
.offline-band { display: flex; justify-content: space-between; padding: 10px 12px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; color: #9a3412; font-size: 11px; }
.trace-card { @include ui.card; overflow: hidden; }
.trace-card > header { min-height: 42px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; border-bottom: 1px solid ui.$border; }
.trace-card > header strong { color: ui.$primary-dark; font-size: 13px; }
.trace-card > header span { display: flex; align-items: center; gap: 5px; color: ui.$text-sub; font-size: 10px; }
.trace-card > header i { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; }
.trace-card > header span.measuring { color: ui.$primary; }
.trace-card > header span.measuring i { background: ui.$primary; box-shadow: 0 0 0 4px rgba(37,99,235,.12); }
.trace-meta { min-height: 30px; display: flex; align-items: center; gap: 6px; padding: 0 10px; background: ui.$instrument; }
.trace-meta b { padding: 3px 6px; border-radius: 5px; background: ui.$instrument-surface; color: #dbeafe; font-size: 9px; @include ui.metric-number; }
.canvas-wrap { position: relative; height: 182px; background: ui.$instrument; }
.canvas-wrap canvas { width: 100%; height: 100%; display: block; }
.cursor-label { position: absolute; top: 10px; left: 59%; padding: 4px 7px; border-radius: 6px; background: ui.$primary; color: #fff; font-size: 9px; font-weight: 700; }
.trace-scale { height: 24px; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; background: ui.$instrument; color: #93c5fd; font-size: 9px; @include ui.metric-number; }
.result-strip { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid ui.$border; }
.result-strip div { min-width: 0; padding: 9px 3px; border-right: 1px solid ui.$border; text-align: center; }
.result-strip div:last-child { border-right: 0; }
.result-strip dt { color: ui.$text-sub; font-size: 8px; }
.result-strip dd { margin: 4px 0 0; color: ui.$text; font-size: 10px; font-weight: 700; @include ui.metric-number; }
.measure-button { @include ui.primary-button; width: 100%; min-height: 48px; font-size: 14px; }
.measure-button.stop { background: ui.$danger; box-shadow: 0 8px 18px rgba(220,38,38,.18); }
.parameter-card { @include ui.card; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); overflow: hidden; }
.parameter-card button { @include ui.button-reset; min-width: 0; min-height: 60px; padding: 8px; border-right: 1px solid ui.$border; border-bottom: 1px solid ui.$border; background: #fff; }
.parameter-card button:nth-child(2n) { border-right: 0; }
.parameter-card button:nth-last-child(-n+2) { border-bottom: 0; }
.parameter-card span, .parameter-card strong { display: block; }
.parameter-card span { color: ui.$primary; font-size: 10px; }
.parameter-card strong { margin-top: 4px; color: ui.$text; font-size: 12px; @include ui.metric-number; }
.records-card { @include ui.card; overflow: hidden; scroll-margin-top: 12px; }
.records-card > header { min-height: 42px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; border-bottom: 1px solid ui.$border; }
.records-card > header strong { font-size: 13px; }
.records-card > header span { color: ui.$primary; font-size: 10px; }
.records-card > button { @include ui.button-reset; width: 100%; min-height: 58px; display: grid; grid-template-columns: 32px minmax(0,1fr) 18px; align-items: center; gap: 9px; padding: 8px 10px; border-bottom: 1px solid ui.$border; background: #fff; color: ui.$text; text-align: left; }
.records-card > button:last-child { border-bottom: 0; }
.record-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 8px; background: ui.$primary-soft; }
.record-icon img { width: 18px; height: 18px; }
.records-card button span:nth-child(2) { min-width: 0; }
.records-card button strong, .records-card button small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.records-card button strong { font-size: 11px; }
.records-card button small { margin-top: 3px; color: ui.$text-sub; font-size: 9px; }
.records-card button i { color: ui.$text-sub; font-size: 18px; font-style: normal; }
.setting-groups { display: flex; flex-direction: column; gap: 16px; }
.setting-groups section > strong { display: block; margin-bottom: 8px; color: ui.$text; font-size: 12px; }
.option-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
.option-grid.two { grid-template-columns: 1fr 1fr; }
.option-grid button { min-width: 0; min-height: 44px; border: 1px solid ui.$border; border-radius: 8px; background: #fff; color: ui.$text; font-size: 11px; }
.option-grid button.active { border-color: #93c5fd; background: ui.$primary-soft; color: ui.$primary-dark; font-weight: 700; }
</style>

