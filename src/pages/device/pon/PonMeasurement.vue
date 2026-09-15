<template>
  <div class="app-container pon-measurement-app">
    <PonPageShell :title="pageTitle" :subtitle="activePanel === 'measurement' ? device?.name : undefined" @back="handleBack">
      <template #action>
        <button v-if="activePanel !== 'measurement'" class="text-action" type="button" @click="confirmPanel">
          {{ activePanel === 'calibration' ? t('common.save') : t('common.confirm') }}
        </button>
        <button v-else class="header-action" type="button" :aria-label="t('pon.historyTitle')" @click="openHistory">
          <img :src="historyIcon" alt="" />
        </button>
      </template>

      <template v-if="activePanel === 'measurement'" #footer>
        <PonFunctionNav :device-id="deviceId" :active="isPonMode ? 'pon' : 'opm'" />
      </template>

      <div v-if="pageLoading" class="loading-page" aria-busy="true">
        <div class="loading-block short"></div><div class="loading-block large"></div><div class="loading-block"></div>
      </div>

      <main v-else class="measurement-page">
        <section v-if="activePanel === 'wavelength'" class="selection-view wavelength-view">
          <div class="wavelength-grid" role="listbox" :aria-label="t('pon.wavelengthSelect')">
            <button
              v-for="wavelength in PON_OPM_WAVELENGTHS"
              :key="wavelength"
              type="button"
              role="option"
              :aria-selected="state.persisted.selectedWavelength === wavelength"
              :class="{ active: state.persisted.selectedWavelength === wavelength }"
              @click="state.setWavelength(wavelength)"
            >
              {{ wavelength }} <small>nm</small>
            </button>
          </div>
          <p class="current-selection">{{ t('pon.currentSelection') }}：{{ state.persisted.selectedWavelength }} nm</p>
        </section>

        <section v-else-if="activePanel === 'frequency'" class="selection-view">
          <button
            class="recognition-toggle"
            type="button"
            role="switch"
            :aria-checked="isFrequencyRecognitionEnabled"
            @click="state.setFrequencyRecognition(!isFrequencyRecognitionEnabled)"
          >
            <span>
              <strong>{{ t('pon.automaticRecognition') }}</strong>
              <small>{{ isFrequencyRecognitionEnabled ? t('pon.frequencyRecognitionEnabled') : t('pon.frequencyRecognitionDisabled') }}</small>
            </span>
            <i :class="{ active: isFrequencyRecognitionEnabled }"><b></b></i>
          </button>
          <div class="recognition-result" :class="{ disabled: !isFrequencyRecognitionEnabled }">
            <span>{{ t('pon.detectedFrequency') }}</span>
            <strong>{{ frequencyLabel }}</strong>
            <small>{{ t('pon.frequencyRecognitionHint') }}</small>
          </div>
          <div class="recognition-capability">
            <span>{{ t('pon.recognizableFrequencies') }}</span>
            <div>
              <b v-for="frequency in PON_DETECTABLE_FREQUENCIES" :key="frequency">{{ formatPonFrequency(frequency) }}</b>
            </div>
          </div>
        </section>

        <section v-else-if="activePanel === 'unit'" class="selection-view">
          <div class="list-options" role="listbox" :aria-label="t('pon.unitSelect')">
            <button v-for="unit in powerUnits" :key="unit" type="button" role="option" :aria-selected="state.persisted.displayUnit === unit" @click="state.setDisplayUnit(unit)">
              <strong>{{ unit }}</strong><span v-if="state.persisted.displayUnit === unit">✓</span>
            </button>
          </div>
          <div class="conversion-card">
            <span>{{ t('pon.currentPowerConversion') }}</span>
            <strong>{{ state.runtime.opmDbm.toFixed(2) }} dBm&nbsp; = &nbsp;{{ microwatts.toFixed(3) }} uW</strong>
            <b>= &nbsp;{{ milliwatts.toFixed(6) }} mW</b>
          </div>
        </section>

        <section v-else-if="activePanel === 'calibration'" class="selection-view calibration-view">
          <dl class="calibration-current">
            <div><dt>{{ t('pon.calibrationWavelength') }}</dt><dd>{{ state.persisted.selectedWavelength }} nm</dd></div>
            <div><dt>{{ t('pon.currentMeasured') }}</dt><dd>{{ state.runtime.opmDbm.toFixed(2) }} dBm</dd></div>
          </dl>
          <label>{{ t('pon.currentOffset') }}（dB）</label>
          <div class="calibration-stepper">
            <button type="button" aria-label="-0.05dB" @click="adjustCalibration(-0.05)">−</button>
            <input v-model.number="calibrationDraft" type="number" min="-5" max="5" step="0.01" inputmode="decimal" />
            <button type="button" aria-label="+0.05dB" @click="adjustCalibration(0.05)">＋</button>
          </div>
          <button class="reset-calibration" type="button" @click="resetCurrentCalibration">{{ t('pon.resetCurrent') }}</button>
          <p class="panel-note">{{ t('pon.calibrationRange') }}</p>
        </section>

        <template v-else>
          <section v-if="!isOnline || state.runtime.status === 'error'" class="state-alert" :class="{ error: state.runtime.status === 'error' }">
            <div><strong>{{ state.runtime.status === 'error' ? t('pon.sensorError') : t('pon.connectionLost') }}</strong><span>{{ state.runtime.status === 'error' ? t('pon.sensorErrorHint') : t('pon.connectionLostHint') }}</span></div>
            <button type="button" @click="router.push(`/device/${deviceId}/pon-settings`)">{{ t('pon.openSettings') }}</button>
          </section>

          <section v-if="isPonMode" class="light-meter pon-meter">
            <header><strong>{{ t('pon.ponMeasurementTitle') }}</strong><span>{{ statusLabel }}</span></header>
            <div class="pon-channel-list" :aria-label="t('pon.fixedPonChannels')">
              <article>
                <div><strong>1490nm</strong><span>{{ t('pon.downstreamChannel') }}</span></div>
                <p><b>{{ state.runtime.pon1490Dbm.toFixed(2) }}</b><small>dBm</small></p>
              </article>
              <article>
                <div><strong>1577nm</strong><span>{{ t('pon.downstreamChannel') }}</span></div>
                <p><b>{{ state.runtime.pon1577Dbm.toFixed(2) }}</b><small>dBm</small></p>
              </article>
            </div>
            <footer class="pon-probe-spec">
              <div><span>{{ t('pon.isolation') }}</span><strong>{{ ponIsolationLabel }}</strong></div>
              <div><span>{{ t('pon.ponAccuracy') }}</span><strong>{{ ponAccuracyLabel }}</strong></div>
            </footer>
          </section>

          <section v-else class="light-meter opm-meter">
            <header>
              <strong>{{ t('pon.opmMeasurementTitle') }}</strong>
              <button type="button" @click="openPanel('wavelength')">{{ state.persisted.selectedWavelength }} nm</button>
            </header>
            <div class="meter-wavelength">{{ state.persisted.selectedWavelength }} nm</div>
            <div class="meter-reading"><strong>{{ opmDisplayValue }}</strong><span>{{ state.persisted.displayUnit }}</span></div>
            <div class="meter-secondary">{{ linearPower }}</div>
            <footer><span>{{ t('pon.frequencyRecognition') }}</span><strong>{{ frequencyLabel }}</strong></footer>
          </section>

          <section class="spec-grid">
            <div><span>{{ t('pon.powerRange') }}</span><strong>{{ powerRangeLabel }}</strong></div>
            <div><span>{{ t('pon.resolution') }}</span><strong>0.01dBm</strong></div>
            <div>
              <span>{{ isPonMode ? t('pon.measurementMethod') : t('pon.measurementAccuracyLabel') }}</span>
              <strong>{{ isPonMode ? t('pon.dualChannelShort') : opmAccuracyLabel }}</strong>
            </div>
          </section>

          <template v-if="!isPonMode">
            <section class="reference-strip">
              <div><span>{{ t('pon.referenceValue') }}</span><strong>{{ referenceDbm.toFixed(2) }} dBm</strong></div>
              <div><span>{{ t('pon.relativePower') }}</span><strong>{{ relativePower.toFixed(2) }} dB</strong></div>
              <button type="button" @click="setReference">{{ t('pon.setCurrentReference') }}</button>
              <button type="button" @click="clearReference">{{ t('pon.clearReference') }}</button>
            </section>

            <section class="quick-actions">
              <button type="button" @click="openPanel('unit')"><img :src="unitIcon" alt="" /><strong>{{ t('pon.unitSelect') }}</strong></button>
              <button type="button" @click="openPanel('frequency')"><img :src="frequencyIcon" alt="" /><strong>{{ t('pon.frequencyRecognition') }}</strong></button>
              <button type="button" @click="openPanel('calibration')"><img :src="calibrationIcon" alt="" /><strong>{{ t('pon.manualCalibration') }}</strong></button>
              <button type="button" @click="openHistory"><img :src="historyIcon" alt="" /><strong>{{ t('pon.historyTitle') }}</strong></button>
            </section>
          </template>

          <button class="reading-save-action" type="button" :disabled="!canUseReading" @click="saveRecord">
            <img :src="saveIcon" alt="" /><span>{{ t('pon.saveCurrentReading') }}</span>
          </button>
        </template>

        <div v-if="feedback" class="feedback-toast" role="status">{{ feedback }}</div>
      </main>
    </PonPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import historyIcon from '@/assets/icons/pon-meter/ui/history.png'
import calibrationIcon from '@/assets/icons/pon-meter/ui/manual-calibration.png'
import frequencyIcon from '@/assets/icons/pon-meter/ui/frequency-signal.png'
import unitIcon from '@/assets/icons/pon-meter/ui/unit-convert.png'
import saveIcon from '@/assets/icons/pon-meter/ui/save.png'
import PonFunctionNav from './PonFunctionNav.vue'
import PonPageShell from './PonPageShell.vue'
import { usePonDevice } from './usePonDevice'
import {
  PON_DETECTABLE_FREQUENCIES,
  PON_OPM_WAVELENGTHS,
  convertPonPower,
  dbmToMilliwatts,
  formatPonFrequency,
  usePonPowerMeterState,
  type PonPowerUnit
} from './usePonPowerMeterState'

type OpmPanel = 'measurement' | 'wavelength' | 'frequency' | 'unit' | 'calibration'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { deviceId, device } = usePonDevice()
const state = usePonPowerMeterState(deviceId.value)
const powerUnits: PonPowerUnit[] = ['dBm', 'mW', 'uW']
const pageLoading = ref(true)
const feedback = ref('')
const calibrationDraft = ref(0)
const activePanel = ref<OpmPanel>('measurement')
let feedbackTimer: number | undefined

const isOnline = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const isPonMode = computed(() => route.name !== 'PonOpmMeasurement')
const panelTitles: Record<OpmPanel, string> = {
  measurement: '', wavelength: 'pon.wavelengthSelect', frequency: 'pon.frequencyRecognition', unit: 'pon.unitSelect', calibration: 'pon.calibrationTitle'
}
const pageTitle = computed(() => activePanel.value === 'measurement'
  ? t(isPonMode.value ? 'pon.ponMeasurementTitle' : 'pon.opmMeasurementTitle')
  : t(panelTitles[activePanel.value]))
const canUseReading = computed(() => state.runtime.status === 'live')
const powerRangeLabel = computed(() => device.value?.ponPowerRange === 'high' ? '-50~+26' : '-70~+10')
const formatAccuracy = (db?: number, percent?: number) => {
  const values: string[] = []
  if (Number.isFinite(db)) values.push(`±${Number(db)}dB`)
  if (Number.isFinite(percent)) values.push(`${Number(percent)}%`)
  return values.join(' / ') || t('pon.probeSpecification')
}
const opmAccuracyLabel = computed(() => formatAccuracy(device.value?.ponOpmAccuracyDb ?? 0.2, device.value?.ponOpmAccuracyPercent ?? 5))
const ponAccuracyLabel = computed(() => formatAccuracy(device.value?.ponMeasurementAccuracyDb))
const ponIsolationLabel = computed(() => Number.isFinite(device.value?.ponIsolationDb)
  ? `≥ ${Number(device.value?.ponIsolationDb)} dB`
  : t('pon.probeSpecification'))
const referenceDbm = computed(() => state.getReferenceDbm())
const relativePower = computed(() => state.runtime.opmDbm - referenceDbm.value)
const opmDisplayValue = computed(() => convertPonPower(state.runtime.opmDbm, state.persisted.displayUnit))
const milliwatts = computed(() => dbmToMilliwatts(state.runtime.opmDbm))
const microwatts = computed(() => milliwatts.value * 1000)
const linearPower = computed(() => microwatts.value >= 1000 ? `${(microwatts.value / 1000).toFixed(3)} mW` : `${microwatts.value.toFixed(3)} uW`)
const isFrequencyRecognitionEnabled = computed(() => state.persisted.frequencyMode !== 0)
const frequencyLabel = computed(() => state.persisted.frequencyMode === 0 ? t('pon.frequencyDisabled') : formatPonFrequency(state.runtime.opmFrequency))
const statusLabel = computed(() => state.runtime.status === 'live' ? t('pon.statusRunning') : t('pon.statusReady'))

const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}

const syncPanelFromQuery = () => {
  const requested = String(route.query.panel || '') as OpmPanel
  activePanel.value = !isPonMode.value && ['wavelength', 'frequency', 'unit', 'calibration'].includes(requested) ? requested : 'measurement'
}
const openPanel = (panel: Exclude<OpmPanel, 'measurement'>) => {
  if (panel === 'calibration') calibrationDraft.value = Number(state.persisted.calibrationOffsets[String(state.persisted.selectedWavelength)] || 0)
  activePanel.value = panel
  router.replace({ path: route.path, query: { panel } })
}
const closePanel = () => {
  activePanel.value = 'measurement'
  router.replace({ path: route.path })
}
const handleBack = () => activePanel.value === 'measurement' ? router.replace(`/device/${deviceId.value}`) : closePanel()
const confirmPanel = () => activePanel.value === 'calibration' ? saveCalibration() : closePanel()
const openHistory = () => router.push(`/device/${deviceId.value}/pon-history`)
const setReference = () => { state.setReferenceFromCurrent(); showFeedback(t('pon.referenceUpdated')) }
const clearReference = () => { state.clearReference(); showFeedback(t('pon.referenceCleared')) }
const saveRecord = () => showFeedback(state.saveCurrentRecord() ? t('pon.resultSaved') : t('pon.noResultToSave'))
const adjustCalibration = (step: number) => { calibrationDraft.value = Number(Math.min(5, Math.max(-5, calibrationDraft.value + step)).toFixed(2)) }
const saveCalibration = () => {
  state.setCalibrationOffset(state.persisted.selectedWavelength, calibrationDraft.value)
  showFeedback(t('pon.calibrationSaved', { offset: calibrationDraft.value.toFixed(2) }))
  closePanel()
}
const resetCurrentCalibration = () => { calibrationDraft.value = 0; state.resetCalibration(state.persisted.selectedWavelength); showFeedback(t('pon.calibrationReset')) }

watch(isPonMode, ponMode => { state.setMeasurementMode(ponMode ? 'pon' : 'opm'); syncPanelFromQuery() }, { immediate: true })
watch(() => route.query.panel, syncPanelFromQuery)
watch(isOnline, online => online ? state.startLiveMeasurement() : state.stopLiveMeasurement('disconnected'))

onMounted(() => {
  window.setTimeout(() => { pageLoading.value = false }, 260)
  if (route.query.state === 'error') state.setMeasurementError()
  else if (isOnline.value) state.startLiveMeasurement()
})
onUnmounted(() => { state.stopLiveMeasurement(); if (feedbackTimer) window.clearTimeout(feedbackTimer) })
</script>

<style scoped lang="scss">
@use './ponUi.scss' as ui;

.pon-measurement-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$pon-bg; }
.header-action, .text-action { @include ui.button-reset; min-width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; background: transparent; }
.header-action img { width: 21px; height: 21px; }
.text-action { color: ui.$pon-primary; font-size: 13px; font-weight: 700; }
.measurement-page, .loading-page { @include ui.page-surface; padding-bottom: 18px; }
.measurement-page { display: flex; flex-direction: column; gap: 12px; }
.loading-page { display: grid; align-content: start; gap: 12px; }
.loading-block { height: 94px; border-radius: 12px; background: #e8eef6; animation: pulse 1.2s ease-in-out infinite; }
.loading-block.large { height: 250px; }.loading-block.short { height: 58px; }@keyframes pulse { 50% { opacity: .55; } }
.state-alert { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; }
.state-alert strong, .state-alert span { display: block; }.state-alert strong { color: #9a3412; font-size: 11px; }.state-alert span { margin-top: 2px; color: #c2410c; font-size: 10px; }
.state-alert button { @include ui.secondary-button; min-height: 38px; padding: 0 8px; color: #9a3412; font-size: 10px; }.state-alert.error { border-color: #fecaca; background: #fff1f2; }
.light-meter { overflow: hidden; border: 1px solid #dbe7f5; border-radius: 12px; background: #ffffff; box-shadow: 0 8px 22px rgba(37,99,235,.08); }
.light-meter > header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #e7eef8; }
.light-meter > header strong { color: ui.$pon-primary-dark; font-size: 13px; }.light-meter > header span { color: ui.$pon-text-sub; font-size: 10px; }
.light-meter > header button { @include ui.button-reset; min-height: 44px; background: transparent; color: ui.$pon-primary; font-size: 13px; font-weight: 700; }
.meter-wavelength { padding-top: 14px; color: ui.$pon-primary; font-size: 16px; text-align: center; @include ui.metric-number; }
.meter-reading { min-height: 86px; display: flex; align-items: center; justify-content: center; gap: 7px; color: ui.$pon-primary-dark; }
.meter-reading strong { width: 205px; max-width: calc(100% - 64px); font-size: 46px; line-height: 1; text-align: right; @include ui.metric-number; }
.meter-reading span { min-width: 48px; color: ui.$pon-text; font-size: 18px; }.meter-secondary { padding-bottom: 14px; color: ui.$pon-text; font-size: 19px; text-align: center; @include ui.metric-number; }
.light-meter > footer { min-height: 45px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-top: 1px solid #e7eef8; color: ui.$pon-primary; }
.light-meter > footer span { font-size: 11px; }.light-meter > footer strong { font-size: 12px; @include ui.metric-number; }
.pon-channel-list { display: grid; gap: 0; }
.pon-channel-list article { min-height: 104px; display: grid; grid-template-columns: 112px minmax(0, 1fr); align-items: center; padding: 0 14px; border-bottom: 1px solid #e7eef8; }
.pon-channel-list article:last-child { border-bottom: 0; }
.pon-channel-list article > div strong, .pon-channel-list article > div span { display: block; }
.pon-channel-list article > div strong { color: ui.$pon-primary; font-size: 15px; @include ui.metric-number; }
.pon-channel-list article > div span { margin-top: 5px; color: ui.$pon-text-sub; font-size: 10px; }
.pon-channel-list p { min-width: 0; display: flex; align-items: baseline; justify-content: flex-end; gap: 6px; margin: 0; }
.pon-channel-list p b { width: 142px; color: ui.$pon-primary-dark; font-size: 39px; line-height: 1; text-align: right; @include ui.metric-number; }
.pon-channel-list p small { min-width: 34px; color: ui.$pon-text; font-size: 13px; }
.pon-probe-spec { min-height: 50px !important; display: grid !important; grid-template-columns: 1fr 1fr; padding: 0 !important; color: ui.$pon-text !important; }
.pon-probe-spec div { min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 6px; border-right: 1px solid #e7eef8; }
.pon-probe-spec div:last-child { border-right: 0; }
.pon-probe-spec span { color: ui.$pon-text-sub; font-size: 9px !important; }
.pon-probe-spec strong { max-width: 100%; color: ui.$pon-primary; font-size: 10px !important; text-align: center; white-space: normal; }
.spec-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow: hidden; border: 1px solid ui.$pon-border; border-radius: 10px; background: #ffffff; }
.spec-grid div { min-width: 0; padding: 10px 4px; border-right: 1px solid ui.$pon-border; text-align: center; }.spec-grid div:last-child { border-right: 0; }
.spec-grid span, .spec-grid strong { display: block; }.spec-grid span { color: ui.$pon-text-sub; font-size: 9px; }.spec-grid strong { margin-top: 4px; font-size: 11px; @include ui.metric-number; }
.reference-strip { display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; border: 1px solid ui.$pon-border; border-radius: 10px; background: #ffffff; }
.reference-strip > div { padding: 9px 10px; border-right: 1px solid ui.$pon-border; }.reference-strip span, .reference-strip strong { display: block; }.reference-strip span { color: ui.$pon-text-sub; font-size: 9px; }.reference-strip strong { margin-top: 3px; font-size: 11px; @include ui.metric-number; }
.reference-strip button { @include ui.button-reset; min-height: 40px; border-top: 1px solid ui.$pon-border; background: #ffffff; color: ui.$pon-primary; font-size: 10px; }.reference-strip button:last-child { border-left: 1px solid ui.$pon-border; }
.quick-actions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; }
.quick-actions button { @include ui.button-reset; min-width: 0; min-height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 5px 2px; border: 1px solid ui.$pon-border; border-radius: 10px; background: #ffffff; }
.quick-actions img { width: 20px; height: 20px; }.quick-actions strong { max-width: 100%; overflow: hidden; color: ui.$pon-text; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.reading-save-action { @include ui.primary-button; min-height: 46px; display: flex; align-items: center; justify-content: center; gap: 7px; font-size: 12px; }.reading-save-action img { width: 18px; height: 18px; filter: brightness(0) invert(1); }
.selection-view { min-height: 610px; display: flex; flex-direction: column; }.wavelength-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 10px; }
.wavelength-grid button { @include ui.button-reset; min-width: 0; min-height: 60px; border: 1px solid #e3ebf6; border-radius: 10px; background: #ffffff; color: ui.$pon-text; font-size: 15px; box-shadow: ui.$pon-shadow; }.wavelength-grid small { font-size: 11px; }
.wavelength-grid button.active { border-color: ui.$pon-primary; background: ui.$pon-primary; color: #ffffff; box-shadow: 0 8px 18px rgba(37,99,235,.22); }.current-selection { margin: auto 0 8px; color: ui.$pon-primary; font-size: 13px; text-align: center; }
.list-options { overflow: hidden; border: 1px solid ui.$pon-border; border-radius: 10px; background: #ffffff; }.list-options button { @include ui.button-reset; width: 100%; min-height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid ui.$pon-border; background: transparent; color: ui.$pon-text; text-align: left; }.list-options button:last-child { border-bottom: 0; }
.list-options strong { font-size: 13px; }.list-options span { color: ui.$pon-primary; font-size: 20px; }.list-options i { color: ui.$pon-text-sub; font-size: 20px; font-style: normal; }
.recognition-toggle { @include ui.button-reset; width: 100%; min-height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 14px; border: 1px solid ui.$pon-border; border-radius: 10px; background: #ffffff; color: ui.$pon-text; text-align: left; box-shadow: ui.$pon-shadow; }
.recognition-toggle span, .recognition-toggle strong, .recognition-toggle small { display: block; }
.recognition-toggle strong { font-size: 14px; }.recognition-toggle small { margin-top: 5px; color: ui.$pon-text-sub; font-size: 10px; }
.recognition-toggle > i { flex: 0 0 auto; width: 44px; height: 26px; display: flex; align-items: center; padding: 3px; box-sizing: border-box; border-radius: 999px; background: #cbd5e1; }
.recognition-toggle > i b { width: 20px; height: 20px; border-radius: 50%; background: #ffffff; box-shadow: 0 2px 6px rgba(15,23,42,.2); transition: transform .18s ease; }
.recognition-toggle > i.active { background: ui.$pon-primary; }.recognition-toggle > i.active b { transform: translateX(18px); }
.recognition-result { min-height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 12px; border: 1px solid #bfdbfe; border-radius: 12px; background: ui.$pon-primary-soft; text-align: center; }
.recognition-result > span { color: ui.$pon-primary; font-size: 11px; }.recognition-result > strong { margin-top: 12px; color: ui.$pon-primary-dark; font-size: 38px; @include ui.metric-number; }.recognition-result > small { margin-top: 12px; color: ui.$pon-text-sub; font-size: 10px; }
.recognition-result.disabled { border-color: ui.$pon-border; background: #f8fafc; }.recognition-result.disabled > strong { color: ui.$pon-text-sub; }
.recognition-capability { margin-top: 12px; padding: 14px; border: 1px solid ui.$pon-border; border-radius: 10px; background: #ffffff; }
.recognition-capability > span { color: ui.$pon-text-sub; font-size: 10px; }.recognition-capability > div { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: 10px; }
.recognition-capability b { min-width: 0; padding: 8px 2px; border-radius: 7px; background: #f1f5f9; color: ui.$pon-text; font-size: 10px; text-align: center; @include ui.metric-number; }
.conversion-card { margin-top: auto; padding: 18px; border-radius: 10px; background: ui.$pon-primary-soft; text-align: center; }.conversion-card span, .conversion-card strong, .conversion-card b { display: block; }.conversion-card span { color: ui.$pon-primary; font-size: 11px; }.conversion-card strong { margin-top: 12px; color: ui.$pon-text; font-size: 16px; @include ui.metric-number; }.conversion-card b { margin-top: 12px; color: ui.$pon-text; font-size: 15px; @include ui.metric-number; }
.panel-note { margin: auto 0 4px; color: ui.$pon-text-sub; font-size: 10px; line-height: 1.5; text-align: center; }.calibration-current { margin: 0; padding: 4px 0 14px; }.calibration-current div { min-height: 34px; display: flex; align-items: center; justify-content: space-between; }.calibration-current dt { color: ui.$pon-text-sub; font-size: 12px; }.calibration-current dd { margin: 0; color: ui.$pon-text; font-size: 13px; @include ui.metric-number; }
.calibration-view > label { margin: 8px 0; color: ui.$pon-text; font-size: 12px; font-weight: 700; }.calibration-stepper { display: grid; grid-template-columns: 54px 1fr 54px; gap: 8px; }.calibration-stepper button { @include ui.button-reset; border-radius: 10px; background: ui.$pon-primary-soft; color: ui.$pon-primary; font-size: 23px; }.calibration-stepper input { min-width: 0; height: 50px; box-sizing: border-box; border: 1px solid ui.$pon-border; border-radius: 10px; background: #ffffff; color: ui.$pon-text; font-size: 20px; text-align: center; @include ui.metric-number; }.reset-calibration { @include ui.secondary-button; margin-top: 12px; color: ui.$pon-primary; }
.feedback-toast { position: fixed; left: 50%; bottom: 28px; z-index: 95; max-width: 300px; transform: translateX(-50%); padding: 9px 13px; border-radius: 8px; background: rgba(15,23,42,.94); color: #ffffff; font-size: 11px; text-align: center; }
@media (max-width: 340px) { .meter-reading strong { font-size: 39px; }.quick-actions { grid-template-columns: repeat(2, 1fr); }.selection-view { min-height: 560px; } }
</style>
