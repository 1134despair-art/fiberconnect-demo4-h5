<template>
  <div class="device-settings-list">
    <section v-for="section in sections" :key="section.key" class="settings-section">
      <h2 v-if="section.title">{{ section.title }}</h2>
      <div class="settings-group">
        <button
          v-for="item in section.items"
          :key="item.key"
          class="settings-row"
          :class="{ danger: item.tone === 'danger' }"
          type="button"
          :disabled="item.disabled"
          @click="emit('select', item.key)"
        >
          <span class="settings-icon" :class="item.tone" :style="{ backgroundColor: settingsIconBackground(item.iconName) }">
            <SettingsGlyph v-if="item.iconName" :name="item.iconName" />
            <img v-else-if="item.icon" :src="item.icon" alt="" />
          </span>
          <span class="settings-copy">
            <strong>{{ item.label }}</strong>
            <small v-if="item.description">{{ item.description }}</small>
          </span>
          <span class="settings-value">
            <b v-if="item.badge" :class="item.badgeTone">{{ item.badge }}</b>
            <span v-if="item.value">{{ item.value }}</span>
            <SettingsGlyph v-if="item.iconName" class="settings-chevron" name="chevron" />
            <img v-else :src="chevronIcon" alt="" />
          </span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import SettingsGlyph from '@/components/SettingsGlyph.vue'
import { settingsIconBackground } from '@/components/settingsIconPalette'
import chevronIcon from '@/assets/icons/iconfont/device/chevron.svg'

export interface DeviceSettingItem {
  key: string
  label: string
  description?: string
  value?: string
  icon?: string
  iconName?: string
  disabled?: boolean
  tone?: 'default' | 'danger'
  badge?: string
  badgeTone?: 'success' | 'warning' | 'danger'
}

export interface DeviceSettingSection {
  key: string
  title?: string
  items: DeviceSettingItem[]
}

defineProps<{ sections: DeviceSettingSection[] }>()
const emit = defineEmits<{ select: [key: string] }>()
</script>

<style scoped>
.device-settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-section h2 {
  margin: 0 0 8px 2px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.settings-group {
  overflow: hidden;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.settings-row {
  width: 100%;
  min-height: 68px;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 0;
  border-bottom: 1px solid #d8e2ef;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.settings-row:last-child { border-bottom: 0; }
.settings-row:active { background: #f8fafc; }
.settings-row:disabled { cursor: not-allowed; opacity: 0.48; }
.settings-row:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.24); outline-offset: -3px; }

.settings-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #eff6ff;
}

.settings-icon.danger { background: #fef2f2; }
.settings-icon img { width: 22px; height: 22px; object-fit: contain; }
.settings-row.danger .settings-copy strong { color: #dc2626; }

.settings-copy { min-width: 0; }
.settings-copy strong,
.settings-copy small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}
.settings-copy strong { font-size: 14px; font-weight: 700; line-height: 1.35; }
.settings-copy small { margin-top: 3px; color: #64748b; font-size: 11px; line-height: 1.45; }

.settings-value {
  min-width: 0;
  max-width: 116px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  color: #475569;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.settings-value > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.settings-value > img { width: 18px; height: 18px; flex: 0 0 auto; }
.settings-value b { padding: 3px 6px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 11px; white-space: nowrap; }
.settings-value b.success { background: #dcfce7; color: #15803d; }
.settings-value b.warning { background: #fef3c7; color: #b45309; }
.settings-value b.danger { background: #fee2e2; color: #b91c1c; }

@media (max-width: 340px) {
  .settings-row { grid-template-columns: 36px minmax(0, 1fr) auto; padding-inline: 10px; }
  .settings-icon { width: 34px; height: 34px; }
  .settings-value { max-width: 88px; }
}
</style>
