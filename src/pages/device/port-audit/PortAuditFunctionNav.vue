<template>
  <nav class="audit-function-nav" :aria-label="t('portAudit.deviceSubtitle')">
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
import homeIcon from '@/assets/icons/iconfont/smart-otdr/navigation/home.svg'
import auditIcon from '@/assets/icons/iconfont/instrument/fid.svg'
import powerIcon from '@/assets/icons/iconfont/smart-otdr/power.svg'
import settingsIcon from '@/assets/icons/iconfont/smart-otdr/navigation/settings.svg'

export type PortAuditFunctionKey = 'home' | 'audit' | 'power' | 'settings'

const props = defineProps<{ deviceId: string; active: PortAuditFunctionKey }>()
const router = useRouter()
const { t } = useI18n()
const items = computed(() => [
  { key: 'home' as const, label: t('common.home'), icon: homeIcon },
  { key: 'audit' as const, label: t('portAudit.fidTitle'), icon: auditIcon },
  { key: 'power' as const, label: t('portAudit.powerTitle'), icon: powerIcon },
  { key: 'settings' as const, label: t('portAudit.settingsTitle'), icon: settingsIcon }
])

const open = (key: PortAuditFunctionKey) => {
  if (key === props.active) return
  const path = key === 'home'
    ? `/device/${props.deviceId}`
    : key === 'audit'
      ? `/device/${props.deviceId}/port-fid`
      : key === 'power'
        ? `/device/${props.deviceId}/port-power`
        : `/device/${props.deviceId}/port-settings`
  router.push(path)
}
</script>

<style scoped lang="scss">
@use './portAuditUi.scss' as ui;
.audit-function-nav { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); align-items: stretch; gap: 6px; padding: 6px; border: 1px solid ui.$audit-border; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgba(15,23,42,.06); }
.audit-function-nav button { @include ui.reset-button; min-width: 0; min-height: 58px; width: 100%; display: grid; grid-template-rows: 28px 14px; place-items: center; align-content: center; gap: 4px; padding: 5px 2px; border-radius: 8px; color: ui.$audit-sub; text-align: center; }
.audit-function-nav button span { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 8px; background: #f5f8fc; }
.audit-function-nav img { width: 20px; height: 20px; display: block; object-fit: contain; opacity: .72; }
.audit-function-nav strong { width: 100%; overflow: hidden; font-size:12px; line-height: 14px; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.audit-function-nav button.active { background: ui.$audit-primary; color: #fff; box-shadow: 0 6px 14px rgba(37,99,235,.22); }
.audit-function-nav button.active span { background: rgba(255,255,255,.18); }
.audit-function-nav button.active img { filter: brightness(0) invert(1); opacity: 1; }
.audit-function-nav button:not(.active):active { background: ui.$audit-primary-soft; transform: scale(.97); }
.audit-function-nav button:focus-visible { @include ui.focus-ring; }
</style>
