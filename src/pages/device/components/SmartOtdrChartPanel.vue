<template>
  <section class="chart-panel">
    <div class="chart-head">
      <div class="chart-title">{{ t('deviceDetail.smartOtdrChartTitle') }}</div>
      <div class="chart-summary">{{ summaryText }}</div>
    </div>

    <div v-if="pageState === 'idle'" class="chart-empty">
      <div class="empty-title">{{ t('deviceDetail.smartOtdrChartEmpty') }}</div>
      <div class="empty-desc">{{ t('deviceDetail.smartOtdrChartEmptyDesc') }}</div>
    </div>

    <div v-else-if="pageState === 'running'" class="chart-running">
      <div class="running-grid"></div>
      <div class="progress-box">
        <div class="progress-label">{{ t('deviceDetail.smartOtdrChartLoading') }} {{ remainingSeconds }}s</div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>
    </div>

    <div v-else class="chart-done">
      <svg class="trace-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          :points="polylinePoints"
          class="trace-line"
        />
        <circle
          v-for="(point, index) in traceData"
          :key="`${point.x}-${point.y}-${index}`"
          :cx="point.x"
          :cy="point.y"
          r="1.3"
          class="trace-node"
        />
      </svg>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface TracePoint {
  x: number
  y: number
}

interface Props {
  pageState: 'idle' | 'running' | 'done'
  progressPercent: number
  remainingSeconds: number
  summaryText: string
  traceData: TracePoint[]
}

const props = defineProps<Props>()
const { t } = useI18n()

const polylinePoints = computed(() => {
  return props.traceData.map(point => `${point.x},${point.y}`).join(' ')
})
</script>

<style scoped>
.chart-panel {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(37, 99, 235, 0.08);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  padding: 16px;
}

.chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.chart-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.chart-summary {
  font-size: 12px;
  color: #64748b;
}

.chart-empty,
.chart-running,
.chart-done {
  position: relative;
  min-height: 280px;
  border-radius: 16px;
  overflow: hidden;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.empty-desc {
  max-width: 320px;
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}

.chart-running,
.chart-done {
  background:
    linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%);
  background-size: 28px 28px, 28px 28px, auto;
}

.running-grid {
  position: absolute;
  inset: 0;
}

.progress-box {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 18px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(10px);
}

.progress-label {
  margin-bottom: 10px;
  font-size: 13px;
  color: #fff;
}

.progress-track {
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.28);
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb 0%, #60a5fa 100%);
}

.trace-svg {
  width: 100%;
  height: 280px;
}

.trace-line {
  fill: none;
  stroke: #f59e0b;
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trace-node {
  fill: #f59e0b;
}

@media (max-width: 768px) {
  .chart-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
