<template>
  <div
    class="smart-otdr-dialog-mask"
    :class="{ 'smart-otdr-dialog-mask--landscape': layout === 'landscape' }"
    @click.self="emit('close')"
  >
    <section
      class="smart-otdr-dialog"
      :class="{ 'smart-otdr-dialog--landscape': layout === 'landscape' }"
      :style="dialogStyle"
      role="dialog"
      aria-modal="true"
    >
      <header class="smart-otdr-dialog__header">
        <div class="smart-otdr-dialog__title">{{ title }}</div>
        <button class="smart-otdr-dialog__close" type="button" @click="emit('close')">
          {{ closeText }}
        </button>
      </header>

      <div class="smart-otdr-dialog__content">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="smart-otdr-dialog__footer">
        <slot name="footer" />
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import {
  SMART_OTDR_DIALOG_MAX_HEIGHT,
  SMART_OTDR_SHELL_MAX_WIDTH,
  createPixelValue
} from './smartOtdrUi'

const props = withDefaults(
  defineProps<{
    title: string
    closeText?: string
    maxWidth?: number | string
    maxHeight?: string
    layout?: 'default' | 'landscape'
  }>(),
  {
    closeText: '关闭',
    maxWidth: SMART_OTDR_SHELL_MAX_WIDTH,
    maxHeight: SMART_OTDR_DIALOG_MAX_HEIGHT,
    layout: 'default'
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const dialogStyle = computed(() => ({
  '--smart-otdr-dialog-width': createPixelValue(props.maxWidth),
  '--smart-otdr-dialog-height': props.maxHeight
}))
</script>

<style lang="scss" scoped>
@use './smartOtdrUi.scss' as ui;

.smart-otdr-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.48);
}

.smart-otdr-dialog {
  @include ui.smart-otdr-dialog-surface;
  width: min(100%, var(--smart-otdr-dialog-width, #{ui.$smart-otdr-shell-width}));
  max-height: var(--smart-otdr-dialog-height, calc(100vh - 96px));
}

.smart-otdr-dialog__header,
.smart-otdr-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
}

.smart-otdr-dialog__header {
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.smart-otdr-dialog__footer {
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.smart-otdr-dialog__title {
  color: ui.$smart-otdr-text-main;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.smart-otdr-dialog__close {
  @include ui.smart-otdr-secondary-button;
  min-width: 56px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
}

.smart-otdr-dialog__content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #f7f9fc;
}

.smart-otdr-dialog-mask--landscape {
  padding: 8px;
}

.smart-otdr-dialog--landscape {
  width: min(calc(100vw - 16px), var(--smart-otdr-dialog-width, 780px));
  height: min(430px, calc(100dvh - 16px));
  max-height: calc(100dvh - 16px);
  border-radius: 12px;
}

.smart-otdr-dialog--landscape .smart-otdr-dialog__header {
  min-height: 44px;
  padding: 6px 12px;
}

.smart-otdr-dialog--landscape .smart-otdr-dialog__content {
  display: flex;
  min-height: 0;
  overflow: hidden;
  padding: 8px;
}

@media (max-width: 600px) {
  .smart-otdr-dialog-mask {
    align-items: flex-end;
    padding: 0;
  }

  .smart-otdr-dialog {
    width: 100%;
    max-height: min(88dvh, var(--smart-otdr-dialog-height, 88dvh));
    border-radius: 14px 14px 0 0;
  }

  .smart-otdr-dialog-mask--landscape {
    align-items: center;
    padding: 6px;
  }

  .smart-otdr-dialog--landscape {
    width: calc(100vw - 12px);
    height: calc(100dvh - 12px);
    max-height: calc(100dvh - 12px);
    border-radius: 10px;
  }
}
</style>
