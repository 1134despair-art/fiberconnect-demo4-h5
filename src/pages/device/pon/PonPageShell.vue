<template>
  <div class="pon-shell">
    <div class="pon-shell__status" aria-hidden="true">
      <strong>{{ currentTime }}</strong>
      <span>
        <img :src="bluetoothIcon" alt="" />
        <i></i><i></i><i></i>
        <img :src="batteryIcon" alt="" />
      </span>
    </div>
    <header class="pon-shell__header">
      <button class="pon-shell__back" type="button" :aria-label="t('common.back')" @click="emit('back')">
        <img :src="backIcon" alt="" />
      </button>
      <div class="pon-shell__heading">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div class="pon-shell__action">
        <slot name="action" />
      </div>
    </header>

    <main class="pon-shell__body hide-scrollbar">
      <slot />
    </main>

    <footer v-if="$slots.footer" class="pon-shell__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import backIcon from '@/assets/icons/pon-meter/ui/back.png'
import bluetoothIcon from '@/assets/icons/pon-meter/ui/bluetooth.png'
import batteryIcon from '@/assets/icons/pon-meter/ui/battery.png'

defineProps<{
  title: string
  subtitle?: string
}>()

const emit = defineEmits<{
  back: []
}>()

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
@use './ponUi.scss' as ui;

.pon-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f9fc;
  overflow: hidden;
}

.pon-shell__status {
  height: 24px;
  flex: 0 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: #ffffff;
  color: ui.$pon-text;
  font-size: 10px;
}

.pon-shell__status > span { display: flex; align-items: flex-end; gap: 3px; }
.pon-shell__status img { width: 13px; height: 13px; object-fit: contain; }
.pon-shell__status i { width: 2px; border-radius: 2px; background: ui.$pon-primary; }
.pon-shell__status i:nth-of-type(1) { height: 4px; }
.pon-shell__status i:nth-of-type(2) { height: 7px; }
.pon-shell__status i:nth-of-type(3) { height: 10px; }

.pon-shell__header {
  min-height: 58px;
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid ui.$pon-border;
  background: #ffffff;
  z-index: 10;
}

.pon-shell__back {
  @include ui.button-reset;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: transparent;
  display: grid;
  place-items: center;

  &:active {
    background: ui.$pon-primary-soft;
  }

  img {
    width: 24px;
    height: 24px;
  }
}

.pon-shell__heading {
  min-width: 0;
  text-align: center;

  h1 {
    margin: 0;
    overflow: hidden;
    color: ui.$pon-text;
    font-size: 16px;
    font-weight: 750;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: 0;
  }

  p {
    margin: 2px 0 0;
    color: ui.$pon-text-sub;
    font-size: 11px;
    line-height: 1.2;
    letter-spacing: 0;
  }
}

.pon-shell__action {
  min-width: 44px;
  display: flex;
  justify-content: flex-end;
}

.pon-shell__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.pon-shell__footer {
  flex: 0 0 auto;
  z-index: 9;
  padding: 8px 14px max(10px, env(safe-area-inset-bottom));
  border-top: 1px solid rgba(216, 226, 239, 0.72);
  background: rgba(247, 249, 252, 0.98);
  box-shadow: 0 -8px 20px rgba(37, 99, 235, 0.04);
}
</style>
