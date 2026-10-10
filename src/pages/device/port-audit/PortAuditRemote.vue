<template>
  <PortAuditPageShell standalone :title="t('portAudit.cellularSettings')" :subtitle="device?.name" @back="goSettings">
    <template #action>
      <span class="remote-badge" :class="{ online: state.persisted.cellularEnabled }">
        {{ state.persisted.cellularEnabled ? t('portAudit.remoteOnline') : t('portAudit.remoteOffline') }}
      </span>
    </template>

    <div class="remote-page">
      <section v-if="!state.persisted.cellularEnabled" class="remote-empty">
        <span class="remote-empty__icon"><img :src="networkIcon" alt="" /></span>
        <h2>{{ t('portAudit.remoteUnavailable') }}</h2>
        <p>{{ t('portAudit.remoteUnavailableHint') }}</p>
        <button type="button" @click="enable4g">{{ t('portAudit.enable4g') }}</button>
      </section>

      <template v-else>
        <section class="remote-status">
          <header>
            <span class="remote-status__icon"><img :src="networkIcon" alt="" /></span>
            <div><h2>{{ t('portAudit.remoteStatus') }}</h2><p>{{ device?.model || 'PCA-100' }} · {{ t('portAudit.remoteOnline') }}</p></div>
            <i aria-hidden="true"></i>
          </header>
          <footer>
            <span>{{ t('portAudit.lastSync') }}</span>
            <strong>{{ lastSync }}</strong>
            <button type="button" :disabled="syncing" @click="refreshRemoteData">{{ syncing ? t('portAudit.syncingData') : t('portAudit.refreshData') }}</button>
          </footer>
        </section>

        <section class="remote-section">
          <div class="section-heading"><h2>{{ t('portAudit.remoteSnapshot') }}</h2></div>
          <div class="snapshot-grid">
            <article><span>FID</span><strong :class="statusTone(state.runtime.fidStatus)">{{ fidStatus }}</strong><small>{{ fidDetail }}</small></article>
            <article><span>ONU</span><strong :class="statusTone(state.runtime.onuStatus)">{{ onuStatus }}</strong><small>{{ onuDetail }}</small></article>
            <article><span>{{ t('portAudit.opmReading') }}</span><strong>{{ state.runtime.opmDbm.toFixed(2) }}dBm</strong><small>{{ state.persisted.selectedWavelength }}nm</small></article>
            <article><span>{{ t('portAudit.rfidCount') }}</span><strong>{{ state.records.value.length }}</strong><small>{{ t('portAudit.records') }}</small></article>
          </div>
        </section>

        <section class="remote-section">
          <div class="section-heading"><h2>{{ t('portAudit.remoteParameters') }}</h2><span>{{ t('portAudit.cellularHint') }}</span></div>
          <div class="parameter-list">
            <div class="parameter-row">
              <span><strong>{{ t('portAudit.autoShutdown') }}</strong><small>{{ draftShutdown === 0 ? t('portAudit.never') : t('portAudit.minutes', { count: draftShutdown }) }}</small></span>
              <select v-model.number="draftShutdown" :aria-label="t('portAudit.autoShutdown')">
                <option v-for="minutes in autoOptions" :key="minutes" :value="minutes">{{ minutes === 0 ? t('portAudit.never') : t('portAudit.minutes', { count: minutes }) }}</option>
              </select>
            </div>
            <div class="parameter-row">
              <span><strong>{{ t('portAudit.buzzer') }}</strong><small>{{ t('portAudit.buzzerHint') }}</small></span>
              <button class="switch-control" :class="{ active: draftBuzzer }" type="button" role="switch" :aria-label="t('portAudit.buzzer')" :aria-checked="draftBuzzer" @click="draftBuzzer = !draftBuzzer"><i></i></button>
            </div>
            <div class="parameter-row language-row">
              <span><strong>{{ t('portAudit.deviceLanguage') }}</strong><small>{{ t('portAudit.simplifiedChinese') }} / {{ t('portAudit.english') }}</small></span>
              <div>
                <button type="button" :class="{ active: draftLanguage === 'zh-CN' }" @click="draftLanguage = 'zh-CN'">中</button>
                <button type="button" :class="{ active: draftLanguage === 'en' }" @click="draftLanguage = 'en'">EN</button>
              </div>
            </div>
          </div>
          <button class="save-remote" type="button" @click="saveRemoteSettings">{{ t('portAudit.saveRemoteSettings') }}</button>
        </section>
      </template>
    </div>

    <div v-if="feedback" class="remote-toast" role="status">{{ feedback }}</div>
    <template #footer><PortAuditFunctionNav :device-id="deviceId" active="settings" /></template>
  </PortAuditPageShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PortAuditPageShell from './PortAuditPageShell.vue'
import PortAuditFunctionNav from './PortAuditFunctionNav.vue'
import { usePortAuditDevice } from './usePortAuditDevice'
import { usePortAuditState, type PortAuditAutoShutdown, type PortAuditRunStatus } from './usePortAuditState'
import networkIcon from '@/assets/icons/iconfont/instrument/network.svg'

const router = useRouter()
const { t } = useI18n()
const { deviceId, device } = usePortAuditDevice()
const state = usePortAuditState(deviceId.value)
const autoOptions: PortAuditAutoShutdown[] = [0, 1, 5, 10, 30, 60]
const draftShutdown = ref<PortAuditAutoShutdown>(state.persisted.autoShutdownMinutes)
const draftBuzzer = ref(state.persisted.buzzerEnabled)
const draftLanguage = ref<'zh-CN' | 'en'>(state.persisted.deviceLanguage)
const syncing = ref(false)
const feedback = ref('')
const lastSync = ref(new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()))
let feedbackTimer: number | undefined

const goSettings = () => router.push(`/device/${deviceId.value}/port-settings`)
const formatStatus = (status: PortAuditRunStatus, pass: string, fail: string, error: string) => status === 'pass' ? pass : status === 'fail' ? fail : status === 'error' ? error : status === 'running' ? 'RUN' : 'READY'
const fidStatus = computed(() => formatStatus(state.runtime.fidStatus, 'PASS', 'FAIL', 'ERR'))
const onuStatus = computed(() => formatStatus(state.runtime.onuStatus, 'PASS', 'FAIL', 'ERR'))
const fidDetail = computed(() => state.runtime.fidDirection === 'forward' ? t('portAudit.forward') : state.runtime.fidDirection === 'reverse' ? t('portAudit.reverse') : t('portAudit.unknown'))
const onuDetail = computed(() => state.runtime.onuCondition === 'connected' ? t('portAudit.onuConnected') : state.runtime.onuCondition === 'open' ? t('portAudit.onuOpen') : state.runtime.onuCondition === 'abnormal' ? t('portAudit.onuAbnormal') : t('portAudit.unknown'))
const statusTone = (status: PortAuditRunStatus) => ({ success: status === 'pass', danger: status === 'fail' || status === 'error' })
const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1500)
}
const refreshRemoteData = async () => {
  syncing.value = true
  await new Promise(resolve => window.setTimeout(resolve, 650))
  lastSync.value = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date())
  syncing.value = false
}
const enable4g = async () => { state.persisted.cellularEnabled = true; await refreshRemoteData() }
const saveRemoteSettings = () => {
  state.persisted.autoShutdownMinutes = draftShutdown.value
  state.persisted.buzzerEnabled = draftBuzzer.value
  state.persisted.deviceLanguage = draftLanguage.value
  showFeedback(t('portAudit.remoteSaved'))
}
</script>

<style scoped lang="scss">
@use './portAuditUi.scss' as ui;
.remote-page { @include ui.page-padding; display: flex; flex-direction: column; gap: 14px; padding-bottom: 24px; }
.remote-badge { max-width: 66px; padding: 4px 7px; overflow: hidden; border-radius: 999px; background: #f1f5f9; color: ui.$audit-sub; font-size:12px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.remote-badge.online { background: #dcfce7; color: #15803d; }
.remote-empty { min-height: 360px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 24px; text-align: center; }
.remote-empty__icon, .remote-status__icon { display: grid; place-items: center; border-radius: 12px; background: ui.$audit-primary-soft; }
.remote-empty__icon { width: 56px; height: 56px; }.remote-empty__icon img { width: 28px; height: 28px; }
.remote-empty h2 { margin: 18px 0 0; font-size: 17px; }.remote-empty p { max-width: 260px; margin: 8px 0 22px; color: ui.$audit-sub; font-size: 12px; line-height: 1.6; }
.remote-empty button, .save-remote { @include ui.primary-button; width: 100%; }
.remote-status { @include ui.surface; overflow: hidden; }
.remote-status header { min-height: 70px; display: grid; grid-template-columns: 42px minmax(0,1fr) 10px; gap: 10px; align-items: center; padding: 12px; }
.remote-status__icon { width: 42px; height: 42px; }.remote-status__icon img { width: 23px; height: 23px; }
.remote-status h2, .section-heading h2 { margin: 0; color: ui.$audit-text; font-size: 14px; }.remote-status p { margin: 4px 0 0; color: ui.$audit-sub; font-size: 11px; }
.remote-status header > i { width: 8px; height: 8px; border-radius: 50%; background: ui.$audit-success; box-shadow: 0 0 0 4px #dcfce7; }
.remote-status footer { min-height: 50px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 7px; padding: 0 12px; border-top: 1px solid ui.$audit-border; }
.remote-status footer span { color: ui.$audit-sub; font-size:12px; }.remote-status footer strong { font-size: 11px; @include ui.numeric; }
.remote-status footer button { @include ui.reset-button; min-height: 38px; padding: 0 10px; border-radius: 8px; background: ui.$audit-primary-soft; color: ui.$audit-primary; font-size: 11px; font-weight: 700; }.remote-status footer button:disabled { color: ui.$audit-disabled; }
.remote-section { display: flex; flex-direction: column; gap: 9px; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 10px; padding: 0 2px; }.section-heading span { overflow: hidden; color: ui.$audit-sub; font-size:12px; text-overflow: ellipsis; white-space: nowrap; }
.snapshot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.snapshot-grid article { @include ui.surface; min-width: 0; min-height: 92px; padding: 12px; box-shadow: none; }
.snapshot-grid span, .snapshot-grid strong, .snapshot-grid small { display: block; }.snapshot-grid span { color: ui.$audit-sub; font-size:12px; }.snapshot-grid strong { margin-top: 9px; color: ui.$audit-primary; font-size: 17px; @include ui.numeric; }.snapshot-grid strong.success { color: ui.$audit-success; }.snapshot-grid strong.danger { color: ui.$audit-danger; }.snapshot-grid small { margin-top: 5px; overflow: hidden; color: ui.$audit-sub; font-size:12px; text-overflow: ellipsis; white-space: nowrap; }
.parameter-list { @include ui.surface; overflow: hidden; box-shadow: none; }
.parameter-row { min-height: 68px; display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 12px; align-items: center; padding: 10px 12px; border-bottom: 1px solid ui.$audit-border; }.parameter-row:last-child { border-bottom: 0; }
.parameter-row span strong, .parameter-row span small { display: block; }.parameter-row span strong { font-size: 13px; }.parameter-row span small { margin-top: 4px; color: ui.$audit-sub; font-size:12px; }
.parameter-row select { min-width: 104px; min-height: 44px; padding: 0 28px 0 10px; border: 1px solid ui.$audit-border; border-radius: 8px; background: #f8fafc; color: ui.$audit-text; font-size: 11px; }
.switch-control { @include ui.reset-button; width: 46px; height: 26px; padding: 3px; border-radius: 13px; background: #cbd5e1; }.switch-control i { display: block; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .18s; }.switch-control.active { background: ui.$audit-primary; }.switch-control.active i { transform: translateX(20px); }
.language-row > div { display: flex; gap: 4px; }.language-row > div button { @include ui.reset-button; min-width: 44px; min-height: 44px; border: 1px solid ui.$audit-border; background: #f8fafc; font-size: 11px; font-weight: 700; }.language-row > div button:first-child { border-radius: 8px 0 0 8px; }.language-row > div button:last-child { border-radius: 0 8px 8px 0; }.language-row > div button.active { border-color: ui.$audit-primary; background: ui.$audit-primary-soft; color: ui.$audit-primary; }
.save-remote { margin-top: 2px; }
.remote-toast { position: absolute; left: 50%; bottom: 92px; z-index: 40; transform: translateX(-50%); padding: 9px 13px; border-radius: 9px; background: #17202d; color: #fff; font-size: 11px; white-space: nowrap; }
@media (max-width: 340px) { .remote-status footer { grid-template-columns: auto 1fr; }.remote-status footer button { grid-column: 1 / -1; margin-bottom: 8px; }.parameter-row { gap: 7px; }.parameter-row select { min-width: 96px; } }
.switch-control,.switch-control.active {position:relative;width:50px;height:44px;padding:12px 5px;background:transparent;}.switch-control::before{content:"";position:absolute;inset:9px 0;border-radius:14px;background:#cbd5e1}.switch-control.active::before{background:#2563eb}.switch-control i{position:relative;z-index:1;}
</style>
