<template>
  <img class="settings-glyph" :src="icons[name] || icons.info" alt="" aria-hidden="true" width="24" height="24" draggable="false" />
</template>

<script setup lang="ts">
import accountIcon from '@/assets/icons/iconfont/settings-ui/account.svg?no-inline'
import translateIcon from '@/assets/icons/iconfont/settings-ui/translate.svg?no-inline'
import supportIcon from '@/assets/icons/iconfont/settings-ui/support.svg?no-inline'
import bookIcon from '@/assets/icons/iconfont/settings-ui/book.svg?no-inline'
import phoneIcon from '@/assets/icons/iconfont/settings-ui/phone.svg?no-inline'
import logoutIcon from '@/assets/icons/iconfont/settings-ui/logout.svg?no-inline'
import bluetoothIcon from '@/assets/icons/iconfont/settings-ui/bluetooth.svg?no-inline'
import brightnessIcon from '@/assets/icons/iconfont/settings-ui/brightness.svg?no-inline'
import buzzerIcon from '@/assets/icons/iconfont/settings-ui/buzzer.svg?no-inline'
import timerIcon from '@/assets/icons/iconfont/settings-ui/timer.svg?no-inline'
import infoIcon from '@/assets/icons/iconfont/settings-ui/info.svg?no-inline'
import uploadIcon from '@/assets/icons/iconfont/settings-ui/upload.svg?no-inline'
import restoreIcon from '@/assets/icons/iconfont/settings-ui/restore.svg?no-inline'
import calibrationIcon from '@/assets/icons/iconfont/settings-ui/calibration.svg?no-inline'
import settingsIcon from '@/assets/icons/iconfont/settings-ui/settings.svg?no-inline'
import calendarIcon from '@/assets/icons/iconfont/settings-ui/calendar.svg?no-inline'
import cellularIcon from '@/assets/icons/iconfont/settings-ui/cellular.svg?no-inline'
import pdfIcon from '@/assets/icons/iconfont/settings-ui/pdf.svg?no-inline'
import chevronIcon from '@/assets/icons/iconfont/settings-ui/chevron.svg?no-inline'
import closeIcon from '@/assets/icons/iconfont/settings-ui/close.svg?no-inline'
import searchIcon from '@/assets/icons/iconfont/settings-ui/search.svg?no-inline'
import privacyIcon from '@/assets/icons/iconfont/settings-ui/privacy.svg?no-inline'
import agreementIcon from '@/assets/icons/iconfont/settings-ui/agreement.svg?no-inline'

defineProps<{ name: string }>()
const icons: Record<string, string> = {
  account: accountIcon,
  translate: translateIcon,
  support: supportIcon,
  book: bookIcon,
  phone: phoneIcon,
  logout: logoutIcon,
  bluetooth: bluetoothIcon,
  brightness: brightnessIcon,
  buzzer: buzzerIcon,
  timer: timerIcon,
  info: infoIcon,
  upload: uploadIcon,
  restore: restoreIcon,
  calibration: calibrationIcon,
  settings: settingsIcon,
  calendar: calendarIcon,
  cellular: cellularIcon,
  pdf: pdfIcon,
  chevron: chevronIcon,
  close: closeIcon,
  search: searchIcon,
  privacy: privacyIcon,
  agreement: agreementIcon,
}
</script>

<style scoped>
.settings-glyph { display: block; width: 24px; height: 24px; flex: 0 0 auto; object-fit: contain; }
</style>
