<template>
  <section class="threshold-panel">
    <section class="threshold-group-card">
      <header class="threshold-group-card__head">
        <h3>衰减门限</h3>
      </header>
      <div class="threshold-group-card__body">
        <div class="threshold-option-list">
          <label class="threshold-option-row">
            <div class="threshold-option-main">
              <input
                :checked="form.lossMode === 'auto'"
                :disabled="disabled"
                type="radio"
                name="lossMode"
                @change="updateField('lossMode', 'auto')"
              />
              <span>{{ t('deviceDetail.smartOtdrModeAuto') }}</span>
            </div>
          </label>
          <label class="threshold-option-row threshold-option-row--input">
            <div class="threshold-option-main">
              <input
                :checked="form.lossMode === 'custom'"
                :disabled="disabled"
                type="radio"
                name="lossMode"
                @change="updateField('lossMode', 'custom')"
              />
              <span>{{ t('deviceDetail.smartOtdrModeCustom') }}</span>
            </div>
            <div class="threshold-option-input">
              <input
                :value="form.lossThreshold"
                class="threshold-input"
                :disabled="disabled || form.lossMode !== 'custom'"
                type="text"
                @input="updateField('lossThreshold', ($event.target as HTMLInputElement).value)"
              />
              <span class="threshold-unit">dB</span>
            </div>
          </label>
        </div>
      </div>
    </section>

    <section class="threshold-group-card">
      <header class="threshold-group-card__head">
        <h3>反射门限</h3>
      </header>
      <div class="threshold-group-card__body">
        <div class="threshold-option-list">
          <label class="threshold-option-row">
            <div class="threshold-option-main">
              <input
                :checked="form.reflectMode === 'auto'"
                :disabled="disabled"
                type="radio"
                name="reflectMode"
                @change="updateField('reflectMode', 'auto')"
              />
              <span>{{ t('deviceDetail.smartOtdrModeAuto') }}</span>
            </div>
          </label>
          <label class="threshold-option-row threshold-option-row--input">
            <div class="threshold-option-main">
              <input
                :checked="form.reflectMode === 'custom'"
                :disabled="disabled"
                type="radio"
                name="reflectMode"
                @change="updateField('reflectMode', 'custom')"
              />
              <span>{{ t('deviceDetail.smartOtdrModeCustom') }}</span>
            </div>
            <div class="threshold-option-input">
              <input
                :value="form.reflectThreshold"
                class="threshold-input"
                :disabled="disabled || form.reflectMode !== 'custom'"
                type="text"
                @input="updateField('reflectThreshold', ($event.target as HTMLInputElement).value)"
              />
              <span class="threshold-unit">dB</span>
            </div>
          </label>
        </div>
      </div>
    </section>

    <section class="threshold-group-card">
      <header class="threshold-group-card__head">
        <h3>末端门限</h3>
      </header>
      <div class="threshold-group-card__body">
        <div class="threshold-option-list">
          <label class="threshold-option-row">
            <div class="threshold-option-main">
              <input
                :checked="form.endMode === 'auto'"
                :disabled="disabled"
                type="radio"
                name="endMode"
                @change="updateField('endMode', 'auto')"
              />
              <span>{{ t('deviceDetail.smartOtdrModeAuto') }}</span>
            </div>
          </label>
          <label class="threshold-option-row threshold-option-row--input">
            <div class="threshold-option-main">
              <input
                :checked="form.endMode === 'custom'"
                :disabled="disabled"
                type="radio"
                name="endMode"
                @change="updateField('endMode', 'custom')"
              />
              <span>{{ t('deviceDetail.smartOtdrModeCustom') }}</span>
            </div>
            <div class="threshold-option-input">
              <input
                :value="form.endThreshold"
                class="threshold-input"
                :disabled="disabled || form.endMode !== 'custom'"
                type="text"
                @input="updateField('endThreshold', ($event.target as HTMLInputElement).value)"
              />
              <span class="threshold-unit">dB</span>
            </div>
          </label>
        </div>
      </div>
    </section>

    <section class="threshold-group-card">
      <header class="threshold-group-card__head">
        <h3>散射系数</h3>
      </header>
      <div class="threshold-group-card__body">
        <div class="threshold-rule-list">
          <label class="threshold-rule-row">
            <div class="threshold-rule-main">
              <input
                :checked="activeBackscatterField === '1310'"
                :disabled="disabled"
                type="radio"
                name="backscatterField"
                @change="activeBackscatterField = '1310'"
              />
              <span class="threshold-rule-title">1310nm</span>
            </div>
            <div class="threshold-rule-input">
              <input
                :value="form.backscatter1310"
                class="threshold-input"
                :disabled="disabled || activeBackscatterField !== '1310'"
                type="text"
                @input="updateField('backscatter1310', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </label>

          <label class="threshold-rule-row">
            <div class="threshold-rule-main">
              <input
                :checked="activeBackscatterField === '1550'"
                :disabled="disabled"
                type="radio"
                name="backscatterField"
                @change="activeBackscatterField = '1550'"
              />
              <span class="threshold-rule-title">1550nm</span>
            </div>
            <div class="threshold-rule-input">
              <input
                :value="form.backscatter1550"
                class="threshold-input"
                :disabled="disabled || activeBackscatterField !== '1550'"
                type="text"
                @input="updateField('backscatter1550', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </label>
        </div>
      </div>
    </section>

    <section class="threshold-group-card">
      <header class="threshold-group-card__head">
        <h3>合格判断门限</h3>
      </header>
      <div class="threshold-group-card__body">
        <div class="threshold-rule-list">
          <div v-for="rule in passRuleRows" :key="rule.key" class="threshold-rule-row">
            <label class="threshold-rule-main">
              <input
                :checked="Boolean(form.passRules[rule.enableKey])"
                :disabled="disabled"
                type="checkbox"
                @change="updatePassRule(rule.enableKey, ($event.target as HTMLInputElement).checked)"
              />
              <span class="threshold-rule-label-group">
                <span class="threshold-rule-title">{{ rule.label }}</span>
                <span v-if="rule.subLabel" class="threshold-rule-sub">{{ rule.subLabel }}</span>
              </span>
            </label>
            <div class="threshold-rule-input">
              <input
                :value="String(form.passRules[rule.valueKey] || '')"
                class="threshold-input"
                :disabled="disabled || !form.passRules[rule.enableKey]"
                type="text"
                @input="updatePassRule(rule.valueKey, ($event.target as HTMLInputElement).value)"
              />
              <span class="threshold-unit">{{ rule.unit }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="save-bar" :class="statusToneClass">
      <div class="save-copy">
        <div class="save-state">
          {{ dirty ? t('deviceDetail.smartOtdrSavedStatePending') : t('deviceDetail.smartOtdrSavedStateSaved') }}
        </div>
        <div class="save-desc">{{ statusText }}</div>
        <div v-if="savedAt" class="save-desc">{{ t('deviceDetail.smartOtdrLastSavedAt') }}：{{ savedAt }}</div>
      </div>
      <div class="save-actions">
        <button class="secondary-btn" type="button" :disabled="disabled" @click="$emit('reset-default')">
          {{ t('deviceDetail.smartOtdrResetDefault') }}
        </button>
        <button class="primary-btn" type="button" :disabled="disabled || !dirty" @click="$emit('save')">
          {{ t('deviceDetail.smartOtdrSaveThreshold') }}
        </button>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { OtdrConfigUsageNotice, PassRuleGroup, ThresholdForm } from './smartOtdrTypes'

interface Props {
  form: ThresholdForm
  disabled: boolean
  dirty: boolean
  savedAt: string
  statusText: string
  statusTone: OtdrConfigUsageNotice['tone']
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:form', payload: Partial<ThresholdForm>): void
  (e: 'update:pass-rules', payload: Partial<PassRuleGroup>): void
  (e: 'reset-default'): void
  (e: 'save'): void
}>()

const { t } = useI18n()

const passRuleRows: Array<{
  key: string
  label: string
  subLabel?: string
  enableKey: keyof PassRuleGroup
  valueKey: keyof PassRuleGroup
  unit: string
}> = [
  { key: 'reflectEvent', label: t('deviceDetail.smartOtdrPassReflectEvent'), enableKey: 'reflectEventEnabled', valueKey: 'reflectEventValue', unit: 'dB' },
  { key: 'nonReflectEvent', label: t('deviceDetail.smartOtdrPassNonReflectEvent'), enableKey: 'nonReflectEventEnabled', valueKey: 'nonReflectEventValue', unit: 'dB' },
  { key: 'totalLoss', label: t('deviceDetail.smartOtdrPassTotalLoss'), enableKey: 'totalLossEnabled', valueKey: 'totalLossValue', unit: 'dB' },
  { key: 'reflect', label: t('deviceDetail.smartOtdrPassReflect'), enableKey: 'reflectEnabled', valueKey: 'reflectValue', unit: 'dB' },
  { key: 'avg1310', label: '平均损耗', subLabel: '1310nm', enableKey: 'avgLoss1310Enabled', valueKey: 'avgLoss1310Value', unit: 'dB' },
  { key: 'avg1550', label: '平均损耗', subLabel: '1550nm', enableKey: 'avgLoss1550Enabled', valueKey: 'avgLoss1550Value', unit: 'dB' }
]

const activeBackscatterField = ref<'1310' | '1550'>('1310')

const statusToneClass = computed(() => {
  if (props.statusTone === 'warning') return 'warning'
  if (props.statusTone === 'success') return 'success'
  return 'default'
})

const updateField = <K extends keyof ThresholdForm>(field: K, value: ThresholdForm[K]) => {
  emit('update:form', {
    [field]: value
  } as Partial<ThresholdForm>)
}

const updatePassRule = <K extends keyof PassRuleGroup>(field: K, value: PassRuleGroup[K]) => {
  emit('update:pass-rules', {
    [field]: value
  } as Partial<PassRuleGroup>)
}
</script>

<style scoped lang="scss">
@use './smartOtdrUi.scss' as ui;

.threshold-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 12px;
}

.threshold-group-card {
  @include ui.smart-otdr-setting-card;
  min-width: 0;
  padding: 12px;
  border-radius: 10px;
  box-shadow: none;
}

.threshold-group-card__head h3,
.save-state {
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
}

.threshold-group-card__body {
  margin-top: 10px;
}

.threshold-option-list,
.threshold-rule-list {
  display: grid;
  gap: 8px;
}

.threshold-option-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }

.threshold-option-row,
.threshold-rule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 44px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #dfe7f2;
  color: #0f172a;
  font-size: 14px;
}

.threshold-option-row--input,
.threshold-rule-row {
  grid-column: 1 / -1;
  align-items: stretch;
  flex-direction: column;
}

.threshold-option-main,
.threshold-option-input,
.threshold-rule-main,
.threshold-rule-input,
.threshold-rule-label-group,
.save-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.threshold-option-main,
.threshold-option-input,
.threshold-rule-main,
.threshold-rule-input {
  width: 100%;
}

.threshold-rule-main {
  cursor: pointer;
}

.threshold-rule-label-group {
  flex-wrap: wrap;
}

.threshold-rule-title {
  color: #0f172a;
  font-weight: 600;
}

.threshold-rule-sub,
.threshold-unit,
.save-desc {
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.threshold-input {
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

.threshold-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.threshold-option-row input[type='radio'],
.threshold-rule-row input[type='radio'],
.threshold-rule-row input[type='checkbox'] {
  margin: 0;
  accent-color: #3b82f6;
}

.save-bar {
  @include ui.smart-otdr-sticky-action-surface;
  grid-column: 1 / -1;
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

.save-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
.threshold-input:disabled,
.threshold-option-row input:disabled,
.threshold-rule-row input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (min-width: 601px), (orientation: landscape) {
  .threshold-panel {
    gap: 8px;
    padding-bottom: 2px;
  }

  .threshold-group-card {
    padding: 10px;
    border-radius: 8px;
  }

  .threshold-group-card__head h3,
  .save-state {
    font-size: 12px;
  }

  .threshold-group-card__body {
    margin-top: 7px;
  }

  .threshold-option-list,
  .threshold-rule-list {
    gap: 6px;
  }

  .threshold-option-row,
  .threshold-rule-row {
    min-height: 40px;
    padding: 6px 8px;
    gap: 6px;
    font-size: 12px;
  }

  .threshold-option-row--input,
  .threshold-rule-row {
    flex-direction: row;
    align-items: center;
  }

  .threshold-option-input,
  .threshold-rule-input {
    width: min(132px, 46%);
    flex: 0 0 auto;
  }

  .threshold-input {
    height: 36px;
    padding: 0 9px;
    font-size: 12px;
  }

  .save-bar {
    position: sticky;
    bottom: -4px;
    z-index: 2;
    min-height: 58px;
    padding: 8px 10px;
    border-radius: 8px;
    background: #ffffff;
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
  .threshold-panel {
    grid-template-columns: 1fr;
  }

  .threshold-option-main,
  .threshold-option-input,
  .threshold-rule-main,
  .threshold-rule-input,
  .save-bar,
  .save-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .primary-btn,
  .secondary-btn {
    width: 100%;
  }
}
</style>
