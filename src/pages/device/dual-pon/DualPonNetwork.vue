<template>
  <DualPonPageShell :title="t('dualPon.networkTitle')" :subtitle="device?.name" standalone @back="router.push(`/device/${deviceId}`)">
    <template #action><button class="header-action" type="button" @click="showThresholds = !showThresholds">{{ t('dualPon.threshold') }}</button></template>
    <template #footer><DualPonFunctionNav :device-id="deviceId" active="network" /></template>
    <div class="network-page">
      <section v-if="!connected" class="inline-state error"><strong>{{ t('dualPon.disconnected') }}</strong><span>{{ t('dualPon.connectFirst') }}</span></section>
      <section class="network-stage" :class="statusClass">
        <header><span>PON NETWORK STATUS</span><strong>{{ statusText }}</strong></header>
        <div class="link-map">
          <div class="node"><b>ONT</b><small>{{ t('dualPon.userSide') }}</small></div>
          <div class="lines"><i v-for="wavelength in wavelengths" :key="wavelength" :class="{ broken: state.runtime.linkReadings[wavelength] <= -69 }"></i></div>
          <div class="meter"><img :src="deviceImage" alt="" /><strong>DPON</strong></div>
          <div class="lines"><i v-for="wavelength in wavelengths" :key="wavelength"></i></div>
          <div class="node node--olt"><b>OLT</b><small>{{ t('dualPon.officeSide') }}</small></div>
        </div>
        <div class="reading-grid">
          <div v-for="wavelength in wavelengths" :key="wavelength"><span>{{ wavelength }}nm</span><strong>{{ state.runtime.linkStatus === 'idle' ? '--' : state.runtime.linkReadings[wavelength].toFixed(2) }}</strong><small>dBm</small></div>
        </div>
        <div class="result-row"><span>{{ t('dualPon.statusDecision') }}</span><strong>{{ resultText }}</strong></div>
        <div v-if="state.runtime.linkStatus === 'running'" class="progress"><i></i></div>
      </section>

      <section v-if="showThresholds" class="threshold-panel">
        <header><div><h2>{{ t('dualPon.thresholdSettings') }}</h2><p>{{ t('dualPon.thresholdHint') }}</p></div><button type="button" @click="restoreThresholds">{{ t('dualPon.restore') }}</button></header>
        <div class="instrument-matrix-scroll" role="region" :aria-label="t('dualPon.thresholdSettings')" tabindex="0">
          <div class="instrument-matrix">
        <div class="threshold-head"><span>{{ t('dualPon.wavelength') }}</span><span>{{ t('dualPon.reference') }}</span><span>{{ t('dualPon.alarmThreshold') }}</span><span>{{ t('dualPon.lowerThreshold') }}</span></div>
        <div v-for="wavelength in wavelengths" :key="wavelength" class="threshold-row"><strong>{{ wavelength }}nm</strong><label><input v-model.number="state.persisted.thresholds[wavelength].reference" type="number" step="0.1" aria-label="reference" /><span>dBm</span></label><label><input v-model.number="state.persisted.thresholds[wavelength].alarm" type="number" step="0.1" aria-label="alarm" /><span>dBm</span></label><label><input v-model.number="state.persisted.thresholds[wavelength].low" type="number" step="0.1" aria-label="low" /><span>dBm</span></label></div>
          </div>
        </div>
      </section>

      <section class="action-row">
        <button class="secondary" type="button" :disabled="!canSave" @click="save">{{ t('dualPon.saveResult') }}</button>
        <button class="primary" type="button" :disabled="!connected || state.runtime.linkStatus === 'running'" @click="start">{{ state.runtime.linkStatus === 'running' ? t('dualPon.testing') : t('dualPon.startTest') }}</button>
      </section>
      <p class="safety-note">{{ t('dualPon.networkSafety') }}</p>
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
import { DUAL_PON_WAVELENGTHS, useDualPonState, type DualPonLinkCase } from './useDualPonState'
import { useDualPonDevice } from './useDualPonDevice'
import deviceImage from '@/assets/app/products/dual-pon-realistic.jpg'

const router = useRouter(); const route = useRoute(); const { t } = useI18n(); const { deviceId, device } = useDualPonDevice(); const state = useDualPonState(deviceId.value)
const wavelengths = DUAL_PON_WAVELENGTHS
const showThresholds = ref(false); const feedback = ref('')
const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const statusClass = computed(() => `is-${state.runtime.linkStatus}`)
const statusText = computed(() => state.runtime.linkStatus === 'running' ? 'RUN' : state.runtime.linkStatus === 'pass' ? 'PASS' : state.runtime.linkStatus === 'fail' ? 'FAIL' : state.runtime.linkStatus === 'disconnected' ? 'OFFLINE' : 'READY')
const resultText = computed(() => state.runtime.linkStatus === 'idle' ? t('dualPon.waitingTest') : state.runtime.linkStatus === 'running' ? t('dualPon.testing') : state.runtime.linkStatus === 'disconnected' ? t('dualPon.disconnected') : t(`dualPon.linkCase.${state.runtime.linkCase}`))
const canSave = computed(() => ['pass', 'fail'].includes(state.runtime.linkStatus))
const queryCase = computed<DualPonLinkCase>(() => {
  const value = String(route.query.result || '')
  return ['online', 'disconnected', 'terminal_fault', 'high_loss', 'unpowered', 'missing_terminal'].includes(value) ? value as DualPonLinkCase : 'online'
})
const start = () => state.startLinkTest(queryCase.value)
const save = () => { state.saveLinkRecord(); feedback.value = t('dualPon.saved'); window.setTimeout(() => { feedback.value = '' }, 1500) }
const restoreThresholds = () => { state.persisted.thresholds = { 1310: { reference: -35, alarm: -15, low: -28 }, 1490: { reference: -40, alarm: -15, low: -28 }, 1550: { reference: -40, alarm: -15, low: -28 } }; feedback.value = t('dualPon.thresholdRestored') }
onBeforeUnmount(state.stopLink)
</script>

<style scoped lang="scss">
@use './dualPonUi.scss' as ui;
.header-action { @include ui.reset-button; min-width: 44px; min-height: 44px; border-radius: 10px; background: transparent; color: ui.$primary; font-size: 11px; font-weight: 700; }.header-action:focus-visible { @include ui.focus-ring; }
.network-page { @include ui.page-padding; position: relative; display: flex; flex-direction: column; gap: 12px; }.inline-state { @include ui.surface; padding: 11px 13px; }.inline-state strong,.inline-state span { display: block; }.inline-state strong { color: ui.$danger; font-size: 11px; }.inline-state span { margin-top: 3px; color: ui.$sub; font-size: 11px; }
.network-stage { overflow: hidden; border-radius: 18px; background: ui.$screen; color: #fff; box-shadow: 0 14px 30px rgba(9,21,38,.16); }.network-stage > header { display: flex; justify-content: space-between; padding: 13px 14px 11px; border-bottom: 1px solid #24334a; }.network-stage > header span { color: #67e8f9; font-size: 11px; font-weight: 800; }.network-stage > header strong { color: ui.$warning; font-size: 11px; }.network-stage.is-pass > header strong { color: #4ade80; }.network-stage.is-fail > header strong { color: #fb7185; }
.link-map { display: grid; grid-template-columns: 45px 1fr 58px 1fr 45px; align-items: center; padding: 15px 11px 10px; }.node,.meter { display: grid; justify-items: center; gap: 4px; }.node b { width: 42px; height: 36px; display: grid; place-items: center; border: 1px solid #2dd4bf; border-radius: 7px; color: #67e8f9; font-size: 11px; }.node--olt b { border-color: #38bdf8; }.node small,.meter strong { color: #a9bad0; font-size: 11px; }.meter img { width: 55px; }.lines { display: grid; gap: 5px; }.lines i { height: 2px; background: #22c55e; }.lines i:nth-child(2) { background: ui.$cyan; }.lines i:nth-child(3) { background: ui.$warning; }.lines i.broken { background: #ef4444; background-image: linear-gradient(90deg,#ef4444 55%,transparent 55%); background-size: 8px 2px; }
.reading-grid { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid #24334a; border-bottom: 1px solid #24334a; }.reading-grid > div { min-width: 0; padding: 11px 5px; border-right: 1px solid #24334a; text-align: center; }.reading-grid > div:last-child { border-right: 0; }.reading-grid span,.reading-grid small { display: block; color: #9fb1c9; font-size: 11px; }.reading-grid strong { @include ui.data-number; display: inline-block; margin-top: 5px; color: #f59e0b; font-size: 18px; }.reading-grid small { display: inline; margin-left: 2px; }
.result-row { display: flex; justify-content: space-between; align-items: center; min-height: 44px; padding: 0 14px; }.result-row span { color: #a9bad0; font-size: 11px; }.result-row strong { color: #fff; font-size: 11px; }.progress { height: 3px; background: #223249; }.progress i { display: block; width: 42%; height: 100%; background: ui.$cyan; animation: scan 1s infinite ease-in-out; }@keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(340%); } }
.threshold-panel { @include ui.surface; overflow: hidden; }.threshold-panel > header { display: flex; justify-content: space-between; align-items: center; padding: 12px; }.threshold-panel h2 { margin: 0; font-size: 12px; }.threshold-panel p { margin: 3px 0 0; color: ui.$sub; font-size: 11px; }.threshold-panel header button { @include ui.reset-button; min-height: 44px; padding: 0 8px; background: transparent; color: ui.$primary; font-size: 11px; }.threshold-head,.threshold-row { display: grid; grid-template-columns: 64px 1fr 1fr; align-items: center; gap: 6px; padding: 7px 10px; border-top: 1px solid ui.$border; }.threshold-head { color: ui.$sub; font-size: 11px; }.threshold-row strong { font-size: 11px; }.threshold-row label { display: flex; align-items: center; overflow: hidden; border: 1px solid ui.$border; border-radius: 8px; }.threshold-row input { width: 100%; min-width: 0; height: 34px; padding: 0 3px; border: 0; outline: 0; text-align: right; font-size: 11px; }.threshold-row label span { padding-right: 4px; color: ui.$sub; font-size: 11px; }
.action-row { display: grid; grid-template-columns: 1fr 1.6fr; gap: 9px; }.action-row button { min-height: 48px; border-radius: 13px; font-weight: 750; }.primary { @include ui.primary-button; }.secondary { @include ui.reset-button; border: 1px solid ui.$border; background: #fff; color: ui.$primary; }.secondary:disabled { color: ui.$disabled; }.safety-note { margin: -3px 0 0; color: ui.$sub; font-size: 11px; line-height: 1.5; text-align: center; }.feedback { position: fixed; left: 50%; bottom: 28px; z-index: 50; transform: translateX(-50%); padding: 9px 13px; border-radius: 9px; background: #17202d; color: #fff; font-size: 11px; white-space: nowrap; }
.network-stage { border: 1px solid #dbe7f5; border-radius: 12px; background: #fff; color: ui.$text; box-shadow: 0 8px 22px rgba(37,99,235,.08); }
.network-stage > header { min-height: 44px; align-items: center; padding: 0 14px; border-color: #e7eef8; }
.network-stage > header span { color: ui.$primary; }
.network-stage > header strong { color: #b45309; }
.network-stage.is-pass > header strong { color: ui.$success; }
.network-stage.is-fail > header strong { color: ui.$danger; }
.node b { border-color: #7dd3fc; background: #eff8ff; color: ui.$primary; }
.node--olt b { border-color: #67e8f9; background: #ecfeff; color: ui.$cyan; }
.node small,.meter strong { color: ui.$sub; }
.reading-grid { border-color: #e7eef8; }
.reading-grid > div { border-color: #e7eef8; }
.reading-grid span,.reading-grid small { color: ui.$sub; }
.reading-grid strong { color: ui.$primary; }
.result-row span { color: ui.$sub; }
.result-row strong { color: ui.$text; }
.feedback { bottom: 92px; }
.threshold-head,.threshold-row { grid-template-columns: 55px repeat(3,minmax(0,1fr)); gap: 4px; padding-right: 8px; padding-left: 8px; }
.threshold-head { font-size:12px; text-align: center; }
.threshold-row strong { font-size:12px; }
.threshold-row label { min-width: 0; }
.threshold-row input { padding: 0 1px; font-size:12px; }
.threshold-row label span { padding-right: 2px; font-size: 8px; }
</style>
