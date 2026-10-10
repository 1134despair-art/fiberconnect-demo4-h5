<template>
  <nav class="smart-measurement-tabs" aria-label="设备测量功能">
    <button v-for="tab in tabs" :key="tab.path" type="button"
      :class="{ active: isActive(tab.path) }"
      :aria-current="isActive(tab.path) ? 'page' : undefined"
      :disabled="busy && !isActive(tab.path)"
      @click="navigate(tab.path)">{{ tab.label }}</button>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
const props = withDefaults(defineProps<{ deviceId: string; busy?: boolean }>(), { busy: false })
const route = useRoute()
const router = useRouter()
const tabs = [
  { path: 'vfl', label: '红光源' },
  { path: 'smart-opm', label: '光功率计' },
  { path: 'smart-otdr', label: 'OTDR 测试' },
  { path: 'event-map', label: '事件地图' }
]
const target = (path: string) => `/device/${encodeURIComponent(props.deviceId)}/${path}`
const isActive = (path: string) => route.path === target(path)
const navigate = (path: string) => {
  if (!props.busy && !isActive(path)) void router.push(target(path))
}
</script>

<style scoped>
.smart-measurement-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3px; width: 100%; box-sizing: border-box; padding: 4px; border-radius: 10px; background: #eaf0f6; }
.smart-measurement-tabs button { min-width: 0; min-height: 44px; padding: 4px 2px; border: 0; border-radius: 7px; background: transparent; color: #617086; font: inherit; font-size: 12px; line-height: 1.4; white-space: nowrap; cursor: pointer; }
.smart-measurement-tabs button.active { background: #fff; color: #1d4ed8; font-weight: 700; box-shadow: 0 1px 4px #0f172a0b; }
.smart-measurement-tabs button:disabled { opacity: .45; cursor: not-allowed; }
.smart-measurement-tabs button:focus-visible { outline: 2px solid #2563eb; outline-offset: -2px; }
</style>
