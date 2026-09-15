<template>
  <DualPonPageShell :title="pageTitle" :subtitle="device?.name" standalone @back="goBack">
    <template #action><span class="standard-badge">{{ state.persisted.cableStandard }}</span></template>
    <template #footer><DualPonFunctionNav :device-id="deviceId" active="home" /></template>
    <div class="cable-page">
      <section v-if="!connected" class="inline-state"><strong>{{ t('dualPon.disconnected') }}</strong><span>{{ t('dualPon.connectFirst') }}</span></section>
      <section class="remote-warning"><span>!</span><p>{{ t('dualPon.remoteWarning') }}</p></section>

      <section class="cable-controls">
        <div class="control-line"><span>{{ t('dualPon.testMode') }}</span><div><button v-for="runMode in runModes" :key="runMode" type="button" :class="{ active: state.persisted.cableRunMode === runMode }" :disabled="state.runtime.cableContinuous" @click="state.persisted.cableRunMode = runMode">{{ runMode === 'single' ? t('dualPon.singleTest') : t('dualPon.continuousTest') }}</button></div></div>
        <template v-if="mode === 'length'">
          <div class="control-line"><span>{{ t('dualPon.cableCategory') }}</span><div><button v-for="category in categories" :key="category" type="button" :class="{ active: state.persisted.cableCategory === category }" @click="state.persisted.cableCategory = category">{{ category === 'cat5e' ? 'CAT5e' : 'CAT6' }}</button></div></div>
          <div class="control-line"><span>{{ t('dualPon.cableUnit') }}</span><div><button v-for="unit in units" :key="unit" type="button" :class="{ active: state.persisted.cableUnit === unit }" @click="state.persisted.cableUnit = unit">{{ unit }}</button></div></div>
          <div class="calibration-line"><div><span>{{ t('dualPon.cableCalibration') }}</span><small>{{ t('dualPon.cableCalibrationHint') }}</small></div><div class="stepper"><button type="button" @click="changeCalibration(-.1)">−</button><strong>{{ state.persisted.cableCalibrationMeters.toFixed(1) }}m</strong><button type="button" @click="changeCalibration(.1)">+</button></div><button class="restore" type="button" @click="restoreCalibration">{{ t('dualPon.restore') }}</button></div>
        </template>
        <div v-if="mode === 'trace'" class="signal-line"><span>{{ t('dualPon.fixedTraceSignal') }}</span><strong>1kHz</strong></div>
      </section>

      <section v-if="mode === 'length'" class="cable-stage">
        <header><span>RJ45 LENGTH</span><strong>{{ statusText }}</strong></header>
        <div class="port-list">
          <div v-for="(length, index) in state.runtime.cableLengths" :key="index"><b>PIN {{ index + 1 }}</b><span class="wire" :class="`wire-${index + 1}`"></span><strong>{{ state.runtime.cableStatus === 'idle' ? '--' : state.calibratedCableLength(length).toFixed(1) }}<small>{{ state.persisted.cableUnit }}</small></strong></div>
        </div>
      </section>

      <section v-else-if="mode === 'wiremap'" class="cable-stage">
        <header><span>RJ45 WIREMAP</span><strong>{{ statusText }}</strong></header>
        <div class="port-list wiremap-list">
          <div v-for="(result, index) in state.runtime.wiremap" :key="index"><b>PIN {{ index + 1 }}</b><span class="wire" :class="[`wire-${index + 1}`, { broken: result !== 'pass' }]"></span><strong :class="result">{{ state.runtime.cableStatus === 'idle' ? '--' : result === 'pass' ? t('dualPon.pass') : result === 'open' ? t('dualPon.openCircuit') : t('dualPon.shortCircuit') }}</strong></div>
        </div>
        <div class="standard-control"><span>{{ t('dualPon.wiringStandard') }}</span><div><button v-for="standard in standards" :key="standard" type="button" :class="{ active: state.persisted.cableStandard === standard }" @click="state.persisted.cableStandard = standard">{{ standard }}</button></div></div>
      </section>

      <section v-else class="cable-stage trace-stage">
        <header><span>RJ45 TRACE</span><strong>{{ statusText }}</strong></header>
        <div class="trace-visual" :class="{ active: state.runtime.cableStatus === 'running' || state.runtime.cableStatus === 'pass' }"><span class="rj45">RJ45</span><i></i><div class="waves"><b></b><b></b><b></b></div></div>
        <div class="trace-port"><span>{{ t('dualPon.tracePort') }}</span><strong>Port {{ state.persisted.selectedTracePort }}</strong></div>
        <div class="port-selector"><button v-for="port in 8" :key="port" type="button" :class="{ active: state.persisted.selectedTracePort === port }" @click="state.persisted.selectedTracePort = port">{{ port }}</button></div>
        <p>{{ t('dualPon.traceInstruction') }}</p>
      </section>

      <section class="action-row">
        <button class="secondary" type="button" :disabled="!canSave" @click="save">{{ t('dualPon.saveResult') }}</button>
        <button class="primary" :class="{ stop: state.runtime.cableContinuous }" type="button" :disabled="!connected || (state.runtime.cableStatus === 'running' && !state.runtime.cableContinuous)" @click="start">{{ state.runtime.cableContinuous ? t('dualPon.stopTest') : state.runtime.cableStatus === 'running' ? t('dualPon.testing') : mode === 'trace' ? t('dualPon.startTrace') : t('dualPon.startTest') }}</button>
      </section>
      <div v-if="feedback" class="feedback" role="status">{{ feedback }}</div>
    </div>
  </DualPonPageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DualPonPageShell from './DualPonPageShell.vue'
import DualPonFunctionNav from './DualPonFunctionNav.vue'
import { useDualPonState, type DualPonCableCategory, type DualPonCableMode, type DualPonCableRunMode, type DualPonCableUnit } from './useDualPonState'
import { useDualPonDevice } from './useDualPonDevice'

const router = useRouter(); const route = useRoute(); const { t } = useI18n(); const { deviceId, device } = useDualPonDevice(); const state = useDualPonState(deviceId.value)
const standards: Array<'T568A' | 'T568B'> = ['T568A', 'T568B']; const feedback = ref('')
const runModes: DualPonCableRunMode[] = ['single', 'continuous']; const categories: DualPonCableCategory[] = ['cat5e', 'cat6']; const units: DualPonCableUnit[] = ['m', 'ft']
const mode = computed<DualPonCableMode>(() => route.name === 'DualPonWiremap' ? 'wiremap' : route.name === 'DualPonTrace' ? 'trace' : 'length')
const pageTitle = computed(() => mode.value === 'length' ? t('dualPon.cableLengthTitle') : mode.value === 'wiremap' ? t('dualPon.wiremapTitle') : t('dualPon.traceTitle'))
const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const statusText = computed(() => state.runtime.cableStatus === 'running' ? 'RUN' : state.runtime.cableStatus === 'pass' ? 'PASS' : state.runtime.cableStatus === 'fail' ? 'FAIL' : state.runtime.cableStatus === 'disconnected' ? 'OFFLINE' : 'READY')
const canSave = computed(() => ['pass', 'fail'].includes(state.runtime.cableStatus))
const start = () => state.runtime.cableContinuous ? state.stopCable() : state.startCableTest(mode.value, state.persisted.cableRunMode)
const changeCalibration = (delta: number) => { state.persisted.cableCalibrationMeters = Math.max(-5, Math.min(5, Number((state.persisted.cableCalibrationMeters + delta).toFixed(1)))) }
const restoreCalibration = () => { state.persisted.cableCalibrationMeters = 0; feedback.value = t('dualPon.calibrationRestored'); window.setTimeout(() => { feedback.value = '' }, 1500) }
const save = () => { state.saveCableRecord(); feedback.value = t('dualPon.saved'); window.setTimeout(() => { feedback.value = '' }, 1500) }
const goBack = () => { state.stopCable(); router.push(`/device/${deviceId.value}`) }
onBeforeUnmount(state.stopCable)
</script>

<style scoped lang="scss">
@use './dualPonUi.scss' as ui;
.standard-badge { padding: 5px 7px; border-radius: 8px; background: ui.$primary-soft; color: ui.$primary; font-size: 11px; font-weight: 750; }.cable-page { @include ui.page-padding; display: flex; flex-direction: column; gap: 12px; }.inline-state { @include ui.surface; padding: 11px 13px; }.inline-state strong,.inline-state span { display: block; }.inline-state strong { color: ui.$danger; font-size: 11px; }.inline-state span { margin-top: 3px; color: ui.$sub; font-size: 11px; }.remote-warning { display: flex; align-items: center; gap: 8px; padding: 9px 11px; border: 1px solid #fde68a; border-radius: 11px; background: #fffbeb; }.remote-warning > span { width: 20px; height: 20px; display: grid; place-items: center; border-radius: 50%; background: ui.$warning; color: #fff; font-weight: 800; }.remote-warning p { margin: 0; color: #92400e; font-size: 11px; line-height: 1.4; }
.cable-stage { overflow: hidden; border-radius: 18px; background: ui.$screen; color: #fff; box-shadow: 0 14px 30px rgba(9,21,38,.16); }.cable-stage > header { display: flex; justify-content: space-between; padding: 13px 14px; border-bottom: 1px solid #24334a; }.cable-stage header span { color: #67e8f9; font-size: 11px; font-weight: 800; }.cable-stage header strong { color: ui.$warning; font-size: 11px; }.port-list { padding: 9px 12px 13px; }.port-list > div { display: grid; grid-template-columns: 47px minmax(0,1fr) 49px; gap: 8px; align-items: center; min-height: 36px; }.port-list b { padding: 5px 4px; border-radius: 4px; background: #109cb9; font-size: 11px; text-align: center; }.port-list .wire { height: 4px; background: #22c55e; }.port-list .wire-1,.port-list .wire-2 { background: repeating-linear-gradient(90deg,#fff 0 9px,#22c55e 9px 18px); }.port-list .wire-3,.port-list .wire-6 { background: repeating-linear-gradient(90deg,#fff 0 9px,#f59e0b 9px 18px); }.port-list .wire-4,.port-list .wire-5 { background: #38bdf8; }.port-list .wire-7,.port-list .wire-8 { background: repeating-linear-gradient(90deg,#fff 0 9px,#8b5cf6 9px 18px); }.port-list .wire.broken { height: 2px; background: repeating-linear-gradient(90deg,#ef4444 0 13px,transparent 13px 20px); }.port-list strong { @include ui.data-number; color: #4ade80; font-size: 11px; text-align: right; }.port-list strong small { margin-left: 2px; color: #9fb1c9; font-size: 11px; }.port-list strong.open,.port-list strong.short { color: #fb7185; }
.standard-control { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-top: 1px solid #24334a; }.standard-control > span { color: #a9bad0; font-size: 11px; }.standard-control > div { display: flex; gap: 5px; }.standard-control button { @include ui.reset-button; min-width: 56px; min-height: 36px; border-radius: 8px; background: #1c2d43; color: #a9bad0; font-size: 11px; }.standard-control button.active { background: ui.$cyan; color: #fff; }
.trace-visual { min-height: 150px; display: grid; grid-template-columns: 70px 1fr 80px; align-items: center; padding: 0 22px; }.rj45 { height: 52px; display: grid; place-items: center; border: 2px solid #46617e; border-radius: 10px; color: #a9bad0; font-size: 11px; font-weight: 800; }.trace-visual > i { height: 3px; background: #38506c; }.waves { position: relative; height: 70px; }.waves b { position: absolute; inset: 10px; border: 2px solid #38506c; border-left: 0; border-radius: 0 50% 50% 0; }.waves b:nth-child(2) { inset: 0; }.waves b:nth-child(3) { inset: -10px; }.trace-visual.active .rj45 { border-color: ui.$cyan; color: #67e8f9; }.trace-visual.active > i { background: ui.$cyan; box-shadow: 0 0 12px ui.$cyan; }.trace-visual.active .waves b { border-color: ui.$cyan; animation: pulse 1.2s infinite; }.trace-visual.active .waves b:nth-child(2) { animation-delay: .2s; }.trace-visual.active .waves b:nth-child(3) { animation-delay: .4s; }@keyframes pulse { 0%,100% { opacity: .25; } 50% { opacity: 1; } }.trace-port { display: flex; justify-content: space-between; padding: 10px 14px; border-top: 1px solid #24334a; }.trace-port span { color: #a9bad0; font-size: 11px; }.trace-port strong { color: #fff; font-size: 11px; }.port-selector { display: grid; grid-template-columns: repeat(8,1fr); gap: 4px; padding: 10px 12px; }.port-selector button { @include ui.reset-button; min-width: 0; min-height: 36px; border-radius: 7px; background: #1c2d43; color: #a9bad0; font-size: 11px; }.port-selector button.active { background: ui.$cyan; color: #fff; }.trace-stage > p { margin: 0; padding: 0 12px 13px; color: #a9bad0; font-size: 11px; text-align: center; }
.action-row { display: grid; grid-template-columns: 1fr 1.6fr; gap: 9px; }.primary { @include ui.primary-button; }.secondary { @include ui.reset-button; min-height: 48px; border: 1px solid ui.$border; border-radius: 13px; background: #fff; color: ui.$primary; font-weight: 700; }.secondary:disabled { color: ui.$disabled; }.feedback { position: fixed; left: 50%; bottom: 28px; z-index: 50; transform: translateX(-50%); padding: 9px 13px; border-radius: 9px; background: #17202d; color: #fff; font-size: 11px; white-space: nowrap; }
.cable-stage { border: 1px solid #dbe7f5; border-radius: 12px; box-shadow: 0 8px 22px rgba(37,99,235,.08); }
.feedback { bottom: 92px; }
.cable-controls { @include ui.surface; overflow: hidden; box-shadow: none; }
.control-line,.signal-line { min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 11px; border-bottom: 1px solid ui.$border; }
.control-line:last-child,.signal-line:last-child { border-bottom: 0; }
.control-line > span,.signal-line > span { color: ui.$sub; font-size: 11px; }
.control-line > div { display: flex; gap: 5px; }
.control-line button { @include ui.reset-button; min-width: 58px; min-height: 38px; padding: 0 8px; border: 1px solid ui.$border; border-radius: 9px; background: #f8fafc; color: ui.$sub; font-size: 10px; font-weight: 700; }
.control-line button.active { border-color: #93c5fd; background: ui.$primary-soft; color: ui.$primary; }
.control-line button:disabled { opacity: .55; }
.signal-line strong { color: ui.$primary; font-size: 12px; }
.calibration-line { display: grid; grid-template-columns: minmax(0,1fr) auto auto; gap: 8px; align-items: center; padding: 9px 11px; }
.calibration-line span,.calibration-line small { display: block; }.calibration-line span { color: ui.$text; font-size: 11px; font-weight: 700; }.calibration-line small { margin-top: 3px; color: ui.$sub; font-size: 9px; }
.stepper { display: flex; align-items: center; gap: 4px; }.stepper button,.calibration-line .restore { @include ui.reset-button; min-width: 38px; min-height: 38px; border-radius: 9px; background: ui.$primary-soft; color: ui.$primary; font-size: 14px; }.stepper strong { @include ui.data-number; min-width: 44px; font-size: 10px; text-align: center; }.calibration-line .restore { padding: 0 6px; background: #f8fafc; font-size: 10px; }
.primary.stop { background: ui.$danger; box-shadow: 0 8px 18px rgba(220,38,38,.2); }
@media (max-width: 340px) { .control-line { align-items: flex-start; flex-direction: column; padding-top: 9px; padding-bottom: 9px; }.calibration-line { grid-template-columns: 1fr auto; }.calibration-line .restore { grid-column: 2; } }
</style>
