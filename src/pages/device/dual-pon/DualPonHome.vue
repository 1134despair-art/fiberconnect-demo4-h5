<template>
  <DualPonPageShell :title="t('dualPon.deviceSubtitle')" :subtitle="device.name" @back="router.push('/')">
    <template #action>
      <button class="header-tool" :class="{ active: state.persisted.flashlightOn }" type="button" :aria-label="t('deviceDetail.flashlightUtility')" :aria-pressed="state.persisted.flashlightOn" @click="toggleLight">
        <img :src="flashlightIcon" alt="" />
      </button>
    </template>
    <template #footer><DualPonFunctionNav :device-id="device.id" active="home" /></template>
    <div class="dual-home">
      <section v-if="!connected" class="offline-state">
        <img :src="bluetoothIcon" alt="" />
        <div><strong>{{ t('dualPon.disconnected') }}</strong><p>{{ t('dualPon.connectFirst') }}</p></div>
        <button type="button" :disabled="reconnecting" @click="reconnect">{{ reconnecting ? t('dualPon.reconnecting') : t('dualPon.reconnect') }}</button>
      </section>

      <section class="topology-hero" aria-label="ONT to OLT topology">
        <header><strong>{{ t('dualPon.networkTitle') }}</strong><span :class="{ online: state.runtime.linkStatus === 'pass' }">{{ state.runtime.linkStatus === 'pass' ? 'PASS' : 'READY' }}</span></header>
        <div class="topology">
          <div class="endpoint"><span class="endpoint__icon">ONT</span><strong>ONT</strong></div>
          <div class="fiber fiber--left"><i></i><i></i><i></i></div>
          <img :src="deviceImage" :alt="t('dualPon.deviceSubtitle')" />
          <div class="fiber fiber--right"><i></i><i></i><i></i></div>
          <div class="endpoint"><span class="endpoint__icon endpoint__icon--olt">OLT</span><strong>OLT</strong></div>
        </div>
        <footer><span>{{ heroSummary }}</span><button type="button" @click="open('dual-pon-network')">{{ t('dualPon.startTest') }} ›</button></footer>
      </section>

      <section class="status-rail" :aria-label="t('dualPon.deviceStatus')">
        <div><img :src="bluetoothIcon" alt="" /><span>BLE</span><strong :class="{ active: connected }">{{ connected ? t('dualPon.connectedShort') : t('dualPon.off') }}</strong></div>
        <div><img :src="vflIcon" alt="" /><span>VFL</span><strong :class="{ active: state.persisted.vflMode !== 'off' }">{{ state.persisted.vflMode === 'off' ? t('dualPon.off') : state.persisted.vflMode.toUpperCase() }}</strong></div>
        <div><img :src="flashlightIcon" alt="" /><span>LED</span><strong :class="{ active: state.persisted.flashlightOn }">{{ state.persisted.flashlightOn ? t('dualPon.on') : t('dualPon.off') }}</strong></div>
        <div><img :src="batteryIcon" alt="" /><span>{{ t('dualPon.battery') }}</span><strong class="active">{{ device.batteryPercent ?? 89 }}%</strong></div>
      </section>

      <section class="task-section">
        <header><h2>{{ t('dualPon.fieldWork') }}</h2></header>
        <div class="instrument-function-grid">
          <button type="button" @click="open('dual-pon-network')"><span class="instrument-tool-icon"><img :src="networkIcon" alt="" /></span><strong>{{ t('dualPon.networkTitle') }}</strong></button>
          <button type="button" @click="open('dual-pon-power')"><span class="instrument-tool-icon teal"><img :src="powerIcon" alt="" /></span><strong>{{ t('dualPon.powerTitle') }}</strong></button>
          <button type="button" @click="open('dual-pon-records')"><span class="instrument-tool-icon"><img :src="recordsIcon" alt="" /></span><strong>{{ t('dualPon.recordsTitle') }}</strong></button>
          <button type="button" @click="open('dual-pon-cable-length')"><span class="instrument-tool-icon teal"><img :src="lengthIcon" alt="" /></span><strong>{{ t('dualPon.cableLength') }}</strong></button>
          <button type="button" @click="open('dual-pon-wiremap')"><span class="instrument-tool-icon teal"><img :src="wiremapIcon" alt="" /></span><strong>{{ t('dualPon.wiremap') }}</strong></button>
          <button type="button" @click="open('dual-pon-trace')"><span class="instrument-tool-icon teal"><img :src="traceIcon" alt="" /></span><strong>{{ t('dualPon.trace') }}</strong></button>
        </div>
      </section>

      <DeviceUtilityControlGrid
        :vfl-title="t('dualPon.vflTitle')"
        :vfl-status="state.persisted.vflMode === 'off' ? t('dualPon.outputOff') : t('dualPon.outputActive')"
        :vfl-active="state.persisted.vflMode !== 'off'"
        :flashlight-title="t('deviceDetail.flashlightUtility')"
        :flashlight-status="state.persisted.flashlightOn ? t('dualPon.on') : t('dualPon.off')"
        :flashlight-on="state.persisted.flashlightOn"
        @open-vfl="open('dual-pon-vfl')"
        @toggle-flashlight="toggleLight"
      />


      <div v-if="feedback" class="feedback" role="status">{{ feedback }}</div>
    </div>
  </DualPonPageShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth, type Device } from '@/composables/useAuth'
import DualPonPageShell from './DualPonPageShell.vue'
import DualPonFunctionNav from './DualPonFunctionNav.vue'
import { useDualPonState } from './useDualPonState'
import deviceImage from '@/assets/app/products/dual-pon-realistic.jpg'
import bluetoothIcon from '@/assets/icons/iconfont/smart-otdr/bluetooth.svg'
import batteryIcon from '@/assets/icons/iconfont/smart-otdr/battery.svg'
import networkIcon from '@/assets/icons/iconfont/instrument/network.svg'
import powerIcon from '@/assets/icons/iconfont/smart-otdr/power.svg'
import vflIcon from '@/assets/icons/iconfont/smart-otdr/vfl.svg'
import lengthIcon from '@/assets/icons/iconfont/smart-otdr/ruler.svg'
import wiremapIcon from '@/assets/icons/iconfont/smart-otdr/cable.svg'
import traceIcon from '@/assets/icons/iconfont/instrument/radar.svg'
import flashlightIcon from '@/assets/icons/iconfont/smart-otdr/flashlight.svg'
import recordsIcon from '@/assets/icons/iconfont/smart-otdr/records.svg'
import DeviceUtilityControlGrid from '../components/DeviceUtilityControlGrid.vue'

const props = defineProps<{ device: Device }>()
const router = useRouter()
const { t } = useI18n()
const { updateDevice } = useAuth()
const state = useDualPonState(props.device.id)
state.configureCapabilities({ powerRange: props.device.dualPonPowerRange, supportedVflColors: props.device.supportedVflColors })
const reconnecting = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined
const connected = computed(() => props.device.status === 'connected' && state.persisted.bluetoothEnabled)
const heroSummary = computed(() => state.runtime.linkStatus === 'pass' ? t('dualPon.linkOnlineSummary') : state.runtime.linkStatus === 'fail' ? t(`dualPon.linkCase.${state.runtime.linkCase}`) : t('dualPon.heroHint'))
const showFeedback = (message: string) => { feedback.value = message; if (feedbackTimer) window.clearTimeout(feedbackTimer); feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1600) }
const reconnect = async () => { reconnecting.value = true; await state.reconnectBluetooth(); updateDevice(props.device.id, { status: 'connected' }); reconnecting.value = false; showFeedback(t('dualPon.connectionRestored')) }
const toggleLight = () => { if (!connected.value) { showFeedback(t('dualPon.connectFirst')); return }; state.persisted.flashlightOn = !state.persisted.flashlightOn; showFeedback(state.persisted.flashlightOn ? t('dualPon.lightOn') : t('dualPon.lightOff')) }
const open = (path: string) => router.push(`/device/${props.device.id}/${path}`)
</script>

<style scoped lang="scss">
@use './dualPonUi.scss' as ui;
.dual-home { @include ui.page-padding; position: relative; display: flex; flex-direction: column; gap: 12px; }
.connection-dot { width: 13px; height: 13px; border: 2px solid #fff; border-radius: 50%; background: ui.$disabled; box-shadow: 0 0 0 1px ui.$border; }.connection-dot.online { background: ui.$success; }
.offline-state { @include ui.surface; display: grid; grid-template-columns: 34px minmax(0,1fr) auto; gap: 9px; align-items: center; padding: 11px; }.offline-state img { width: 22px; }.offline-state strong { display: block; font-size: 12px; }.offline-state p { margin: 3px 0 0; color: ui.$sub; font-size: 11px; }.offline-state button { @include ui.reset-button; min-height: 44px; padding: 0 10px; border-radius: 10px; background: ui.$primary; color: #fff; font-size: 11px; font-weight: 700; }
.topology-hero { min-height: 190px; overflow: hidden; padding: 14px; border-radius: 18px; background: ui.$screen; color: #fff; box-shadow: 0 14px 30px rgba(9,21,38,.18); }.topology-hero__eyebrow { color: #67e8f9; font-size: 11px; font-weight: 800; }.topology { display: grid; grid-template-columns: 46px 1fr 82px 1fr 46px; align-items: center; margin-top: 10px; }.topology > img { width: 82px; }.endpoint { display: grid; gap: 5px; justify-items: center; }.endpoint__icon { width: 42px; height: 37px; display: grid; place-items: center; border: 1px solid #2dd4bf; border-radius: 8px; background: #0c3140; color: #67e8f9; font-size: 11px; font-weight: 800; }.endpoint__icon--olt { border-color: #38bdf8; background: #0c2840; }.endpoint strong { color: #dbeafe; font-size: 11px; }.fiber { display: grid; gap: 5px; }.fiber i { height: 2px; background: ui.$success; }.fiber i:nth-child(2) { background: ui.$cyan; }.fiber i:nth-child(3) { background: ui.$warning; }.topology-hero > p { margin: 8px 0 0; color: #b9c8dc; font-size: 11px; line-height: 1.45; text-align: center; }
.status-rail { @include ui.surface; display: grid; grid-template-columns: repeat(4,1fr); overflow: hidden; box-shadow: none; }.status-rail > div, .status-rail > button { @include ui.reset-button; min-width: 0; min-height: 62px; padding: 8px 3px; border-right: 1px solid ui.$border; background: #fff; text-align: center; }.status-rail > :last-child { border-right: 0; }.status-rail img { width: 17px; height: 17px; }.status-rail span, .status-rail strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.status-rail span { margin-top: 2px; color: ui.$sub; font-size: 11px; }.status-rail strong { margin-top: 2px; color: ui.$text; font-size: 11px; }.status-rail .active, .status-rail strong.active { color: ui.$primary; }
.task-section, .utility-section { display: flex; flex-direction: column; gap: 9px; }.task-section header h2 { margin: 2px 0 0; color: ui.$text; font-size: 15px; }.task-section header p { margin: 3px 0 0; color: ui.$sub; font-size: 11px; }.network-entry, .wide-entry, .utility-section button { @include ui.reset-button; @include ui.surface; width: 100%; display: grid; grid-template-columns: 43px minmax(0,1fr) 18px; gap: 10px; align-items: center; min-height: 68px; padding: 10px 12px; text-align: left; }.network-entry { min-height: 78px; border-color: #a9c7f7; background: #fbfdff; }.network-entry:active, .wide-entry:active, .tool-grid button:active, .utility-section button:active { transform: scale(.985); }.network-entry:focus-visible, .wide-entry:focus-visible, .tool-grid button:focus-visible, .utility-section button:focus-visible { @include ui.focus-ring; }.entry-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; background: ui.$primary-soft; }.entry-icon img { width: 23px; height: 23px; }.network-entry strong, .wide-entry strong, .tool-grid strong, .utility-section strong { display: block; color: ui.$text; font-size: 11px; }.network-entry small, .wide-entry small, .tool-grid small, .utility-section small { display: block; margin-top: 4px; overflow: hidden; color: ui.$sub; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.network-entry > i, .wide-entry > i, .settings-entry > i { color: ui.$sub; font-size: 20px; font-style: normal; }
.tool-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }.tool-grid button { @include ui.reset-button; @include ui.surface; min-width: 0; min-height: 108px; padding: 10px 8px; text-align: left; }.tool-grid .entry-icon { width: 36px; height: 36px; }.tool-grid strong { margin-top: 9px; }.utility-section { display: flex; flex-direction: column; }.utility-section button { grid-template-columns: 38px minmax(0,1fr) 18px; min-height: 64px; padding: 9px; }.utility-section .entry-icon { width: 36px; height: 36px; }.utility-section .settings-entry { grid-template-columns: 38px minmax(0,1fr) 18px; }
.feedback { position: fixed; left: 50%; bottom: 28px; z-index: 50; transform: translateX(-50%); padding: 9px 13px; border-radius: 9px; background: #17202d; color: #fff; font-size: 11px; white-space: nowrap; }
.header-tool { @include ui.reset-button; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; background: transparent; }
.header-tool img { width: 22px; height: 22px; opacity: .72; }
.header-tool.active { background: ui.$primary-soft; }
.header-tool.active img { opacity: 1; }
.topology-hero { min-height: 0; padding: 0; border: 1px solid #dbe7f5; border-radius: 12px; background: #fff; color: ui.$text; box-shadow: 0 8px 22px rgba(37,99,235,.08); }
.topology-hero > header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #e7eef8; }
.topology-hero > header strong { color: ui.$primary; font-size: 13px; }
.topology-hero > header span { padding: 3px 7px; border-radius: 999px; background: #eef2f7; color: ui.$sub; font-size:12px; font-weight: 800; }
.topology-hero > header span.online { background: #dcfce7; color: #15803d; }
.topology { grid-template-columns: 46px 1fr 76px 1fr 46px; min-height: 112px; margin: 0; padding: 10px 12px; }
.topology > img { width: 76px; }
.endpoint__icon { border-color: #7dd3fc; background: #eff8ff; color: ui.$primary; }
.endpoint__icon--olt { border-color: #67e8f9; background: #ecfeff; color: ui.$cyan; }
.endpoint strong { color: ui.$text; }
.topology-hero > footer { min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 14px; border-top: 1px solid #e7eef8; }
.topology-hero > footer span { min-width: 0; overflow: hidden; color: ui.$sub; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.topology-hero > footer button { @include ui.reset-button; min-height: 44px; padding: 0; background: transparent; color: ui.$primary; font-size: 11px; font-weight: 700; white-space: nowrap; }
.network-entry { min-height: 72px; border-color: #93c5fd; }
.entry-icon { border-radius: 10px; }
.network-entry small, .wide-entry small, .tool-grid small, .utility-section small { font-size:12px; }
.feedback { bottom: 92px; }
@media (max-width: 340px) { .topology { grid-template-columns: 42px 1fr 72px 1fr 42px; }.topology > img { width: 72px; } }
</style>
