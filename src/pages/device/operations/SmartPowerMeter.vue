<template>
  <div class="app-container opm-app-page">
    <div class="content-flex hide-scrollbar">
      <SmartOtdrPageShell :title="t('device.opm.title')" @back="goBack">
        <main class="opm-app-main">
          <section class="reading-card">
            <div class="card-head">
              <div class="card-title-group">
                <h3 class="section-title">光功率计</h3>
                <p class="section-desc">{{ pageDescription }}</p>
              </div>
              <div class="status-badge" :class="opmState.viewState">
                {{ stateText }}
              </div>
            </div>

            <div class="meter-screen">
              <div class="screen-head">
                <span>{{ opmState.wavelength }}nm</span>
                <span>{{ opmState.frequencyMode }}</span>
                <span class="screen-mode" :class="opmState.viewState">
                  {{ stateText }}
                </span>
              </div>

              <div class="screen-reading">
                <span class="reading-number">{{ opmState.powerValue }}</span>
                <span class="reading-unit">{{ opmState.displayUnit }}</span>
              </div>

              <div class="screen-metrics">
                <div class="metric-item">
                  <div class="metric-label">线性功率</div>
                  <div class="metric-value">{{ opmState.linearPower }}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">参考值</div>
                  <div class="metric-value">{{ referenceDisplay }}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">相对功率</div>
                  <div class="metric-value">{{ relativeDisplay }}</div>
                </div>
              </div>
            </div>
          </section>

          <section class="probe-card" aria-label="光功率探头能力">
            <button type="button" :class="{ active: probeMode === 'standard' }" @click="setProbeMode('standard')"><span>标准量程探头</span><strong>-70 ~ +10dBm</strong></button>
            <button type="button" :class="{ active: probeMode === 'high' }" @click="setProbeMode('high')"><span>高量程探头</span><strong>-50 ~ +26dBm</strong></button>
            <div class="probe-status"><span>当前探头</span><strong>{{ probeMode === 'standard' ? '标准量程 · 已识别' : '高量程 · 已识别（演示）' }}</strong></div>
          </section>

          <section v-if="opmState.viewState !== 'calibration'" class="operation-card">
            <div class="card-head">
              <div class="card-title-group">
                <h3 class="section-title">功能操作</h3>
              </div>
            </div>

            <div class="action-grid">
              <button
                class="action-primary"
                type="button"
                @click="opmState.viewState === 'off' ? openDevice() : closeDevice()"
              >
                {{ opmState.viewState === 'off' ? '开启' : '关闭' }}
              </button>

              <button class="action-secondary" type="button" @click="cycleWavelength">
                波长切换
              </button>

              <button class="action-secondary" type="button" @click="cycleDisplayUnit">
                单位切换 · {{ opmState.displayUnit }}
              </button>

              <button
                class="action-secondary"
                type="button"
                :disabled="opmState.viewState !== 'on'"
                @click="recognizeFrequency"
              >
                重新识别 · {{ opmState.frequencyMode }}
              </button>

              <button
                class="action-secondary"
                type="button"
                :disabled="opmState.viewState !== 'on' || isSettingReference"
                @click="setReferenceValue"
              >
                {{ isSettingReference ? '设置中...' : '设为参考' }}
              </button>

              <button
                class="action-secondary"
                type="button"
                :disabled="opmState.viewState !== 'on' || isResettingReference"
                @click="resetReferenceValue"
              >
                {{ isResettingReference ? '清零中...' : '参考置零' }}
              </button>

              <button
                class="action-secondary"
                type="button"
                :disabled="opmState.viewState !== 'on'"
                @click="enterCalibration"
              >
                校准
              </button>
            </div>

            <button class="exit-btn" type="button" @click="goBack">
              退出
            </button>
          </section>

          <section v-else class="calibration-card">
            <div class="card-head">
              <div class="card-title-group">
                <h3 class="section-title">校准</h3>
              </div>
              <div class="status-badge calibration">校准中</div>
            </div>

            <div class="calibration-panel">
              <div class="calibration-info">
                <div class="calibration-label">校准波长</div>
                <div class="calibration-chip">{{ opmState.wavelength }}nm</div>
              </div>

              <div class="calibration-wavelengths">
                <button
                  v-for="wavelength in wavelengths"
                  :key="`cal-${wavelength}`"
                  class="calibration-wave-btn"
                  :class="{ active: opmState.wavelength === wavelength }"
                  type="button"
                  @click="setCalibrationWavelength(wavelength)"
                >
                  {{ wavelength }}nm
                </button>
              </div>

              <div class="calibration-stepper">
                <button class="stepper-btn" type="button" @click="changeCalibration(-0.1)">-</button>
                <div class="calibration-value">{{ opmState.calibrationValue.toFixed(2) }}</div>
                <button class="stepper-btn" type="button" @click="changeCalibration(0.1)">+</button>
              </div>

              <div class="calibration-tip">
                当前保存偏移：{{ opmState.appliedCalibrationOffset.toFixed(2) }}
              </div>

              <div class="calibration-actions">
                <button class="action-primary" type="button" :disabled="isSavingCalibration" @click="saveCalibration">
                  {{ isSavingCalibration ? '保存中...' : '保存' }}
                </button>
                <button class="action-secondary" type="button" @click="exitCalibration">
                  返回
                </button>
              </div>
            </div>
          </section>
        </main>
      </SmartOtdrPageShell>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SmartOtdrPageShell from '../components/SmartOtdrPageShell.vue'

type SmartOpmViewState = 'off' | 'on' | 'calibration'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const wavelengths = [850, 980, 1270, 1300, 1310, 1490, 1550, 1577, 1625, 1650]
const displayUnits = ['dBm', 'mW', 'uW'] as const
const detectedFrequencyMap: Record<number, 'CW' | '270Hz' | '330Hz' | '1kHz' | '2kHz'> = {
  850: '270Hz', 980: '330Hz', 1270: '1kHz', 1300: '2kHz', 1310: '270Hz',
  1490: '330Hz', 1550: '1kHz', 1577: '2kHz', 1625: '270Hz', 1650: 'CW'
}
const probeMode = ref<'standard' | 'high'>('standard')

const opmState = reactive({
  viewState: 'off' as SmartOpmViewState,
  wavelength: 850,
  displayUnit: 'dBm',
  rawPowerDbm: null as number | null,
  powerValue: '--',
  linearPower: '--',
  referenceValue: '0.00',
  relativePower: '--',
  frequencyMode: 'CW',
  calibrationValue: 0,
  appliedCalibrationOffset: 0
})

const isSettingReference = ref(false)
const isResettingReference = ref(false)
const isSavingCalibration = ref(false)

const stateText = computed(() => {
  if (opmState.viewState === 'off') return '关闭'
  if (opmState.viewState === 'calibration') return '校准'
  return '开启'
})

const pageDescription = computed(() => {
  if (opmState.viewState === 'off') return '开启后显示测量读数'
  if (opmState.viewState === 'calibration') return '保存后返回测量'
  return '波长 · 参考值 · 校准'
})

const referenceDisplay = computed(() => `${opmState.referenceValue}dBm`)
const relativeDisplay = computed(() => (opmState.relativePower === '--' ? '--' : `${opmState.relativePower}dB`))

const goBack = () => {
  router.push(`/device/${String(route.params.id || '')}`)
}

const formatLinearPower = (powerDbm: number) => {
  const milliWatt = Math.pow(10, powerDbm / 10)
  if (milliWatt < 0.001) return `${(milliWatt * 1000).toFixed(3)}uW`
  return `${milliWatt.toFixed(4)}mW`
}

const formatDisplayValue = (powerDbm: number) => {
  if (opmState.displayUnit === 'dBm') return powerDbm.toFixed(2)
  const milliWatt = Math.pow(10, powerDbm / 10)
  if (opmState.displayUnit === 'mW') return milliWatt.toFixed(milliWatt < 0.001 ? 6 : 4)
  return (milliWatt * 1000).toFixed(milliWatt < 0.001 ? 3 : 2)
}

const buildMockReading = () => {
  const wavelengthOffsetMap: Record<number, number> = {
    850: 0.6,
    980: 0.42,
    1270: -0.12,
    1300: -0.25,
    1310: -0.15,
    1490: 0.2,
    1550: 0,
    1577: -0.08,
    1625: -0.45,
    1650: -0.52
  }

  const baseValue = -50 + Math.random() * 2.4 + (wavelengthOffsetMap[opmState.wavelength] ?? 0)
  const powerDbm = Number((baseValue + opmState.appliedCalibrationOffset).toFixed(2))
  const referenceValue = Number(opmState.referenceValue || 0)
  const relativePower = Number((powerDbm - referenceValue).toFixed(2))

  return {
    rawPowerDbm: powerDbm,
    powerValue: formatDisplayValue(powerDbm),
    linearPower: formatLinearPower(powerDbm),
    relativePower: relativePower.toFixed(2)
  }
}

const applyMockReading = () => {
  const next = buildMockReading()
  opmState.rawPowerDbm = next.rawPowerDbm
  opmState.powerValue = next.powerValue
  opmState.linearPower = next.linearPower
  opmState.relativePower = next.relativePower
}

const openDevice = () => {
  opmState.viewState = 'on'
  applyMockReading()
  recognizeFrequency()
}

const closeDevice = () => {
  opmState.viewState = 'off'
  opmState.rawPowerDbm = null
  opmState.powerValue = '--'
  opmState.linearPower = '--'
  opmState.relativePower = '--'
}

const refreshDisplayedReading = () => {
  if (opmState.rawPowerDbm === null) return
  opmState.powerValue = formatDisplayValue(opmState.rawPowerDbm)
}

const cycleDisplayUnit = () => {
  const currentIndex = displayUnits.indexOf(opmState.displayUnit as typeof displayUnits[number])
  opmState.displayUnit = displayUnits[(currentIndex + 1) % displayUnits.length]
  refreshDisplayedReading()
}

const recognizeFrequency = () => {
  if (opmState.viewState !== 'on') return
  opmState.frequencyMode = detectedFrequencyMap[opmState.wavelength] || 'CW'
}

const setProbeMode = (mode: 'standard' | 'high') => {
  probeMode.value = mode
  if (opmState.viewState === 'on') applyMockReading()
}

const cycleWavelength = () => {
  const currentIndex = wavelengths.indexOf(opmState.wavelength)
  const nextIndex = (currentIndex + 1) % wavelengths.length
  opmState.wavelength = wavelengths[nextIndex]

  if (opmState.viewState === 'on') {
    applyMockReading()
    recognizeFrequency()
  }
}

const setCalibrationWavelength = (wavelength: number) => {
  opmState.wavelength = wavelength

  if (opmState.powerValue !== '--') {
    applyMockReading()
  }
}

const setReferenceValue = async () => {
  if (opmState.viewState !== 'on' || opmState.powerValue === '--') return

  isSettingReference.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 120))
    opmState.referenceValue = (opmState.rawPowerDbm ?? 0).toFixed(2)
    opmState.relativePower = '0.00'
  } finally {
    isSettingReference.value = false
  }
}

const resetReferenceValue = async () => {
  if (opmState.viewState !== 'on') return

  isResettingReference.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 120))
    opmState.referenceValue = '0.00'
    opmState.relativePower = opmState.rawPowerDbm === null ? '--' : opmState.rawPowerDbm.toFixed(2)
  } finally {
    isResettingReference.value = false
  }
}

const enterCalibration = () => {
  if (opmState.viewState !== 'on') return
  opmState.calibrationValue = opmState.appliedCalibrationOffset
  opmState.viewState = 'calibration'
}

const exitCalibration = () => {
  opmState.viewState = 'on'
}

const changeCalibration = (delta: number) => {
  opmState.calibrationValue = Number((opmState.calibrationValue + delta).toFixed(2))
}

const saveCalibration = async () => {
  isSavingCalibration.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    opmState.appliedCalibrationOffset = opmState.calibrationValue
    opmState.viewState = 'on'
    applyMockReading()
  } finally {
    isSavingCalibration.value = false
  }
}

onMounted(() => {
  opmState.viewState = 'off'
  opmState.rawPowerDbm = null
  opmState.powerValue = '--'
  opmState.linearPower = '--'
  opmState.relativePower = '--'
})
</script>

<style scoped lang="scss">
@use '../components/smartOtdrUi.scss' as ui;

.opm-app-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: linear-gradient(180deg, #f6f8fc 0%, #edf3ff 100%);
}

.content-flex {
  flex: 1;
  display: flex;
  justify-content: center;
  overflow-y: auto;
  padding: 0;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.opm-app-page :deep(.smart-otdr-shell) {
  border-radius: 0;
  border: 0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: none;
  overflow: hidden;
}

.opm-app-page :deep(.smart-otdr-shell__header) {
  padding: 14px 16px 10px;
}

.opm-app-page :deep(.smart-otdr-shell__body) {
  padding: 8px 16px 110px;
}

.opm-app-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.probe-card {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  overflow: hidden;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
  background: #ffffff;
}
.probe-card > button { min-height: 58px; display: grid; align-content: center; gap: 4px; padding: 8px 10px; border: 0; border-right: 1px solid #e2e8f0; background: #fff; text-align: left; }
.probe-card > button:nth-child(2) { border-right: 0; }
.probe-card > button.active { background: #eff6ff; box-shadow: inset 0 0 0 1px #60a5fa; }
.probe-card .probe-status { grid-column: 1 / -1; min-height: 44px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
.probe-card span { color: #64748b; font-size: 10px; }
.probe-card strong { color: #0f172a; font-size: 11px; font-variant-numeric: tabular-nums; }
.probe-card > button.active strong { color: #2563eb; }

.reading-card,
.operation-card,
.calibration-card {
  @include ui.smart-otdr-app-surface;
  border-color: rgba(59, 130, 246, 0.10);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
  padding: 16px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-title-group {
  min-width: 0;
}

.section-desc {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.status-badge {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: #e2e8f0;
  color: #475569;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.status-badge.on {
  background: #eff6ff;
  color: #2563eb;
  border-color: rgba(59, 130, 246, 0.12);
}

.status-badge.calibration {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: rgba(59, 130, 246, 0.12);
}

.meter-screen {
  margin-top: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #07162f 0%, #0b2144 100%);
  color: #dbe7ff;
  padding: 16px;
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.12);
}

.screen-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: rgba(219, 231, 255, 0.78);
}

.screen-mode {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.16);
}

.screen-mode.on {
  background: rgba(234, 179, 8, 0.24);
  color: #fcd34d;
}

.screen-mode.calibration {
  background: rgba(59, 130, 246, 0.24);
  color: #93c5fd;
}

.screen-reading {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  padding: 26px 0 18px;
}

.reading-number {
  font-size: 46px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
  color: #f8fbff;
  font-variant-numeric: tabular-nums;
}

.reading-unit {
  font-size: 16px;
  font-weight: 700;
  color: #7dd3fc;
}

.screen-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 6px;
}

.metric-item {
  padding: 10px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.26);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.metric-label {
  font-size: 11px;
  color: rgba(219, 231, 255, 0.66);
  margin-bottom: 6px;
}

.metric-value {
  font-size: 13px;
  font-weight: 700;
  color: #f8fbff;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.action-primary,
.action-secondary,
.exit-btn,
.calibration-wave-btn,
.stepper-btn {
  min-height: 48px;
  border-radius: 14px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.action-primary {
  grid-column: 1 / -1;
  @include ui.smart-otdr-primary-button;
}

.action-secondary,
.exit-btn,
.calibration-wave-btn,
.stepper-btn {
  @include ui.smart-otdr-secondary-button;
}

.exit-btn {
  width: 100%;
  margin-top: 12px;
  color: #475569;
}

.action-primary:disabled,
.action-secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.calibration-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 14px;
}

.calibration-info {
  @include ui.smart-otdr-soft-surface;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
}

.calibration-label {
  font-size: 13px;
  color: #64748b;
}

.calibration-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.calibration-wavelengths {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.calibration-wave-btn {
  font-size: 12px;
  font-weight: 700;
}

.calibration-wave-btn.active {
  @include ui.smart-otdr-primary-button;
  color: #ffffff;
}

.calibration-stepper {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  gap: 12px;
  align-items: center;
}

.stepper-btn {
  width: 44px;
  height: 44px;
  font-size: 24px;
  line-height: 1;
}

.calibration-value {
  @include ui.smart-otdr-soft-surface;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.calibration-tip {
  font-size: 12px;
  color: #64748b;
}

.calibration-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 768px) {
  .card-head,
  .calibration-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .screen-head {
    flex-wrap: wrap;
  }

  .screen-metrics,
  .action-grid,
  .calibration-actions,
  .calibration-wavelengths {
    grid-template-columns: 1fr;
  }

  .action-primary {
    grid-column: auto;
  }
}

@media (max-width: 520px) {
  .content-flex {
    padding: 0 0 20px;
  }

  .opm-app-page :deep(.smart-otdr-shell__header) {
    padding: 12px 14px 8px;
  }

  .opm-app-page :deep(.smart-otdr-shell__body) {
    padding: 8px 14px 110px;
  }

  .reading-number {
    font-size: 40px;
  }

  .screen-reading {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

/* Align the smart OTDR tools with the 10GPON mobile instrument language. */
.opm-app-page { background: #f7f9fc; }
.opm-app-page :deep(.smart-otdr-shell__body) { padding: 14px; }
.opm-app-main { gap: 12px; }
.reading-card,
.operation-card,
.calibration-card {
  padding: 12px;
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: none;
}
.reading-card { padding: 0; overflow: hidden; }
.reading-card > .card-head { min-height: 44px; padding: 0 14px; border-bottom: 1px solid #e6edf7; }
.reading-card .section-title { color: #1d4ed8; font-size: 13px; }
.reading-card .section-desc { display: none; }
.status-badge { padding: 4px 9px; border-radius: 6px; font-size: 10px; }
.meter-screen {
  margin: 0;
  padding: 0;
  border-radius: 0;
  background: #ffffff;
  color: #0f172a;
  box-shadow: none;
}
.screen-head { min-height: 38px; padding: 0 14px; color: #2563eb; }
.screen-mode { background: #eef2f7; color: #64748b; }
.screen-mode.on { background: #eff6ff; color: #1d4ed8; }
.screen-reading { min-height: 112px; padding: 12px 14px; }
.reading-number { color: #1d4ed8; font-size: 44px; }
.reading-unit { color: #0f172a; font-size: 15px; }
.screen-metrics { gap: 0; margin: 0; border-top: 1px solid #e6edf7; }
.metric-item { padding: 11px 8px; border: 0; border-right: 1px solid #e6edf7; border-radius: 0; background: #ffffff; text-align: center; }
.metric-item:last-child { border-right: 0; }
.metric-label { color: #64748b; font-size: 10px; }
.metric-value { color: #0f172a; font-size: 11px; }
.operation-card .section-title,
.calibration-card .section-title { font-size: 14px; }
.action-grid { gap: 8px; margin-top: 10px; }
.action-primary,
.action-secondary,
.exit-btn,
.calibration-wave-btn,
.stepper-btn { min-height: 44px; border-radius: 8px; font-size: 12px; }
.action-primary { box-shadow: 0 6px 14px rgba(37, 99, 235, 0.18); }
.exit-btn { margin-top: 8px; }

@media (max-width: 520px) {
  .opm-app-page :deep(.smart-otdr-shell__body) { padding: 14px; }
  .screen-metrics,
  .action-grid,
  .calibration-actions,
  .calibration-wavelengths { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .screen-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .action-primary { grid-column: 1 / -1; }
}
</style>
