<template>
  <section class="event-table-card">
    <div class="table-title">{{ t('deviceDetail.smartOtdrEventTitle') }}</div>

    <div v-if="pageState === 'idle'" class="table-empty">
      {{ t('deviceDetail.smartOtdrEventEmpty') }}
    </div>

    <div v-else-if="pageState === 'running'" class="table-loading">
      {{ t('deviceDetail.smartOtdrEventLoading') }}
    </div>

    <div v-else class="table-wrap">
      <div class="table-head row">
        <span>{{ t('deviceDetail.smartOtdrEventIndex') }}</span>
        <span>{{ t('deviceDetail.smartOtdrEventType') }}</span>
        <span>{{ t('deviceDetail.smartOtdrEventDistance') }}</span>
        <span>{{ t('deviceDetail.smartOtdrEventLoss') }}</span>
        <span>{{ t('deviceDetail.smartOtdrEventReflect') }}</span>
        <span>{{ t('deviceDetail.smartOtdrEventTotalLoss') }}</span>
      </div>
      <div v-for="row in rows" :key="row.id" class="row table-row">
        <span>{{ row.id }}</span>
        <span><OtdrEventSymbol :type="row.type" compact />{{ row.type }}</span>
        <span>{{ row.distance }}</span>
        <span>{{ row.loss }}</span>
        <span>{{ row.reflect }}</span>
        <span>{{ row.totalLoss }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import OtdrEventSymbol from './OtdrEventSymbol.vue'
import { useI18n } from 'vue-i18n'

interface EventRow {
  id: number
  type: string
  distance: string
  loss: string
  reflect: string
  totalLoss: string
}

interface Props {
  pageState: 'idle' | 'running' | 'done'
  rows: EventRow[]
}

defineProps<Props>()
const { t } = useI18n()
</script>

<style scoped>
.event-table-card {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(37, 99, 235, 0.08);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  padding: 16px;
}

.table-title {
  margin-bottom: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.table-empty,
.table-loading {
  padding: 24px 16px;
  border-radius: 16px;
  background: #f8fbff;
  font-size: 13px;
  color: #64748b;
}

.table-wrap {
  overflow-x: auto;
}

.row {
  display: grid;
  grid-template-columns: 56px 1.1fr 1fr 1fr 1fr 1fr;
  gap: 10px;
  align-items: center;
  min-width: 640px;
}

.table-head {
  padding: 10px 12px;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.table-row {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
  color: #0f172a;
}
</style>
