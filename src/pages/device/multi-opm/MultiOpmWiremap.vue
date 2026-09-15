<template>
  <div class="multi-opm-wire-app app-container">
    <MultiOpmPageShell title="网线对线" :subtitle="device.name" @back="goHome">
      <template #footer><MultiOpmFunctionNav :device-id="device.id" active="home" /></template>

      <main class="wire-page">
        <section class="mode-card">
          <div><span>接线标准</span><strong>{{ standard }}</strong></div>
          <div class="segments">
            <button type="button" :class="{ active: standard === 'T568B' }" @click="selectStandard('T568B')">T568B</button>
            <button type="button" :class="{ active: standard === 'T568A' }" @click="selectStandard('T568A')">T568A</button>
          </div>
        </section>

        <section class="wire-card" aria-label="RJ45对线结果">
          <header><strong>RJ45 线序</strong><span :class="status">{{ statusLabel }}</span></header>
          <div class="port-row port-row--label"><span>本端</span><i></i><span>远端</span></div>
          <div v-for="pin in 8" :key="pin" class="port-row">
            <b :style="{ borderColor: wireColors[standard][pin - 1] }">{{ pin }}</b>
            <i :class="status" :style="{ '--wire-color': wireColors[standard][pin - 1] }"></i>
            <b :style="{ borderColor: wireColors[standard][pin - 1] }">{{ status === 'ok' ? pin : '--' }}</b>
          </div>
        </section>

        <section class="result-strip">
          <div><span>连通芯数</span><strong>{{ status === 'ok' ? '8 / 8' : '--' }}</strong></div>
          <div><span>测试结果</span><strong :class="status">{{ statusLabel }}</strong></div>
        </section>

        <button class="primary-button" type="button" :disabled="status === 'testing'" @click="startTest">{{ status === 'testing' ? '测试中' : '开始对线' }}</button>
        <button class="secondary-button" type="button" @click="router.push(`/device/${device.id}/seek`)">进入网线寻线</button>
      </main>
    </MultiOpmPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Device } from '@/composables/useAuth'
import MultiOpmFunctionNav from './MultiOpmFunctionNav.vue'
import MultiOpmPageShell from './MultiOpmPageShell.vue'
import { type CableStandard, wireColors, type WireStatus } from './multiOpmWire'

const props = defineProps<{ device: Device }>()
const router = useRouter()
const standard = ref<CableStandard>('T568B')
const status = ref<WireStatus>('idle')
const statusLabel = computed(() => status.value === 'testing' ? '检测中' : status.value === 'ok' ? '连通正常' : '等待测试')
const goHome = () => router.replace(`/device/${props.device.id}`)
const selectStandard = (value: CableStandard) => { standard.value = value; status.value = 'idle' }
const startTest = async () => {
  status.value = 'testing'
  await new Promise(resolve => window.setTimeout(resolve, 900))
  status.value = 'ok'
  sessionStorage.setItem(`multi_opm_wire_result_${props.device.id}_${standard.value}`, JSON.stringify(Object.fromEntries(Array.from({ length: 8 }, (_, index) => [String(index + 1), 'ok']))))
}
</script>

<style scoped lang="scss">
@use './multiOpmUi.scss' as ui;

.multi-opm-wire-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$bg; }
.wire-page { @include ui.page-surface; display: flex; flex-direction: column; gap: 12px; padding-bottom: 18px; }
.mode-card { @include ui.card; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; }
.mode-card span, .mode-card strong { display: block; }
.mode-card span { color: ui.$text-sub; font-size: 10px; }
.mode-card strong { margin-top: 3px; color: ui.$text; font-size: 13px; }
.segments { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding: 4px; border-radius: 8px; background: #eef2f7; }
.segments button { @include ui.button-reset; min-height: 36px; padding: 0 10px; border-radius: 6px; background: transparent; color: ui.$text-sub; font-size: 11px; font-weight: 700; }
.segments button.active { background: #fff; color: ui.$primary; box-shadow: 0 2px 7px rgba(15,23,42,.08); }
.wire-card { @include ui.card; overflow: hidden; }
.wire-card header { min-height: 46px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid ui.$border; }
.wire-card header strong { font-size: 13px; }
.wire-card header span { color: ui.$text-sub; font-size: 10px; }
.wire-card header span.testing { color: ui.$primary; }
.wire-card header span.ok { color: ui.$success; }
.port-row { display: grid; grid-template-columns: 42px 1fr 42px; align-items: center; gap: 8px; padding: 5px 14px; }
.port-row--label { padding-block: 9px 4px; color: ui.$text-sub; font-size: 9px; text-align: center; }
.port-row b { width: 32px; height: 26px; display: grid; place-items: center; justify-self: center; box-sizing: border-box; border: 2px solid ui.$border; border-radius: 6px; background: #fff; color: ui.$text; font-size: 11px; }
.port-row i { height: 4px; border-radius: 2px; background: #dbe3ef; }
.port-row i.testing { background: linear-gradient(90deg, #dbe3ef, ui.$primary, #dbe3ef); background-size: 200% 100%; animation: scan 1s linear infinite; }
.port-row i.ok { background: var(--wire-color); }
@keyframes scan { to { background-position: -200% 0; } }
.result-strip { display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; border: 1px solid ui.$border; border-radius: 10px; background: #fff; }
.result-strip div { padding: 10px; text-align: center; }
.result-strip div + div { border-left: 1px solid ui.$border; }
.result-strip span, .result-strip strong { display: block; }
.result-strip span { color: ui.$text-sub; font-size: 9px; }
.result-strip strong { margin-top: 4px; color: ui.$text; font-size: 12px; }
.result-strip strong.ok { color: ui.$success; }
.primary-button { @include ui.primary-button; width: 100%; min-height: 48px; }
.secondary-button { @include ui.secondary-button; width: 100%; min-height: 46px; color: ui.$primary; }
</style>
