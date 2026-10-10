<template>
  <nav class="dual-function-nav" aria-label="双端PON设备功能">
    <button v-for="item in items" :key="item.key" type="button" :class="{ active: active === item.key }" :aria-current="active === item.key ? 'page' : undefined" @click="open(item.key)">
      <span><img :src="item.icon" alt="" /></span>
      <strong>{{ item.label }}</strong>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import homeIcon from '@/assets/icons/iconfont/smart-otdr/navigation/home.svg'
import networkIcon from '@/assets/icons/iconfont/instrument/network.svg'
import powerIcon from '@/assets/icons/iconfont/smart-otdr/power.svg'
import settingsIcon from '@/assets/icons/iconfont/smart-otdr/navigation/settings.svg'

export type DualPonFunctionKey = 'home' | 'network' | 'power' | 'settings'
const props = defineProps<{ deviceId: string; active: DualPonFunctionKey }>()
const router = useRouter()
const { t } = useI18n()
const items = computed(() => [
  { key: 'home' as const, label: '首页', icon: homeIcon },
  { key: 'network' as const, label: t('dualPon.networkShort'), icon: networkIcon },
  { key: 'power' as const, label: t('dualPon.powerShort'), icon: powerIcon },
  { key: 'settings' as const, label: t('dualPon.settingsTitle'), icon: settingsIcon }
])
const open = (key: DualPonFunctionKey) => {
  if (key === props.active) return
  const path = key === 'home' ? `/device/${props.deviceId}` : key === 'network' ? `/device/${props.deviceId}/dual-pon-network` : key === 'power' ? `/device/${props.deviceId}/dual-pon-power` : `/device/${props.deviceId}/dual-pon-settings`
  router.push(path)
}
</script>

<style scoped lang="scss">
@use './dualPonUi.scss' as ui;
.dual-function-nav { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 6px; padding: 6px; border: 1px solid ui.$border; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgba(15,23,42,.06); }
.dual-function-nav button { @include ui.reset-button; min-width: 0; min-height: 58px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 5px 2px; border-radius: 8px; background: transparent; color: ui.$sub; }
.dual-function-nav button span { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 8px; background: #f5f8fc; }
.dual-function-nav img { width: 19px; height: 19px; object-fit: contain; opacity: .72; }
.dual-function-nav strong { max-width: 100%; overflow: hidden; font-size:12px; text-overflow: ellipsis; white-space: nowrap; }
.dual-function-nav button.active { background: ui.$primary; color: #fff; box-shadow: 0 6px 14px rgba(37,99,235,.22); }
.dual-function-nav button.active span { background: rgba(255,255,255,.18); }
.dual-function-nav button.active img { filter: brightness(0) invert(1); opacity: 1; }
</style>
