<template>
  <div :class="standalone ? 'app-container stable-source-page-app' : 'source-shell-host'">
    <div class="source-shell">
      <div class="source-shell__status" aria-hidden="true">
        <strong>{{ currentTime }}</strong>
        <span>
          <img :src="bluetoothIcon" alt="" />
          <i></i><i></i><i></i>
          <img :src="batteryIcon" alt="" />
        </span>
      </div>
      <header class="source-shell__header">
        <button class="source-shell__back" type="button" :aria-label="t('common.back')" @click="emit('back')">
          <img :src="backIcon" alt="" />
        </button>
        <div class="source-shell__heading">
          <h1>{{ title }}</h1>
          <p v-if="subtitle">{{ subtitle }}</p>
        </div>
        <div class="source-shell__action"><slot name="action" /></div>
      </header>
      <main class="source-shell__body hide-scrollbar"><slot /></main>
      <footer v-if="$slots.footer" class="source-shell__footer">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import backIcon from '@/assets/icons/pon-meter/ui/back.png'
import bluetoothIcon from '@/assets/icons/pon-meter/ui/bluetooth.png'
import batteryIcon from '@/assets/icons/pon-meter/ui/battery.png'

defineProps<{ title: string; subtitle?: string; standalone?: boolean }>()
const emit = defineEmits<{ back: [] }>()
const { t } = useI18n()
const formatTime = () => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
const currentTime = ref(formatTime())
let timeTimer: number | undefined

onMounted(() => {
  timeTimer = window.setInterval(() => { currentTime.value = formatTime() }, 30_000)
})

onUnmounted(() => {
  if (timeTimer) window.clearInterval(timeTimer)
})
</script>

<style scoped lang="scss">
@use './stableSourceUi.scss' as ui;

.source-shell-host {
  width: 100%;
  height: 100%;
}

.app-container.stable-source-page-app {
  width: min(375px, calc(100vw - 24px));
  max-width: 375px;
  box-sizing: border-box;
  border-radius: 22px;
  background: ui.$source-bg;
}

.source-shell__status {
  height: 24px;
  flex: 0 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: #ffffff;
  color: ui.$source-text;
  font-size: 10px;
}

.source-shell__status > span { display: flex; align-items: flex-end; gap: 3px; }
.source-shell__status img { width: 13px; height: 13px; object-fit: contain; }
.source-shell__status i { width: 2px; border-radius: 2px; background: ui.$source-primary; }
.source-shell__status i:nth-of-type(1) { height: 4px; }
.source-shell__status i:nth-of-type(2) { height: 7px; }
.source-shell__status i:nth-of-type(3) { height: 10px; }

.source-shell {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ui.$source-bg;
}

.source-shell__header {
  min-height: 58px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid ui.$source-border;
  background: #ffffff;
  flex: 0 0 auto;
  z-index: 10;
}

.source-shell__back {
  @include ui.button-reset;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 8px;

  &:active { background: ui.$source-primary-soft; }
  &:focus-visible { @include ui.focus-ring; }
  img { width: 24px; height: 24px; }
}

.source-shell__heading {
  min-width: 0;
  text-align: center;

  h1 {
    margin: 0;
    overflow: hidden;
    color: ui.$source-text;
    font-size: 16px;
    font-weight: 750;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: 0;
  }

  p {
    margin: 2px 0 0;
    color: ui.$source-text-sub;
    font-size: 11px;
    line-height: 1.2;
    letter-spacing: 0;
  }
}

.source-shell__action {
  min-width: 44px;
  display: flex;
  justify-content: flex-end;
}

.source-shell__body {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.source-shell__footer {
  flex: 0 0 auto;
  z-index: 9;
  padding: 8px 14px max(10px, env(safe-area-inset-bottom));
  border-top: 1px solid rgba(216, 226, 239, .72);
  background: rgba(247, 249, 252, .98);
  box-shadow: 0 -8px 20px rgba(37, 99, 235, .04);
}
</style>
