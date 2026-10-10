<template>
  <nav class="pon-function-nav" aria-label="PON device functions">
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
import { useI18n } from 'vue-i18n'
import powerIcon from '@/assets/icons/iconfont/smart-otdr/power.svg'
import measureIcon from '@/assets/icons/iconfont/instrument/split.svg'
import vflIcon from '@/assets/icons/iconfont/smart-otdr/vfl.svg'
import settingsIcon from '@/assets/icons/iconfont/smart-otdr/navigation/settings.svg'

export type PonFunctionKey = 'opm' | 'pon' | 'vfl' | 'settings'

const props = defineProps<{
  deviceId: string
  active: PonFunctionKey
}>()

const router = useRouter()
const { t } = useI18n()
const items = computed(() => [
  { key: 'opm' as const, label: t('pon.opmMode'), icon: powerIcon },
  { key: 'pon' as const, label: t('pon.ponMode'), icon: measureIcon },
  { key: 'vfl' as const, label: 'VFL', icon: vflIcon },
  { key: 'settings' as const, label: t('pon.settingsTitle'), icon: settingsIcon }
])

const open = (key: PonFunctionKey) => {
  if (key === props.active) return
  const path = key === 'opm'
    ? `/device/${props.deviceId}/pon-opm`
    : key === 'pon'
      ? `/device/${props.deviceId}/pon-measure`
      : key === 'vfl'
        ? `/device/${props.deviceId}/pon-vfl`
        : `/device/${props.deviceId}/pon-settings`
  router.push(path)
}
</script>

<style scoped lang="scss">
@use './ponUi.scss' as ui;

.pon-function-nav {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 6px;
  border: 1px solid ui.$pon-border;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: ui.$pon-shadow;
}

.pon-function-nav button {
  @include ui.button-reset;
  min-width: 0;
  min-height: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 2px;
  border-radius: 8px;
  background: transparent;
  color: ui.$pon-text-sub;
}

.pon-function-nav button span {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #f5f8fc;
}

.pon-function-nav img { width: 19px; height: 19px; object-fit: contain; opacity: .72; }
.pon-function-nav strong { max-width: 100%; overflow: hidden; font-size:12px; text-overflow: ellipsis; white-space: nowrap; }
.pon-function-nav button.active { background: ui.$pon-primary; color: #ffffff; box-shadow: 0 6px 14px rgba(37, 99, 235, .22); }
.pon-function-nav button.active span { background: rgba(255, 255, 255, .18); }
.pon-function-nav button.active img { filter: brightness(0) invert(1); opacity: 1; }
</style>
