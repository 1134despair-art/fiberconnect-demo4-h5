<template>
  <div class="multi-opm-seek-app app-container">
    <MultiOpmPageShell title="网线寻线" :subtitle="device.name" @back="goHome">
      <template #footer><MultiOpmFunctionNav :device-id="device.id" active="home" /></template>

      <main class="seek-page">
        <section class="seek-hero" :class="status">
          <div class="signal-icon"><i></i><i></i><i></i><i></i></div>
          <strong>{{ statusLabel }}</strong>
          <span>{{ status === 'found' ? '端口信号稳定，可前往现场确认' : '连接网线后开始定位远端端口' }}</span>
        </section>

        <section class="mode-card">
          <header><strong>接线标准</strong><span>{{ standard }}</span></header>
          <div class="segments">
            <button type="button" :class="{ active: standard === 'T568B' }" @click="standard = 'T568B'">T568B</button>
            <button type="button" :class="{ active: standard === 'T568A' }" @click="standard = 'T568A'">T568A</button>
          </div>
        </section>

        <section class="signal-card">
          <div><span>当前信号</span><strong>{{ signalStrength }}%</strong></div>
          <div class="signal-track"><i :style="{ width: `${signalStrength}%` }"></i></div>
          <footer><span>远端端口</span><strong>{{ status === 'found' ? 'LAN-08' : '--' }}</strong></footer>
        </section>

        <button class="primary-button" type="button" @click="toggleSeek">{{ status === 'seeking' ? '停止寻线' : status === 'found' ? '重新寻线' : '开始寻线' }}</button>
        <button class="secondary-button" type="button" @click="router.push(`/device/${device.id}/wiremap`)">进入网线对线</button>
      </main>
    </MultiOpmPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Device } from '@/composables/useAuth'
import MultiOpmFunctionNav from './MultiOpmFunctionNav.vue'
import MultiOpmPageShell from './MultiOpmPageShell.vue'
import type { CableStandard } from './multiOpmWire'

const props = defineProps<{ device: Device }>()
const router = useRouter()
const standard = ref<CableStandard>('T568B')
const status = ref<'idle' | 'seeking' | 'found'>('idle')
const signalStrength = ref(0)
let timer: number | undefined
const statusLabel = computed(() => status.value === 'seeking' ? '正在寻线' : status.value === 'found' ? '已定位端口' : '等待寻线')
const goHome = () => router.replace(`/device/${props.device.id}`)
const stopTimer = () => { if (timer) window.clearInterval(timer); timer = undefined }
const toggleSeek = () => {
  if (status.value === 'seeking') {
    stopTimer()
    status.value = 'idle'
    signalStrength.value = 0
    return
  }
  status.value = 'seeking'
  signalStrength.value = 18
  stopTimer()
  timer = window.setInterval(() => {
    signalStrength.value = Math.min(92, signalStrength.value + 12)
    if (signalStrength.value >= 92) {
      stopTimer()
      status.value = 'found'
    }
  }, 180)
}
onUnmounted(stopTimer)
</script>

<style scoped lang="scss">
@use './multiOpmUi.scss' as ui;

.multi-opm-seek-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$bg; }
.seek-page { @include ui.page-surface; display: flex; flex-direction: column; gap: 12px; padding-bottom: 18px; }
.seek-hero { min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid ui.$border; border-radius: 12px; background: #fff; box-shadow: ui.$shadow; }
.signal-icon { height: 82px; display: flex; align-items: flex-end; gap: 6px; }
.signal-icon i { width: 10px; border-radius: 5px 5px 2px 2px; background: #cbd5e1; }
.signal-icon i:nth-child(1) { height: 22px; }.signal-icon i:nth-child(2) { height: 38px; }.signal-icon i:nth-child(3) { height: 56px; }.signal-icon i:nth-child(4) { height: 74px; }
.seek-hero.seeking .signal-icon i { background: ui.$primary; animation: pulse 1s ease-in-out infinite; }
.seek-hero.seeking .signal-icon i:nth-child(2) { animation-delay: .1s; }.seek-hero.seeking .signal-icon i:nth-child(3) { animation-delay: .2s; }.seek-hero.seeking .signal-icon i:nth-child(4) { animation-delay: .3s; }
.seek-hero.found .signal-icon i { background: ui.$success; }
@keyframes pulse { 50% { opacity: .3; } }
.seek-hero > strong { margin-top: 14px; color: ui.$text; font-size: 18px; }
.seek-hero > span { max-width: 250px; margin-top: 7px; color: ui.$text-sub; font-size: 11px; line-height: 1.5; text-align: center; }
.mode-card, .signal-card { @include ui.card; padding: 12px; }
.mode-card header, .signal-card footer { display: flex; align-items: center; justify-content: space-between; }
.mode-card header strong { font-size: 13px; }.mode-card header span { color: ui.$primary; font-size: 11px; }
.segments { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 10px; padding: 4px; border-radius: 8px; background: #eef2f7; }
.segments button { @include ui.button-reset; min-height: 40px; border-radius: 6px; background: transparent; color: ui.$text-sub; font-size: 11px; font-weight: 700; }
.segments button.active { background: #fff; color: ui.$primary; box-shadow: 0 2px 7px rgba(15,23,42,.08); }
.signal-card > div:first-child { display: flex; align-items: center; justify-content: space-between; color: ui.$text-sub; font-size: 11px; }.signal-card > div strong { color: ui.$primary; font-size: 16px; }
.signal-track { height: 9px; overflow: hidden; margin: 12px 0; border-radius: 5px; background: #dbe3ef; }.signal-track i { display: block; height: 100%; border-radius: inherit; background: ui.$primary; transition: width .16s linear; }
.signal-card footer { padding-top: 10px; border-top: 1px solid ui.$border; color: ui.$text-sub; font-size: 11px; }.signal-card footer strong { color: ui.$text; font-size: 12px; }
.primary-button { @include ui.primary-button; width: 100%; min-height: 48px; }
.secondary-button { @include ui.secondary-button; width: 100%; min-height: 46px; color: ui.$primary; }
</style>
