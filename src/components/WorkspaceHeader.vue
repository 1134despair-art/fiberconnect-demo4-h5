<template>
  <header class="secondary-header">
    <button type="button" :aria-label="t('common.back')" :title="t('common.back')" @click="$emit('back')">
      <img :src="backIcon" alt="" />
    </button>
    <h1>{{ title }}</h1>
    <div class="secondary-header-action"><slot /></div>
  </header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import backIcon from '@/assets/icons/pon-meter/back.svg'
defineProps<{ title: string }>()
defineEmits<{ back: [] }>()
const { t } = useI18n()
</script>

<style scoped>
.secondary-header { display: grid; grid-template-columns: 40px minmax(0, 1fr) 40px; gap: 8px; align-items: center; flex-shrink: 0; min-height: 64px; padding: 10px 14px; border-bottom: 1px solid #e9ebef; background: #fff; }
.secondary-header > button { display: grid; place-items: center; width: 40px; height: 40px; background: transparent; border: 0; border-radius: 8px; cursor: pointer; }
.secondary-header > button:hover { background: #f0f3f8; }
.secondary-header img { width: 24px; height: 24px; }
.secondary-header h1 { margin: 0; font-size: 17px; font-weight: 650; line-height: 1.5; text-align: center; overflow-wrap: anywhere; }
.secondary-header-action { display: flex; justify-content: flex-end; }
</style>
