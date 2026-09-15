<template>
  <section class="result-panel">
    <section class="summary-card">
      <div class="card-title">{{ t('deviceDetail.smartOtdrResultSummary') }}</div>
      <div class="summary-grid">
        <div class="summary-item">
          <span>{{ t('deviceDetail.smartOtdrTotalLoss') }}</span>
          <strong>{{ resultData.summary.totalLoss }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ t('deviceDetail.smartOtdrAverageLoss') }}</span>
          <strong>{{ resultData.summary.averageLoss }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ t('deviceDetail.smartOtdrEventTitle') }}</span>
          <strong>{{ resultData.summary.eventCount }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ t('deviceDetail.smartOtdrMaxReflect') }}</span>
          <strong>{{ resultData.summary.maxReflectance }}</strong>
        </div>
        <div class="summary-item full">
          <span>{{ t('deviceDetail.smartOtdrConclusion') }}</span>
          <strong :class="resultData.summary.conclusion">{{ resultData.summary.conclusionText }}</strong>
        </div>
      </div>
    </section>

    <SmartOtdrCurveCard
      :measure-status="measureStatus"
      :parameter-form="parameterForm"
      :progress-percent="measureProgress.percent"
      :remaining-seconds="measureProgress.remainingSeconds"
      :trace-data="resultData.trace"
      :selected-event-id="selectedEventId"
    />

    <SmartOtdrEventList
      :title="t('deviceDetail.smartOtdrEventTitle')"
      :empty-text="t('deviceDetail.smartOtdrEventEmpty')"
      :events="resultData.events"
      :selected-event-id="selectedEventId"
      @select="$emit('select-event', $event)"
    />

    <section class="action-card">
      <button class="primary-btn" type="button" :disabled="measureStatus !== 'done'" @click="$emit('save')">
        {{ t('deviceDetail.smartOtdrSaveResult') }}
      </button>
      <button class="secondary-btn" type="button" :disabled="measureStatus !== 'done'" @click="$emit('restart')">
        {{ t('deviceDetail.smartOtdrRestartMeasure') }}
      </button>
      <button class="secondary-btn" type="button" :disabled="measureStatus !== 'done'" @click="$emit('export')">
        {{ t('deviceDetail.smartOtdrExportSor') }}
      </button>
      <button class="secondary-btn" type="button" @click="$emit('open-files')">
        {{ t('deviceDetail.smartOtdrFileManager') }}
      </button>
    </section>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SmartOtdrCurveCard from './SmartOtdrCurveCard.vue'
import SmartOtdrEventList from './SmartOtdrEventList.vue'
import type {
  MeasureStatus,
  OtdrResultData,
  ParameterForm
} from './smartOtdrTypes'

interface Props {
  measureStatus: MeasureStatus
  parameterForm: ParameterForm
  measureProgress: {
    percent: number
    remainingSeconds: number
  }
  resultData: OtdrResultData
  selectedEventId: number | null
}

defineProps<Props>()

defineEmits<{
  (e: 'select-event', id: number): void
  (e: 'save'): void
  (e: 'restart'): void
  (e: 'export'): void
  (e: 'open-files'): void
}>()

const { t } = useI18n()
</script>

<style scoped lang="scss">
.result-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-card,
.action-card {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(37, 99, 235, 0.08);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  padding: 16px;
}

.card-title {
  margin-bottom: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-item {
  padding: 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;

  &.full {
    grid-column: 1 / -1;
  }

  span {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 8px;
  }

  strong {
    font-size: 15px;
    color: #0f172a;

    &.pass {
      color: #047857;
    }

    &.fail {
      color: #b91c1c;
    }
  }
}

.action-card {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.primary-btn,
.secondary-btn {
  height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.primary-btn {
  border: none;
  background: #2563eb;
  color: #fff;
}

.secondary-btn {
  border: 1px solid #dbeafe;
  background: #f8fbff;
  color: #1d4ed8;
}

.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-item.full {
    grid-column: auto;
  }

  .primary-btn,
  .secondary-btn {
    width: 100%;
  }
}
</style>
