<template>
  <section class="overview-panel">
    <SmartOtdrCurveCard
      :measure-status="measureStatus"
      :parameter-form="parameterForm"
      :progress-percent="measureProgress.percent"
      :remaining-seconds="measureProgress.remainingSeconds"
      :trace-data="resultData.trace"
      :selected-event-id="selectedEventId"
    />

    <section class="summary-card">
      <div class="card-head">
        <div class="card-title">{{ t('deviceDetail.smartOtdrCurrentParams') }}</div>
        <div v-if="calibrationState.lastCalibratedAt" class="calibration-tip">
          {{ t('deviceDetail.smartOtdrCalibrationLastTime') }}：{{ calibrationState.lastCalibratedAt }}
        </div>
      </div>
      <div class="summary-grid">
        <div class="summary-item">
          <span>{{ t('deviceDetail.smartOtdrConfigWavelength') }}</span>
          <strong>{{ parameterForm.wavelength }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ t('deviceDetail.smartOtdrConfigRange') }}</span>
          <strong>{{ parameterForm.range }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ t('deviceDetail.smartOtdrConfigPulse') }}</span>
          <strong>{{ parameterForm.pulseWidth }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ t('deviceDetail.smartOtdrConfigDuration') }}</span>
          <strong>{{ measureTimeLabel }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ t('deviceDetail.smartOtdrRefractiveIndex') }}</span>
          <strong>{{ parameterForm.refractiveIndex1310 }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ t('deviceDetail.smartOtdrConfigUnit') }}</span>
          <strong>{{ parameterForm.unit }}</strong>
        </div>
      </div>
    </section>

    <section class="action-card">
      <div class="card-title">{{ t('deviceDetail.smartOtdrQuickActions') }}</div>
      <div class="action-row">
        <button
          v-if="measureStatus !== 'running'"
          class="primary-btn"
          type="button"
          @click="$emit('start-measure')"
        >
          {{ measureStatus === 'done' ? t('deviceDetail.smartOtdrRestartMeasure') : t('deviceDetail.smartOtdrStartMeasure') }}
        </button>
        <button
          v-else
          class="danger-btn"
          type="button"
          @click="$emit('cancel-measure')"
        >
          {{ t('deviceDetail.smartOtdrStopMeasure') }}
        </button>
        <button class="secondary-btn" type="button" :disabled="measureStatus !== 'done'" @click="$emit('open-result')">
          {{ t('deviceDetail.smartOtdrViewResult') }}
        </button>
        <button class="secondary-btn" type="button" @click="$emit('open-files')">
          {{ t('deviceDetail.smartOtdrFileManager') }}
        </button>
      </div>
    </section>

    <SmartOtdrRecentRecords
      :records="historyList"
      @open-files="$emit('open-files')"
      @load-record="$emit('load-history', $event)"
    />

    <section class="event-analysis-card">
      <div class="card-head">
        <div>
          <div class="card-title">{{ t('deviceDetail.smartOtdrEventAnalysis') }}</div>
          <div class="event-analysis-desc">{{ t('deviceDetail.smartOtdrEventAnalysisDesc') }}</div>
        </div>
        <div class="event-count-chip">
          {{ t('deviceDetail.smartOtdrEventAnalysisCount', { count: resultData.summary.eventCount || 0 }) }}
        </div>
      </div>

      <div class="event-analysis-body">
        <div class="event-analysis-meta">
          <span>{{ t('deviceDetail.smartOtdrEventAnalysisHint') }}</span>
          <strong>{{ resultData.testedAt || t('deviceDetail.smartOtdrEventAnalysisNoData') }}</strong>
        </div>

        <button class="primary-btn event-analysis-btn" type="button" @click="$emit('open-event-map')">
          {{ t('deviceDetail.smartOtdrEventAnalysisEnter') }}
        </button>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SmartOtdrCurveCard from './SmartOtdrCurveCard.vue'
import SmartOtdrRecentRecords from './SmartOtdrRecentRecords.vue'
import type {
  CalibrationState,
  MeasureStatus,
  OtdrHistoryRecord,
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
  historyList: OtdrHistoryRecord[]
  selectedEventId: number | null
  calibrationState: CalibrationState
}

defineEmits<{
  (e: 'start-measure'): void
  (e: 'cancel-measure'): void
  (e: 'open-result'): void
  (e: 'open-files'): void
  (e: 'open-event-map'): void
  (e: 'load-history', id: string): void
}>()

const { t } = useI18n()

const props = defineProps<Props>()

const measureTimeLabel = computed(() => {
  if (props.parameterForm.measurementMode === 'real-time') {
    return t('deviceDetail.smartOtdrMeasureRealtime')
  }

  if (props.parameterForm.measureTimeMode === 'custom') {
    return `${props.parameterForm.customMeasureSeconds || '--'}s`
  }

  return props.parameterForm.measureTimeMode
})
</script>

<style scoped lang="scss">
.overview-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-card,
.action-card,
.event-analysis-card {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(37, 99, 235, 0.08);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  padding: 16px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.calibration-tip {
  font-size: 12px;
  color: #047857;
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

  span {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 8px;
  }

  strong {
    font-size: 15px;
    color: #0f172a;
  }
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.primary-btn,
.secondary-btn,
.danger-btn {
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
  flex: 1 1 180px;
}

.danger-btn {
  border: none;
  background: #ef4444;
  color: #fff;
  flex: 1 1 180px;
}

.secondary-btn {
  border: 1px solid #dbeafe;
  background: #f8fbff;
  color: #1d4ed8;
}

.secondary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.event-analysis-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.event-count-chip {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.event-analysis-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.event-analysis-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-analysis-meta span {
  font-size: 12px;
  color: #64748b;
}

.event-analysis-meta strong {
  font-size: 14px;
  color: #0f172a;
}

.event-analysis-btn {
  min-width: 156px;
  flex: 0 0 auto;
}

@media (max-width: 768px) {
  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .primary-btn,
  .secondary-btn,
  .danger-btn {
    width: 100%;
  }

  .event-analysis-body {
    flex-direction: column;
    align-items: stretch;
  }

  .event-count-chip {
    align-self: flex-start;
  }
}
</style>
