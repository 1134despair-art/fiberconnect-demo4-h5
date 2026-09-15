<template>
  <PortAuditPageShell standalone :title="t('portAudit.fidPageTitle')" :subtitle="device?.name" @back="goHome">
    <div v-if="loading" class="loading"><i></i><i></i><i></i></div>
    <div v-else class="fid-page">
      <section v-if="!connected" class="offline"><img :src="bluetoothIcon" alt="" /><h2>{{ t('portAudit.disconnected') }}</h2><p>{{ t('portAudit.connectFirst') }}</p><button type="button" @click="reconnect">{{ t('portAudit.reconnect') }}</button></section>
      <template v-else>
        <section class="fid-meter" :class="statusClass">
          <header><strong>{{ t('portAudit.fidTitle') }}</strong><span>{{ shortStatus }}</span></header>
          <div class="fid-meter__mode">FID</div>
          <div class="fid-meter__reading">
            <strong>{{ readingText }}</strong>
          </div>
          <p>{{ statusText }}</p>
          <footer><span>{{ t('portAudit.energyIntensity') }}</span><strong>{{ state.runtime.fidIntensity }}%</strong></footer>
        </section>

        <section class="result-summary" aria-label="FID measurement summary">
          <div><span>{{ t('portAudit.fiberDirection') }}</span><strong>{{ directionText }}</strong></div>
          <div><span>{{ t('portAudit.detectedPower') }}</span><strong>{{ state.runtime.fidStatus === 'idle' ? '--' : `${state.runtime.fidPowerDbm.toFixed(2)}dBm` }}</strong></div>
          <div><span>{{ t('portAudit.energyIntensity') }}</span><strong>{{ state.runtime.fidIntensity }}%</strong></div>
        </section>

        <section class="scenario-panel">
          <header><h2>{{ t('portAudit.fiberDirection') }}</h2><span>{{ t('portAudit.fidHint') }}</span></header>
          <div>
            <button type="button" :class="{ active: selectedScenario === 'forward' }" @click="selectedScenario = 'forward'">{{ t('portAudit.forward') }}</button>
            <button type="button" :class="{ active: selectedScenario === 'reverse' }" @click="selectedScenario = 'reverse'">{{ t('portAudit.reverse') }}</button>
            <button type="button" :class="{ active: selectedScenario === 'no-signal' }" @click="selectedScenario = 'no-signal'">{{ t('portAudit.fidFail') }}</button>
            <button type="button" :class="{ active: selectedScenario === 'error' }" @click="selectedScenario = 'error'">{{ t('portAudit.fidError') }}</button>
          </div>
        </section>

        <button class="primary-action" type="button" :disabled="state.runtime.fidStatus === 'running'" @click="runTest">{{ state.runtime.fidStatus === 'idle' ? t('portAudit.startFid') : t('portAudit.retest') }}</button>

        <section class="signal-section">
          <header><h2>{{ t('portAudit.energyIntensity') }}</h2><strong>{{ state.runtime.fidIntensity }}%</strong></header>
          <div class="energy-meter"><i v-for="index in 10" :key="index" :class="{ active: index * 10 <= state.runtime.fidIntensity }"></i></div>
          <div class="scale"><span>LOW</span><span>ACTIVE FIBER</span><span>HIGH</span></div>
          <p>{{ signalHint }}</p>
        </section>

        <p v-if="state.persisted.buzzerEnabled" class="buzzer-note">{{ t('portAudit.buzzerOn') }}</p>
      </template>
    </div>
    <template #footer><PortAuditFunctionNav :device-id="deviceId" active="audit" /></template>
  </PortAuditPageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import PortAuditPageShell from './PortAuditPageShell.vue'
import PortAuditFunctionNav from './PortAuditFunctionNav.vue'
import { usePortAuditDevice } from './usePortAuditDevice'
import { usePortAuditState, type PortAuditFidScenario } from './usePortAuditState'
import bluetoothIcon from '@/assets/app/icons/connection/bluetooth.png'

const router = useRouter(); const { t } = useI18n(); const { updateDevice } = useAuth()
const { deviceId, device } = usePortAuditDevice(); const state = usePortAuditState(deviceId.value)
const goHome = () => router.push(`/device/${deviceId.value}`)
const loading = ref(true); const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const selectedScenario = ref<PortAuditFidScenario>('forward')
const statusClass = computed(() => state.runtime.fidStatus)
const shortStatus = computed(() => ({ idle: 'READY', running: 'RUN', pass: 'PASS', fail: 'FAIL', error: 'ERR', disconnected: 'OFF' }[state.runtime.fidStatus]))
const statusText = computed(() => t(`portAudit.${{ idle: 'fidStandby', running: 'fidRunning', pass: 'fidPass', fail: 'fidFail', error: 'fidError', disconnected: 'disconnected' }[state.runtime.fidStatus]}`))
const directionText = computed(() => t(`portAudit.${state.runtime.fidDirection === 'forward' ? 'forward' : state.runtime.fidDirection === 'reverse' ? 'reverse' : 'unknown'}`))
const readingText = computed(() => state.runtime.fidStatus === 'running' ? 'RUN' : state.runtime.fidStatus === 'pass' ? directionText.value : state.runtime.fidStatus === 'fail' ? 'FAIL' : state.runtime.fidStatus === 'error' ? 'ERR' : 'READY')
const signalHint = computed(() => state.runtime.fidStatus === 'pass' ? t('portAudit.fidPassHint') : state.runtime.fidStatus === 'running' ? t('portAudit.fidRunHint') : state.runtime.fidStatus === 'fail' ? t('portAudit.fidFail') : state.runtime.fidStatus === 'error' ? t('portAudit.fidError') : t('portAudit.fidStandby'))
const runTest = () => state.startFid(selectedScenario.value)
onMounted(() => window.setTimeout(() => { loading.value = false }, 280)); onBeforeUnmount(() => state.stopFid())
const reconnect = async () => { await state.reconnectBluetooth(); updateDevice(deviceId.value, { status: 'connected' }) }
</script>

<style scoped lang="scss">
@use './portAuditUi.scss' as ui;
.fid-page { @include ui.page-padding; display: flex; flex-direction: column; gap: 12px; }.loading { height: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; }.loading i { width: 7px; height: 7px; border-radius: 50%; background: ui.$audit-primary; animation: pulse 1s infinite; }.loading i:nth-child(2) { animation-delay: .12s }.loading i:nth-child(3) { animation-delay: .24s } @keyframes pulse { 50% { opacity: .3; transform: translateY(-4px) } }
.offline { padding: 70px 20px; text-align: center; }.offline img { width: 42px }.offline h2 { margin: 14px 0 5px; font-size: 17px }.offline p { margin: 0; color: ui.$audit-sub; font-size: 11px }.offline button { @include ui.primary-button; width: 100%; margin-top: 20px; }
.fid-meter { overflow: hidden; border: 1px solid #dbe7f5; border-radius: 12px; background: #fff; box-shadow: 0 8px 22px rgba(37,99,235,.08); }
.fid-meter header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #e7eef8; }
.fid-meter header strong { color: #1d4ed8; font-size: 13px; }.fid-meter header span { padding: 4px 8px; border-radius: 10px; background: ui.$audit-primary-soft; color: ui.$audit-primary; font-size: 10px; font-weight: 750; }
.fid-meter.pass header span { background: #ecfdf5; color: ui.$audit-success; }.fid-meter.fail header span, .fid-meter.error header span { background: #fef2f2; color: ui.$audit-danger; }.fid-meter.running header span { background: #fff7ed; color: ui.$audit-amber; }
.fid-meter__mode { padding-top: 17px; color: ui.$audit-primary; font-size: 15px; text-align: center; @include ui.numeric; }
.fid-meter__reading { min-height: 82px; display: grid; place-items: center; padding: 0 12px; }.fid-meter__reading strong { max-width: 100%; overflow: hidden; color: #1d4ed8; font-size: 42px; line-height: 1; text-overflow: ellipsis; white-space: nowrap; @include ui.numeric; }
.fid-meter.pass .fid-meter__reading strong { color: ui.$audit-success; }.fid-meter.fail .fid-meter__reading strong, .fid-meter.error .fid-meter__reading strong { color: ui.$audit-danger; }.fid-meter.running .fid-meter__reading strong { color: ui.$audit-amber; }
.fid-meter > p { margin: -5px 0 15px; color: ui.$audit-sub; font-size: 11px; text-align: center; }.fid-meter footer { min-height: 45px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-top: 1px solid #e7eef8; color: ui.$audit-primary; }.fid-meter footer span { font-size: 11px; }.fid-meter footer strong { font-size: 13px; @include ui.numeric; }
.result-summary { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); overflow: hidden; border: 1px solid ui.$audit-border; border-radius: 10px; background: #fff; }.result-summary div { min-width: 0; padding: 10px 4px; text-align: center; }.result-summary div + div { border-left: 1px solid ui.$audit-border }.result-summary span, .result-summary strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.result-summary span { color: ui.$audit-sub; font-size: 9px }.result-summary strong { margin-top: 4px; color: ui.$audit-text; font-size: 11px; @include ui.numeric; }
.scenario-panel { padding: 12px; border: 1px solid ui.$audit-border; border-radius: 12px; background: #fff; }.scenario-panel header { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }.scenario-panel h2 { margin: 0; font-size: 13px; }.scenario-panel header span { color: ui.$audit-sub; font-size: 10px; }.scenario-panel > div { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 6px; margin-top: 10px; }.scenario-panel button { @include ui.reset-button; min-width: 0; min-height: 44px; border: 1px solid ui.$audit-border; border-radius: 9px; background: #fff; color: ui.$audit-sub; font-size: 10px; font-weight: 700; }.scenario-panel button.active { border-color: ui.$audit-primary; background: ui.$audit-primary-soft; color: ui.$audit-primary; }.scenario-panel button:focus-visible { @include ui.focus-ring; }
.signal-section { padding: 13px; border: 1px solid ui.$audit-border; border-radius: 12px; background: #fff; }.signal-section header { display: flex; justify-content: space-between; align-items: center; }.signal-section h2 { margin: 0; font-size: 13px }.signal-section header strong { @include ui.numeric; color: ui.$audit-primary; font-size: 13px }.energy-meter { display: grid; grid-template-columns: repeat(10,1fr); gap: 4px; margin-top: 11px; }.energy-meter i { height: 26px; border-radius: 3px; background: #dce3ec }.energy-meter i.active { background: ui.$audit-primary }.scale { display: flex; justify-content: space-between; margin-top: 6px; color: ui.$audit-sub; font-size: 9px }.signal-section > p { margin: 12px 0 0; padding-top: 11px; border-top: 1px solid #e7eef8; color: ui.$audit-sub; font-size: 11px; line-height: 1.5; text-align: center; }
.buzzer-note { margin: -4px 0 0; color: ui.$audit-sub; font-size: 11px; text-align: center }.primary-action { @include ui.primary-button; width: 100%; }
</style>
