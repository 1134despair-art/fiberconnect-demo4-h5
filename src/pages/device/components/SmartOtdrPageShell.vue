<template>
  <div class="smart-otdr-shell" :style="shellStyle">
    <div v-if="showMobileStatus" class="smart-otdr-shell__status" aria-hidden="true">
      <strong>{{ currentTime }}</strong>
      <span>
        <img :src="bluetoothIcon" alt="" />
        <i></i><i></i><i></i>
        <b v-if="batteryCharging" class="smart-otdr-shell__charging">+</b>
        <img :src="batteryIcon" alt="" />
        <b class="smart-otdr-shell__battery-value">{{ batteryPercent }}%</b>
      </span>
    </div>
    <header class="smart-otdr-shell__header">
      <button class="smart-otdr-shell__back" type="button" aria-label="返回" @click="emit('back')">
        <img :src="backIcon" alt="" />
      </button>
      <div class="smart-otdr-shell__heading">
        <h1 class="smart-otdr-shell__title">{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions || (showQuickPanel && !blocked)" class="smart-otdr-shell__actions">
        <slot name="actions" />
        <SmartOtdrQuickPanel v-if="showQuickPanel && !blocked" inline-trigger />
      </div>
      <div v-else class="smart-otdr-shell__spacer" aria-hidden="true"></div>
    </header>

    <main class="smart-otdr-shell__body">
      <p v-if="blocked" role="alert">正在检查连接与授权…</p>
      <slot v-else />
    </main>

    <footer v-if="$slots.footer && !blocked" class="smart-otdr-shell__footer">
      <slot name="footer" />
    </footer>


  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useSmartOtdrDevice } from '@/composables/useSmartOtdrDevice'
import backIcon from '@/assets/icons/iconfont/smart-otdr/back.svg'
import bluetoothIcon from '@/assets/icons/iconfont/smart-otdr/bluetooth.svg'
import batteryIcon from '@/assets/icons/iconfont/smart-otdr/battery.svg'

import { SMART_OTDR_SHELL_MAX_WIDTH, createPixelValue } from './smartOtdrUi'
import SmartOtdrQuickPanel from './SmartOtdrQuickPanel.vue'

const route = useRoute(); const router = useRouter()
const { user } = useAuth()
const device = computed(() => user.value?.devices?.find(d => d.id === route.params.id))
const { locked, runtime } = useSmartOtdrDevice(device)
const blocked = computed(() => device.value?.deviceType === 'smart_otdr' && route.name !== 'SmartOtdrConnect' && (device.value.status !== 'connected' || locked.value || !!runtime.value.authorizationError))
watch(blocked, value => { if (value) void router.replace(`/device/${route.params.id}/activate`) }, { immediate: true })
const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    backText?: string
    maxWidth?: number | string
    showStatusBar?: boolean
    showQuickPanel?: boolean
    batteryLevel?: number
    batteryCharging?: boolean
  }>(),
  {
    backText: '\u2190 返回',
    maxWidth: SMART_OTDR_SHELL_MAX_WIDTH,
    showStatusBar: true,
    showQuickPanel: true,
    batteryLevel: 86,
    batteryCharging: false
  }
)

const emit = defineEmits<{
  (e: 'back'): void
}>()

const shellStyle = computed(() => ({
  '--smart-otdr-shell-width': createPixelValue(props.maxWidth)
}))

const numericMaxWidth = computed(() => Number.parseFloat(String(props.maxWidth)))
const showMobileStatus = computed(() => props.showStatusBar && numericMaxWidth.value <= 430)
const batteryPercent = computed(() => Math.round(Math.min(100, Math.max(0, props.batteryLevel))))
const formatTime = () => new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}).format(new Date())
const currentTime = ref(formatTime())
let timeTimer: number | undefined

onMounted(() => {
  timeTimer = window.setInterval(() => { currentTime.value = formatTime() }, 30_000)
})

onUnmounted(() => {
  if (timeTimer) window.clearInterval(timeTimer)
})
</script>

<style lang="scss" scoped>
@use './smartOtdrUi.scss' as ui;

.smart-otdr-shell {
  @include ui.smart-otdr-shell-container;
  width: min(100%, var(--smart-otdr-shell-width, #{ui.$smart-otdr-shell-width}));
  height: 100%;
  overflow: hidden;
  background: #f7f9fc;
}

.smart-otdr-shell__status {
  height: 24px;
  flex: 0 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: #ffffff;
  color: ui.$smart-otdr-text-main;
  font-size:12px;
}

.smart-otdr-shell__status > span {
  display: flex;
  align-items: flex-end;
  gap: 3px;
}

.smart-otdr-shell__status img {
  width: 13px;
  height: 13px;
  object-fit: contain;
}

.smart-otdr-shell__status i {
  width: 2px;
  border-radius: 2px;
  background: ui.$smart-otdr-primary;
}

.smart-otdr-shell__status i:nth-of-type(1) { height: 4px; }
.smart-otdr-shell__status i:nth-of-type(2) { height: 7px; }
.smart-otdr-shell__status i:nth-of-type(3) { height: 10px; }
.smart-otdr-shell__battery-value,
.smart-otdr-shell__charging {
  color: ui.$smart-otdr-primary;
  font-size:12px;
  line-height: 1;
}
.smart-otdr-shell__charging { color: #16a34a; font-weight: 900; }

.smart-otdr-shell__header {
  min-height: 58px;
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid #d8e2ef;
  background: #ffffff;
  z-index: 10;
}

.smart-otdr-shell__back {
  @include ui.smart-otdr-plain-button;
  width: 44px;
  height: 44px;
  padding: 0;
  display: grid;
  place-items: center;
  border-radius: 8px;
}

.smart-otdr-shell__back:active {
  background: ui.$smart-otdr-primary-soft;
}

.smart-otdr-shell__back img {
  width: 24px;
  height: 24px;
}

.smart-otdr-shell__heading {
  min-width: 0;
  text-align: center;
}

.smart-otdr-shell__title {
  margin: 0;
  overflow: hidden;
  color: ui.$smart-otdr-text-main;
  font-size: 16px;
  font-weight: 750;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0;
}

.smart-otdr-shell__heading p {
  margin: 2px 0 0;
  overflow: hidden;
  color: ui.$smart-otdr-text-sub;
  font-size: 11px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0;
}

.smart-otdr-shell__spacer {
  min-width: 44px;
}

.smart-otdr-shell__actions {
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.smart-otdr-shell__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: transparent;
}

.smart-otdr-shell__footer {
  flex: 0 0 auto;
  z-index: 9;
  padding: 8px 14px max(10px, env(safe-area-inset-bottom));
  border-top: 1px solid rgba(216, 226, 239, 0.72);
  background: rgba(247, 249, 252, 0.98);
  box-shadow: 0 -8px 20px rgba(37, 99, 235, 0.04);
}
</style>
