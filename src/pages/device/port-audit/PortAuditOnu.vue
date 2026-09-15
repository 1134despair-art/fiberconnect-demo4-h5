<template>
  <PortAuditPageShell standalone :title="t('portAudit.onuPageTitle')" :subtitle="device?.name" @back="goHome">
    <div class="onu-page">
      <section v-if="!connected" class="offline"><img :src="bluetoothIcon" alt="" /><h2>{{ t('portAudit.disconnected') }}</h2><p>{{ t('portAudit.connectFirst') }}</p><button type="button" @click="reconnect">{{ t('portAudit.reconnect') }}</button></section>
      <template v-else>
        <section class="onu-screen" :class="state.runtime.onuStatus">
          <header><span>ONU</span><strong>{{ shortStatus }}</strong></header>
          <div class="onu-result"><p>{{ statusText }}</p><strong>{{ mainResult }}</strong><small v-if="state.runtime.onuStatus === 'pass'">{{ t('portAudit.returnLoss') }}</small></div>
          <footer><i></i><span>{{ resultHint }}</span></footer>
        </section>

        <section class="connection-path">
          <div class="node active"><span>OLT</span></div><i></i><div class="node" :class="{ active: state.runtime.onuStatus === 'pass', testing: state.runtime.onuStatus === 'running' }"><span>ONU</span></div>
        </section>

        <section class="result-list">
          <div><span>{{ t('portAudit.onuCondition') }}</span><strong :class="state.runtime.onuStatus">{{ conditionText }}</strong></div>
          <div><span>{{ t('portAudit.returnLoss') }}</span><strong>{{ returnLossText }}</strong></div>
        </section>

        <section class="scenario-panel">
          <header><h2>{{ t('portAudit.onuCondition') }}</h2><span>{{ t('portAudit.onuHint') }}</span></header>
          <div>
            <button type="button" :class="{ active: selectedCondition === 'connected' }" @click="selectedCondition = 'connected'">{{ t('portAudit.onuConnected') }}</button>
            <button type="button" :class="{ active: selectedCondition === 'open' }" @click="selectedCondition = 'open'">{{ t('portAudit.onuOpen') }}</button>
            <button type="button" :class="{ active: selectedCondition === 'abnormal' }" @click="selectedCondition = 'abnormal'">{{ t('portAudit.onuAbnormal') }}</button>
          </div>
        </section>

        <aside class="test-note"><span>{{ testNote }}</span><small v-if="state.persisted.buzzerEnabled">{{ t('portAudit.buzzerOn') }}</small></aside>
        <button class="primary-action" type="button" :disabled="state.runtime.onuStatus === 'running'" @click="runTest">{{ state.runtime.onuStatus === 'idle' ? t('portAudit.startOnu') : t('portAudit.retest') }}</button>
      </template>
    </div>
    <template #footer><PortAuditFunctionNav :device-id="deviceId" active="audit" /></template>
  </PortAuditPageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import PortAuditPageShell from './PortAuditPageShell.vue'
import PortAuditFunctionNav from './PortAuditFunctionNav.vue'
import { usePortAuditDevice } from './usePortAuditDevice'
import { usePortAuditState, type PortAuditOnuCondition } from './usePortAuditState'
import bluetoothIcon from '@/assets/app/icons/connection/bluetooth.png'

const router = useRouter(); const { t } = useI18n(); const { updateDevice } = useAuth()
const { deviceId, device } = usePortAuditDevice(); const state = usePortAuditState(deviceId.value)
const goHome = () => router.push(`/device/${deviceId.value}`)
const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const selectedCondition = ref<PortAuditOnuCondition>('connected')
const shortStatus = computed(() => ({ idle: 'READY', running: 'RUN', pass: 'PASS', fail: 'FAIL', error: 'ERR', disconnected: 'OFF' }[state.runtime.onuStatus]))
const statusText = computed(() => t(`portAudit.${{ idle: 'onuStandby', running: 'onuRunning', pass: 'onuPass', fail: 'onuFail', error: 'onuError', disconnected: 'disconnected' }[state.runtime.onuStatus]}`))
const conditionText = computed(() => t(`portAudit.${state.runtime.onuCondition === 'connected' ? 'onuConnected' : state.runtime.onuCondition === 'open' ? 'onuOpen' : state.runtime.onuCondition === 'abnormal' ? 'onuAbnormal' : 'unknown'}`))
const mainResult = computed(() => state.runtime.onuStatus === 'pass' ? `${state.runtime.onuReturnLossDb.toFixed(2)} dB` : state.runtime.onuStatus === 'running' ? '···' : '--')
const returnLossText = computed(() => state.runtime.onuStatus === 'pass' ? `${state.runtime.onuReturnLossDb.toFixed(2)}dB` : state.runtime.onuStatus === 'fail' || state.runtime.onuStatus === 'error' ? t('portAudit.returnLossUnavailable') : '--')
const resultHint = computed(() => state.runtime.onuStatus === 'pass' ? t('portAudit.onuConnected') : state.runtime.onuStatus === 'running' ? t('portAudit.onuRunning') : t('portAudit.onuStandby'))
const testNote = computed(() => state.runtime.onuStatus === 'pass' ? t('portAudit.onuPassHint') : state.runtime.onuStatus === 'running' ? t('portAudit.onuRunning') : state.runtime.onuStatus === 'fail' ? t('portAudit.onuOpen') : state.runtime.onuStatus === 'error' ? t('portAudit.onuAbnormal') : t('portAudit.onuStandby'))
const runTest = () => state.startOnu(selectedCondition.value)
onBeforeUnmount(() => state.stopOnu())
const reconnect = async () => { await state.reconnectBluetooth(); updateDevice(deviceId.value, { status: 'connected' }) }
</script>

<style scoped lang="scss">
@use './portAuditUi.scss' as ui;
.onu-page { @include ui.page-padding; display: flex; flex-direction: column; gap: 12px }.offline { padding: 70px 20px; text-align: center }.offline img { width: 42px }.offline h2 { margin: 14px 0 5px; font-size: 17px }.offline p { margin: 0; color: ui.$audit-sub; font-size: 11px }.offline button { @include ui.primary-button; width: 100%; margin-top: 20px }
.onu-screen { overflow: hidden; border-radius: 12px; background: ui.$audit-screen; color: #fff; box-shadow: 0 10px 22px rgba(11,15,20,.16) }.onu-screen header { height: 42px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #303743 }.onu-screen header span { font-size: 13px }.onu-screen header strong { color: #94a3b8; font-size: 11px }.onu-result { height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center }.onu-result p { margin: 0; color: #aeb8c7; font-size: 11px }.onu-result strong { margin-top: 10px; color: ui.$audit-amber; font-size: 31px; @include ui.numeric }.onu-result small { margin-top: 5px; color: #94a3b8; font-size: 11px }.onu-screen.pass .onu-result strong, .onu-screen.pass header strong { color: ui.$audit-success }.onu-screen.fail .onu-result strong, .onu-screen.error .onu-result strong, .onu-screen.fail header strong, .onu-screen.error header strong { color: ui.$audit-danger }.onu-screen footer { height: 38px; display: flex; align-items: center; justify-content: center; gap: 7px; background: ui.$audit-screen-soft; color: #aeb8c7; font-size: 11px }.onu-screen footer i { width: 7px; height: 7px; border-radius: 50%; background: #64748b }.onu-screen.pass footer i { background: ui.$audit-success }.onu-screen.running footer i { background: ui.$audit-amber; animation: blink 1s infinite } @keyframes blink { 50% { opacity: .25 } }
.connection-path { display: grid; grid-template-columns: 54px 1fr 54px; align-items: center; padding: 8px 22px }.connection-path > i { height: 3px; background: #cbd5e1 }.node { width: 52px; height: 52px; display: grid; place-items: center; border: 2px solid #cbd5e1; border-radius: 50%; background: #fff; color: ui.$audit-sub; font-size: 11px; font-weight: 800 }.node.active { border-color: ui.$audit-primary; color: ui.$audit-primary; box-shadow: 0 0 0 5px ui.$audit-primary-soft }.node.testing { animation: nodePulse 1s infinite } @keyframes nodePulse { 50% { border-color: ui.$audit-amber; box-shadow: 0 0 0 7px rgba(245,158,11,.12) } }
.result-list { overflow: hidden; border: 1px solid ui.$audit-border; border-radius: 14px; background: #fff }.result-list div { min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 13px; border-bottom: 1px solid ui.$audit-border }.result-list div:last-child { border-bottom: 0 }.result-list span { color: ui.$audit-sub; font-size: 11px }.result-list strong { color: ui.$audit-text; font-size: 11px; text-align: right; @include ui.numeric }.result-list strong.pass { color: ui.$audit-success }.result-list strong.fail, .result-list strong.error { color: ui.$audit-danger }
.scenario-panel { padding: 12px; border: 1px solid ui.$audit-border; border-radius: 12px; background: #fff; }.scenario-panel header { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }.scenario-panel h2 { margin: 0; font-size: 13px; }.scenario-panel header span { color: ui.$audit-sub; font-size: 10px; }.scenario-panel > div { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 7px; margin-top: 10px; }.scenario-panel button { @include ui.reset-button; min-width: 0; min-height: 44px; border: 1px solid ui.$audit-border; border-radius: 9px; background: #fff; color: ui.$audit-sub; font-size: 10px; font-weight: 700; }.scenario-panel button.active { border-color: ui.$audit-primary; background: ui.$audit-primary-soft; color: ui.$audit-primary; }.scenario-panel button:focus-visible { @include ui.focus-ring; }
.test-note { padding: 12px; border: 1px solid #bfdbfe; border-radius: 12px; background: #eff6ff }.test-note span, .test-note small { display: block }.test-note span { color: #1e40af; font-size: 11px; line-height: 1.45 }.test-note small { margin-top: 4px; color: #64748b; font-size: 11px }.primary-action { @include ui.primary-button; width: 100% }
</style>
