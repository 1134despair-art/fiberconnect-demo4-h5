<template>
  <div class="device-utility-grid">
    <button type="button" :class="{ active: vflActive }" @click="emit('open-vfl')">
      <span class="utility-icon"><img :src="vflIcon" alt="" /></span>
      <strong>{{ vflTitle }}</strong>
      <small>{{ vflStatus }}</small>
      <span class="utility-arrow" aria-hidden="true">›</span>
    </button>
    <button
      type="button"
      :class="{ active: flashlightOn }"
      :aria-pressed="flashlightOn"
      @click="emit('toggle-flashlight')"
    >
      <span class="utility-icon"><img :src="flashlightIcon" alt="" /></span>
      <strong>{{ flashlightTitle }}</strong>
      <small>{{ flashlightStatus }}</small>
      <span class="mini-switch" :class="{ active: flashlightOn }" aria-hidden="true"><i></i></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import vflIcon from '@/assets/icons/iconfont/smart-otdr/vfl.svg'
import flashlightIcon from '@/assets/icons/iconfont/smart-otdr/flashlight.svg'

defineProps<{
  vflTitle: string
  vflStatus: string
  vflActive: boolean
  flashlightTitle: string
  flashlightStatus: string
  flashlightOn: boolean
}>()

const emit = defineEmits<{ 'open-vfl': []; 'toggle-flashlight': [] }>()
</script>

<style scoped>
.device-utility-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.device-utility-grid button { position: relative; min-width: 0; min-height: 112px; padding: 12px; border: 1px solid #d8e2ef; border-radius: 8px; background: #ffffff; color: #0f172a; font: inherit; text-align: left; box-shadow: 0 2px 8px rgba(15, 23, 42, .05); }
.device-utility-grid button:active { transform: scale(.985); border-color: #93c5fd; }
.device-utility-grid button:focus-visible { outline: 3px solid rgba(37, 99, 235, .25); outline-offset: 2px; }
.device-utility-grid button.active { border-color: #93c5fd; background: #f8fbff; }
.utility-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 8px; background: #eff6ff; }
.utility-icon img { width: 23px; height: 23px; object-fit: contain; }
.device-utility-grid strong, .device-utility-grid small { display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.device-utility-grid strong { margin-top: 9px; font-size: 13px; line-height: 1.35; }
.device-utility-grid small { margin-top: 3px; padding-right: 34px; color: #64748b; font-size: 11px; line-height: 1.35; }
.utility-arrow { position: absolute; right: 12px; bottom: 15px; color: #64748b; font-size: 22px; line-height: 1; }
.mini-switch { position: absolute; right: 12px; bottom: 14px; width: 32px; height: 18px; padding: 2px; box-sizing: border-box; border-radius: 9px; background: #cbd5e1; }
.mini-switch i { display: block; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; transition: transform .18s ease; }
.mini-switch.active { background: #2563eb; }
.mini-switch.active i { transform: translateX(14px); }
@media (prefers-reduced-motion: reduce) { .mini-switch i { transition: none; } }
</style>
