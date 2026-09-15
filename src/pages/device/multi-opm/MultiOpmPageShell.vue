<template>
  <div class="multi-opm-shell">
    <div class="multi-opm-shell__status" aria-hidden="true">
      <strong>{{ currentTime }}</strong>
      <span>
        <img :src="bluetoothIcon" alt="" />
        <i></i><i></i><i></i>
        <img :src="batteryIcon" alt="" />
      </span>
    </div>

    <header class="multi-opm-shell__header">
      <button class="multi-opm-shell__back" type="button" aria-label="返回" @click="emit('back')">
        <img :src="backIcon" alt="" />
      </button>
      <div class="multi-opm-shell__heading">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div class="multi-opm-shell__action"><slot name="action" /></div>
    </header>

    <main class="multi-opm-shell__body hide-scrollbar"><slot /></main>
    <footer v-if="$slots.footer" class="multi-opm-shell__footer"><slot name="footer" /></footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import backIcon from '@/assets/icons/pon-meter/ui/back.png'
import bluetoothIcon from '@/assets/icons/pon-meter/ui/bluetooth.png'
import batteryIcon from '@/assets/icons/pon-meter/ui/battery.png'

defineProps<{ title: string; subtitle?: string }>()
const emit = defineEmits<{ back: [] }>()
const formatTime = () => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
const currentTime = ref(formatTime())
let timer: number | undefined

onMounted(() => { timer = window.setInterval(() => { currentTime.value = formatTime() }, 30_000) })
onUnmounted(() => { if (timer) window.clearInterval(timer) })
</script>

<style scoped lang="scss">
@use './multiOpmUi.scss' as ui;

.multi-opm-shell { width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; background: ui.$bg; }
.multi-opm-shell__status { height: 24px; flex: 0 0 24px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; background: #fff; color: ui.$text; font-size: 10px; }
.multi-opm-shell__status > span { display: flex; align-items: flex-end; gap: 3px; }
.multi-opm-shell__status img { width: 13px; height: 13px; object-fit: contain; }
.multi-opm-shell__status i { width: 2px; border-radius: 2px; background: ui.$primary; }
.multi-opm-shell__status i:nth-of-type(1) { height: 4px; }
.multi-opm-shell__status i:nth-of-type(2) { height: 7px; }
.multi-opm-shell__status i:nth-of-type(3) { height: 10px; }
.multi-opm-shell__header { min-height: 58px; flex: 0 0 auto; display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; padding: 6px 12px; border-bottom: 1px solid ui.$border; background: #fff; z-index: 10; }
.multi-opm-shell__back { @include ui.button-reset; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; background: transparent; }
.multi-opm-shell__back:active { background: ui.$primary-soft; }
.multi-opm-shell__back img { width: 24px; height: 24px; }
.multi-opm-shell__heading { min-width: 0; text-align: center; }
.multi-opm-shell__heading h1 { margin: 0; overflow: hidden; color: ui.$text; font-size: 16px; font-weight: 750; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; letter-spacing: 0; }
.multi-opm-shell__heading p { margin: 2px 0 0; overflow: hidden; color: ui.$text-sub; font-size: 11px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; letter-spacing: 0; }
.multi-opm-shell__action { min-width: 44px; display: flex; justify-content: flex-end; }
.multi-opm-shell__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.multi-opm-shell__footer { flex: 0 0 auto; z-index: 9; padding: 8px 14px max(10px, env(safe-area-inset-bottom)); border-top: 1px solid rgba(216, 226, 239, .72); background: rgba(247, 249, 252, .98); box-shadow: 0 -8px 20px rgba(37, 99, 235, .04); }
</style>
