<template>
  <div :class="standalone ? 'app-container port-audit-page-app' : 'audit-shell-host'">
    <div class="audit-shell">
      <div class="audit-shell__status" aria-hidden="true">
        <strong>{{ currentTime }}</strong>
        <span><img :src="bluetoothIcon" alt="" /><i></i><i></i><i></i><img :src="batteryIcon" alt="" /></span>
      </div>
      <header class="audit-shell__header">
        <button class="audit-shell__back" type="button" :aria-label="t('common.back')" @click="emit('back')"><img :src="backIcon" alt="" /></button>
        <div class="audit-shell__heading"><h1>{{ title }}</h1><p v-if="subtitle">{{ subtitle }}</p></div>
        <div class="audit-shell__action"><slot name="action" /></div>
      </header>
      <main class="audit-shell__body hide-scrollbar"><slot /></main>
      <footer v-if="$slots.footer" class="audit-shell__footer"><slot name="footer" /></footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import backIcon from '@/assets/icons/port-audit/back.svg'
import bluetoothIcon from '@/assets/icons/port-audit/bluetooth.svg'
import batteryIcon from '@/assets/icons/port-audit/battery.svg'
defineProps<{ title: string; subtitle?: string; standalone?: boolean }>()
const emit = defineEmits<{ back: [] }>()
const { t } = useI18n()
const currentTime = ref('')
let clockTimer: number | undefined
const syncTime = () => { currentTime.value = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) }
onMounted(() => { syncTime(); clockTimer = window.setInterval(syncTime, 30_000) })
onBeforeUnmount(() => { if (clockTimer) window.clearInterval(clockTimer) })
</script>

<style scoped lang="scss">
@use './portAuditUi.scss' as ui;
.audit-shell-host { width: 100%; height: 100%; }
.app-container.port-audit-page-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$audit-bg; }
.audit-shell { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; background: ui.$audit-bg; }
.audit-shell__status { height: 24px; display: flex; align-items: center; justify-content: space-between; padding: 0 13px; background: #fff; color: ui.$audit-text; flex: 0 0 auto; }
.audit-shell__status strong { font-size: 10px; font-weight: 750; }
.audit-shell__status span { height: 16px; display: flex; align-items: flex-end; gap: 2px; color: ui.$audit-primary; }
.audit-shell__status span img { width: 13px; height: 13px; object-fit: contain; }
.audit-shell__status span img:last-child { width: 17px; }
.audit-shell__status span i { width: 2px; border-radius: 1px; background: currentColor; }
.audit-shell__status span i:nth-of-type(1) { height: 5px; }.audit-shell__status span i:nth-of-type(2) { height: 8px; }.audit-shell__status span i:nth-of-type(3) { height: 11px; }
.audit-shell__header { min-height: 58px; display: grid; grid-template-columns: 44px minmax(0,1fr) 44px; align-items: center; padding: 0 12px; border-bottom: 1px solid ui.$audit-border; background: #fff; flex: 0 0 auto; z-index: 10; }
.audit-shell__back { @include ui.reset-button; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; &:active { background: ui.$audit-primary-soft; } &:focus-visible { @include ui.focus-ring; } img { width: 24px; height: 24px; } }
.audit-shell__heading { min-width: 0; text-align: center; h1 { margin: 0; overflow: hidden; color: ui.$audit-text; font-size: 17px; font-weight: 750; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; letter-spacing: 0; } p { margin: 2px 0 0; color: ui.$audit-sub; font-size: 11px; line-height: 1.2; letter-spacing: 0; } }
.audit-shell__action { min-width: 44px; display: flex; justify-content: flex-end; }
.audit-shell__body { min-height: 0; flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; }
.audit-shell__footer { flex: 0 0 auto; padding: 8px 12px calc(10px + env(safe-area-inset-bottom)); border-top: 1px solid ui.$audit-border; background: rgba(255,255,255,.96); z-index: 20; }
</style>
