<template>
  <Teleport to="body">
    <div class="calibration-backdrop" role="presentation" @click.self="emit('close')">
      <section class="calibration-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId">
        <header>
          <div>
            <h2 :id="titleId">{{ t('pon.calibrationTitle') }}</h2>
            <p>{{ t('pon.calibrationHint') }}</p>
          </div>
          <button type="button" :aria-label="t('common.close')" @click="emit('close')">×</button>
        </header>

        <div class="calibration-summary">
          <div><span>{{ t('pon.calibrationWavelength') }}</span><strong>{{ wavelength }}nm</strong></div>
          <div><span>{{ t('pon.currentMeasured') }}</span><strong>{{ currentDbm.toFixed(2) }}dBm</strong></div>
          <div><span>{{ t('pon.currentOffset') }}</span><strong>{{ signedOffset(currentOffset) }}dB</strong></div>
        </div>

        <label class="reference-input">
          <span>{{ t('pon.standardReference') }}</span>
          <div>
            <input v-model.number="referenceDbm" type="number" min="-80" max="30" step="0.01" inputmode="decimal" />
            <b>dBm</b>
          </div>
        </label>

        <div class="offset-preview">
          <span>{{ t('pon.offsetPreview') }}</span>
          <strong>{{ signedOffset(previewOffset) }}dB</strong>
        </div>
        <p class="calibration-note">{{ t('pon.calibrationRange') }}</p>

        <div class="calibration-secondary-actions">
          <button type="button" @click="emit('reset-current')">{{ t('pon.resetCurrent') }}</button>
          <button type="button" @click="confirmResetAll = true">{{ t('pon.resetAll') }}</button>
        </div>

        <div v-if="confirmResetAll" class="reset-confirm" role="alert">
          <span>{{ t('pon.resetAllCalibrationConfirm') }}</span>
          <div>
            <button type="button" @click="confirmResetAll = false">{{ t('common.cancel') }}</button>
            <button class="danger" type="button" @click="emit('reset-all')">{{ t('common.confirm') }}</button>
          </div>
        </div>

        <footer>
          <button type="button" @click="emit('close')">{{ t('common.cancel') }}</button>
          <button class="primary" type="button" @click="saveCalibration">{{ t('common.save') }}</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PonOpmWavelength } from './usePonPowerMeterState'

const props = defineProps<{
  wavelength: PonOpmWavelength
  currentDbm: number
  currentOffset: number
}>()

const emit = defineEmits<{
  close: []
  save: [offset: number]
  'reset-current': []
  'reset-all': []
}>()

const { t } = useI18n()
const titleId = `pon-calibration-${Math.random().toString(16).slice(2)}`
const referenceDbm = ref(Number((props.currentDbm - props.currentOffset).toFixed(2)))
const confirmResetAll = ref(false)
const previewOffset = computed(() => Math.min(5, Math.max(-5, Number(referenceDbm.value) - (props.currentDbm - props.currentOffset))))

const signedOffset = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
const saveCalibration = () => emit('save', Number(previewOffset.value.toFixed(2)))
</script>

<style scoped lang="scss">
@use './ponUi.scss' as ui;

.calibration-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: end center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.48);
}

.calibration-dialog {
  width: min(360px, calc(100vw - 40px));
  padding: 18px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.24);
}

header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
header h2, header p { margin: 0; letter-spacing: 0; }
header h2 { color: ui.$pon-text; font-size: 17px; }
header p { margin-top: 4px; color: ui.$pon-text-sub; font-size: 11px; line-height: 1.45; }
header button { @include ui.button-reset; width: 44px; height: 44px; flex: 0 0 44px; border-radius: 12px; color: ui.$pon-text-sub; font-size: 25px; }

.calibration-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 16px; overflow: hidden; border: 1px solid ui.$pon-border; border-radius: 14px; }
.calibration-summary div { min-width: 0; padding: 10px 8px; border-right: 1px solid ui.$pon-border; }
.calibration-summary div:last-child { border-right: 0; }
.calibration-summary span, .calibration-summary strong { display: block; }
.calibration-summary span { color: ui.$pon-text-sub; font-size: 11px; }
.calibration-summary strong { margin-top: 4px; overflow: hidden; color: ui.$pon-text; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; @include ui.metric-number; }

.reference-input { display: block; margin-top: 16px; }
.reference-input > span { display: block; margin-bottom: 7px; color: ui.$pon-text; font-size: 12px; font-weight: 750; }
.reference-input > div { height: 48px; display: flex; align-items: center; padding: 0 12px; border: 1px solid ui.$pon-border; border-radius: 12px; background: #f8fafc; }
.reference-input input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; color: ui.$pon-text; font-size: 18px; @include ui.metric-number; }
.reference-input b { color: ui.$pon-text-sub; font-size: 11px; }

.offset-preview { min-height: 44px; display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding: 0 12px; border-radius: 12px; background: ui.$pon-primary-soft; }
.offset-preview span { color: ui.$pon-primary-dark; font-size: 11px; }
.offset-preview strong { color: ui.$pon-primary-dark; font-size: 14px; @include ui.metric-number; }
.calibration-note { margin: 8px 0 0; color: ui.$pon-text-sub; font-size: 11px; line-height: 1.45; }

.calibration-secondary-actions, footer { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.calibration-secondary-actions { margin-top: 14px; }
.calibration-secondary-actions button, footer button { @include ui.secondary-button; min-height: 44px; }
.reset-confirm { margin-top: 12px; padding: 11px; border: 1px solid #fecaca; border-radius: 12px; background: #fff1f2; }
.reset-confirm span { color: #9f1239; font-size: 11px; }
.reset-confirm div { display: flex; justify-content: flex-end; gap: 8px; margin-top: 9px; }
.reset-confirm button { @include ui.button-reset; min-width: 64px; min-height: 38px; border-radius: 9px; background: #ffffff; color: ui.$pon-text; font-size: 11px; }
.reset-confirm button.danger { background: #dc2626; color: #ffffff; }
footer { margin-top: 16px; }
footer button.primary { @include ui.primary-button; }

@media (min-width: 520px) {
  .calibration-backdrop { place-items: center; }
}

@media (prefers-reduced-motion: no-preference) {
  .calibration-dialog { animation: dialog-in 180ms ease-out; }
  @keyframes dialog-in { from { opacity: 0; transform: translateY(14px); } }
}
</style>
