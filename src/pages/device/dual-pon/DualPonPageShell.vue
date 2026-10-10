<template>
  <div :class="standalone ? 'app-container dual-pon-page-app' : 'dual-shell-host'">
    <div class="dual-shell instrument-ui">
      <div class="dual-shell__status" aria-hidden="true">
        <strong>{{ currentTime }}</strong>
        <span>
          <img :src="bluetoothIcon" alt="" />
          <i></i><i></i><i></i>
          <img :src="batteryIcon" alt="" />
        </span>
      </div>
      <header class="dual-shell__header">
        <button class="dual-shell__back" type="button" :aria-label="t('common.back')" @click="emit('back')">
          <img :src="backIcon" alt="" />
        </button>
        <div class="dual-shell__heading">
          <h1>{{ title }}</h1>
          <p v-if="subtitle">{{ subtitle }}</p>
        </div>
        <div class="dual-shell__action"><slot name="action" /></div>
      </header>
      <main class="dual-shell__body hide-scrollbar"><slot /></main>
      <footer v-if="$slots.footer" class="dual-shell__footer"><slot name="footer" /></footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import '../components/instrumentUi.scss'
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import backIcon from '@/assets/icons/iconfont/smart-otdr/back.svg'
import bluetoothIcon from '@/assets/icons/iconfont/smart-otdr/bluetooth.svg'
import batteryIcon from '@/assets/icons/iconfont/smart-otdr/battery.svg'

defineProps<{ title: string; subtitle?: string; standalone?: boolean }>()
const emit = defineEmits<{ back: [] }>()
const { t } = useI18n()
const formatTime = () => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
const currentTime = ref(formatTime())
let timeTimer: number | undefined

onMounted(() => { timeTimer = window.setInterval(() => { currentTime.value = formatTime() }, 30_000) })
onUnmounted(() => { if (timeTimer) window.clearInterval(timeTimer) })
</script>

<style scoped lang="scss">
@use './dualPonUi.scss' as ui;
.dual-shell-host { width: 100%; height: 100%; }
.app-container.dual-pon-page-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$bg; }
.dual-shell { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; background: ui.$bg; }
.dual-shell__status { height: 24px; flex: 0 0 24px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; background: #fff; color: ui.$text; font-size:12px; }
.dual-shell__status > span { display: flex; align-items: flex-end; gap: 3px; }
.dual-shell__status img { width: 13px; height: 13px; object-fit: contain; }
.dual-shell__status i { width: 2px; border-radius: 2px; background: ui.$primary; }
.dual-shell__status i:nth-of-type(1) { height: 4px; }
.dual-shell__status i:nth-of-type(2) { height: 7px; }
.dual-shell__status i:nth-of-type(3) { height: 10px; }
.dual-shell__header { min-height: 58px; display: grid; grid-template-columns: 44px minmax(0,1fr) 44px; align-items: center; padding: 6px 12px; border-bottom: 1px solid ui.$border; background: #fff; flex: 0 0 auto; z-index: 10; }
.dual-shell__back { @include ui.reset-button; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; background: transparent; }
.dual-shell__back:active { background: ui.$primary-soft; }
.dual-shell__back:focus-visible { @include ui.focus-ring; }
.dual-shell__back img { width: 24px; height: 24px; }
.dual-shell__heading { min-width: 0; text-align: center; }
.dual-shell__heading h1 { margin: 0; overflow: hidden; color: ui.$text; font-size: 16px; font-weight: 750; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; letter-spacing: 0; }
.dual-shell__heading p { margin: 2px 0 0; color: ui.$sub; font-size: 11px; line-height: 1.2; letter-spacing: 0; }
.dual-shell__action { min-width: 44px; display: flex; justify-content: flex-end; align-items: center; }
.dual-shell__body { min-height: 0; flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; }
.dual-shell__footer { flex: 0 0 auto; z-index: 9; padding: 8px 14px max(10px, env(safe-area-inset-bottom)); border-top: 1px solid rgba(216,226,239,.72); background: rgba(247,249,252,.98); box-shadow: 0 -8px 20px rgba(37,99,235,.04); }
</style>
