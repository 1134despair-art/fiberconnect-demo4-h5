<template>
  <section class="parameter-panel">
    <section class="setting-group-card">
      <header class="setting-group-card__head">
        <h3>波长</h3>
      </header>
      <div class="setting-group-card__body">
        <div class="setting-choice-list">
          <label v-for="option in wavelengthOptions" :key="option" class="setting-choice-row">
            <div class="setting-choice-main">
              <input
                :checked="form.wavelength === option"
                :disabled="disabled"
                type="radio"
                name="wavelength"
                @change="updateField('wavelength', option)"
              />
              <span>{{ option }}</span>
            </div>
          </label>
        </div>
      </div>
    </section>

    <section class="setting-group-card">
      <header class="setting-group-card__head">
        <h3>测量范围</h3>
      </header>
      <div class="setting-group-card__body">
        <div class="setting-choice-list scrollable-list">
          <label v-for="option in rangeOptions" :key="option" class="setting-choice-row">
            <div class="setting-choice-main">
              <input
                :checked="form.range === option"
                :disabled="disabled"
                type="radio"
                name="range"
                @change="updateField('range', option)"
              />
              <span>{{ option }}</span>
            </div>
          </label>
        </div>
      </div>
    </section>

    <section class="setting-group-card">
      <header class="setting-group-card__head">
        <h3>测量脉宽</h3>
      </header>
      <div class="setting-group-card__body">
        <div class="setting-choice-list scrollable-list">
          <label v-for="option in pulseOptions" :key="option" class="setting-choice-row">
            <div class="setting-choice-main">
              <input
                :checked="form.pulseWidth === option"
                :disabled="disabled"
                type="radio"
                name="pulseWidth"
                @change="updateField('pulseWidth', option)"
              />
              <span>{{ option }}</span>
            </div>
          </label>
        </div>
      </div>
    </section>

    <section class="setting-group-card">
      <header class="setting-group-card__head">
        <h3>测量模式</h3>
      </header>
      <div class="setting-group-card__body">
        <div class="setting-choice-list">
          <label v-for="option in measurementModeOptions" :key="option.value" class="setting-choice-row">
            <div class="setting-choice-main">
              <input
                :checked="form.measurementMode === option.value"
                :disabled="disabled"
                type="radio"
                name="measurementMode"
                @change="updateField('measurementMode', option.value)"
              />
              <span>{{ option.label }}</span>
            </div>
          </label>
        </div>
        <p class="setting-group-hint">
          {{ form.measurementMode === 'real-time' ? '持续采集，需手动结束测量' : '按设定时间完成平均测量' }}
        </p>
      </div>
    </section>

    <section class="setting-group-card">
      <header class="setting-group-card__head">
        <h3>测量时间</h3>
      </header>
      <div class="setting-group-card__body">
        <div class="setting-choice-list">
          <label
            v-for="option in measureTimeOptions"
            :key="option.value"
            class="setting-choice-row"
            :class="{ 'setting-choice-row--input': option.value === 'custom' }"
          >
            <div class="setting-choice-main">
              <input
                :checked="form.measureTimeMode === option.value"
                :disabled="disabled || form.measurementMode === 'real-time'"
                type="radio"
                name="measureTime"
                @change="updateField('measureTimeMode', option.value)"
              />
              <span>{{ option.label }}</span>
            </div>
            <div v-if="option.value === 'custom'" class="setting-inline-field">
              <input
                :value="form.customMeasureSeconds"
                class="setting-input"
                :disabled="disabled || form.measurementMode === 'real-time' || form.measureTimeMode !== 'custom'"
                min="1"
                max="3600"
                inputmode="numeric"
                type="number"
                @input="updateField('customMeasureSeconds', ($event.target as HTMLInputElement).value)"
              />
              <span class="setting-unit">S</span>
            </div>
          </label>
        </div>
      </div>
    </section>

    <section class="setting-group-card">
      <header class="setting-group-card__head">
        <h3>折射率</h3>
      </header>
      <div class="setting-group-card__body">
        <div class="setting-field-stack">
          <label class="setting-field-row">
            <span class="setting-field-label">1310nm</span>
            <input
              :value="form.refractiveIndex1310"
              class="setting-input"
              :disabled="disabled"
              min="1"
              max="2"
              step="0.000001"
              inputmode="decimal"
              type="number"
              @input="updateField('refractiveIndex1310', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="setting-field-row">
            <span class="setting-field-label">1550nm</span>
            <input
              :value="form.refractiveIndex1550"
              class="setting-input"
              :disabled="disabled"
              min="1"
              max="2"
              step="0.000001"
              inputmode="decimal"
              type="number"
              @input="updateField('refractiveIndex1550', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
      </div>
    </section>

    <section class="setting-group-card">
      <header class="setting-group-card__head">
        <h3>引导光纤</h3>
      </header>
      <div class="setting-group-card__body">
        <div class="setting-choice-list">
          <label class="setting-choice-row">
            <div class="setting-choice-main">
              <input
                :checked="form.launchFiberMode === 'none'"
                :disabled="disabled"
                type="radio"
                name="launchFiber"
                @change="updateField('launchFiberMode', 'none')"
              />
              <span>无</span>
            </div>
          </label>

          <label class="setting-choice-row setting-choice-row--input">
            <div class="setting-choice-main">
              <input
                :checked="form.launchFiberMode === 'length'"
                :disabled="disabled"
                type="radio"
                name="launchFiber"
                @change="updateField('launchFiberMode', 'length')"
              />
              <span>长度</span>
            </div>
            <div class="setting-inline-field">
              <input
                :value="form.launchFiberValue"
                class="setting-input"
                :disabled="disabled || form.launchFiberMode !== 'length'"
                type="text"
                @input="updateField('launchFiberValue', ($event.target as HTMLInputElement).value)"
              />
              <span class="setting-unit">m</span>
            </div>
          </label>

          <label class="setting-choice-row setting-choice-row--input">
            <div class="setting-choice-main">
              <input
                :checked="form.launchFiberMode === 'event'"
                :disabled="disabled"
                type="radio"
                name="launchFiber"
                @change="updateField('launchFiberMode', 'event')"
              />
              <span>事件编号</span>
            </div>
            <div class="setting-inline-field">
              <input
                :value="form.launchFiberValue"
                class="setting-input"
                :disabled="disabled || form.launchFiberMode !== 'event'"
                type="text"
                @input="updateField('launchFiberValue', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </label>
        </div>
      </div>
    </section>

    <section class="setting-group-card capability-card">
      <header class="setting-group-card__head">
        <h3>探头与分辨率</h3>
      </header>
      <div class="capability-list">
        <div><span>APD 高压补偿</span><strong>自动</strong></div>
        <div><span>探头批次</span><strong>APD-A01</strong></div>
        <div><span>温度补偿</span><strong>28°C · 正常</strong></div>
        <div><span>距离分辨率</span><strong>&lt; 0.25m</strong></div>
      </div>
      <p class="setting-group-hint">高压偏置随探头批次与温度自动校正。</p>
    </section>

    <section class="setting-group-card">
      <header class="setting-group-card__head">
        <h3>接收光纤</h3>
      </header>
      <div class="setting-group-card__body">
        <div class="setting-choice-list">
          <label class="setting-choice-row">
            <div class="setting-choice-main">
              <input
                :checked="form.receiveFiberMode === 'none'"
                :disabled="disabled"
                type="radio"
                name="receiveFiber"
                @change="updateField('receiveFiberMode', 'none')"
              />
              <span>无</span>
            </div>
          </label>

          <label class="setting-choice-row setting-choice-row--input">
            <div class="setting-choice-main">
              <input
                :checked="form.receiveFiberMode === 'length'"
                :disabled="disabled"
                type="radio"
                name="receiveFiber"
                @change="updateField('receiveFiberMode', 'length')"
              />
              <span>长度</span>
            </div>
            <div class="setting-inline-field">
              <input
                :value="form.receiveFiberValue"
                class="setting-input"
                :disabled="disabled || form.receiveFiberMode !== 'length'"
                type="text"
                @input="updateField('receiveFiberValue', ($event.target as HTMLInputElement).value)"
              />
              <span class="setting-unit">m</span>
            </div>
          </label>

          <label class="setting-choice-row setting-choice-row--input">
            <div class="setting-choice-main">
              <input
                :checked="form.receiveFiberMode === 'event'"
                :disabled="disabled"
                type="radio"
                name="receiveFiber"
                @change="updateField('receiveFiberMode', 'event')"
              />
              <span>事件编号</span>
            </div>
            <div class="setting-inline-field">
              <input
                :value="form.receiveFiberValue"
                class="setting-input"
                :disabled="disabled || form.receiveFiberMode !== 'event'"
                type="text"
                @input="updateField('receiveFiberValue', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </label>
        </div>
      </div>
    </section>

    <section class="setting-group-card">
      <header class="setting-group-card__head">
        <h3>单位</h3>
      </header>
      <div class="setting-group-card__body">
        <div class="setting-choice-list">
          <label v-for="option in unitOptions" :key="option" class="setting-choice-row">
            <div class="setting-choice-main">
              <input
                :checked="form.unit === option"
                :disabled="disabled"
                type="radio"
                name="unit"
                @change="updateField('unit', option)"
              />
              <span>{{ option }}</span>
            </div>
          </label>
        </div>
      </div>
    </section>

    <div class="parameter-action-stack">
      <section class="calibration-panel">
        <div class="action-copy">
          <div class="action-title">{{ t('deviceDetail.smartOtdrConfigCalibration') }}</div>
          <div class="action-state">{{ calibrationState.result || '未校准' }}</div>
          <div v-if="calibrationState.lastCalibratedAt" class="action-desc">{{ calibrationState.lastCalibratedAt }}</div>
        </div>
        <button class="secondary-btn" type="button" :disabled="disabled || calibrationState.loading" @click="$emit('request-calibration')">
          {{ calibrationState.loading ? t('deviceDetail.smartOtdrCalibrationLoading') : t('deviceDetail.smartOtdrConfigCalibration') }}
        </button>
      </section>

      <section class="save-bar" :class="statusToneClass">
        <div class="action-copy">
          <div class="action-title">{{ dirty ? '待保存' : '已保存' }}</div>
          <div class="action-desc">{{ statusText }}</div>
          <div v-if="savedAt" class="action-desc">{{ savedAt }}</div>
        </div>
        <button class="primary-btn" type="button" :disabled="disabled || !dirty" @click="$emit('save')">
          保存
        </button>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  CalibrationState,
  DistanceUnit,
  MeasurementMode,
  MeasureTimeMode,
  OtdrConfigUsageNotice,
  ParameterForm,
  PulseWidthOption,
  RangeOption,
  WavelengthOption
} from './smartOtdrTypes'

interface Props {
  form: ParameterForm
  disabled: boolean
  calibrationState: CalibrationState
  dirty: boolean
  savedAt: string
  statusText: string
  statusTone: OtdrConfigUsageNotice['tone']
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:form', payload: Partial<ParameterForm>): void
  (e: 'request-calibration'): void
  (e: 'save'): void
}>()

const { t } = useI18n()

const wavelengthOptions: WavelengthOption[] = ['1310nm', '1550nm', '1310+1550']
const rangeOptions: RangeOption[] = ['100m', '500m', '1km', '2km', '5km', '10km', '20km', '40km', '60km', '90km', '100km', '120km', '150km', '200km']
const pulseOptions: PulseWidthOption[] = ['5ns', '10ns', '20ns', '50ns', '100ns', '275ns', '500ns', '1us', '2us', '5us', '10us']
const unitOptions: DistanceUnit[] = ['km', 'kfeet', 'miles']
const measurementModeOptions: Array<{ label: string; value: MeasurementMode }> = [
  { label: '平均测量', value: 'average' },
  { label: '实时测量', value: 'real-time' }
]
const measureTimeOptions: Array<{ label: string; value: MeasureTimeMode }> = [
  { label: '10s', value: '10s' },
  { label: '15s', value: '15s' },
  { label: '30s', value: '30s' },
  { label: t('deviceDetail.smartOtdrMeasureCustom'), value: 'custom' }
]

const statusToneClass = computed(() => {
  if (props.statusTone === 'warning') return 'warning'
  if (props.statusTone === 'success') return 'success'
  return 'default'
})

const updateField = <K extends keyof ParameterForm>(field: K, value: ParameterForm[K]) => {
  emit('update:form', {
    [field]: value
  } as Partial<ParameterForm>)
}
</script>

<style scoped lang="scss">
@use './smartOtdrUi.scss' as ui;

.parameter-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 12px;
}

.setting-group-card {
  @include ui.smart-otdr-setting-card;
  min-width: 0;
  padding: 12px;
  border-radius: 10px;
  box-shadow: none;
}

.setting-group-card__head h3,
.action-title,
.action-state {
  margin: 0;
  color: #0f172a;
}

.setting-group-card__head h3,
.action-title {
  font-size: 14px;
  font-weight: 700;
}

.setting-group-card__body {
  margin-top: 10px;
}

.setting-group-hint {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.capability-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin-top: 10px;
  overflow: hidden;
  border: 1px solid #dfe7f2;
  border-radius: 8px;
  background: #dfe7f2;
}

.capability-list div {
  min-width: 0;
  min-height: 52px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 8px 10px;
  background: #f8fafc;
}

.capability-list span { color: #64748b; font-size: 11px; }
.capability-list strong { color: #0f172a; font-size: 12px; font-variant-numeric: tabular-nums; }

.setting-choice-list,
.setting-field-stack,
.parameter-action-stack {
  display: grid;
  gap: 8px;
}

.setting-choice-list { grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); }
.setting-field-stack { grid-template-columns: repeat(2, minmax(0, 1fr)); }

.scrollable-list {
  max-height: none;
  overflow: visible;
  padding-right: 0;
}

.setting-choice-row,
.setting-field-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #dfe7f2;
  color: #0f172a;
  font-size: 14px;
}

.setting-choice-row {
  justify-content: space-between;
}

.setting-choice-row--input,
.setting-field-row {
  grid-column: 1 / -1;
  align-items: center;
}

.setting-choice-row--input { flex-direction: column; align-items: stretch; }
.setting-field-row { flex-direction: column; align-items: stretch; }

.setting-choice-main,
.setting-inline-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-choice-main {
  width: 100%;
}

.setting-inline-field {
  width: 100%;
}

.setting-field-label {
  color: #334155;
  font-weight: 600;
}

.setting-input {
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(59, 130, 246, 0.12);
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
}

.setting-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.setting-choice-row input[type='radio'] {
  margin: 0;
  accent-color: #3b82f6;
}

.setting-unit,
.action-desc {
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.parameter-action-stack {
  grid-column: 1 / -1;
  padding-top: 2px;
}

.calibration-panel,
.save-bar {
  @include ui.smart-otdr-sticky-action-surface;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
}

.save-bar.warning {
  border-color: #fed7aa;
}

.save-bar.success {
  border-color: #bbf7d0;
}

.action-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-state {
  font-size: 16px;
  font-weight: 700;
}

.primary-btn,
.secondary-btn {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.primary-btn {
  @include ui.smart-otdr-primary-button;
}

.secondary-btn {
  @include ui.smart-otdr-secondary-button;
}

.primary-btn:disabled,
.secondary-btn:disabled,
.setting-input:disabled,
.setting-choice-row input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (min-width: 601px), (orientation: landscape) {
  .parameter-panel {
    gap: 8px;
    padding-bottom: 2px;
  }

  .setting-group-card {
    padding: 10px;
    border-radius: 8px;
  }

  .setting-group-card__head h3,
  .action-title {
    font-size: 12px;
  }

  .setting-group-card__body {
    margin-top: 7px;
  }

  .setting-choice-list,
  .setting-field-stack,
  .parameter-action-stack {
    gap: 6px;
  }

  .setting-choice-list {
    grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
  }

  .setting-choice-row,
  .setting-field-row {
    min-height: 40px;
    padding: 6px 8px;
    gap: 6px;
    font-size: 12px;
  }

  .setting-choice-row--input,
  .setting-field-row {
    flex-direction: row;
    align-items: center;
  }

  .setting-choice-row--input .setting-choice-main {
    width: auto;
    min-width: 74px;
  }

  .setting-inline-field {
    min-width: 0;
  }

  .setting-input {
    height: 36px;
    padding: 0 9px;
    font-size: 12px;
  }

  .parameter-action-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    position: sticky;
    bottom: -4px;
    z-index: 2;
    padding: 6px 0 2px;
    background: #f7f9fc;
  }

  .calibration-panel,
  .save-bar {
    min-height: 58px;
    padding: 8px 10px;
    border-radius: 8px;
  }

  .action-state {
    font-size: 13px;
  }

  .action-desc {
    line-height: 1.35;
  }

  .primary-btn,
  .secondary-btn {
    min-height: 40px;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 12px;
  }
}

@media (max-width: 520px) {
  .parameter-panel,
  .setting-field-stack {
    grid-template-columns: 1fr;
  }

  .setting-choice-main,
  .setting-inline-field,
  .calibration-panel,
  .save-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .primary-btn,
  .secondary-btn {
    width: 100%;
  }
}
</style>
