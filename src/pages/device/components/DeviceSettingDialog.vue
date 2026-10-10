<template>
  <div v-if="open" v-smart-otdr-overlay="!!contained" class="dialog-layer" role="presentation" @keydown.esc="emit('close')">
    <button class="dialog-mask" type="button" :aria-label="t('common.close')" @click="emit('close')"></button>
    <section class="setting-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <header>
        <div>
          <h2 :id="titleId">{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </div>
        <button class="close-button" type="button" :aria-label="t('common.close')" @click="emit('close')">
          <img :src="closeIcon" alt="" />
        </button>
      </header>

      <div class="dialog-body"><slot /></div>

      <footer v-if="showFooter">
        <button class="cancel-button" type="button" :disabled="busy" @click="emit('close')">
          {{ cancelText || t('common.cancel') }}
        </button>
        <button class="confirm-button" :class="{ danger }" type="button" :disabled="busy || confirmDisabled" @click="emit('confirm')">
          {{ confirmText || t('common.confirm') }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { vSmartOtdrOverlay } from '@/directives/smartOtdrOverlay'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import closeIcon from '@/assets/icons/iconfont/device/close.svg'

const props = withDefaults(defineProps<{
  contained?: boolean
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  showFooter?: boolean
  danger?: boolean
  busy?: boolean
  confirmDisabled?: boolean
}>(), {
  description: '',
  confirmText: '',
  cancelText: '',
  showFooter: true,
  danger: false,
  busy: false,
  confirmDisabled: false
})

const emit = defineEmits<{ close: []; confirm: [] }>()
const { t } = useI18n()
const titleId = computed(() => `device-setting-${props.title.replace(/\s+/g, '-').toLowerCase()}`)
</script>

<style scoped>
.dialog-layer {
  position: absolute;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 20px;
}
.dialog-mask { position: absolute; inset: 0; border: 0; background: rgba(15, 23, 42, 0.58); }
.setting-dialog {
  position: relative;
  width: min(100%, 320px);
  max-height: min(680px, calc(100% - 24px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.24);
}
.setting-dialog > header {
  min-height: 64px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #d8e2ef;
}
.setting-dialog h2 { margin: 0; color: #0f172a; font-size: 16px; font-weight: 700; line-height: 1.35; }
.setting-dialog header p { margin: 4px 0 0; color: #64748b; font-size: 11px; line-height: 1.5; }
.close-button { width: 44px; height: 44px; flex: 0 0 auto; display: grid; place-items: center; margin: -7px -8px -7px 0; border: 0; border-radius: 8px; background: transparent; }
.close-button:active { background: #eff6ff; }
.close-button img { width: 22px; height: 22px; }
.dialog-body { min-height: 0; overflow-y: auto; padding: 16px; background: #f8fafc; }
.setting-dialog footer { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px 16px 16px; border-top: 1px solid #d8e2ef; background: #ffffff; }
.setting-dialog footer button { min-height: 44px; border: 0; border-radius: 8px; font: inherit; font-size: 13px; font-weight: 700; }
.cancel-button { background: #eef2f7; color: #334155; }
.confirm-button { background: #2563eb; color: #ffffff; }
.confirm-button.danger { background: #dc2626; }
.setting-dialog button:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.25); outline-offset: 2px; }
.setting-dialog button:disabled { opacity: 0.5; }

@media (max-width: 340px) {
  .dialog-layer { padding: 12px; }
  .setting-dialog > header, .dialog-body { padding: 14px; }
  .setting-dialog footer { padding: 10px 14px 14px; }
}
</style>
