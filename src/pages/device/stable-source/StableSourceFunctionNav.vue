<template>
  <nav class="source-function-nav" aria-label="Stable light source functions">
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
import homeIcon from '@/assets/icons/stable-source/nav-home.png'
import outputIcon from '@/assets/icons/stable-source/nav-output.png'
import vflIcon from '@/assets/icons/pon-meter/ui/vfl.png'
import settingsIcon from '@/assets/icons/pon-meter/ui/settings.png'

export type StableSourceFunctionKey = 'home' | 'output' | 'vfl' | 'settings'

const props = defineProps<{
  deviceId: string
  active: StableSourceFunctionKey
}>()

const router = useRouter()
const { t } = useI18n()
const items = computed(() => [
  { key: 'home' as const, label: t('common.home'), icon: homeIcon },
  { key: 'output' as const, label: t('stableSource.outputStatus'), icon: outputIcon },
  { key: 'vfl' as const, label: 'VFL', icon: vflIcon },
  { key: 'settings' as const, label: t('stableSource.settingsTitle'), icon: settingsIcon }
])

const open = (key: StableSourceFunctionKey) => {
  if (key === props.active) return
  const path = key === 'home'
    ? `/device/${props.deviceId}`
    : key === 'output'
      ? `/device/${props.deviceId}/stable-source-control`
      : key === 'vfl'
        ? `/device/${props.deviceId}/stable-source-vfl`
        : `/device/${props.deviceId}/stable-source-settings`
  router.push(path)
}
</script>

<style scoped lang="scss">
@use './stableSourceUi.scss' as ui;

.source-function-nav {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: stretch;
  gap: 6px;
  padding: 6px;
  border: 1px solid ui.$source-border;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: ui.$source-shadow;
}

.source-function-nav button {
  @include ui.button-reset;
  min-width: 0;
  min-height: 58px;
  width: 100%;
  display: grid;
  grid-template-rows: 28px 14px;
  place-items: center;
  align-content: center;
  gap: 4px;
  padding: 5px 2px;
  border-radius: 8px;
  background: transparent;
  color: ui.$source-text-sub;
  text-align: center;
  transition: background-color .16s ease, color .16s ease, transform .16s ease;
}

.source-function-nav button span {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  justify-self: center;
  border-radius: 8px;
  background: #f5f8fc;
}

.source-function-nav img { width: 20px; height: 20px; display: block; margin: 0 auto; object-fit: contain; object-position: 50% 50%; opacity: .72; }
.source-function-nav strong { width: 100%; max-width: 100%; display: block; justify-self: center; overflow: hidden; margin: 0; font-size: 10px; line-height: 14px; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.source-function-nav button.active { background: ui.$source-primary; color: #ffffff; box-shadow: 0 6px 14px rgba(37, 99, 235, .22); }
.source-function-nav button.active span { background: rgba(255, 255, 255, .18); }
.source-function-nav button.active img { filter: brightness(0) invert(1); opacity: 1; }
.source-function-nav button:not(.active):active { background: ui.$source-primary-soft; transform: scale(.97); }
.source-function-nav button:focus-visible { @include ui.focus-ring; }
</style>
