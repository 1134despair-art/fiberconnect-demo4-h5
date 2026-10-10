<template>
  <div class="app-container pon-history-app">
    <PonPageShell :title="t('pon.historyTitle')" :subtitle="device?.name" @back="router.replace(`/device/${deviceId}`)">
      <div v-if="pageLoading" class="history-loading" aria-busy="true">
        <div class="loading-summary"></div>
        <div v-for="index in 3" :key="index" class="loading-record"></div>
      </div>

      <main v-else class="history-page">
        <header class="history-summary">
          <div>
            <span>{{ t('pon.historyTitle') }}</span>
            <strong>{{ records.length }}</strong>
          </div>
          <p>{{ t('pon.historyCapacity') }}</p>
        </header>

        <section v-if="records.length === 0" class="empty-state">
          <img :src="historyIcon" alt="" />
          <h2>{{ t('pon.historyEmpty') }}</h2>
          <p>{{ t('pon.historyEmptyHint') }}</p>
          <button type="button" @click="openMeasurement">{{ t('pon.openLiveMeasurement') }}</button>
        </section>

        <section v-else class="record-list" :aria-label="t('pon.historyTitle')">
          <article v-for="record in records" :key="record.id" class="record-card">
            <header class="record-header">
              <div>
                <span class="record-type">{{ record.mode === 'pon' ? t('pon.ponMode') : t('pon.opmMode') }}</span>
                <time :datetime="record.createdAt">{{ formatDate(record.createdAt) }}</time>
              </div>
              <button
                class="delete-trigger"
                type="button"
                :aria-label="t('pon.deleteRecord')"
                @click="pendingDeleteId = record.id"
              >
                {{ t('common.delete') }}
              </button>
            </header>

            <div v-if="record.mode === 'pon'" class="record-channels">
              <div>
                <span>1490nm</span>
                <strong>{{ formatPower(record.pon1490Dbm) }} <small>dBm</small></strong>
              </div>
              <div>
                <span>1577nm</span>
                <strong>{{ formatPower(record.pon1577Dbm) }} <small>dBm</small></strong>
              </div>
            </div>

            <div v-else class="record-channels opm">
              <div>
                <span>{{ record.wavelength }}nm</span>
                <strong>{{ formatRecordPower(record.powerDbm, record.unit) }} <small>{{ record.unit }}</small></strong>
                <em>{{ formatPonFrequency(record.frequency || 0) }}</em>
              </div>
              <dl>
                <div><dt>{{ t('pon.referenceValue') }}</dt><dd>{{ formatPower(record.referenceDbm) }}dBm</dd></div>
                <div><dt>{{ t('pon.relativePower') }}</dt><dd>{{ formatPower(record.relativeDb) }}dB</dd></div>
              </dl>
            </div>

            <div v-if="pendingDeleteId === record.id" class="record-confirm" role="alert">
              <span>{{ t('pon.deleteRecordConfirm') }}</span>
              <div>
                <button type="button" @click="pendingDeleteId = ''">{{ t('common.cancel') }}</button>
                <button class="danger" type="button" @click="deleteRecord(record.id)">{{ t('common.confirm') }}</button>
              </div>
            </div>
          </article>
        </section>

        <footer v-if="records.length > 0" class="history-footer">
          <button v-if="!confirmingClear" class="clear-trigger" type="button" @click="confirmingClear = true">
            {{ t('pon.clearHistory') }}
          </button>
          <div v-else class="clear-confirm" role="alert">
            <span>{{ t('pon.clearHistoryConfirm') }}</span>
            <div>
              <button type="button" @click="confirmingClear = false">{{ t('common.cancel') }}</button>
              <button class="danger" type="button" @click="clearRecords">{{ t('common.confirm') }}</button>
            </div>
          </div>
        </footer>

        <div v-if="feedback" class="feedback-toast" role="status">{{ feedback }}</div>
      </main>
    </PonPageShell>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import historyIcon from '@/assets/icons/iconfont/smart-otdr/timer.svg'
import PonPageShell from './PonPageShell.vue'
import { usePonDevice } from './usePonDevice'
import { convertPonPower, formatPonFrequency, usePonPowerMeterState, type PonPowerUnit } from './usePonPowerMeterState'

const { t, locale } = useI18n()
const router = useRouter()
const { deviceId, device } = usePonDevice()
const state = usePonPowerMeterState(deviceId.value)
const records = state.records

const pageLoading = ref(true)
const pendingDeleteId = ref('')
const confirmingClear = ref(false)
const feedback = ref('')
let feedbackTimer: number | undefined

const formatDate = (date: string) => new Intl.DateTimeFormat(locale.value, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(date))

const formatPower = (value?: number) => Number(value || 0).toFixed(2)
const formatRecordPower = (value: number | undefined, unit: PonPowerUnit) => convertPonPower(Number(value || 0), unit)

const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}

const openMeasurement = () => router.push(`/device/${deviceId.value}/pon-measure`)

const deleteRecord = (recordId: string) => {
  state.deleteRecord(recordId)
  pendingDeleteId.value = ''
  showFeedback(t('pon.recordDeleted'))
}

const clearRecords = () => {
  state.clearRecords()
  confirmingClear.value = false
  showFeedback(t('pon.recordsCleared'))
}

onMounted(() => {
  window.setTimeout(() => { pageLoading.value = false }, 320)
})

onUnmounted(() => {
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
})
</script>

<style scoped lang="scss">
@use './ponUi.scss' as ui;

.pon-history-app {
  width: min(375px, calc(100vw - 24px));
  max-width: 375px;
  box-sizing: border-box;
  border-radius: 22px;
  background: ui.$pon-bg;
}

.history-page,
.history-loading {
  @include ui.page-surface;
  min-height: 640px;
  padding-bottom: 28px;
}

.history-loading { display: grid; align-content: start; gap: 12px; }
.loading-summary,
.loading-record { border-radius: 16px; background: #e8eef6; animation: pulse 1.2s ease-in-out infinite; }
.loading-summary { height: 86px; }
.loading-record { height: 138px; }
@keyframes pulse { 50% { opacity: 0.55; } }

.history-summary {
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid #dbe7f5;
  border-radius: 12px;
  background: #ffffff;
  color: ui.$pon-text;
  box-shadow: ui.$pon-shadow;
}
.history-summary div { display: flex; align-items: baseline; gap: 10px; }
.history-summary span { color: ui.$pon-primary; font-size: 11px; font-weight: 800; }
.history-summary strong { font-size: 32px; line-height: 1; @include ui.metric-number; }
.history-summary p { max-width: 130px; margin: 0; color: ui.$pon-text-sub; font-size: 11px; line-height: 1.45; text-align: right; }

.empty-state {
  min-height: 430px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  text-align: center;
}
.empty-state img { width: 48px; height: 48px; opacity: 0.62; }
.empty-state h2 { margin: 16px 0 6px; color: ui.$pon-text; font-size: 17px; letter-spacing: 0; }
.empty-state p { max-width: 220px; margin: 0; color: ui.$pon-text-sub; font-size: 12px; line-height: 1.6; }
.empty-state button { @include ui.primary-button; width: 184px; margin-top: 22px; }

.record-list { display: grid; gap: 12px; margin-top: 14px; }
.record-card {
  overflow: hidden;
  border: 1px solid ui.$pon-border;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}
.record-header { min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 12px; border-bottom: 1px solid ui.$pon-border; }
.record-header > div { min-width: 0; display: flex; align-items: center; gap: 8px; }
.record-type { padding: 3px 7px; border-radius: 7px; background: ui.$pon-primary-soft; color: ui.$pon-primary-dark; font-size: 11px; font-weight: 800; }
.record-header time { overflow: hidden; color: ui.$pon-text-sub; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.delete-trigger { @include ui.button-reset; min-width: 44px; min-height: 44px; background: transparent; color: ui.$pon-danger; font-size: 11px; font-weight: 700; }

.record-channels { display: grid; grid-template-columns: 1fr 1fr; }
.record-channels.opm { grid-template-columns: 1fr; }
.record-channels > div { min-width: 0; padding: 14px 12px; border-right: 1px solid ui.$pon-border; }
.record-channels > div:last-child { border-right: 0; }
.record-channels span,
.record-channels strong,
.record-channels em { display: block; }
.record-channels span { color: #0891b2; font-size: 11px; font-weight: 800; }
.record-channels strong { margin-top: 7px; color: ui.$pon-text; font-size: 20px; line-height: 1.1; @include ui.metric-number; }
.record-channels strong small { color: ui.$pon-text-sub; font-size: 11px; }
.record-channels em { margin-top: 6px; color: ui.$pon-text-sub; font-size: 11px; font-style: normal; @include ui.metric-number; }
.record-channels.opm > div { border-right: 0; }
.record-channels dl { margin: 0; padding: 8px 12px 12px; border-top: 1px solid ui.$pon-border; }
.record-channels dl div { min-height: 26px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.record-channels dt { color: ui.$pon-text-sub; font-size: 11px; }
.record-channels dd { margin: 0; color: ui.$pon-text; font-size: 11px; @include ui.metric-number; }

.record-confirm,
.clear-confirm { padding: 12px; border-top: 1px solid #fecaca; background: #fff7f7; }
.record-confirm span,
.clear-confirm span { display: block; color: #991b1b; font-size: 11px; line-height: 1.45; }
.record-confirm div,
.clear-confirm div { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
.record-confirm button,
.clear-confirm button { @include ui.secondary-button; min-height: 42px; }
.record-confirm button.danger,
.clear-confirm button.danger { border-color: ui.$pon-danger; background: ui.$pon-danger; color: #ffffff; }

.history-footer { margin-top: 16px; }
.clear-trigger { @include ui.secondary-button; width: 100%; color: ui.$pon-danger; }
.clear-confirm { border: 1px solid #fecaca; border-radius: 14px; }

.feedback-toast { position: fixed; left: 50%; bottom: 28px; z-index: 95; width: max-content; max-width: 300px; transform: translateX(-50%); padding: 10px 14px; border-radius: 10px; background: rgba(15, 23, 42, .94); color: #ffffff; font-size: 12px; text-align: center; }

@media (max-width: 340px) {
  .history-summary { align-items: flex-start; }
  .record-channels strong { font-size: 18px; }
}
</style>
