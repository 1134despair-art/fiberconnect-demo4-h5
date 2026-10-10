<template>
  <div class="multi-opm-measure-app app-container">
    <MultiOpmPageShell :title="isHistoryView ? '测量记录' : '光功率测量'" :subtitle="device.name" @back="goHome">
      <template #action>
        <button class="header-action" type="button" :aria-label="isHistoryView ? '返回测量' : '测量记录'" @click="toggleHistory">
          <img :src="isHistoryView ? measureIcon : historyIcon" alt="" />
        </button>
      </template>
      <template #footer><MultiOpmFunctionNav :device-id="device.id" active="measure" /></template>

      <main v-if="!isHistoryView" class="measure-page">
        <section v-if="!isOnline" class="offline-band" role="status"><strong>设备离线</strong><span>请在首页重新连接后继续测量</span></section>

        <section class="meter-card" aria-label="光功率测量结果">
          <header>
            <strong>普通光功率计</strong>
            <button type="button" :class="{ active: state.persisted.isEnabled }" :disabled="!isOnline" @click="state.persisted.isEnabled = !state.persisted.isEnabled">
              {{ state.persisted.isEnabled ? '测量中' : '已停止' }}
            </button>
          </header>
          <div class="meter-body" :class="{ disabled: !state.persisted.isEnabled }">
            <span>{{ state.persisted.wavelength }} nm</span>
            <div><strong>{{ displayReading }}</strong><small>{{ state.persisted.unit }}</small></div>
            <p>{{ linearPower }}</p>
          </div>
          <footer><span>频率识别</span><strong>{{ frequencyLabel }}</strong></footer>
        </section>

        <section class="parameter-grid" aria-label="当前测量参数">
          <button type="button" @click="openDialog('wavelength')"><span>测量波长</span><strong>{{ state.persisted.wavelength }}nm</strong></button>
          <button type="button" @click="openDialog('frequency')"><span>识别频率</span><strong>{{ frequencyLabel }}</strong></button>
          <button type="button" @click="openDialog('unit')"><span>显示单位</span><strong>{{ state.persisted.unit }}</strong></button>
        </section>

        <section class="spec-strip" aria-label="测量规格">
          <div><span>测量范围</span><strong>-70~+10</strong></div>
          <div><span>分辨率</span><strong>0.01dBm</strong></div>
          <div><span>测量精度</span><strong>±0.2dB</strong></div>
        </section>

        <section class="reference-card">
          <div><span>参考值</span><strong>{{ state.persisted.referenceDbm.toFixed(2) }} dBm</strong></div>
          <div><span>相对功率</span><strong>{{ relativePower }} dB</strong></div>
          <footer>
            <button type="button" @click="setReference">设为参考</button>
            <button type="button" @click="clearReference">参考清零</button>
          </footer>
        </section>

        <button class="save-button" type="button" :disabled="!isOnline || !state.persisted.isEnabled || isSaving" @click="saveMeasurement">
          {{ isSaving ? '保存中' : '保存当前读数' }}
        </button>
      </main>

      <main v-else class="history-page">
        <section class="history-summary"><span>已保存记录</span><strong>{{ state.records.value.length }} 条</strong></section>
        <section v-if="state.records.value.length" class="record-list">
          <button v-for="record in state.records.value" :key="record.id" type="button">
            <span><strong>{{ record.wavelength }}nm · {{ formatMultiOpmFrequency(record.frequency) }}</strong><small>{{ record.timestamp }}</small></span>
            <b>{{ record.result.toFixed(2) }} dBm</b>
          </button>
        </section>
        <section v-else class="empty-state"><img :src="historyIcon" alt="" /><strong>暂无测量记录</strong><span>完成测量并保存后在此查看</span></section>
      </main>

      <DeviceSettingDialog
        :open="activeDialog !== null"
        :title="dialogTitle"
        :description="dialogDescription"
        confirm-text="应用"
        @close="activeDialog = null"
        @confirm="applyDialog"
      >
        <div class="setting-options">
          <button v-for="option in dialogOptions" :key="String(option.value)" class="setting-option" type="button" :class="{ active: draftValue === option.value }" @click="draftValue = option.value">
            {{ option.label }}
          </button>
        </div>
      </DeviceSettingDialog>

      <div v-if="feedback" class="settings-toast" role="status">{{ feedback }}</div>
    </MultiOpmPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Device } from '@/composables/useAuth'
import historyIcon from '@/assets/icons/iconfont/device/timer.svg'
import measureIcon from '@/assets/icons/iconfont/device/power.svg'
import DeviceSettingDialog from '../components/DeviceSettingDialog.vue'
import MultiOpmFunctionNav from './MultiOpmFunctionNav.vue'
import MultiOpmPageShell from './MultiOpmPageShell.vue'
import { formatMultiOpmFrequency, formatMultiOpmReading, multiOpmDbmToMw, type MultiOpmUnit, useMultiOpmState } from './useMultiOpmState'

type DialogKey = 'wavelength' | 'frequency' | 'unit'
type DraftValue = number | MultiOpmUnit
const props = defineProps<{ device: Device }>()
const router = useRouter()
const route = useRoute()
const state = useMultiOpmState(props.device.id)
const readingDbm = ref(-18.86)
const activeDialog = ref<DialogKey | null>(null)
const draftValue = ref<DraftValue>(1310)
const isSaving = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined
const wavelengths = [850, 980, 1270, 1300, 1310, 1490, 1550, 1577, 1625, 1650]
const frequencies = [0, 270, 330, 1000, 2000]
const units: MultiOpmUnit[] = ['dBm', 'mW', 'uW', 'nW']

const isOnline = computed(() => props.device.status === 'connected' && state.persisted.bluetoothEnabled)
const isHistoryView = computed(() => route.query.focus === 'history')
const frequencyLabel = computed(() => formatMultiOpmFrequency(state.persisted.frequency))
const displayReading = computed(() => state.persisted.isEnabled ? formatMultiOpmReading(readingDbm.value, state.persisted.unit) : '--')
const linearPower = computed(() => {
  const microwatts = multiOpmDbmToMw(readingDbm.value) * 1000
  return `${microwatts.toFixed(3)} uW`
})
const relativePower = computed(() => (readingDbm.value - state.persisted.referenceDbm).toFixed(2))
const dialogTitle = computed(() => activeDialog.value === 'wavelength' ? '波长选择' : activeDialog.value === 'frequency' ? '频率识别' : '显示单位')
const dialogDescription = computed(() => activeDialog.value === 'wavelength' ? '选择当前测量波长。' : activeDialog.value === 'frequency' ? '选择频率识别模式。' : '选择主读数显示单位。')
const dialogOptions = computed(() => activeDialog.value === 'wavelength'
  ? wavelengths.map(value => ({ value, label: `${value} nm` }))
  : activeDialog.value === 'frequency'
    ? frequencies.map(value => ({ value, label: formatMultiOpmFrequency(value) }))
    : units.map(value => ({ value, label: value })))

const goHome = () => router.replace(`/device/${props.device.id}`)
const toggleHistory = () => router.replace({ path: `/device/${props.device.id}/mopm`, query: isHistoryView.value ? {} : { focus: 'history' } })
const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}
const openDialog = (key: DialogKey) => {
  activeDialog.value = key
  draftValue.value = key === 'wavelength' ? state.persisted.wavelength : key === 'frequency' ? state.persisted.frequency : state.persisted.unit
}
const applyDialog = () => {
  if (activeDialog.value === 'wavelength') state.persisted.wavelength = Number(draftValue.value)
  if (activeDialog.value === 'frequency') state.persisted.frequency = Number(draftValue.value)
  if (activeDialog.value === 'unit') state.persisted.unit = draftValue.value as MultiOpmUnit
  activeDialog.value = null
  showFeedback('测量参数已更新')
}
const setReference = () => { state.persisted.referenceDbm = readingDbm.value; showFeedback('已设为参考值') }
const clearReference = () => { state.persisted.referenceDbm = 0; showFeedback('参考值已清零') }
const saveMeasurement = async () => {
  isSaving.value = true
  await new Promise(resolve => window.setTimeout(resolve, 500))
  state.saveRecord(readingDbm.value)
  isSaving.value = false
  showFeedback('当前读数已保存')
}

onMounted(() => {
  const panel = String(route.query.panel || '')
  if (panel === 'wavelength' || panel === 'frequency' || panel === 'unit') openDialog(panel)
})
onUnmounted(() => { if (feedbackTimer) window.clearTimeout(feedbackTimer) })
</script>

<style scoped lang="scss">
@use './multiOpmUi.scss' as ui;
@use '../components/deviceSettingsControls.scss';

.multi-opm-measure-app { width: min(375px, calc(100vw - 24px)); max-width: 375px; box-sizing: border-box; border-radius: 22px; background: ui.$bg; }
.header-action { @include ui.button-reset; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 8px; background: transparent; }
.header-action img { width: 21px; height: 21px; object-fit: contain; }
.measure-page, .history-page { @include ui.page-surface; display: flex; flex-direction: column; gap: 12px; padding-bottom: 18px; }
.offline-band { display: flex; justify-content: space-between; gap: 8px; padding: 9px 12px; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; color: #9a3412; font-size: 11px; }
.offline-band span { color: #c2410c; }
.meter-card { overflow: hidden; border: 1px solid #dbe7f5; border-radius: 12px; background: #fff; box-shadow: 0 8px 22px rgba(37,99,235,.08); }
.meter-card > header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #e7eef8; }
.meter-card > header strong { color: ui.$primary-dark; font-size: 13px; }
.meter-card > header button { @include ui.button-reset; min-height: 34px; padding: 0 9px; border-radius: 999px; background: #eef2f7; color: ui.$text-sub; font-size:12px; }
.meter-card > header button.active { background: #dcfce7; color: #15803d; }
.meter-body { min-height: 156px; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity .18s ease; }
.meter-body.disabled { opacity: .42; }
.meter-body > span { color: ui.$primary; font-size: 14px; }
.meter-body > div { min-height: 70px; display: flex; align-items: baseline; gap: 7px; }
.meter-body strong { color: ui.$primary-dark; font-size: 48px; line-height: 1; @include ui.metric-number; }
.meter-body small { color: ui.$text; font-size: 16px; font-weight: 700; }
.meter-body p { margin: 0; color: ui.$text; font-size: 17px; @include ui.metric-number; }
.meter-card > footer { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-top: 1px solid #e7eef8; color: ui.$primary; font-size: 12px; }
.parameter-grid, .spec-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.parameter-grid { gap: 8px; }
.parameter-grid button { @include ui.button-reset; min-width: 0; min-height: 64px; padding: 8px 4px; border: 1px solid ui.$border; border-radius: 10px; background: #fff; }
.parameter-grid span, .parameter-grid strong { display: block; }
.parameter-grid span { color: ui.$primary; font-size:12px; }
.parameter-grid strong { margin-top: 5px; color: ui.$text; font-size: 12px; @include ui.metric-number; }
.spec-strip { overflow: hidden; border: 1px solid ui.$border; border-radius: 10px; background: #fff; }
.spec-strip div { padding: 9px 3px; border-right: 1px solid ui.$border; text-align: center; }
.spec-strip div:last-child { border-right: 0; }
.spec-strip span, .spec-strip strong { display: block; }
.spec-strip span { color: ui.$text-sub; font-size:12px; }
.spec-strip strong { margin-top: 4px; color: ui.$text; font-size: 11px; }
.reference-card { @include ui.card; overflow: hidden; }
.reference-card > div { display: inline-flex; width: 50%; box-sizing: border-box; flex-direction: column; gap: 4px; padding: 11px 12px; }
.reference-card > div + div { border-left: 1px solid ui.$border; }
.reference-card span { color: ui.$text-sub; font-size:12px; }
.reference-card strong { color: ui.$text; font-size: 12px; @include ui.metric-number; }
.reference-card footer { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid ui.$border; }
.reference-card footer button { @include ui.button-reset; min-height: 42px; background: #fff; color: ui.$primary; font-size: 11px; font-weight: 700; }
.reference-card footer button + button { border-left: 1px solid ui.$border; }
.save-button { @include ui.primary-button; width: 100%; min-height: 48px; font-size: 13px; }
.history-summary { min-height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border: 1px solid ui.$border; border-radius: 10px; background: #fff; color: ui.$text-sub; font-size: 12px; }
.history-summary strong { color: ui.$primary; }
.record-list { overflow: hidden; border: 1px solid ui.$border; border-radius: 10px; background: #fff; }
.record-list button { @include ui.button-reset; width: 100%; min-height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid ui.$border; background: #fff; text-align: left; }
.record-list button:last-child { border-bottom: 0; }
.record-list span strong, .record-list span small { display: block; }
.record-list span strong { color: ui.$text; font-size: 12px; }
.record-list span small { margin-top: 4px; color: ui.$text-sub; font-size:12px; }
.record-list b { color: ui.$primary-dark; font-size: 13px; white-space: nowrap; @include ui.metric-number; }
.empty-state { min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: ui.$text-sub; text-align: center; }
.empty-state img { width: 44px; height: 44px; opacity: .58; }
.empty-state strong { margin-top: 14px; color: ui.$text; font-size: 14px; }
.empty-state span { margin-top: 6px; font-size: 11px; }
.settings-toast { bottom: 94px; }
@media (max-width: 340px) { .meter-body strong { font-size: 42px; } }
</style>
