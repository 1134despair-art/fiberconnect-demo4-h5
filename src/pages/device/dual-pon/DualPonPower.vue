<template>
  <DualPonPageShell :title="t('dualPon.powerTitle')" :subtitle="device?.name" standalone @back="goBack">
    <template #action><button class="icon-action" type="button" :aria-label="t('dualPon.recordsTitle')" @click="router.push(`/device/${deviceId}/dual-pon-records`)"><img :src="recordsIcon" alt="" /></button></template>
    <template #footer><DualPonFunctionNav :device-id="deviceId" active="power" /></template>
    <div class="power-page">
      <section v-if="!connected" class="inline-state"><strong>{{ t('dualPon.disconnected') }}</strong><span>{{ t('dualPon.connectFirst') }}</span></section>
      <div class="mode-control" role="tablist" :aria-label="t('dualPon.measureMode')">
        <button v-for="mode in modes" :key="mode" type="button" role="tab" :aria-selected="state.persisted.powerMode === mode" :class="{ active: state.persisted.powerMode === mode }" @click="state.persisted.powerMode = mode">{{ mode === 'pon' ? t('dualPon.ponPower') : t('dualPon.opmPower') }}</button>
      </div>

      <section v-if="state.persisted.powerMode === 'pon'" class="power-stage pon-stage">
        <header><div><span>PON</span><small>{{ statusLabel }}</small></div><strong>{{ powerRangeLabel }}</strong></header>
        <div v-for="wavelength in ponWavelengths" :key="wavelength" class="pon-channel">
          <div class="pon-channel__label"><strong>{{ wavelength }}nm</strong><span>{{ channelRole(wavelength) }}</span></div>
          <div class="pon-channel__value"><strong>{{ displayPon(wavelength).value }}</strong><span>{{ displayPon(wavelength).unit }}</span><b :class="`is-${channelStatus(wavelength)}`">{{ channelStatusLabel(wavelength) }}</b></div>
        </div>
      </section>

      <section v-if="state.persisted.powerMode === 'pon'" class="control-section threshold-matrix">
        <header><div><h2>{{ t('dualPon.channelParameters') }}</h2></div><button type="button" @click="restoreThresholds">{{ t('dualPon.restore') }}</button></header>
        <div class="instrument-matrix-scroll" role="region" :aria-label="t('dualPon.channelParameters')" tabindex="0">
          <div class="instrument-matrix">
        <div class="matrix-row matrix-head"><span>{{ t('dualPon.wavelength') }}</span><span>{{ t('dualPon.reference') }}</span><span>{{ t('dualPon.alarmThreshold') }}</span><span>{{ t('dualPon.lowerThreshold') }}</span></div>
        <div v-for="wavelength in ponWavelengths" :key="`threshold-${wavelength}`" class="matrix-row">
          <strong>{{ wavelength }}nm</strong>
          <label><input v-model.number="state.persisted.thresholds[wavelength].reference" type="number" step="0.1" /><span>dBm</span></label>
          <label><input v-model.number="state.persisted.thresholds[wavelength].alarm" type="number" step="0.1" /><span>dBm</span></label>
          <label><input v-model.number="state.persisted.thresholds[wavelength].low" type="number" step="0.1" /><span>dBm</span></label>
        </div>
          </div>
        </div>
      </section>

      <template v-else>
        <section class="power-stage opm-stage">
          <header><div><span>OPM</span><small>{{ statusLabel }}</small></div><strong>{{ frequencyLabel }}</strong></header>
          <div class="opm-value"><strong>{{ opmDisplay.value }}</strong><span>{{ opmDisplay.unit }}</span></div>
          <div class="opm-meta"><div><span>{{ t('dualPon.relativePower') }}</span><strong>{{ relativeDb.toFixed(2) }} dB</strong></div><div><span>{{ t('dualPon.linearPower') }}</span><strong>{{ linearUw }} uW</strong></div></div>
        </section>

        <section class="control-section">
          <header><h2>{{ t('dualPon.wavelength') }}</h2><span>{{ state.persisted.selectedOpmWavelength }}nm</span></header>
          <div class="wavelength-grid">
            <button v-for="wavelength in opmWavelengths" :key="wavelength" type="button" :class="{ active: state.persisted.selectedOpmWavelength === wavelength }" @click="state.persisted.selectedOpmWavelength = wavelength">{{ wavelength }}</button>
          </div>
        </section>

        <section class="control-section compact">
          <header><h2>{{ t('dualPon.displayUnit') }}</h2></header>
          <div class="unit-control"><button v-for="unit in units" :key="unit" type="button" :class="{ active: state.persisted.powerUnit === unit }" @click="state.persisted.powerUnit = unit">{{ unit }}</button></div>
          <div class="reference-row"><div><span>{{ t('dualPon.reference') }}</span><strong>{{ state.persisted.referenceDbm.toFixed(2) }} dBm</strong></div><div class="reference-actions"><button type="button" @click="setReference">{{ t('dualPon.setCurrentReference') }}</button><button type="button" @click="clearReference">{{ t('dualPon.referenceClear') }}</button></div></div>
        </section>

        <section class="control-section calibration">
          <button class="section-toggle" type="button" @click="showCalibration = !showCalibration"><span><strong>{{ t('dualPon.manualCalibration') }}</strong></span><i>{{ showCalibration ? '−' : '+' }}</i></button>
          <div v-if="showCalibration" class="calibration-body">
            <div class="calibration-value"><button type="button" @click="changeCalibration(-.05)">−</button><strong>{{ calibrationOffset.toFixed(2) }} <span>dB</span></strong><button type="button" @click="changeCalibration(.05)">+</button></div>
            <button class="reset-link" type="button" @click="resetCalibration">{{ t('dualPon.resetWavelength') }}</button>
          </div>
        </section>
      </template>

      <section class="action-row">
        <button class="secondary" type="button" :disabled="state.runtime.powerStatus !== 'running'" @click="save">{{ t('dualPon.saveReading') }}</button>
        <button class="primary" type="button" :disabled="!connected" @click="toggleMeasure">{{ state.runtime.powerStatus === 'running' ? t('dualPon.stopMeasure') : t('dualPon.startMeasure') }}</button>
      </section>
      <p class="measure-note">{{ t('dualPon.accuracyNote') }}</p>
      <div v-if="feedback" class="feedback" role="status">{{ feedback }}</div>
    </div>
  </DualPonPageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DualPonPageShell from './DualPonPageShell.vue'
import DualPonFunctionNav from './DualPonFunctionNav.vue'
import { DUAL_PON_OPM_WAVELENGTHS, DUAL_PON_WAVELENGTHS, useDualPonState, type DualPonOpmWavelength, type DualPonPowerMode, type DualPonPowerUnit, type DualPonWavelength } from './useDualPonState'
import { useDualPonDevice } from './useDualPonDevice'
import recordsIcon from '@/assets/icons/iconfont/smart-otdr/records.svg'

const router = useRouter(); const { t } = useI18n(); const { deviceId, device } = useDualPonDevice(); const state = useDualPonState(deviceId.value)
const modes: DualPonPowerMode[] = ['pon', 'opm']; const units: DualPonPowerUnit[] = ['dBm', 'mW', 'uW']; const ponWavelengths = DUAL_PON_WAVELENGTHS; const opmWavelengths = DUAL_PON_OPM_WAVELENGTHS
const showCalibration = ref(false); const feedback = ref('')
watchEffect(() => state.configureCapabilities({ powerRange: device.value?.dualPonPowerRange, supportedVflColors: device.value?.supportedVflColors }))
const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const powerRangeLabel = computed(() => { const bounds = state.powerBounds(); return `${bounds.min} ~ +${bounds.max} dBm` })
const statusLabel = computed(() => state.runtime.powerStatus === 'running' ? t('dualPon.live') : state.runtime.powerStatus === 'disconnected' ? t('dualPon.disconnected') : t('dualPon.paused'))
const frequencyLabel = computed(() => state.runtime.frequencyHz >= 1000 ? `${state.runtime.frequencyHz / 1000}kHz` : `${state.runtime.frequencyHz}Hz`)
const opmDisplay = computed(() => state.convertPower(state.runtime.opmDbm))
const relativeDb = computed(() => state.runtime.opmDbm - state.persisted.referenceDbm)
const linearUw = computed(() => (10 ** (state.runtime.opmDbm / 10) * 1000).toFixed(3))
const calibrationOffset = computed(() => Number(state.persisted.calibrationOffsets[String(state.persisted.selectedOpmWavelength)] || 0))
const displayPon = (wavelength: DualPonWavelength) => state.convertPower(state.runtime.ponReadings[wavelength], 'dBm')
const channelRole = (wavelength: DualPonWavelength) => wavelength === 1310 ? t('dualPon.uplinkChannel') : wavelength === 1490 ? t('dualPon.downlinkChannel') : t('dualPon.videoChannel')
const channelStatus = (wavelength: DualPonWavelength) => state.getPonChannelStatus(wavelength)
const channelStatusLabel = (wavelength: DualPonWavelength) => t(`dualPon.channelStatus.${channelStatus(wavelength)}`)
const toggleMeasure = () => state.runtime.powerStatus === 'running' ? state.stopPower() : state.startPower()
const setReference = () => { state.setReference(); showFeedback(t('dualPon.referenceSaved')) }
const clearReference = () => { state.clearReference(); showFeedback(t('dualPon.referenceCleared')) }
const restoreThresholds = () => {
  state.persisted.thresholds = { 1310: { reference: -35, alarm: -15, low: -28 }, 1490: { reference: -40, alarm: -15, low: -28 }, 1550: { reference: -40, alarm: -15, low: -28 } }
  showFeedback(t('dualPon.thresholdRestored'))
}
const changeCalibration = (delta: number) => state.setCalibration(state.persisted.selectedOpmWavelength, calibrationOffset.value + delta)
const resetCalibration = () => state.setCalibration(state.persisted.selectedOpmWavelength as DualPonOpmWavelength, 0)
const save = () => { state.savePowerRecord(); showFeedback(t('dualPon.saved')) }
const showFeedback = (message: string) => { feedback.value = message; window.setTimeout(() => { feedback.value = '' }, 1500) }
const goBack = () => { state.stopPower(); router.push(`/device/${deviceId.value}`) }
onMounted(() => { if (connected.value) state.startPower() })
onBeforeUnmount(state.stopPower)
</script>

<style scoped lang="scss">
@use './dualPonUi.scss' as ui;
.icon-action { @include ui.reset-button; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 11px; background: transparent; }.icon-action img { width: 22px; }.icon-action:focus-visible { @include ui.focus-ring; }
.power-page { @include ui.page-padding; position: relative; display: flex; flex-direction: column; gap: 12px; }.inline-state { @include ui.surface; padding: 11px 13px; }.inline-state strong,.inline-state span { display: block; }.inline-state strong { color: ui.$danger; font-size: 11px; }.inline-state span { margin-top: 3px; color: ui.$sub; font-size: 11px; }
.mode-control { display: grid; grid-template-columns: 1fr 1fr; padding: 4px; border: 1px solid ui.$border; border-radius: 13px; background: #eaf0f7; }.mode-control button,.unit-control button { @include ui.reset-button; min-height: 42px; border-radius: 10px; background: transparent; color: ui.$sub; font-size: 11px; font-weight: 700; }.mode-control button.active,.unit-control button.active { background: #fff; color: ui.$primary; box-shadow: 0 3px 10px rgba(32,50,78,.09); }.mode-control button:focus-visible,.unit-control button:focus-visible { @include ui.focus-ring; }
.power-stage { overflow: hidden; border-radius: 18px; background: ui.$screen; color: #fff; box-shadow: 0 14px 30px rgba(9,21,38,.15); }.power-stage > header { display: flex; justify-content: space-between; align-items: center; min-height: 44px; padding: 0 14px; border-bottom: 1px solid #24334a; }.power-stage > header > div { display: flex; align-items: center; gap: 7px; }.power-stage header span { color: #fff; font-size: 11px; font-weight: 800; }.power-stage header small { padding: 3px 6px; border-radius: 8px; background: #25364d; color: #bcd0e9; font-size: 11px; }.power-stage header > strong { color: #b9c8dc; font-size: 11px; }
.pon-channel { display: grid; grid-template-columns: 1fr 1.5fr; min-height: 82px; border-bottom: 1px solid #24334a; }.pon-channel:last-child { border-bottom: 0; }.pon-channel__label { display: flex; flex-direction: column; justify-content: center; padding: 0 14px; background: #0c7994; }.pon-channel__label strong { font-size: 12px; }.pon-channel__label span { margin-top: 5px; color: #d7f7ff; font-size: 11px; }.pon-channel__value { display: flex; align-items: baseline; justify-content: flex-end; gap: 4px; padding: 0 16px 0 8px; }.pon-channel__value strong,.opm-value strong { @include ui.data-number; color: ui.$warning; font-size: 31px; }.pon-channel__value span,.opm-value span { font-size: 11px; }
.opm-value { min-height: 112px; display: flex; align-items: center; justify-content: center; gap: 5px; }.opm-value strong { font-size: 38px; }.opm-meta { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #24334a; }.opm-meta > div { padding: 10px 12px; border-right: 1px solid #24334a; }.opm-meta > div:last-child { border-right: 0; }.opm-meta span,.opm-meta strong { display: block; }.opm-meta span { color: #9fb1c9; font-size: 11px; }.opm-meta strong { @include ui.data-number; margin-top: 4px; font-size: 11px; }
.control-section { @include ui.surface; overflow: hidden; padding: 12px; box-shadow: none; }.control-section > header { display: flex; justify-content: space-between; align-items: center; }.control-section h2 { margin: 0; font-size: 11px; }.control-section header > span { color: ui.$primary; font-size: 11px; font-weight: 750; }.wavelength-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 6px; margin-top: 10px; }.wavelength-grid button { @include ui.reset-button; min-width: 0; min-height: 38px; padding: 0 2px; border: 1px solid ui.$border; border-radius: 9px; background: #f8fafc; color: ui.$sub; font-size: 11px; }.wavelength-grid button.active { border-color: ui.$primary; background: ui.$primary; color: #fff; }.wavelength-grid button:focus-visible { @include ui.focus-ring; }.unit-control { display: grid; grid-template-columns: repeat(3,1fr); gap: 5px; margin-top: 9px; padding: 3px; border-radius: 11px; background: #edf2f8; }.unit-control button { min-height: 38px; }.reference-row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid ui.$border; }.reference-row span,.reference-row strong { display: block; }.reference-row span { color: ui.$sub; font-size: 11px; }.reference-row strong { @include ui.data-number; margin-top: 3px; font-size: 11px; }.reference-row button,.reset-link { @include ui.reset-button; min-height: 44px; padding: 0 9px; border-radius: 9px; background: ui.$primary-soft; color: ui.$primary; font-size: 11px; font-weight: 700; }
.calibration { padding: 0; }.section-toggle { @include ui.reset-button; width: 100%; min-height: 62px; display: flex; justify-content: space-between; align-items: center; padding: 0 12px; background: #fff; text-align: left; }.section-toggle strong,.section-toggle small { display: block; }.section-toggle strong { color: ui.$text; font-size: 11px; }.section-toggle small { margin-top: 3px; color: ui.$sub; font-size: 11px; }.section-toggle i { color: ui.$primary; font-size: 18px; font-style: normal; }.calibration-body { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px 12px; border-top: 1px solid ui.$border; }.calibration-value { display: flex; align-items: center; gap: 10px; }.calibration-value button { @include ui.reset-button; width: 40px; height: 40px; border-radius: 10px; background: ui.$primary-soft; color: ui.$primary; font-size: 18px; }.calibration-value strong { @include ui.data-number; min-width: 66px; text-align: center; }.calibration-value strong span { color: ui.$sub; font-size: 11px; }.reset-link { background: transparent; }
.action-row { display: grid; grid-template-columns: 1fr 1.55fr; gap: 9px; }.primary { @include ui.primary-button; }.secondary { @include ui.reset-button; min-height: 48px; border: 1px solid ui.$border; border-radius: 13px; background: #fff; color: ui.$primary; font-weight: 700; }.secondary:disabled { color: ui.$disabled; }.measure-note { margin: -4px 0 0; color: ui.$sub; font-size: 11px; text-align: center; }.feedback { position: fixed; left: 50%; bottom: 28px; z-index: 50; transform: translateX(-50%); padding: 9px 13px; border-radius: 9px; background: #17202d; color: #fff; font-size: 11px; white-space: nowrap; }
.power-stage { border: 1px solid #dbe7f5; border-radius: 12px; background: #fff; color: ui.$text; box-shadow: 0 8px 22px rgba(37,99,235,.08); }
.power-stage > header { border-color: #e7eef8; }
.power-stage header span { color: ui.$primary; }
.power-stage header small { background: ui.$primary-soft; color: ui.$primary; }
.power-stage header > strong { color: ui.$sub; }
.pon-channel { border-color: #e7eef8; }
.pon-channel__label { background: #f3f8ff; }
.pon-channel__label strong { color: ui.$primary; }
.pon-channel__label span { color: ui.$sub; }
.pon-channel__value strong,.opm-value strong { color: #1d4ed8; }
.pon-channel__value span,.opm-value span { color: ui.$text; }
.opm-meta { border-color: #e7eef8; }
.opm-meta > div { border-color: #e7eef8; }
.opm-meta span { color: ui.$sub; }
.feedback { bottom: 92px; }
.pon-channel__value { display: grid; grid-template-columns: minmax(0,1fr) auto auto; align-items: baseline; gap: 4px; padding: 0 12px 0 8px; }
.pon-channel__value strong { text-align: right; }
.pon-channel__value b { align-self: center; min-width: 38px; padding: 4px 5px; border-radius: 999px; background: #dcfce7; color: #15803d; font-size:12px; text-align: center; }
.pon-channel__value b.is-low,.pon-channel__value b.is-high,.pon-channel__value b.is-fall { background: #fee2e2; color: #b91c1c; }
.control-section header small { display: block; margin-top: 3px; color: ui.$sub; font-size:12px; }
.control-section header > button { @include ui.reset-button; min-height: 44px; padding: 0 4px; color: ui.$primary; font-size: 11px; font-weight: 700; }
.reference-actions { display: flex; gap: 4px; }
.reference-actions button { padding: 0 8px; font-size:12px; }
.reference-actions button:last-child { background: #f8fafc; color: ui.$sub; }
.threshold-matrix { padding: 0; }
.threshold-matrix > header { padding: 9px 12px 7px; }
.matrix-row { display: grid; grid-template-columns: 58px repeat(3,minmax(0,1fr)); gap: 5px; align-items: center; padding: 6px 8px; border-top: 1px solid ui.$border; }
.matrix-head { padding-top: 7px; padding-bottom: 5px; color: ui.$sub; font-size:12px; text-align: center; }
.matrix-row > strong { font-size:12px; }
.matrix-row label { display: flex; align-items: center; min-width: 0; overflow: hidden; border: 1px solid ui.$border; border-radius: 7px; background: #f8fafc; }
.matrix-row input { width: 100%; min-width: 0; height: 34px; padding: 0 1px 0 3px; border: 0; outline: 0; background: transparent; color: ui.$text; font-size:12px; text-align: right; }
.matrix-row label span { padding-right: 3px; color: ui.$sub; font-size: 8px; }
</style>
