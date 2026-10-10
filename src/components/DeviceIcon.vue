<template>
  <span class="device-glyph" :style="maskStyle" aria-hidden="true"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import settingsaccount from '@/assets/icons/iconfont/settings/account.svg'
import settingstranslate from '@/assets/icons/iconfont/settings/translate.svg'
import settingssupport from '@/assets/icons/iconfont/settings/support.svg'
import settingsbook from '@/assets/icons/iconfont/settings/book.svg'
import settingsphone from '@/assets/icons/iconfont/settings/phone.svg'
import settingslogout from '@/assets/icons/iconfont/settings/logout.svg'
import glyph0 from '@/assets/icons/iconfont/device/key.svg'
import glyph1 from '@/assets/icons/iconfont/device/chevron.svg'
import glyph2 from '@/assets/icons/iconfont/device/edit.svg'
import glyph3 from '@/assets/icons/iconfont/device/flashlight.svg'
import glyph4 from '@/assets/icons/iconfont/device/measure.svg'
import glyph5 from '@/assets/icons/iconfont/device/records.svg'
import glyph6 from '@/assets/icons/iconfont/device/cable.svg'
import glyph7 from '@/assets/icons/iconfont/device/radar.svg'
import glyph8 from '@/assets/icons/iconfont/device/close.svg'
import glyph9 from '@/assets/icons/iconfont/device/cellular.svg'
import glyph10 from '@/assets/icons/iconfont/device/split.svg'
import glyph11 from '@/assets/icons/iconfont/device/ruler.svg'
import glyph12 from '@/assets/icons/iconfont/device/timer.svg'
import glyph13 from '@/assets/icons/iconfont/device/info.svg'
import glyph14 from '@/assets/icons/iconfont/device/image.svg'
import glyph15 from '@/assets/icons/iconfont/device/download.svg'
import glyph16 from '@/assets/icons/iconfont/device/lightning.svg'
import glyph17 from '@/assets/icons/iconfont/device/settings.svg'
import glyph18 from '@/assets/icons/iconfont/device/chip.svg'
import glyph19 from '@/assets/icons/iconfont/device/fire.svg'
import glyph20 from '@/assets/icons/iconfont/device/refresh.svg'
import glyph21 from '@/assets/icons/iconfont/device/check.svg'
import glyph22 from '@/assets/icons/iconfont/device/warning.svg'
import glyph23 from '@/assets/icons/iconfont/device/folder.svg'
import glyph24 from '@/assets/icons/iconfont/device/delete.svg'
import glyph25 from '@/assets/icons/iconfont/device/back.svg'

const props = defineProps<{ name: string }>()
const icons: Record<string, string> = {
  'account': settingsaccount,
  'translate': settingstranslate,
  'support': settingssupport,
  'book': settingsbook,
  'phone': settingsphone,
  'logout': settingslogout,
  'key': glyph0,
  'chevron': glyph1,
  'edit': glyph2,
  'flashlight': glyph3,
  'measure': glyph4,
  'records': glyph5,
  'cable': glyph6,
  'radar': glyph7,
  'close': glyph8,
  'cellular': glyph9,
  'split': glyph10,
  'ruler': glyph11,
  'timer': glyph12,
  'info': glyph13,
  'image': glyph14,
  'download': glyph15,
  'lightning': glyph16,
  'settings': glyph17,
  'chip': glyph18,
  'fire': glyph19,
  'refresh': glyph20,
  'check': glyph21,
  'warning': glyph22,
  'folder': glyph23,
  'delete': glyph24,
  'back': glyph25
}
const aliases: Record<string, string> = {
  "mdi:key": "key",
  "mdi:chevron-right": "chevron",
  "mdi:pencil": "edit",
  "mdi:flashlight": "flashlight",
  "mdi:chart-line": "measure",
  "mdi:clipboard-text-outline": "records",
  "mdi:lan-connect": "cable",
  "mdi:radar": "radar",
  "mdi:close": "close",
  "mdi:access-point": "cellular",
  "mdi:call-split": "split",
  "mdi:ruler": "ruler",
  "mdi:history": "timer",
  "mdi:information": "info",
  "mdi:image": "image",
  "mdi:image-outline": "image",
  "mdi:download": "download",
  "mdi:lightning-bolt": "lightning",
  "mdi:cog": "settings",
  "mdi:chip": "chip",
  "mdi:fire": "fire",
  "mdi:flash": "lightning",
  "mdi:loading": "refresh",
  "mdi:clock-outline": "timer",
  "mdi:check-circle": "check",
  "mdi:check": "check",
  "mdi:alert-circle": "warning",
  "mdi:alert": "warning",
  "mdi:folder-open-outline": "folder",
  "mdi:trash-can-outline": "delete",
  "fluent:delete-24-regular": "delete"
}
const maskStyle = computed(() => {
  const source = icons[aliases[props.name] || props.name] || icons.info
  return { maskImage: 'url("' + source + '")', WebkitMaskImage: 'url("' + source + '")' }
})
</script>

<style scoped>
.device-glyph { display: inline-block; width: 1em; height: 1em; flex-shrink: 0; vertical-align: -0.125em; background-color: currentColor; mask-position: center; mask-size: contain; mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat; }
</style>
