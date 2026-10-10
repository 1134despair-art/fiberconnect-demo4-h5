<template>
  <PortAuditPageShell standalone :title="t('portAudit.rfidPageTitle')" :subtitle="device?.name" @back="goHome">
    <div class="rfid-page">
      <section v-if="!connected" class="connection-alert"><img :src="bluetoothIcon" alt="" /><span><strong>{{ t('portAudit.disconnected') }}</strong><small>{{ t('portAudit.connectFirst') }}</small></span><button type="button" @click="reconnect">{{ t('portAudit.reconnect') }}</button></section>

      <section class="rfid-reader" :class="{ scanning: state.runtime.rfidScanning }">
        <div class="reader-ring"><img :src="rfidIcon" alt="" /><i></i><i></i></div>
        <h2>{{ state.runtime.rfidScanning ? t('portAudit.scanning') : t('portAudit.rfidTitle') }}</h2>
        <p>{{ t('portAudit.rfidFrequency') }}</p>
        <button type="button" :disabled="!connected || state.runtime.rfidScanning" @click="scan">{{ state.runtime.rfidScanning ? t('portAudit.scanning') : t('portAudit.startScan') }}</button>
      </section>

      <section class="records-section">
        <header><div><h2>{{ t('portAudit.records') }}</h2><p>{{ state.records.value.length }} / 100</p></div><button v-if="state.records.value.length" type="button" @click="confirmingClear = true">{{ t('portAudit.clearRecords') }}</button></header>
        <div v-if="!state.records.value.length" class="empty-state"><img :src="rfidIcon" alt="" /><strong>{{ t('portAudit.noRecords') }}</strong><p>{{ t('portAudit.noRecordsHint') }}</p></div>
        <div v-else class="record-list">
          <article v-for="record in state.records.value" :key="record.id" class="record-item">
            <header><strong>{{ record.portCode }}</strong><span :class="{ uploaded: record.uploaded }">{{ record.uploaded ? t('portAudit.uploaded') : t('portAudit.rfidTitle') }}</span></header>
            <dl><div><dt>{{ t('portAudit.epc') }}</dt><dd>{{ record.epc }}</dd></div><div><dt>{{ t('portAudit.assetCode') }}</dt><dd>{{ record.assetCode }}</dd></div><div><dt>{{ t('portAudit.readTime') }}</dt><dd>{{ formatTime(record.readAt) }}</dd></div></dl>
            <button type="button" :disabled="record.uploaded || uploadingId === record.id" @click="upload(record.id)"><img :src="uploadIcon" alt="" />{{ uploadingId === record.id ? `${t('portAudit.uploading')} ${state.runtime.uploadProgress}%` : record.uploaded ? t('portAudit.uploaded') : t('portAudit.upload') }}</button>
          </article>
        </div>
      </section>
    </div>

    <div v-if="confirmingClear" v-smart-otdr-overlay class="dialog-backdrop" @click.self="confirmingClear = false"><section class="dialog" role="alertdialog" aria-modal="true"><h2>{{ t('portAudit.clearRecords') }}</h2><p>{{ t('portAudit.clearRecordsConfirm') }}</p><div><button type="button" @click="confirmingClear = false">{{ t('common.cancel') }}</button><button class="danger" type="button" @click="clearRecords">{{ t('common.confirm') }}</button></div></section></div>
    <div v-if="feedback" class="feedback" role="status">{{ feedback }}</div>
    <template #footer><PortAuditFunctionNav :device-id="deviceId" active="audit" /></template>
  </PortAuditPageShell>
</template>

<script setup lang="ts">
import { vSmartOtdrOverlay } from '@/directives/smartOtdrOverlay'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import PortAuditPageShell from './PortAuditPageShell.vue'
import PortAuditFunctionNav from './PortAuditFunctionNav.vue'
import { usePortAuditDevice } from './usePortAuditDevice'
import { usePortAuditState } from './usePortAuditState'
import bluetoothIcon from '@/assets/icons/iconfont/smart-otdr/bluetooth.svg'
import rfidIcon from '@/assets/icons/iconfont/instrument/rfid.svg'
import uploadIcon from '@/assets/icons/iconfont/smart-otdr/upload.svg'

const router = useRouter(); const { t, locale } = useI18n(); const { updateDevice } = useAuth()
const { deviceId, device } = usePortAuditDevice(); const state = usePortAuditState(deviceId.value)
const goHome = () => router.push(`/device/${deviceId.value}`)
const confirmingClear = ref(false); const uploadingId = ref(''); const feedback = ref(''); let feedbackTimer: number | undefined
const connected = computed(() => device.value?.status === 'connected' && state.persisted.bluetoothEnabled)
const showFeedback = (value: string) => { feedback.value = value; if (feedbackTimer) window.clearTimeout(feedbackTimer); feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1600) }
const scan = async () => { const record = await state.scanRfid(); if (record) showFeedback(`${t('portAudit.portCode')}: ${record.portCode}`) }
const upload = async (id: string) => { uploadingId.value = id; const success = await state.uploadRecord(id); uploadingId.value = ''; if (success) showFeedback(t('portAudit.uploaded')) }
const clearRecords = () => { state.records.value = []; confirmingClear.value = false }
const reconnect = async () => { await state.reconnectBluetooth(); updateDevice(deviceId.value, { status: 'connected' }) }
const formatTime = (value: string) => new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
</script>

<style scoped lang="scss">
@use './portAuditUi.scss' as ui;
.rfid-page { @include ui.page-padding; display: flex; flex-direction: column; gap: 12px }.connection-alert { display: grid; grid-template-columns: 32px 1fr auto; gap: 8px; align-items: center; padding: 10px; border: 1px solid #fed7aa; border-radius: 12px; background: #fff7ed }.connection-alert img { width: 22px }.connection-alert strong, .connection-alert small { display: block }.connection-alert strong { color: #9a3412; font-size: 11px }.connection-alert small { margin-top: 2px; color: #c2410c; font-size: 11px }.connection-alert button { @include ui.reset-button; min-height: 38px; padding: 0 9px; border-radius: 9px; background: #fff; color: #9a3412; font-size: 11px; font-weight: 700 }
.rfid-reader { padding: 24px 16px 16px; border-radius: 12px; background: ui.$audit-screen; color: #fff; text-align: center; box-shadow: 0 10px 22px rgba(11,15,20,.16) }.reader-ring { position: relative; width: 88px; height: 88px; display: grid; place-items: center; margin: 0 auto; border: 1px solid #3f4a59; border-radius: 50% }.reader-ring img { width: 34px; height: 34px; filter: brightness(0) invert(1) }.reader-ring i { position: absolute; inset: 10px; border: 1px solid #2a3543; border-radius: 50% }.reader-ring i + i { inset: 22px }.rfid-reader.scanning .reader-ring { border-color: #67e8f9; animation: ring 1.1s infinite }.rfid-reader.scanning .reader-ring i { border-color: #0891b2 } @keyframes ring { 50% { box-shadow: 0 0 0 12px rgba(8,145,178,.12) } }.rfid-reader h2 { margin: 14px 0 0; font-size: 16px }.rfid-reader p { margin: 5px 0 0; color: #9aa7b8; font-size: 11px }.rfid-reader > button { @include ui.primary-button; width: 100%; margin-top: 16px; box-shadow: none }
.records-section > header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px }.records-section header h2 { margin: 0; font-size: 14px }.records-section header p { margin: 2px 0 0; color: ui.$audit-sub; font-size: 11px }.records-section > header button { @include ui.reset-button; min-height: 36px; color: ui.$audit-danger; font-size: 11px; font-weight: 700 }.empty-state { padding: 30px 20px; border: 1px dashed #bdcad9; border-radius: 14px; background: rgba(255,255,255,.55); text-align: center }.empty-state img { width: 32px; opacity: .55 }.empty-state strong { display: block; margin-top: 9px; color: ui.$audit-text; font-size: 12px }.empty-state p { margin: 4px 0 0; color: ui.$audit-sub; font-size: 11px; line-height: 1.45 }
.record-list { display: flex; flex-direction: column; gap: 9px }.record-item { @include ui.surface; padding: 12px; box-shadow: none }.record-item > header { display: flex; align-items: center; justify-content: space-between }.record-item > header strong { color: ui.$audit-text; font-size: 12px; @include ui.numeric }.record-item > header span { padding: 3px 6px; border-radius: 6px; background: #f1f5f9; color: ui.$audit-sub; font-size: 11px }.record-item > header span.uploaded { background: #ecfdf5; color: ui.$audit-success }.record-item dl { margin: 9px 0 0 }.record-item dl div { display: grid; grid-template-columns: 68px minmax(0,1fr); gap: 7px; margin-top: 5px }.record-item dt { color: ui.$audit-sub; font-size: 11px }.record-item dd { margin: 0; overflow: hidden; color: ui.$audit-text; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; @include ui.numeric }.record-item > button { @include ui.reset-button; width: 100%; min-height: 40px; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; border-radius: 10px; background: ui.$audit-primary-soft; color: ui.$audit-primary; font-size: 11px; font-weight: 700 }.record-item > button img { width: 17px }.record-item > button:disabled { background: #f1f5f9; color: ui.$audit-disabled }
.dialog-backdrop { position: absolute; inset: 0; z-index: 50; display: grid; place-items: center; padding: 20px; background: rgba(5,12,22,.62) }.dialog { width: min(100%,310px); padding: 20px; border-radius: 12px; background: #fff; text-align: center }.dialog h2 { margin: 0; font-size: 17px }.dialog p { margin: 8px 0 0; color: ui.$audit-sub; font-size: 11px; line-height: 1.5 }.dialog div { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 18px }.dialog button { @include ui.reset-button; min-height: 44px; border-radius: 10px; background: #eef2f7; font-size: 11px; font-weight: 700 }.dialog button.danger { background: ui.$audit-danger; color: #fff }.feedback { position: absolute; left: 50%; bottom: 92px; z-index: 60; transform: translateX(-50%); padding: 9px 13px; border-radius: 9px; background: #17202d; color: #fff; font-size: 11px; white-space: nowrap }
</style>
