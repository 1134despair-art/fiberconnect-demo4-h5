<template>
  <svg :viewBox="compact ? '0 0 24 24' : '0 0 48 48'" fill="none" stroke="currentColor" :stroke-width="compact ? 1.5 : 2" stroke-linecap="round" stroke-linejoin="round" :class="['otdr-event-symbol', { compact }]" role="img" :aria-label="type" :data-event-kind="kind">
    <title>{{ type }}</title>
    <template v-if="compact">
      <!-- Hardware-style line symbols; event labels stay available to assistive technology. -->
      <path v-if="kind === 'connector'" d="M3 17h5V7h8v10h5" />
      <path v-else-if="kind === 'start'" d="M21 5v14M3 12h17M8 8l-5 4 5 4" />
      <path v-else-if="kind === 'end'" d="M3 5v14M4 12h17m-5-4 5 4-5 4" />
      <path v-else-if="kind === 'splice'" d="M3 17h6l6-10h6" />
      <path v-else-if="kind === 'splitter'" d="M3 12h7m0 0 7-6h4m-11 6 7 6h4" />
      <path v-else-if="kind === 'bend'" d="M3 7h5l8 10h5" />
      <g v-else><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.1" /></g>
    </template>
    <template v-else>
      <g v-if="kind === 'start'" stroke="none"><rect x="2" y="14" width="44" height="20" rx="3" fill="#64748b"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white">START</text></g>
      <g v-else-if="kind === 'connector'" stroke="none" fill="#20a9e7"><path d="M2 20h9v-7h26v7h9v8h-9v7H11v-7H2z"/><path d="M2 20h5v8H2m39-8h5v8h-5" fill="#f2b521"/></g>
      <g v-else-if="kind === 'splice'"><rect x="3" y="17" width="42" height="14" rx="2" fill="#20a9e7" stroke="none"/><path d="M3 24h42" stroke="#89d9f8"/></g>
      <g v-else-if="kind === 'splitter'"><path d="M10 7h10l18 17-18 17H10z" fill="#20a9e7" stroke="none"/><path d="M5 12h5m-5 8h5m-5 8h5m-5 8h5M38 24h8" stroke="#f2b521" stroke-width="4"/></g>
      <g v-else-if="kind === 'end'"><path d="M3 24h22m0-12v24m7-19 8-6m-8 13h11m-11 7 8 6" /></g>
      <g v-else-if="kind === 'bend'"><path d="M3 30h11c8 0 3-16 12-16s4 16 12 16h7" /></g>
      <g v-else><circle cx="24" cy="24" r="12"/><path d="M24 16v10m0 6v.1"/></g>
    </template>
  </svg>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ type: string; compact?: boolean }>()
const kind = computed(() => {
  if (/末端|终点|end/i.test(props.type)) return 'end'
  if (/分路|splitter/i.test(props.type)) return 'splitter'
  if (/熔接|非反射|splice/i.test(props.type)) return 'splice'
  if (/微弯|宏弯|弯折|bend/i.test(props.type)) return 'bend'
  if (/起始|起点|start/i.test(props.type)) return 'start'
  if (/连接|反射|connector/i.test(props.type)) return 'connector'
  return 'unknown'
})
</script>
<style scoped>
.otdr-event-symbol { display:inline-block;width:40px;height:40px;color:#2563eb;vertical-align:middle;flex-shrink:0; }.otdr-event-symbol.compact { width:28px;height:24px;margin:0;color:inherit; }
</style>
