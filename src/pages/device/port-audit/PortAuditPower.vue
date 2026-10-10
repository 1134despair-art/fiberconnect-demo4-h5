<template>
  <PortAuditPageShell standalone :title="t('portAudit.powerPageTitle')" :subtitle="device?.name" @back="goHome">
    <div class="power-page">
      <section v-if="!connected" class="offline"><img :src="bluetoothIcon" alt="" /><h2>{{ t('portAudit.disconnected') }}</h2><p>{{ t('portAudit.connectFirst') }}</p><button type="button" @click="reconnect">{{ t('portAudit.reconnect') }}</button></section>
      <template v-else>
        <div class="mode-tabs" role="tablist">
          <button type="button" role="tab" :aria-selected="state.persisted.powerView === 'opm'" :class="{ active: state.persisted.powerView === 'opm' }" @click="setView('opm')">{{ t('portAudit.opmMode') }}</button>
          <button type="button" role="tab" :aria-selected="state.persisted.powerView === 'pon'" :class="{ active: state.persisted.powerView === 'pon' }" @click="setView('pon')">{{ t('portAudit.ponMode') }}</button>
        </div>

        <section class="power-meter" :class="{ running: state.runtime.powerStatus === 'running' }">
          <header><strong>{{ state.persisted.powerView === 'opm' ? t('portAudit.opmMode') : t('portAudit.ponMode') }}</strong><span><i></i>{{ state.runtime.powerStatus === 'running' ? t('portAudit.measureRunning') : t('portAudit.measureStandby') }}</span></header>
          <template v-if="state.persisted.powerView === 'opm'">
            <div class="opm-reading"><span>{{ state.persisted.selectedWavelength }}nm</span><div><b>{{ formatValue(state.runtime.opmDbm) }}</b><small>{{ state.persisted.powerUnit }}</small></div><em>{{ formatPortAuditFrequency(state.runtime.frequencyHz) }}</em></div>
            <footer><span>{{ t('portAudit.relativePower') }}</span><strong>{{ relativePower }}</strong><span>{{ t('portAudit.reference') }} {{ state.persisted.opmReferenceDbm.toFixed(2) }}dBm</span></footer>
          </template>
          <template v-else>
            <div class="pon-reading">
              <div><span>1490nm</span><strong>{{ formatValue(state.runtime.pon1490Dbm) }} <small>{{ state.persisted.powerUnit }}</small></strong><em>{{ relativePon1490 }}</em></div>
              <div><span>1577nm</span><strong>{{ formatValue(state.runtime.pon1577Dbm) }} <small>{{ state.persisted.powerUnit }}</small></strong><em>{{ relativePon1577 }}</em></div>
            </div>
            <footer><span>{{ t('portAudit.ponChannels') }}</span><strong>1490 + 1577nm</strong><span>0.01dBm</span></footer>
          </template>
        </section>

        <section class="spec-grid">
          <div><span>{{ state.persisted.powerView === 'opm' ? t('portAudit.wavelength') : t('portAudit.ponChannels') }}</span><strong>{{ state.persisted.powerView === 'opm' ? `${state.persisted.selectedWavelength}nm` : '1490/1577nm' }}</strong></div>
          <div><span>{{ t('portAudit.unit') }}</span><strong>{{ state.persisted.powerUnit }}</strong></div>
          <div><span>{{ t('pon.resolution') }}</span><strong>0.01dBm</strong></div>
        </section>

        <button class="measure-action" :class="{ stop: state.runtime.powerStatus === 'running' }" type="button" @click="toggleMeasurement">{{ state.runtime.powerStatus === 'running' ? t('portAudit.stopMeasure') : t('portAudit.startMeasure') }}</button>

        <section v-if="state.persisted.powerView === 'opm'" class="parameter-section">
          <header><h2>{{ t('portAudit.wavelength') }}</h2></header>
          <div class="wavelength-grid" role="group" :aria-label="t('portAudit.wavelength')">
            <button v-for="wavelength in PORT_AUDIT_WAVELENGTHS" :key="wavelength" type="button" :class="{ active: state.persisted.selectedWavelength === wavelength }" @click="state.persisted.selectedWavelength = wavelength">{{ wavelength }}<small>nm</small></button>
          </div>
        </section>

        <section class="parameter-section">
          <header><h2>{{ t('portAudit.unit') }}</h2></header>
          <div class="unit-control" role="group"><button v-for="unit in units" :key="unit" type="button" :class="{ active: state.persisted.powerUnit === unit }" @click="state.persisted.powerUnit = unit">{{ unit }}</button></div>
        </section>

        <section class="reference-panel" :class="{ dual: state.persisted.powerView === 'pon' }">
          <div v-if="state.persisted.powerView === 'opm'"><span>{{ t('portAudit.reference') }}</span><strong>{{ state.persisted.opmReferenceDbm.toFixed(2) }}dBm</strong></div>
          <div v-else class="dual-reference">
            <span><em>1490nm</em><strong>{{ state.persisted.ponReferenceDbm['1490'].toFixed(2) }}dBm</strong></span>
            <span><em>1577nm</em><strong>{{ state.persisted.ponReferenceDbm['1577'].toFixed(2) }}dBm</strong></span>
          </div>
          <button type="button" @click="setReference">{{ t('portAudit.setReference') }}</button><button type="button" @click="clearReference">{{ t('portAudit.clearReference') }}</button>
        </section>

        <section class="calibration-section">
          <header><h2>{{ t('portAudit.manualCalibration') }}</h2><p>{{ t('portAudit.calibrationOffset') }} · 0.01dBm</p></header>
          <div v-for="wavelength in calibrationWavelengths" :key="wavelength" class="calibration-row">
            <strong>{{ wavelength }}nm</strong>
            <div><button type="button" @click="adjustCalibration(wavelength, -0.01)">−</button><span>{{ calibrationValue(wavelength) }}dB</span><button type="button" @click="adjustCalibration(wavelength, 0.01)">+</button></div>
          </div>
        </section>

      </template>
    </div>
    <template #footer><PortAuditFunctionNav :device-id="deviceId" active="power" /></template>
  </PortAuditPageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import PortAuditPageShell from './PortAuditPageShell.vue'
import PortAuditFunctionNav from './PortAuditFunctionNav.vue'
import { usePortAuditDevice } from './usePortAuditDevice'
import { PORT_AUDIT_WAVELENGTHS, convertPortAuditPower, formatPortAuditFrequency, usePortAuditState, type PortAuditPowerUnit, type PortAuditPowerView, type PortAuditWavelength } from './usePortAuditState'
import bluetoothIcon from '@/assets/icons/iconfont/smart-otdr/bluetooth.svg'

const router = useRouter(); const { t } = useI18n(); const { updateDevice } = useAuth()
const { deviceId, device } = usePortAuditDevice(); const state = usePortAuditState(deviceId.value)
const goHome = () => router.push(`/device/${deviceId.value}`)
const units: PortAuditPowerUnit[] = ['dBm', 'mW', 'uW', 'nW']
const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const calibrationWavelengths = computed<PortAuditWavelength[]>(() => state.persisted.powerView === 'pon' ? [1490, 1577] : [state.persisted.selectedWavelength])
const relativePower = computed(() => `${(state.runtime.opmDbm - state.persisted.opmReferenceDbm).toFixed(2)}dB`)
const relativePon1490 = computed(() => `${t('portAudit.relativePower')} ${(state.runtime.pon1490Dbm - state.persisted.ponReferenceDbm['1490']).toFixed(2)}dB`)
const relativePon1577 = computed(() => `${t('portAudit.relativePower')} ${(state.runtime.pon1577Dbm - state.persisted.ponReferenceDbm['1577']).toFixed(2)}dB`)
const formatValue = (dbm: number) => convertPortAuditPower(dbm, state.persisted.powerUnit)
const calibrationValue = (wavelength: PortAuditWavelength) => Number(state.persisted.calibrationOffsets[String(wavelength)] || 0).toFixed(2)
const setView = (view: PortAuditPowerView) => { state.persisted.powerView = view }
const setReference = () => state.setReferenceFromCurrent()
const clearReference = () => state.clearReference()
const adjustCalibration = (wavelength: PortAuditWavelength, delta: number) => state.setCalibration(wavelength, Number(state.persisted.calibrationOffsets[String(wavelength)] || 0) + delta)
const toggleMeasurement = () => state.runtime.powerStatus === 'running' ? state.stopPower() : state.startPower()
const reconnect = async () => { await state.reconnectBluetooth(); updateDevice(deviceId.value, { status: 'connected' }) }
onBeforeUnmount(() => state.stopPower())
</script>

<style scoped lang="scss">
@use './portAuditUi.scss' as ui;
.power-page { @include ui.page-padding; display: flex; flex-direction: column; gap: 12px }.offline { padding: 70px 20px; text-align: center }.offline img { width: 42px }.offline h2 { margin: 14px 0 5px; font-size: 17px }.offline p { margin: 0; color: ui.$audit-sub; font-size: 11px }.offline button { @include ui.primary-button; width: 100%; margin-top: 20px }
.mode-tabs, .unit-control { display: grid; gap: 4px; padding: 4px; border: 1px solid ui.$audit-border; border-radius: 12px; background: #e7edf5 }.mode-tabs { grid-template-columns: 1fr 1fr }.unit-control { grid-template-columns: repeat(4,1fr) }.mode-tabs button, .unit-control button { @include ui.reset-button; min-height: 42px; border-radius: 8px; color: ui.$audit-sub; font-size: 11px; font-weight: 700 }.mode-tabs button.active, .unit-control button.active { background: #fff; color: ui.$audit-primary; box-shadow: 0 2px 7px rgba(15,23,42,.1) }.mode-tabs button:focus-visible, .unit-control button:focus-visible, .wavelength-grid button:focus-visible { @include ui.focus-ring; }
.power-meter { overflow: hidden; border: 1px solid #dbe7f5; border-radius: 12px; background: #fff; box-shadow: 0 8px 22px rgba(37,99,235,.08) }.power-meter header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #e7eef8 }.power-meter header > strong { color: #1d4ed8; font-size: 13px }.power-meter header span { display: flex; align-items: center; gap: 6px; color: ui.$audit-sub; font-size:12px }.power-meter header i { width: 7px; height: 7px; border-radius: 50%; background: #94a3b8 }.power-meter.running header i { background: ui.$audit-success; box-shadow: 0 0 0 4px rgba(22,163,74,.12) }
.opm-reading { min-height: 166px; display: flex; flex-direction: column; align-items: center; justify-content: center }.opm-reading > span { color: ui.$audit-primary; font-size: 16px; @include ui.numeric }.opm-reading div { display: grid; grid-template-columns: minmax(130px,auto) 42px; align-items: end; justify-content: center; gap: 6px; margin-top: 13px }.opm-reading b { @include ui.numeric; color: #1d4ed8; font-size: 42px; line-height: 1; text-align: center }.opm-reading small { color: ui.$audit-text; font-size: 15px }.opm-reading em { margin-top: 11px; color: ui.$audit-sub; font-size: 12px; font-style: normal; @include ui.numeric }.pon-reading { display: grid; grid-template-columns: 1fr 1fr; min-height: 166px }.pon-reading div { display: flex; flex-direction: column; align-items: center; justify-content: center }.pon-reading div + div { border-left: 1px solid #e7eef8 }.pon-reading span { color: ui.$audit-primary; font-size: 12px; @include ui.numeric }.pon-reading strong { margin-top: 12px; color: #1d4ed8; font-size: 21px; @include ui.numeric }.pon-reading small { color: ui.$audit-text; font-size: 11px }.pon-reading em { margin-top: 8px; color: ui.$audit-sub; font-size:12px; font-style: normal; @include ui.numeric }.power-meter footer { min-height: 45px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 7px; padding: 0 14px; border-top: 1px solid #e7eef8; color: ui.$audit-primary; font-size:12px }.power-meter footer strong { font-size: 11px; text-align: center; @include ui.numeric }.power-meter footer span:last-child { text-align: right }
.spec-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); overflow: hidden; border: 1px solid ui.$audit-border; border-radius: 10px; background: #fff }.spec-grid div { min-width: 0; padding: 10px 4px; text-align: center }.spec-grid div + div { border-left: 1px solid ui.$audit-border }.spec-grid span, .spec-grid strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }.spec-grid span { color: ui.$audit-sub; font-size:12px }.spec-grid strong { margin-top: 4px; color: ui.$audit-text; font-size: 11px; @include ui.numeric }
.parameter-section { padding: 12px; border: 1px solid ui.$audit-border; border-radius: 12px; background: #fff }.parameter-section header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 8px }.parameter-section h2 { margin: 0; color: ui.$audit-text; font-size: 13px }.parameter-section header span { color: ui.$audit-sub; font-size:12px }.wavelength-grid { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 7px; }.wavelength-grid button { @include ui.reset-button; min-width: 0; min-height: 44px; border: 1px solid ui.$audit-border; border-radius: 9px; background: #fff; color: ui.$audit-text; font-size:12px; white-space: nowrap; @include ui.numeric }.wavelength-grid button.active { border-color: ui.$audit-primary; background: ui.$audit-primary; color: #fff; font-weight: 800; box-shadow: 0 6px 14px rgba(37,99,235,.16) }.wavelength-grid small { margin-left: 1px; font-size:12px }
.reference-panel { display: grid; grid-template-columns: minmax(0,1fr) auto auto; gap: 7px; align-items: center; padding: 10px; border: 1px solid ui.$audit-border; border-radius: 13px; background: #fff }.reference-panel span, .reference-panel strong { display: block }.reference-panel span { color: ui.$audit-sub; font-size: 11px }.reference-panel strong { margin-top: 3px; font-size: 11px; @include ui.numeric }.reference-panel button { @include ui.reset-button; min-height: 38px; padding: 0 9px; border-radius: 9px; background: ui.$audit-primary-soft; color: ui.$audit-primary; font-size: 11px; font-weight: 700 }
.reference-panel.dual { grid-template-columns: minmax(0,1fr) auto auto; }.dual-reference { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }.dual-reference > span { min-width: 0; }.dual-reference em { display: block; color: ui.$audit-sub; font-size:12px; font-style: normal; }.dual-reference strong { white-space: nowrap; }
.calibration-section { padding: 12px; border: 1px solid ui.$audit-border; border-radius: 14px; background: #fff }.calibration-section header h2 { margin: 0; font-size: 13px }.calibration-section header p { margin: 3px 0 0; color: ui.$audit-sub; font-size: 11px }.calibration-row { display: grid; grid-template-columns: 58px 1fr; align-items: center; margin-top: 9px; padding-top: 9px; border-top: 1px solid ui.$audit-border }.calibration-row > strong { font-size: 11px; @include ui.numeric }.calibration-row div { display: grid; grid-template-columns: 36px 1fr 36px; align-items: center }.calibration-row button { @include ui.reset-button; width: 36px; height: 36px; border-radius: 9px; background: ui.$audit-primary-soft; color: ui.$audit-primary; font-size: 19px }.calibration-row span { text-align: center; font-size: 11px; @include ui.numeric }.measure-action { @include ui.primary-button; width: 100% }.measure-action.stop { background: ui.$audit-danger; box-shadow: 0 8px 18px rgba(225,29,72,.18) }
@media (max-width: 340px) { .wavelength-grid { grid-template-columns: repeat(4,minmax(0,1fr)); } }
</style>
