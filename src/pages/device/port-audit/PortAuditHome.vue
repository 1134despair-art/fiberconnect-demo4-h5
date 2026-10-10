<template>
  <PortAuditPageShell :title="t('portAudit.deviceSubtitle')" :subtitle="device.name" @back="router.push('/')">
    <template #action>
      <button class="header-tool" :class="{ active: state.persisted.flashlightOn }" type="button" :aria-label="t('portAudit.flashlight')" :aria-pressed="state.persisted.flashlightOn" @click="toggleFlashlight">
        <img :src="flashlightIcon" alt="" />
      </button>
    </template>
    <div class="audit-home">
      <section v-if="!connected" class="offline-state">
        <img :src="bluetoothIcon" alt="" /><div><strong>{{ t('portAudit.disconnected') }}</strong><p>{{ t('portAudit.connectFirst') }}</p></div>
        <button type="button" :disabled="reconnecting" @click="reconnect">{{ reconnecting ? t('portAudit.reconnecting') : t('portAudit.reconnect') }}</button>
      </section>

      <section class="home-meter" aria-label="FID实时状态">
        <header><strong>{{ t('portAudit.fidTitle') }}</strong><span :class="heroStatus.toLowerCase()">{{ heroStatus }}</span></header>
        <div class="meter-mode">FID</div>
        <div class="meter-reading"><strong>{{ connected ? state.runtime.fidIntensity : '--' }}</strong><span>%</span></div>
        <div class="meter-caption">{{ t('portAudit.energyIntensity') }}</div>
        <footer><span>{{ t('portAudit.fiberDirection') }}</span><strong>{{ directionLabel }}</strong></footer>
      </section>

      <section class="parameter-grid" aria-label="核查摘要">
        <button type="button" @click="open('port-fid')"><span>FID</span><strong>{{ heroStatus }}</strong></button>
        <button type="button" @click="open('port-onu')"><span>ONU</span><strong>{{ onuStatusLabel }}</strong></button>
        <button type="button" @click="open('port-rfid')"><span>RFID</span><strong>{{ state.records.value.length }}</strong></button>
      </section>

      <section class="status-rail" :aria-label="t('portAudit.deviceSignals')">
        <div v-for="item in statusItems" :key="item.key"><img :src="item.icon" alt="" /><span>{{ item.label }}</span><strong :class="{ active: item.active }">{{ item.value }}</strong></div>
      </section>

      <section class="audit-section">
        <header><h2>{{ t('portAudit.auditControls') }}</h2></header>
        <div class="instrument-function-grid">
          <button type="button" :aria-label="fidSummary" @click="open('port-fid')"><span class="instrument-tool-icon violet"><img :src="fidIcon" alt="" /></span><strong>{{ t('portAudit.fidTitle') }}</strong></button>
          <button type="button" :aria-label="onuSummary" @click="open('port-onu')"><span class="instrument-tool-icon"><img :src="onuIcon" alt="" /></span><strong>{{ t('portAudit.onuTitle') }}</strong></button>
          <button type="button" :aria-label="rfidSummary" @click="open('port-rfid')"><span class="instrument-tool-icon violet"><img :src="rfidIcon" alt="" /></span><strong>{{ t('portAudit.rfidTitle') }}</strong></button>
        </div>

        <DeviceUtilityControlGrid
          :vfl-title="t('portAudit.vflTitle')"
          :vfl-status="state.persisted.vflMode === 'off' ? t('portAudit.outputOff') : state.persisted.vflMode.toUpperCase()"
          :vfl-active="state.persisted.vflMode !== 'off'"
          :flashlight-title="t('portAudit.flashlight')"
          :flashlight-status="state.persisted.flashlightOn ? t('portAudit.outputOn') : t('portAudit.outputOff')"
          :flashlight-on="state.persisted.flashlightOn"
          @open-vfl="open('port-vfl')"
          @toggle-flashlight="toggleFlashlight"
        />
      </section>
      <div v-if="feedback" class="feedback" role="status">{{ feedback }}</div>
    </div>
    <template #footer><PortAuditFunctionNav :device-id="device.id" active="home" /></template>
  </PortAuditPageShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth, type Device } from '@/composables/useAuth'
import PortAuditPageShell from './PortAuditPageShell.vue'
import PortAuditFunctionNav from './PortAuditFunctionNav.vue'
import { usePortAuditState } from './usePortAuditState'
import fidIcon from '@/assets/icons/iconfont/instrument/fid.svg'
import onuIcon from '@/assets/icons/iconfont/instrument/onu.svg'
import rfidIcon from '@/assets/icons/iconfont/instrument/rfid.svg'
import bluetoothIcon from '@/assets/icons/iconfont/smart-otdr/bluetooth.svg'
import networkIcon from '@/assets/icons/iconfont/smart-otdr/cellular.svg'
import batteryIcon from '@/assets/icons/iconfont/smart-otdr/battery.svg'
import flashlightIcon from '@/assets/icons/iconfont/smart-otdr/flashlight.svg'
import DeviceUtilityControlGrid from '../components/DeviceUtilityControlGrid.vue'

const props = defineProps<{ device: Device }>()
const router = useRouter(); const { t } = useI18n(); const { updateDevice } = useAuth()
const state = usePortAuditState(props.device.id)
const reconnecting = ref(false); const feedback = ref(''); let feedbackTimer: number | undefined
const connected = computed(() => props.device.status === 'connected' && state.persisted.bluetoothEnabled)
const heroStatus = computed(() => state.runtime.fidStatus === 'pass' ? 'PASS' : state.runtime.fidStatus === 'fail' ? 'FAIL' : state.runtime.fidStatus === 'running' ? 'RUN' : 'READY')
const directionLabel = computed(() => state.runtime.fidDirection === 'forward' ? t('portAudit.forward') : state.runtime.fidDirection === 'reverse' ? t('portAudit.reverse') : t('portAudit.unknown'))
const onuStatusLabel = computed(() => state.runtime.onuStatus === 'pass' ? 'PASS' : state.runtime.onuStatus === 'fail' ? 'FAIL' : state.runtime.onuStatus === 'running' ? 'RUN' : 'READY')
const fidSummary = computed(() => state.runtime.fidStatus === 'pass' ? `${t('portAudit.fidPass')} · ${t('portAudit.forward')}` : t('portAudit.fidHint'))
const onuSummary = computed(() => state.runtime.onuStatus === 'pass' ? `${t('portAudit.onuConnected')} · ${state.runtime.onuReturnLossDb.toFixed(2)}dB` : t('portAudit.onuHint'))
const rfidSummary = computed(() => state.records.value.length ? `${state.records.value.length} ${t('portAudit.records')}` : t('portAudit.rfidHint'))
const statusItems = computed(() => [
  { key: 'ble', label: 'BLE', value: connected.value ? t('portAudit.connected') : t('portAudit.disconnected'), active: connected.value, icon: bluetoothIcon },
  { key: '4g', label: '4G', value: state.persisted.cellularEnabled ? t('portAudit.outputOn') : t('portAudit.outputOff'), active: state.persisted.cellularEnabled, icon: networkIcon },
  { key: 'battery', label: t('portAudit.battery'), value: `${props.device.batteryPercent ?? 91}%`, active: true, icon: batteryIcon }
])
const showFeedback = (message: string) => { feedback.value = message; if (feedbackTimer) window.clearTimeout(feedbackTimer); feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1600) }
const reconnect = async () => { reconnecting.value = true; await state.reconnectBluetooth(); updateDevice(props.device.id, { status: 'connected' }); reconnecting.value = false; showFeedback(t('portAudit.connectionRestored')) }
const toggleFlashlight = () => { if (!connected.value) { showFeedback(t('portAudit.connectFirst')); return }; state.persisted.flashlightOn = !state.persisted.flashlightOn; showFeedback(state.persisted.flashlightOn ? t('portAudit.outputOn') : t('portAudit.outputOff')) }
const open = (path: string) => router.push(`/device/${props.device.id}/${path}`)
</script>

<style scoped lang="scss">
@use './portAuditUi.scss' as ui;
.audit-home { @include ui.page-padding; display: flex; flex-direction: column; gap: 12px; }
.header-tool { @include ui.reset-button; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; }
.header-tool img { width: 22px; height: 22px; opacity: .72; }
.header-tool.active { background: ui.$audit-primary-soft; }.header-tool.active img { opacity: 1; }
.offline-state { @include ui.surface; display: grid; grid-template-columns: 38px 1fr auto; gap: 9px; align-items: center; padding: 11px; }.offline-state img { width: 23px; }.offline-state strong { display: block; font-size: 12px; }.offline-state p { margin: 3px 0 0; color: ui.$audit-sub; font-size: 11px; }.offline-state button { @include ui.reset-button; min-height: 42px; padding: 0 11px; border-radius: 10px; background: ui.$audit-primary; color: #fff; font-size: 11px; font-weight: 700; }
.home-meter { overflow: hidden; border: 1px solid #dbe7f5; border-radius: 12px; background: #fff; box-shadow: 0 8px 22px rgba(37,99,235,.08); }
.home-meter > header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #e7eef8; }
.home-meter > header strong { color: #1d4ed8; font-size: 13px; }.home-meter > header span { padding: 4px 8px; border-radius: 10px; background: #eff6ff; color: ui.$audit-primary; font-size:12px; font-weight: 750; }
.home-meter > header span.pass { background: #ecfdf5; color: ui.$audit-success; }.home-meter > header span.fail { background: #fef2f2; color: ui.$audit-danger; }.home-meter > header span.run { background: #fff7ed; color: ui.$audit-amber; }
.meter-mode { padding-top: 14px; color: ui.$audit-primary; font-size: 15px; text-align: center; @include ui.numeric; }
.meter-reading { min-height: 72px; display: grid; grid-template-columns: minmax(72px, auto) 34px; align-items: center; justify-content: center; column-gap: 7px; color: #1d4ed8; }
.meter-reading strong { width: auto; max-width: none; font-size: 45px; line-height: 1; text-align: center; @include ui.numeric; }.meter-reading span { min-width: 34px; color: ui.$audit-text; font-size: 18px; text-align: left; }
.meter-caption { padding-bottom: 14px; color: ui.$audit-text; font-size: 14px; text-align: center; }
.home-meter > footer { min-height: 46px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-top: 1px solid #e7eef8; color: ui.$audit-primary; }
.home-meter > footer span { font-size: 12px; }.home-meter > footer strong { font-size: 13px; @include ui.numeric; }
.parameter-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; }
.parameter-grid button { @include ui.reset-button; min-width: 0; min-height: 66px; padding: 8px 4px; border: 1px solid #e3ebf6; border-radius: 10px; background: #fff; color: ui.$audit-text; box-shadow: 0 2px 8px rgba(15,23,42,.06); }
.parameter-grid span, .parameter-grid strong { display: block; }.parameter-grid span { color: ui.$audit-primary; font-size: 11px; }.parameter-grid strong { margin-top: 5px; overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; @include ui.numeric; }
.parameter-grid button:active { border-color: #93c5fd; background: ui.$audit-primary-soft; }
.status-rail { @include ui.surface; display: grid; grid-template-columns: repeat(3,1fr); overflow: hidden; box-shadow: none; }.status-rail > div { min-width: 0; padding: 10px 5px; border-right: 1px solid ui.$audit-border; text-align: center; }.status-rail > div:last-child { border-right: 0; }.status-rail img { width: 18px; height: 18px; }.status-rail span, .status-rail strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.status-rail span { color: ui.$audit-sub; font-size: 11px; }.status-rail strong { margin-top: 3px; color: ui.$audit-text; font-size: 11px; }.status-rail strong.active { color: ui.$audit-primary; }
.audit-section { display: flex; flex-direction: column; gap: 10px; }.audit-section header h2 { margin: 0; color: ui.$audit-text; font-size: 16px; }.audit-section header p { margin: 4px 0 0; color: ui.$audit-sub; font-size: 11px; }.primary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }.primary-grid button, .quick-grid button { @include ui.reset-button; @include ui.surface; position: relative; min-height: 116px; padding: 12px; text-align: left; }.primary-grid button:active, .wide-entry:active, .quick-grid button:active { transform: scale(.985); border-color: #9fc1f8; }.primary-grid button:focus-visible, .wide-entry:focus-visible, .quick-grid button:focus-visible { @include ui.focus-ring; }.icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; background: ui.$audit-primary-soft; }.icon img { width: 23px; height: 23px; }.primary-grid strong, .quick-grid strong, .wide-entry strong { display: block; color: ui.$audit-text; font-size: 12px; }.primary-grid strong, .quick-grid strong { margin-top: 9px; }.primary-grid small, .quick-grid small, .wide-entry small { display: block; margin-top: 4px; overflow: hidden; color: ui.$audit-sub; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.primary-grid button > i { position: absolute; right: 11px; top: 15px; color: ui.$audit-sub; font-size: 20px; font-style: normal; }
.wide-entry { @include ui.reset-button; @include ui.surface; width: 100%; min-height: 68px; display: grid; grid-template-columns: 42px minmax(0,1fr) 20px; gap: 10px; align-items: center; padding: 11px 12px; text-align: left; }.wide-entry > i { color: ui.$audit-sub; font-size: 22px; font-style: normal; }.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }.quick-grid button.enabled { border-color: #93c5fd; background: #f8fbff; }.mini-switch { position: absolute; right: 11px; bottom: 12px; width: 32px; height: 18px; padding: 2px; border-radius: 9px; background: #cbd5e1; }.mini-switch i { display: block; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform .18s; }.mini-switch.active { background: ui.$audit-primary; }.mini-switch.active i { transform: translateX(14px); }.feedback { position: absolute; left: 50%; bottom: 92px; z-index: 40; transform: translateX(-50%); padding: 9px 13px; border-radius: 9px; background: #17202d; color: #fff; font-size: 11px; white-space: nowrap; }
.primary-grid button { min-height: 96px; }
@media (max-width: 340px) { .meter-reading strong { font-size: 39px; }.parameter-grid { gap: 5px; } }
</style>
