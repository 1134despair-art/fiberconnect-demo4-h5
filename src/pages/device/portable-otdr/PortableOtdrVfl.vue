<template>
  <div class="portable-vfl-app app-container">
    <PortableOtdrPageShell title="VFL红光源" :subtitle="device.name" @back="goHome">
      <template #footer><PortableOtdrFunctionNav :device-id="device.id" active="vfl" /></template>

      <main class="vfl-page">
        <section v-if="!isOnline" class="offline-band" role="status"><strong>设备离线</strong><span>连接后可控制红光输出</span></section>

        <section class="source-state" :class="{ active: state.vflMode !== 'off' }">
          <img :src="vflIcon" alt="" />
          <strong>650 <small>nm</small></strong>
          <span>{{ state.vflMode === 'off' ? '输出关闭' : modeLabel }}</span>
        </section>

        <section class="mode-panel">
          <div><strong>输出模式</strong><span>常亮 / 1Hz / 2Hz</span></div>
          <div class="mode-grid">
            <button v-for="mode in modes" :key="mode.key" type="button" :class="{ active: state.vflMode === mode.key }" :disabled="!isOnline" @click="selectMode(mode.key)">
              <img :src="mode.icon" alt="" /><strong>{{ mode.label }}</strong>
            </button>
          </div>
          <button class="close-output" type="button" :disabled="!isOnline || state.vflMode === 'off'" @click="state.vflMode = 'off'">
            <img :src="powerOffIcon" alt="" />关闭
          </button>
          <p>激光输出时请勿直视端口，也不要将光束对准他人。</p>
        </section>
      </main>

      <DeviceSettingDialog :open="pendingMode !== null" title="确认开启激光输出" description="请确认端口未朝向人眼，现场人员已知晓激光正在工作。" confirm-text="确认开启" danger @close="pendingMode = null" @confirm="confirmMode">
        <div class="laser-mark">LASER</div>
      </DeviceSettingDialog>
    </PortableOtdrPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Device } from '@/composables/useAuth'
import DeviceSettingDialog from '../components/DeviceSettingDialog.vue'
import vflIcon from '@/assets/icons/iconfont/device/vfl.svg'
import steadyIcon from '@/assets/icons/iconfont/device/output.svg'
import pulse1Icon from '@/assets/icons/iconfont/device/pulse.svg'
import pulse2Icon from '@/assets/icons/iconfont/device/pulse.svg'
import powerOffIcon from '@/assets/icons/iconfont/device/poweroff.svg'
import PortableOtdrFunctionNav from './PortableOtdrFunctionNav.vue'
import PortableOtdrPageShell from './PortableOtdrPageShell.vue'
import { usePortableOtdrState, type PortableOtdrVflMode } from './usePortableOtdrState'

const props = defineProps<{ device: Device }>()
const router = useRouter()
const state = usePortableOtdrState(props.device.id)
const pendingMode = ref<Exclude<PortableOtdrVflMode, 'off'> | null>(null)
const isOnline = computed(() => props.device.status === 'connected' && state.bluetoothEnabled)
const modes = [
  { key: 'steady' as const, label: '常亮', icon: steadyIcon },
  { key: '1hz' as const, label: '1Hz', icon: pulse1Icon },
  { key: '2hz' as const, label: '2Hz', icon: pulse2Icon }
]
const modeLabel = computed(() => modes.find(item => item.key === state.vflMode)?.label || '输出关闭')
const goHome = () => router.replace(`/device/${props.device.id}`)
const selectMode = (mode: Exclude<PortableOtdrVflMode, 'off'>) => {
  if (state.vflMode === mode) return
  if (state.vflMode === 'off') pendingMode.value = mode
  else state.vflMode = mode
}
const confirmMode = () => {
  if (pendingMode.value) state.vflMode = pendingMode.value
  pendingMode.value = null
}
</script>

<style scoped lang="scss">
@use './portableOtdrUi.scss' as ui;
@use '../components/deviceSettingsControls.scss';

.portable-vfl-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$bg; }
.vfl-page { @include ui.page-surface; display: flex; flex-direction: column; gap: 16px; padding-bottom: 22px; }
.offline-band { display: flex; justify-content: space-between; padding: 10px 12px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; color: #9a3412; font-size: 11px; }
.source-state { min-height: 210px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; border-bottom: 1px solid ui.$border; }
.source-state img { width: 58px; height: 58px; opacity: .28; filter: grayscale(1); }
.source-state > strong { color: ui.$text; font-size: 28px; @include ui.metric-number; }
.source-state small { font-size: 12px; }
.source-state > span { padding: 6px 16px; border-radius: 999px; background: #edf2f7; color: ui.$text-sub; font-size:12px; }
.source-state.active img { opacity: 1; filter: none; }
.source-state.active > span { background: #fee2e2; color: ui.$danger; }
.mode-panel > div:first-child strong, .mode-panel > div:first-child span { display: block; }
.mode-panel > div:first-child strong { color: ui.$text; font-size: 13px; }
.mode-panel > div:first-child span { margin-top: 4px; color: ui.$text-sub; font-size:12px; }
.mode-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.mode-grid button { @include ui.secondary-button; min-width: 0; min-height: 86px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
.mode-grid button img { width: 27px; height: 27px; }
.mode-grid button strong { font-size: 12px; }
.mode-grid button.active { border-color: #93c5fd; background: ui.$primary-soft; color: ui.$primary; }
.close-output { @include ui.secondary-button; width: 100%; margin-top: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; color: ui.$danger; }
.close-output img { width: 20px; height: 20px; }
.mode-panel p { margin: 12px 8px 0; color: ui.$text-sub; font-size:12px; line-height: 1.5; text-align: center; }
.laser-mark { width: fit-content; margin: 0 auto; padding: 6px 10px; border: 2px solid ui.$danger; border-radius: 999px; color: ui.$danger; font-size: 11px; font-weight: 800; }
</style>

