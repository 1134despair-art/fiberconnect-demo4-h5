<template>
  <section class="event-list-card">
    <div class="card-head">
      <div class="card-title">{{ title }}</div>
      <div v-if="events.length" class="event-count">{{ events.length }} {{ t('deviceDetail.smartOtdrEventCountUnit') }}</div>
    </div>

    <div v-if="!events.length" class="empty-state">
      {{ emptyText }}
    </div>

    <button
      v-for="event in visibleEvents"
      :key="event.id"
      class="event-item"
      :class="{ active: event.id === selectedEventId }"
      type="button"
      @click="$emit('select', event.id)"
    >
      <div class="event-head">
        <span class="event-name">{{ event.name }}</span>
        <span class="event-status" :class="event.pass ? 'pass' : 'fail'">
          {{ event.pass ? t('deviceDetail.smartOtdrConclusionPass') : t('deviceDetail.smartOtdrConclusionFail') }}
        </span>
      </div>
      <div class="event-meta">{{ t('deviceDetail.smartOtdrEventDistance') }}：{{ event.distance }} · {{ t('deviceDetail.smartOtdrEventType') }}：{{ event.type }}</div>
      <div class="event-meta">{{ t('deviceDetail.smartOtdrEventLoss') }}：{{ event.loss }} · {{ t('deviceDetail.smartOtdrEventReflect') }}：{{ event.reflect }}</div>
      <div class="event-detail">{{ event.detail }}</div>
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { OtdrEventItem } from './smartOtdrTypes'

interface Props {
  title: string
  emptyText: string
  events: OtdrEventItem[]
  selectedEventId: number | null
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 0
})

defineEmits<{
  (e: 'select', id: number): void
}>()

const { t } = useI18n()

const visibleEvents = computed(() => {
  return props.limit > 0 ? props.events.slice(0, props.limit) : props.events
})
</script>

<style scoped lang="scss">
.event-list-card {
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

.event-count {
  font-size: 12px;
  color: #64748b;
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

.event-item {
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

  &.active {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    background: #f8fbff;
  }
}

.event-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.event-name {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.event-status {
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

.event-meta,
.event-detail {
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.event-detail {
  margin-top: 6px;
}
</style>
