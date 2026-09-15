<template>
  <section class="records-card">
    <div class="card-head">
      <div class="card-title">{{ t('deviceDetail.smartOtdrRecentRecords') }}</div>
      <button class="link-btn" type="button" @click="$emit('open-files')">
        {{ t('deviceDetail.smartOtdrFileManager') }}
      </button>
    </div>

    <div v-if="!records.length" class="empty-state">
      {{ t('deviceDetail.smartOtdrHistoryEmpty') }}
    </div>

    <button
      v-for="record in visibleRecords"
      :key="record.id"
      class="record-item"
      type="button"
      @click="$emit('load-record', record.id)"
    >
      <div class="record-head">
        <div class="record-name">{{ record.name }}</div>
        <div class="record-status" :class="record.conclusion">
          {{ record.conclusionText }}
        </div>
      </div>
      <div class="record-meta">{{ record.time }}</div>
      <div class="record-tags">
        <span>{{ record.wavelength }}</span>
        <span>{{ record.distance }}</span>
        <span>{{ record.size }}</span>
      </div>
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { OtdrHistoryRecord } from './smartOtdrTypes'

interface Props {
  records: OtdrHistoryRecord[]
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 3
})

defineEmits<{
  (e: 'open-files'): void
  (e: 'load-record', id: string): void
}>()

const { t } = useI18n()

const visibleRecords = computed(() => props.records.slice(0, props.limit))
</script>

<style scoped lang="scss">
.records-card {
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

.link-btn {
  border: none;
  background: none;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  border-radius: 16px;
  background: #f8fbff;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
}

.record-item {
  width: 100%;
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  text-align: left;
  cursor: pointer;

  &:last-child {
    margin-bottom: 0;
  }
}

.record-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.record-name {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.record-status {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;

  &.pass {
    color: #047857;
    background: #dcfce7;
  }

  &.fail {
    color: #b91c1c;
    background: #fee2e2;
  }
}

.record-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.record-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;

  span {
    padding: 4px 8px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #475569;
    font-size: 12px;
  }
}
</style>
