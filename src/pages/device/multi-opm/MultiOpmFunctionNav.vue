<template>
  <nav class="multi-opm-function-nav" aria-label="多功能光功率计设备功能">
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
import { useRouter } from 'vue-router'
import homeIcon from '@/assets/icons/iconfont/device/power.svg'
import measureIcon from '@/assets/icons/iconfont/device/power.svg'
import vflIcon from '@/assets/icons/iconfont/device/vfl.svg'
import settingsIcon from '@/assets/icons/iconfont/device/settings.svg'

export type MultiOpmFunctionKey = 'home' | 'measure' | 'vfl' | 'settings'
const props = defineProps<{ deviceId: string; active: MultiOpmFunctionKey }>()
const router = useRouter()
const items = [
  { key: 'home' as const, label: '首页', icon: homeIcon },
  { key: 'measure' as const, label: '光功率', icon: measureIcon },
  { key: 'vfl' as const, label: 'VFL', icon: vflIcon },
  { key: 'settings' as const, label: '设备设置', icon: settingsIcon }
]

const open = (key: MultiOpmFunctionKey) => {
  if (key === props.active) return
  const path = key === 'home'
    ? `/device/${props.deviceId}`
    : key === 'measure'
      ? `/device/${props.deviceId}/mopm`
      : key === 'vfl'
        ? `/device/${props.deviceId}/mopm-vfl`
        : `/device/${props.deviceId}/legacy-settings`
  router.push(path)
}
</script>

<style scoped lang="scss">
@use './multiOpmUi.scss' as ui;

.multi-opm-function-nav { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; padding: 6px; border: 1px solid ui.$border; border-radius: 12px; background: #fff; box-shadow: ui.$shadow; }
.multi-opm-function-nav button { @include ui.button-reset; min-width: 0; min-height: 58px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 5px 2px; border-radius: 8px; background: transparent; color: ui.$text-sub; }
.multi-opm-function-nav button span { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 8px; background: #f5f8fc; }
.multi-opm-function-nav img { width: 19px; height: 19px; object-fit: contain; opacity: .72; }
.multi-opm-function-nav strong { max-width: 100%; overflow: hidden; font-size:12px; text-overflow: ellipsis; white-space: nowrap; }
.multi-opm-function-nav button.active { background: ui.$primary; color: #fff; box-shadow: 0 6px 14px rgba(37, 99, 235, .22); }
.multi-opm-function-nav button.active span { background: rgba(255, 255, 255, .18); }
.multi-opm-function-nav button.active img { filter: brightness(0) invert(1); opacity: 1; }
</style>
