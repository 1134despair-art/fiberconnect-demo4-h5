<template>
  <div class="device-vfl-control">
    <section v-if="!connected" class="offline-banner" role="status">
      <span class="offline-indicator"></span>
      <div>
        <strong>{{ copy.offlineTitle }}</strong>
        <p>{{ copy.offlineText }}</p>
      </div>
      <button type="button" :disabled="reconnecting" @click="emit('offline-action')">
        {{ copy.offlineAction }}
      </button>
    </section>

    <section class="vfl-instrument" :class="[color, { active: mode !== 'off' }]">
      <span class="instrument-laser-icon"><img :src="vflIcon" alt="" /></span>
      <div class="beam-stage">


        <span class="reading">
          <strong v-if="color === 'red'">650</strong>
          <strong v-else>{{ copy.greenLabel }}</strong>
          <small v-if="color === 'red'">nm</small>
        </span>
      </div>
      <footer>
        <span class="status-dot"></span>
        <strong>{{ modeLabel }}</strong>
      </footer>
    </section>

    <section class="control-block">
      <header><h2>{{ copy.colorTitle }}</h2></header>
      <div class="color-options" :class="{ single: !supportsGreen }">
        <button
          type="button"
          :class="{ active: color === 'red' }"
          :disabled="!connected"
          :aria-pressed="color === 'red'"
          @click="emit('color-change', 'red')"
        >
          <i class="red"></i><span>{{ copy.redLabel }}</span>
        </button>
        <button
          v-if="supportsGreen"
          type="button"
          :class="{ active: color === 'green' }"
          :disabled="!connected"
          :aria-pressed="color === 'green'"
          @click="emit('color-change', 'green')"
        >
          <i class="green"></i><span>{{ copy.greenLabel }}</span>
        </button>
      </div>
    </section>

    <section class="control-block">
      <header><h2>{{ copy.modeTitle }}</h2></header>
      <div class="mode-options" :style="{ '--mode-columns': supportedModes.length }">
        <button
          v-for="item in supportedModes"
          :key="item"
          type="button"
          :class="{ active: mode === item }"
          :disabled="!connected && item !== 'off'"
          :aria-pressed="mode === item"
          @click="emit('mode-request', item)"
        >
          <img class="instrument-mode-icon" :src="modeIcons[item]" alt="" /><strong>{{ formatMode(item) }}</strong>
        </button>
      </div>
    </section>

    <aside class="laser-safety">
      <b>LASER</b>
      <div><strong>{{ copy.safetyTitle }}</strong><p>{{ copy.safetyText }}</p></div>
    </aside>

    <div v-if="feedback" class="vfl-feedback" role="status">{{ feedback }}</div>

    <div v-if="pendingMode" v-smart-otdr-overlay class="confirm-layer" role="presentation">
      <button class="confirm-mask" type="button" :aria-label="copy.cancelLabel" @click="emit('cancel-confirm')"></button>
      <section role="alertdialog" aria-modal="true" :aria-label="copy.confirmTitle">
        <span class="dialog-mark">LASER</span>
        <h2>{{ copy.confirmTitle }}</h2>
        <p>{{ copy.confirmText }}</p>
        <div>
          <button type="button" @click="emit('cancel-confirm')">{{ copy.cancelLabel }}</button>
          <button class="danger" type="button" @click="emit('confirm')">{{ copy.confirmAction }}</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { vSmartOtdrOverlay } from '@/directives/smartOtdrOverlay'
import vflIcon from '@/assets/icons/iconfont/smart-otdr/vfl.svg'
import cwIcon from '@/assets/icons/iconfont/smart-otdr/cw.svg'
import pulseIcon from '@/assets/icons/iconfont/smart-otdr/pulse.svg'
import pulseFastIcon from '@/assets/icons/iconfont/smart-otdr/pulse-fast.svg'
import offIcon from '@/assets/icons/iconfont/smart-otdr/poweroff.svg'
const modeIcons = { off: offIcon, cw: cwIcon, '1hz': pulseIcon, '2hz': pulseFastIcon }

import { computed } from 'vue'

export type DeviceVflMode = 'off' | 'cw' | '1hz' | '2hz'
export type DeviceVflColor = 'red' | 'green'

export interface DeviceVflCopy {
  offlineTitle: string
  offlineText: string
  offlineAction: string
  outputOff: string
  outputActive: string
  readyHint: string
  activeHint: string
  colorTitle: string
  colorHint: string
  redLabel: string
  greenLabel: string
  modeTitle: string
  modeHint: string
  startLabel: string
  stopLabel: string
  safetyTitle: string
  safetyText: string
  confirmTitle: string
  confirmText: string
  confirmAction: string
  cancelLabel: string
}

const props = withDefaults(defineProps<{
  connected: boolean
  reconnecting?: boolean
  color: DeviceVflColor
  mode: DeviceVflMode
  pendingMode?: DeviceVflMode | null
  supportedModes?: DeviceVflMode[]
  supportsGreen?: boolean
  feedback?: string
  copy: DeviceVflCopy
}>(), {
  reconnecting: false,
  pendingMode: null,
  supportedModes: () => ['off', 'cw', '1hz', '2hz'],
  supportsGreen: true,
  feedback: ''
})

const emit = defineEmits<{
  'offline-action': []
  'color-change': [color: DeviceVflColor]
  'mode-request': [mode: DeviceVflMode]
  'cancel-confirm': []
  confirm: []
}>()

const formatMode = (mode: DeviceVflMode) => mode === 'off' ? 'OFF' : mode === 'cw' ? 'CW' : mode === '1hz' ? '1Hz' : '2Hz'
const modeLabel = computed(() => formatMode(props.mode))
</script>

<style scoped>
.device-vfl-control { position: relative; min-height: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 20px; color: #0f172a; }
.offline-banner { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 11px 12px; border: 1px solid #fed7aa; border-radius: 8px; background: #fff7ed; }
.offline-indicator { width: 9px; height: 9px; border-radius: 50%; background: #d97706; }
.offline-banner strong, .offline-banner p { display: block; margin: 0; }
.offline-banner strong { color: #9a3412; font-size: 12px; }
.offline-banner p { margin-top: 3px; color: #c2410c; font-size: 11px; line-height: 1.4; }
.offline-banner button { min-width: 72px; min-height: 44px; padding: 0 10px; border: 0; border-radius: 8px; background: #ffffff; color: #9a3412; font-size: 11px; font-weight: 700; }
.offline-banner button:disabled { opacity: .5; }

.vfl-instrument { overflow: hidden; border: 1px solid #26364c; border-radius: 12px; background: #0b1423; color: #ffffff; box-shadow: 0 8px 20px rgba(15, 23, 42, .16); }
.vfl-instrument > header { min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 14px; border-bottom: 1px solid #26364c; }
.vfl-instrument > header div { min-width: 0; display: flex; align-items: center; gap: 8px; }
.vfl-instrument > header span { color: #67e8f9; font-size: 11px; font-weight: 800; }
.vfl-instrument > header strong { overflow: hidden; color: #94a3b8; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.vfl-instrument > header b { min-width: 44px; padding: 4px 7px; border-radius: 6px; background: #1e293b; color: #cbd5e1; font-size: 11px; text-align: center; }
.beam-stage { min-height: 154px; display: grid; grid-template-columns: 38px minmax(54px, 1fr) auto; align-items: center; gap: 8px; padding: 18px; }
.emitter { width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid #475569; border-radius: 50%; }
.emitter i { width: 8px; height: 8px; border-radius: 50%; background: #64748b; }
.beam { height: 3px; overflow: visible; background: #334155; }
.beam i { display: block; width: 0; height: 100%; transition: width 180ms ease; }
.reading { min-width: 76px; display: flex; align-items: baseline; justify-content: flex-end; gap: 4px; }
.reading strong { max-width: 86px; overflow: hidden; color: #94a3b8; font-family: "SFMono-Regular", Consolas, monospace; font-size: 28px; font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; }
.reading small { color: #94a3b8; font-size: 11px; }
.vfl-instrument.active .beam i { width: 100%; }
.vfl-instrument.active.red .emitter i, .vfl-instrument.active.red .beam i { background: #ef4444; box-shadow: 0 0 12px rgba(239, 68, 68, .8); }
.vfl-instrument.active.red .reading strong { color: #fca5a5; }
.vfl-instrument.active.green .emitter i, .vfl-instrument.active.green .beam i { background: #22c55e; box-shadow: 0 0 12px rgba(34, 197, 94, .75); }
.vfl-instrument.active.green .reading strong { color: #86efac; }
.vfl-instrument.active > header b { background: #3f2d17; color: #fbbf24; }
.vfl-instrument > footer { min-height: 42px; display: grid; grid-template-columns: 8px auto minmax(0, 1fr); align-items: center; gap: 7px; padding: 8px 12px; background: #132238; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #64748b; }
.vfl-instrument.active .status-dot { background: #f59e0b; }
.vfl-instrument > footer strong { color: #dbe4f0; font-size: 11px; }
.vfl-instrument > footer > span:last-child { overflow: hidden; color: #94a3b8; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }

.control-block > header h2, .control-block > header p { margin: 0; }
.control-block > header h2 { font-size: 14px; line-height: 1.4; }
.control-block > header p { margin-top: 3px; color: #64748b; font-size: 11px; line-height: 1.4; }
.color-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 9px; }
.color-options.single { grid-template-columns: 1fr; }
.color-options button { min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #d8e2ef; border-radius: 8px; background: #ffffff; color: #475569; font-size: 12px; font-weight: 700; }
.color-options button.active { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.color-options button:disabled { opacity: .48; }
.color-options i { width: 12px; height: 12px; border-radius: 50%; }
.color-options i.red { background: #ef4444; }
.color-options i.green { background: #22c55e; }
.mode-options { display: grid; grid-template-columns: repeat(var(--mode-columns), minmax(0, 1fr)); gap: 6px; margin-top: 9px; }
.mode-options button { min-width: 0; min-height: 58px; padding: 8px 4px; border: 1px solid #d8e2ef; border-radius: 8px; background: #ffffff; color: #475569; }
.mode-options strong, .mode-options span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mode-options strong { color: #0f172a; font-size: 13px; }
.mode-options span { margin-top: 4px; color: #64748b; font-size: 11px; }
.mode-options button.active { border-color: #93c5fd; background: #eff6ff; }
.mode-options button.active strong { color: #1d4ed8; }
.mode-options button:disabled { opacity: .48; }
.color-options button:focus-visible, .mode-options button:focus-visible, .offline-banner button:focus-visible { outline: 3px solid rgba(37, 99, 235, .25); outline-offset: 2px; }
.laser-safety { display: grid; grid-template-columns: 52px minmax(0, 1fr); align-items: center; gap: 11px; margin-top: auto; padding: 11px 12px; border: 1px solid #fecaca; border-radius: 8px; background: #fff7f7; }
.laser-safety > b { height: 30px; display: grid; place-items: center; border: 2px solid #dc2626; border-radius: 999px; color: #dc2626; font-size: 11px; }
.laser-safety strong, .laser-safety p { display: block; margin: 0; }
.laser-safety strong { color: #991b1b; font-size: 12px; }
.laser-safety p { margin-top: 3px; color: #7f1d1d; font-size: 11px; line-height: 1.45; }
.vfl-feedback { position: absolute; left: 50%; bottom: 24px; z-index: 80; max-width: calc(100% - 32px); transform: translateX(-50%); padding: 9px 13px; border-radius: 8px; background: rgba(15, 23, 42, .94); color: #ffffff; font-size: 11px; text-align: center; white-space: nowrap; }

.confirm-layer { position: absolute; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; }
.confirm-mask { position: absolute; inset: 0; border: 0; background: rgba(15, 23, 42, .58); }
.confirm-layer section { position: relative; width: min(100%, 320px); box-sizing: border-box; padding: 20px; border: 1px solid #d8e2ef; border-radius: 12px; background: #ffffff; text-align: center; box-shadow: 0 20px 48px rgba(15, 23, 42, .24); }
.dialog-mark { display: inline-grid; place-items: center; min-width: 58px; height: 28px; border: 2px solid #dc2626; border-radius: 999px; color: #dc2626; font-size: 11px; font-weight: 800; }
.confirm-layer h2 { margin: 13px 0 0; font-size: 16px; }
.confirm-layer p { margin: 7px 0 18px; color: #64748b; font-size: 12px; line-height: 1.55; }
.confirm-layer section > div { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.confirm-layer section button { min-height: 44px; border: 0; border-radius: 8px; background: #eef2f7; color: #334155; font-size: 13px; font-weight: 700; }
.confirm-layer section button.danger { background: #dc2626; color: #ffffff; }

@media (max-width: 340px) {
  .device-vfl-control { padding: 14px 12px 18px; }
  .beam-stage { grid-template-columns: 34px minmax(36px, 1fr) auto; padding: 14px; }
  .reading { min-width: 68px; }
  .reading strong { font-size: 24px; }
  .mode-options button { min-height: 56px; }
}

@media (prefers-reduced-motion: reduce) {
  .beam i { transition: none; }
}
</style>
