<template>
  <nav class="smart-function-nav" aria-label="智能 OTDR 设备功能">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      :class="{ active: active === item.key }"
      :aria-current="active === item.key ? 'page' : undefined"
      @click="open(item.key)"
    >
      <span><img :src="item.icon" alt="" /></span>
      <strong>{{ item.label }}</strong>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import homeIcon from '@/assets/app/icons/navigation/home-default.png'
import measureIcon from '@/assets/app/icons/device/measurement.png'
import eventMapIcon from '@/assets/app/icons/device/event-map.png'
import settingsIcon from '@/assets/app/icons/common/settings.png'

export type SmartOtdrFunctionKey = 'home' | 'measure' | 'event-map' | 'settings'

const props = defineProps<{
  deviceId: string
  active?: SmartOtdrFunctionKey
}>()

const router = useRouter()
const items = computed(() => [
  { key: 'home' as const, label: '首页', icon: homeIcon },
  { key: 'measure' as const, label: 'OTDR测量', icon: measureIcon },
  { key: 'event-map' as const, label: '事件地图', icon: eventMapIcon },
  { key: 'settings' as const, label: '设备设置', icon: settingsIcon }
])

const open = (key: SmartOtdrFunctionKey) => {
  if (key === props.active) return
  const path = key === 'home'
    ? `/device/${props.deviceId}`
    : key === 'measure'
      ? `/device/${props.deviceId}/smart-otdr`
      : key === 'event-map'
        ? `/device/${props.deviceId}/event-map`
        : `/device/${props.deviceId}/system`
  router.push(path)
}
</script>

<style scoped>
.smart-function-nav {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 6px;
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.07);
}

.smart-function-nav button {
  min-width: 0;
  min-height: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 2px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
}

.smart-function-nav button span {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #f5f8fc;
}

.smart-function-nav img {
  width: 19px;
  height: 19px;
  object-fit: contain;
  opacity: 0.72;
}

.smart-function-nav button:not(.active) img {
  filter: brightness(0) saturate(100%) invert(43%) sepia(14%) saturate(732%) hue-rotate(176deg) brightness(91%) contrast(88%);
}

.smart-function-nav strong {
  max-width: 100%;
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.smart-function-nav button.active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.22);
}

.smart-function-nav button.active span { background: rgba(255, 255, 255, 0.18); }
.smart-function-nav button.active img { filter: brightness(0) invert(1); opacity: 1; }
.smart-function-nav button:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.24); outline-offset: 2px; }
</style>
