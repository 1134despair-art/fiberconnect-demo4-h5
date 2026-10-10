<template>
  <span class="local-icon" :style="maskStyle" aria-hidden="true"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import icon0 from '@/assets/icons/mdi-local/account.svg'
import icon1 from '@/assets/icons/mdi-local/account-edit.svg'
import icon2 from '@/assets/icons/mdi-local/account-group.svg'
import icon3 from '@/assets/icons/mdi-local/bell-cog.svg'
import icon4 from '@/assets/icons/mdi-local/calendar-check.svg'
import icon5 from '@/assets/icons/mdi-local/certificate.svg'
import icon6 from '@/assets/icons/mdi-local/check-circle.svg'
import icon7 from '@/assets/icons/mdi-local/check-circle-outline.svg'
import icon8 from '@/assets/icons/mdi-local/chevron-right.svg'
import icon9 from '@/assets/icons/mdi-local/clipboard-check.svg'
import icon10 from '@/assets/icons/mdi-local/clipboard-text-off.svg'
import icon11 from '@/assets/icons/mdi-local/clock-outline.svg'
import icon12 from '@/assets/icons/mdi-local/close.svg'
import icon13 from '@/assets/icons/mdi-local/email.svg'
import icon14 from '@/assets/icons/mdi-local/eye-settings.svg'
import icon15 from '@/assets/icons/mdi-local/file-document.svg'
import icon16 from '@/assets/icons/mdi-local/headset.svg'
import icon17 from '@/assets/icons/mdi-local/logout.svg'
import icon18 from '@/assets/icons/mdi-local/phone.svg'
import icon19 from '@/assets/icons/mdi-local/shield-account.svg'
import icon20 from '@/assets/icons/mdi-local/star.svg'
import icon21 from '@/assets/icons/mdi-local/video.svg'

const props = defineProps<{ name: string }>()
const icons: Record<string, string> = {
  'mdi:account': icon0,
  'mdi:account-edit': icon1,
  'mdi:account-group': icon2,
  'mdi:bell-cog': icon3,
  'mdi:calendar-check': icon4,
  'mdi:certificate': icon5,
  'mdi:check-circle': icon6,
  'mdi:check-circle-outline': icon7,
  'mdi:chevron-right': icon8,
  'mdi:clipboard-check': icon9,
  'mdi:clipboard-text-off': icon10,
  'mdi:clock-outline': icon11,
  'mdi:close': icon12,
  'mdi:email': icon13,
  'mdi:eye-settings': icon14,
  'mdi:file-document': icon15,
  'mdi:headset': icon16,
  'mdi:logout': icon17,
  'mdi:phone': icon18,
  'mdi:shield-account': icon19,
  'mdi:star': icon20,
  'mdi:video': icon21
}
const maskStyle = computed(() => {
  const source = icons[props.name]
  return { maskImage: source ? `url("${source}")` : 'none', WebkitMaskImage: source ? `url("${source}")` : 'none' }
})
</script>

<style scoped>
.local-icon { display: inline-block; width: 1em; height: 1em; flex-shrink: 0; vertical-align: -0.125em; background-color: currentColor; mask: center / contain no-repeat; -webkit-mask: center / contain no-repeat; }
</style>
