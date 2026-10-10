<template>
  <div class="app-container">
    <div class="content-flex hide-scrollbar">
      <SmartOtdrPageShell title="损耗测试" @back="exitPage">
      <div class="page-body">
        <section class="panel-card overview-card">
          <div class="meter-screen" :class="{ off: !lossState.isEnabled }">
            <div class="screen-head">
              <span>LS</span>
              <span>{{ lossState.wavelength }}nm</span>
            </div>

            <div class="screen-reading">
              <span class="reading-number">{{ currentPowerText }}</span>
              <span v-if="lossState.isEnabled" class="reading-unit">dBm</span>
            </div>

            <div class="screen-foot">
              <div class="screen-foot-item">
                <div class="foot-label">模块</div>
                <div class="foot-value">OPM</div>
              </div>
              <div class="screen-foot-item">
                <div class="foot-label">波长</div>
                <div class="foot-value">{{ lossState.wavelength }}nm</div>
              </div>
              <div class="screen-foot-item">
                <div class="foot-label">状态</div>
                <div class="foot-value">{{ statusTagText }}</div>
              </div>
            </div>

            <div class="inline-metrics">
              <div class="inline-metric-head">
                <span>线性功率</span>
                <span>参考值</span>
                <span>相对功率</span>
              </div>
              <div class="inline-metric-body">
                <span>{{ linearPowerText }}</span>
                <span>{{ referenceText }}</span>
                <span>{{ relativePowerText }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel-card action-card">
          <div class="card-title-row action-head">
            <div>
              <h3 class="section-title">功能操作</h3>
          <div class="section-desc">波长 · 参考值 · 相对功率</div>
            </div>
          </div>

          <div class="action-grid">
            <button class="action-btn primary" type="button" @click="togglePower">
              {{ lossState.isEnabled ? '关闭' : '开启' }}
            </button>
            <button class="action-btn" type="button" :disabled="!lossState.isEnabled" @click="switchWavelength">
              波长切换
            </button>
            <button class="action-btn" type="button" :disabled="!lossState.isEnabled" @click="setReference">
              设为参考
            </button>
            <button class="action-btn" type="button" @click="resetReference">
              参考置零
            </button>
          </div>

          <button class="exit-btn" type="button" @click="exitPage">退出</button>
        </section>
      </div>
      </SmartOtdrPageShell>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SmartOtdrPageShell from '../components/SmartOtdrPageShell.vue'

type WavelengthOption = 1310 | 1550

type LossPreset = {
  powerDbm: number
  linearPower: string
  statusTag: string
}

const route = useRoute()
const router = useRouter()
const deviceId = String(route.params.id || '')

const wavelengthOrder: WavelengthOption[] = [1310, 1550]

const presets: Record<WavelengthOption, LossPreset> = {
  1310: {
    powerDbm: -50.0,
    linearPower: '12.041nW',
    statusTag: 'Low'
  },
  1550: {
    powerDbm: -47.2,
    linearPower: '19.054nW',
    statusTag: 'Low'
  }
}

const lossState = reactive({
  isEnabled: true,
  wavelength: 1310 as WavelengthOption,
  referenceDbm: 0
})

const currentPreset = computed(() => presets[lossState.wavelength])

const currentPowerText = computed(() => {
  if (!lossState.isEnabled) return '--'
  return currentPreset.value.powerDbm.toFixed(2)
})

const linearPowerText = computed(() => {
  if (!lossState.isEnabled) return '--'
  return currentPreset.value.linearPower
})

const referenceText = computed(() => `${lossState.referenceDbm.toFixed(2)}dBm`)

const relativePowerText = computed(() => {
  if (!lossState.isEnabled) return '--'
  const relative = currentPreset.value.powerDbm - lossState.referenceDbm

  if (Math.abs(relative) < 0.005) return '0.00dB'
  if (relative <= -50) return '< -50.0dB'
  return `${relative.toFixed(2)}dB`
})

const statusTagText = computed(() => {
  if (!lossState.isEnabled) return 'Off'
  return currentPreset.value.statusTag
})

const togglePower = () => {
  lossState.isEnabled = !lossState.isEnabled
}

const switchWavelength = () => {
  if (!lossState.isEnabled) return
  const currentIndex = wavelengthOrder.indexOf(lossState.wavelength)
  const nextIndex = (currentIndex + 1) % wavelengthOrder.length
  lossState.wavelength = wavelengthOrder[nextIndex]
}

const setReference = () => {
  if (!lossState.isEnabled) return
  lossState.referenceDbm = currentPreset.value.powerDbm
}

const resetReference = () => {
  lossState.referenceDbm = 0
}

const exitPage = () => {
  router.push(`/device/${deviceId}`)
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
}

.content-flex {
  flex: 1;
  display: flex;
  justify-content: center;
  overflow-y: auto;
  padding: 0;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.page-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 22px;
  padding: 16px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.card-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.section-desc {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.status-badge {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.status-badge.off {
  background: #e2e8f0;
  color: #475569;
}

.meter-screen {
  margin-top: 16px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #0c1b35 0%, #0f274c 100%);
  color: #dbeafe;
}

.meter-screen.off {
  filter: saturate(0.78);
}

.screen-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
  font-weight: 700;
}

.screen-mode {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 24px;
  padding: 0 12px;
  border-radius: 6px;
  background: #f6a609;
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
}

.screen-mode.off {
  background: rgba(148, 163, 184, 0.3);
  color: #cbd5e1;
}

.screen-reading {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.reading-number {
  font-size: 56px;
  line-height: 1;
  font-weight: 800;
  color: #48a3ff;
  letter-spacing: -0.04em;
}

.reading-unit {
  font-size: 20px;
  font-weight: 700;
  color: rgba(219, 234, 254, 0.9);
}

.screen-foot {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.screen-foot-item {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.28);
  border: 1px solid rgba(191, 219, 254, 0.12);
}

.foot-label {
  font-size: 12px;
  color: rgba(219, 234, 254, 0.72);
}

.foot-value {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
}

.inline-metrics {
  overflow: hidden;
  margin-top: 16px;
  border-radius: 14px;
  border: 1px solid rgba(191, 219, 254, 0.12);
  background: rgba(15, 23, 42, 0.24);
}

.inline-metric-head,
.inline-metric-body {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.inline-metric-head span {
  padding: 12px 10px;
  background: rgba(106, 129, 158, 0.52);
  color: #dbeafe;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
}

.inline-metric-body span {
  padding: 16px 10px;
  color: #48a3ff;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  word-break: break-word;
}

.inline-metric-head span + span,
.inline-metric-body span + span {
  border-left: 1px solid rgba(191, 219, 254, 0.12);
}

.action-head {
  margin-bottom: 14px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.action-btn {
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  background: #f8fbff;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.action-btn.primary {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
}

.action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.exit-btn {
  width: 100%;
  min-height: 46px;
  margin-top: 12px;
  border-radius: 14px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  background: #f8fbff;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.meter-screen.off .reading-number {
  color: rgba(148, 163, 184, 0.74);
}

@media (max-width: 768px) {
  .card-title-row,
  .screen-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .screen-foot,
  .action-grid {
    grid-template-columns: 1fr;
  }

  .reading-number {
    font-size: 46px;
  }

  .inline-metric-head,
  .inline-metric-body {
    grid-template-columns: 1fr;
  }

  .inline-metric-head span + span,
  .inline-metric-body span + span {
    border-left: none;
    border-top: 1px solid rgba(191, 219, 254, 0.12);
  }
}

/* Shared mobile instrument treatment used by the 10GPON pages. */
.app-container { background: #f7f9fc; }
.page-body { gap: 12px; padding: 14px; }
.panel-card { padding: 12px; border: 1px solid #d8e2ef; border-radius: 12px; background: #ffffff; box-shadow: none; }
.overview-card { padding: 0; overflow: hidden; }
.overview-card > .card-title-row { min-height: 44px; align-items: center; padding: 0 14px; border-bottom: 1px solid #e6edf7; }
.overview-card .section-title { color: #1d4ed8; font-size: 13px; }
.overview-card .section-desc { display: none; }
.status-badge { padding: 4px 9px; border-radius: 6px; font-size:12px; }
.meter-screen { margin: 0; padding: 0; border-radius: 0; background: #ffffff; color: #0f172a; }
.meter-screen.off { filter: none; }
.screen-head { min-height: 38px; padding: 0 14px; color: #2563eb; font-size: 11px; }
.screen-mode { min-width: auto; height: 24px; padding: 0 8px; border-radius: 6px; background: #eff6ff; color: #1d4ed8; font-size:12px; }
.screen-reading { min-height: 104px; align-items: baseline; justify-content: center; margin: 0; padding: 12px 14px; }
.reading-number { color: #1d4ed8; font-size: 44px; letter-spacing: 0; }
.reading-unit { color: #0f172a; font-size: 15px; }
.screen-foot { gap: 0; margin: 0; border-top: 1px solid #e6edf7; }
.screen-foot-item { padding: 10px 6px; border: 0; border-right: 1px solid #e6edf7; border-radius: 0; background: #ffffff; text-align: center; }
.screen-foot-item:last-child { border-right: 0; }
.foot-label { color: #64748b; font-size:12px; }
.foot-value { margin-top: 4px; color: #0f172a; font-size: 11px; }
.inline-metrics { margin: 0; border: 0; border-top: 1px solid #e6edf7; border-radius: 0; background: #ffffff; }
.inline-metric-head span { padding: 8px 4px 3px; background: #ffffff; color: #64748b; font-size:12px; }
.inline-metric-body span { padding: 3px 4px 10px; color: #0f172a; font-size: 11px; }
.action-card .section-title { font-size: 14px; }
.action-grid { gap: 8px; }
.action-btn,
.exit-btn { min-height: 44px; border-radius: 8px; font-size: 12px; }
.action-btn.primary { background: #2563eb; box-shadow: 0 6px 14px rgba(37, 99, 235, 0.18); }

@media (max-width: 768px) {
  .screen-head { flex-direction: row; align-items: center; }
  .screen-foot,
  .action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .screen-foot { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .inline-metric-head,
  .inline-metric-body { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .inline-metric-head span + span,
  .inline-metric-body span + span { border-top: 0; border-left: 1px solid #e6edf7; }
}
</style>
