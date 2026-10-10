<template>
  <div class="setting-workspace">
    <nav class="setting-menu" aria-label="设置项目">
      <button v-for="item in items" :key="item.key" type="button"
        :class="{ active: activeKey === item.key }" :aria-pressed="activeKey === item.key"
        @click="activeKey = item.key">
        <span>{{ item.label }}</span><small v-if="item.value">{{ item.value }}</small>
      </button>
    </nav>
    <div :key="activeKey" class="setting-editor" tabindex="0" :aria-label="activeLabel">
      <slot :active-key="activeKey" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
const props = defineProps<{ items: Array<{ key: string; label: string; value?: string }> }>()
const activeKey = ref(props.items[0]?.key || '')
const activeLabel = computed(() => props.items.find(item => item.key === activeKey.value)?.label || '设置内容')
watch(() => props.items, items => {
  if (!items.some(item => item.key === activeKey.value)) activeKey.value = items[0]?.key || ''
})
</script>
<style scoped>
.setting-workspace { display:grid; grid-template-columns:minmax(88px, 30%) minmax(0, 1fr); height:clamp(140px, calc(100dvh - 220px), 330px); min-height:0; border:1px solid #dde5ef; border-radius:10px; overflow:hidden; background:#fff; }
.setting-menu,.setting-editor { min-width:0; min-height:0; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; }
.setting-menu { background:#f2f5fa; border-right:1px solid #dde5ef; padding:5px; }
.setting-menu button { display:flex; flex-direction:column; justify-content:center; gap:4px; width:100%; min-height:48px; padding:9px 10px; border:0; border-radius:6px; background:transparent; text-align:left; color:#334155; font:inherit; font-size:13px; cursor:pointer; }
.setting-menu button.active { background:#e4edff; color:#174eab; box-shadow:inset 3px 0 #2563eb; font-weight:700; }
.setting-menu small { color:#64748b; font-size:11px; font-weight:400; overflow-wrap:anywhere; }
.setting-editor { padding:12px 8px; }
.setting-editor :deep(.setting-group-card),.setting-editor :deep(.threshold-group-card) { padding:0; border:0; box-shadow:none; background:transparent; }
.setting-editor :deep(.scrollable-list) { max-height:none; overflow:visible; }

.setting-editor :deep(input[type='radio']),.setting-editor :deep(input[type='checkbox']) { accent-color:#2563eb; width:18px; height:18px; flex-shrink:0; }
button:focus-visible,.setting-editor:focus-visible { outline:2px solid #2563eb; outline-offset:-2px; }
@media(max-height:450px) { .setting-workspace { height:clamp(110px, calc(100dvh - 196px), 240px); } .setting-editor { padding:8px 12px; } }

.setting-editor :deep(.setting-input),.setting-editor :deep(.setting-inline-field) { min-width:0;max-width:100%; }.setting-editor :deep(.setting-choice-main) { flex-direction:row;align-items:center; }.setting-editor :deep(.setting-choice-row--input),.setting-editor :deep(.setting-field-row) { flex-wrap:wrap;gap:8px; }
</style>
