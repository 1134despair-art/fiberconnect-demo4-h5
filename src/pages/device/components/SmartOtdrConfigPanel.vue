<template>
  <section v-if="activePanel !== 'none'" class="config-panel">
    <div class="config-head">
      <div>
        <div class="config-title">{{ panelTitle }}</div>
        <div class="config-subtitle">{{ t('deviceDetail.smartOtdrConfigHint') }}</div>
      </div>
      <button class="close-btn" type="button" @click="emit('close')">
        {{ t('common.close') }}
      </button>
    </div>

    <div v-if="activePanel === 'wavelength'" class="option-list">
      <button class="option-btn" type="button" @click="apply({ wavelength: '1310nm' })">1310nm</button>
      <button class="option-btn" type="button" @click="apply({ wavelength: '1550nm' })">1550nm</button>
      <button class="option-btn" type="button" @click="apply({ wavelength: '1310/1550nm' })">1310/1550nm</button>
    </div>

    <div v-else-if="activePanel === 'range'" class="option-list">
      <button class="option-btn" type="button" @click="apply({ range: '自动' })">自动</button>
      <button class="option-btn" type="button" @click="apply({ range: '500m' })">500m</button>
      <button class="option-btn" type="button" @click="apply({ range: '1km' })">1km</button>
      <button class="option-btn" type="button" @click="apply({ range: '2km' })">2km</button>
      <button class="option-btn" type="button" @click="apply({ range: '5km' })">5km</button>
      <button class="option-btn" type="button" @click="apply({ range: '10km' })">10km</button>
      <button class="option-btn" type="button" @click="apply({ range: '20km' })">20km</button>
      <button class="option-btn" type="button" @click="apply({ range: '50km' })">50km</button>
      <button class="option-btn" type="button" @click="apply({ range: '100km' })">100km</button>
    </div>

    <div v-else-if="activePanel === 'pulse'" class="option-list">
      <button class="option-btn" type="button" @click="apply({ pulseWidth: '5ns' })">5ns</button>
      <button class="option-btn" type="button" @click="apply({ pulseWidth: '10ns' })">10ns</button>
      <button class="option-btn" type="button" @click="apply({ pulseWidth: '30ns' })">30ns</button>
      <button class="option-btn" type="button" @click="apply({ pulseWidth: '50ns' })">50ns</button>
      <button class="option-btn" type="button" @click="apply({ pulseWidth: '100ns' })">100ns</button>
      <button class="option-btn" type="button" @click="apply({ pulseWidth: '500ns' })">500ns</button>
      <button class="option-btn" type="button" @click="apply({ pulseWidth: '1us' })">1us</button>
    </div>

    <div v-else-if="activePanel === 'duration'" class="option-list">
      <button class="option-btn" type="button" @click="apply({ duration: '5s' })">5s</button>
      <button class="option-btn" type="button" @click="apply({ duration: '10s' })">10s</button>
      <button class="option-btn" type="button" @click="apply({ duration: '15s' })">15s</button>
      <button class="option-btn" type="button" @click="apply({ duration: '30s' })">30s</button>
      <button class="option-btn" type="button" @click="apply({ duration: '60s' })">60s</button>
      <button class="option-btn" type="button" @click="apply({ duration: '90s' })">90s</button>
    </div>

    <div v-else-if="activePanel === 'attenuation'" class="preset-panel">
      <div class="preset-current">{{ t('deviceDetail.smartOtdrCurrentValue') }}：{{ form.attenuationThreshold }}</div>
      <div class="option-list">
        <button class="option-btn" type="button" @click="apply({ attenuationThreshold: '0.10dB' })">0.10dB</button>
        <button class="option-btn" type="button" @click="apply({ attenuationThreshold: '0.20dB' })">0.20dB</button>
        <button class="option-btn" type="button" @click="apply({ attenuationThreshold: '0.30dB' })">0.30dB</button>
        <button class="option-btn" type="button" @click="apply({ attenuationThreshold: '0.50dB' })">0.50dB</button>
      </div>
    </div>

    <div v-else-if="activePanel === 'reflect'" class="preset-panel">
      <div class="preset-current">{{ t('deviceDetail.smartOtdrCurrentValue') }}：{{ form.reflectThreshold }}</div>
      <div class="option-list">
        <button class="option-btn" type="button" @click="apply({ reflectThreshold: '-30dB' })">-30dB</button>
        <button class="option-btn" type="button" @click="apply({ reflectThreshold: '-35dB' })">-35dB</button>
        <button class="option-btn" type="button" @click="apply({ reflectThreshold: '-40dB' })">-40dB</button>
        <button class="option-btn" type="button" @click="apply({ reflectThreshold: '-45dB' })">-45dB</button>
      </div>
    </div>

    <div v-else-if="activePanel === 'end'" class="preset-panel">
      <div class="preset-current">{{ t('deviceDetail.smartOtdrCurrentValue') }}：{{ form.endThreshold }}</div>
      <div class="option-list">
        <button class="option-btn" type="button" @click="apply({ endThreshold: '3.00dB' })">3.00dB</button>
        <button class="option-btn" type="button" @click="apply({ endThreshold: '5.00dB' })">5.00dB</button>
        <button class="option-btn" type="button" @click="apply({ endThreshold: '8.00dB' })">8.00dB</button>
        <button class="option-btn" type="button" @click="apply({ endThreshold: '10.00dB' })">10.00dB</button>
      </div>
    </div>

    <div v-else-if="activePanel === 'pass'" class="preset-panel">
      <div class="dual-setting">
        <div class="dual-item">
          <div class="preset-label">1310nm</div>
          <div class="preset-value">{{ form.passThreshold1310 }}</div>
          <div class="mini-actions">
            <button class="mini-btn" type="button" @click="apply({ passThreshold1310: '0.20dB' })">0.20dB</button>
            <button class="mini-btn" type="button" @click="apply({ passThreshold1310: '0.30dB' })">0.30dB</button>
          </div>
        </div>
        <div class="dual-item">
          <div class="preset-label">1550nm</div>
          <div class="preset-value">{{ form.passThreshold1550 }}</div>
          <div class="mini-actions">
            <button class="mini-btn" type="button" @click="apply({ passThreshold1550: '0.20dB' })">0.20dB</button>
            <button class="mini-btn" type="button" @click="apply({ passThreshold1550: '0.30dB' })">0.30dB</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activePanel === 'launchFiber'" class="preset-panel">
      <div class="preset-current">{{ t('deviceDetail.smartOtdrCurrentValue') }}：{{ launchFiberText }}</div>
      <div class="option-list">
        <button class="option-btn" type="button" @click="apply({ launchFiberEnabled: false, launchFiberLength: '' })">{{ t('common.none') }}</button>
        <button class="option-btn" type="button" @click="apply({ launchFiberEnabled: true, launchFiberLength: '50m' })">50m</button>
        <button class="option-btn" type="button" @click="apply({ launchFiberEnabled: true, launchFiberLength: '100m' })">100m</button>
        <button class="option-btn" type="button" @click="apply({ launchFiberEnabled: true, launchFiberLength: '500m' })">500m</button>
      </div>
    </div>

    <div v-else-if="activePanel === 'receiveFiber'" class="preset-panel">
      <div class="preset-current">{{ t('deviceDetail.smartOtdrCurrentValue') }}：{{ receiveFiberText }}</div>
      <div class="option-list">
        <button class="option-btn" type="button" @click="apply({ receiveFiberEnabled: false, receiveFiberLength: '' })">{{ t('common.none') }}</button>
        <button class="option-btn" type="button" @click="apply({ receiveFiberEnabled: true, receiveFiberLength: '50m' })">50m</button>
        <button class="option-btn" type="button" @click="apply({ receiveFiberEnabled: true, receiveFiberLength: '100m' })">100m</button>
        <button class="option-btn" type="button" @click="apply({ receiveFiberEnabled: true, receiveFiberLength: '500m' })">500m</button>
      </div>
    </div>

    <div v-else-if="activePanel === 'unit'" class="option-list">
      <button class="option-btn" type="button" @click="apply({ unit: 'km' })">km</button>
      <button class="option-btn" type="button" @click="apply({ unit: 'kfeet' })">kfeet</button>
      <button class="option-btn" type="button" @click="apply({ unit: 'miles' })">miles</button>
    </div>

    <div v-else-if="activePanel === 'calibration'" class="confirm-box">
      <div class="confirm-title">{{ t('deviceDetail.smartOtdrCalibrationConfirm') }}</div>
      <div class="confirm-desc">{{ t('deviceDetail.smartOtdrCalibrationDesc') }}</div>
      <div class="confirm-actions">
        <button class="secondary-btn" type="button" @click="emit('close')">
          {{ t('common.cancel') }}
        </button>
        <button class="primary-btn" type="button" :disabled="calibrationLoading || pageState === 'running'" @click="emit('confirm-calibration')">
          {{ calibrationLoading ? t('deviceDetail.smartOtdrCalibrationLoading') : t('common.confirm') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type ConfigPanelState =
  | 'none'
  | 'wavelength'
  | 'range'
  | 'pulse'
  | 'duration'
  | 'attenuation'
  | 'reflect'
  | 'end'
  | 'pass'
  | 'launchFiber'
  | 'receiveFiber'
  | 'unit'
  | 'calibration'

interface MeasureForm {
  wavelength: string
  range: string
  pulseWidth: string
  duration: string
  attenuationThreshold: string
  reflectThreshold: string
  endThreshold: string
  passThreshold1310: string
  passThreshold1550: string
  launchFiberEnabled: boolean
  launchFiberLength: string
  receiveFiberEnabled: boolean
  receiveFiberLength: string
  unit: string
}

interface Props {
  activePanel: ConfigPanelState
  pageState: 'idle' | 'running' | 'done'
  form: MeasureForm
  calibrationLoading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'apply-preset', payload: Partial<MeasureForm>): void
  (e: 'confirm-calibration'): void
}>()

const { t } = useI18n()

const panelTitle = computed(() => {
  const titleMap: Record<Exclude<ConfigPanelState, 'none'>, string> = {
    wavelength: t('deviceDetail.smartOtdrConfigWavelength'),
    range: t('deviceDetail.smartOtdrConfigRange'),
    pulse: t('deviceDetail.smartOtdrConfigPulse'),
    duration: t('deviceDetail.smartOtdrConfigDuration'),
    attenuation: t('deviceDetail.smartOtdrConfigAttenuation'),
    reflect: t('deviceDetail.smartOtdrConfigReflect'),
    end: t('deviceDetail.smartOtdrConfigEnd'),
    pass: t('deviceDetail.smartOtdrConfigPass'),
    launchFiber: t('deviceDetail.smartOtdrConfigLaunchFiber'),
    receiveFiber: t('deviceDetail.smartOtdrConfigReceiveFiber'),
    unit: t('deviceDetail.smartOtdrConfigUnit'),
    calibration: t('deviceDetail.smartOtdrConfigCalibration')
  }

  return props.activePanel === 'none' ? '' : titleMap[props.activePanel]
})

const launchFiberText = computed(() => {
  return props.form.launchFiberEnabled ? props.form.launchFiberLength || '--' : t('common.none')
})

const receiveFiberText = computed(() => {
  return props.form.receiveFiberEnabled ? props.form.receiveFiberLength || '--' : t('common.none')
})

const apply = (payload: Partial<MeasureForm>) => {
  emit('apply-preset', payload)
}
</script>

<style scoped>
.config-panel {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(37, 99, 235, 0.08);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  padding: 16px;
}

.config-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.config-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.config-subtitle {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

.close-btn {
  border: 1px solid #dbeafe;
  background: #f8fbff;
  color: #1d4ed8;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.option-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.option-btn,
.primary-btn,
.secondary-btn,
.mini-btn {
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.option-btn,
.secondary-btn,
.mini-btn {
  border: 1px solid #dbeafe;
  background: #f8fbff;
  color: #1d4ed8;
}

.option-btn {
  padding: 12px 14px;
}

.preset-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preset-current,
.preset-label {
  font-size: 13px;
  color: #64748b;
}

.preset-value {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.dual-setting {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dual-item {
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.mini-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.mini-btn {
  padding: 8px 12px;
}

.confirm-box {
  padding: 24px 16px;
  border-radius: 16px;
  background: #0f172a;
  color: #fff;
}

.confirm-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.confirm-desc {
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.72);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.primary-btn,
.secondary-btn {
  height: 40px;
  padding: 0 16px;
}

.primary-btn {
  border: none;
  background: #2563eb;
  color: #fff;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .config-head,
  .dual-setting,
  .option-list {
    grid-template-columns: 1fr;
  }

  .config-head {
    flex-direction: column;
  }

  .confirm-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
