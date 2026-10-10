<template>
  <DualPonPageShell :title="t('dualPon.recordsTitle')" :subtitle="device?.name" standalone @back="router.push(`/device/${deviceId}`)">
    <template #action><button v-if="state.persisted.records.length" class="clear-action" type="button" @click="confirmClear = true">{{ t('dualPon.clear') }}</button></template>
    <template #footer><DualPonFunctionNav :device-id="deviceId" active="home" /></template>
    <div class="records-page">
      <div class="filter-tabs" role="tablist"><button v-for="item in filters" :key="item.value" type="button" :class="{ active: filter === item.value }" @click="filter = item.value">{{ item.label }}</button></div>

      <section v-if="!filteredRecords.length" class="empty-state">
        <img :src="recordsIcon" alt="" /><h2>{{ t('dualPon.noRecords') }}</h2><p>{{ t('dualPon.noRecordsHint') }}</p>
      </section>
      <section v-else class="record-list">
        <article v-for="record in filteredRecords" :key="record.id" class="record-item" :class="`result-${record.result}`">
          <button class="record-main" type="button" @click="expanded = expanded === record.id ? '' : record.id">
            <span class="record-mark"><img :src="record.kind === 'network' ? networkIcon : record.kind === 'power' ? powerIcon : cableIcon" alt="" /></span>
            <span><strong>{{ record.title }}</strong><small>{{ record.createdAt }} · {{ record.summary }}</small></span><i>{{ expanded === record.id ? '⌃' : '⌄' }}</i>
          </button>
          <div v-if="expanded === record.id" class="record-detail"><div v-for="value in record.values" :key="`${value.label}-${value.value}`"><span>{{ value.label }}</span><strong>{{ value.value }}</strong></div><button type="button" @click="pendingDelete = record.id">{{ t('common.delete') }}</button></div>
        </article>
      </section>

      <div v-if="pendingDelete || confirmClear" v-smart-otdr-overlay class="dialog-backdrop" @click.self="closeConfirm">
        <section class="confirm-dialog" role="dialog" aria-modal="true"><h2>{{ pendingDelete ? t('dualPon.deleteRecordTitle') : t('dualPon.clearRecordsTitle') }}</h2><p>{{ pendingDelete ? t('dualPon.deleteRecordText') : t('dualPon.clearRecordsText') }}</p><div><button type="button" @click="closeConfirm">{{ t('common.cancel') }}</button><button class="danger" type="button" @click="confirmAction">{{ t('common.confirm') }}</button></div></section>
      </div>
    </div>
  </DualPonPageShell>
</template>

<script setup lang="ts">
import { vSmartOtdrOverlay } from '@/directives/smartOtdrOverlay'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DualPonPageShell from './DualPonPageShell.vue'
import DualPonFunctionNav from './DualPonFunctionNav.vue'
import { useDualPonState, type DualPonRecordKind } from './useDualPonState'
import { useDualPonDevice } from './useDualPonDevice'
import recordsIcon from '@/assets/icons/iconfont/smart-otdr/records.svg'
import networkIcon from '@/assets/icons/iconfont/instrument/network.svg'
import powerIcon from '@/assets/icons/iconfont/smart-otdr/power.svg'
import cableIcon from '@/assets/icons/iconfont/smart-otdr/cable.svg'

type Filter = 'all' | DualPonRecordKind
const router = useRouter(); const { t } = useI18n(); const { deviceId, device } = useDualPonDevice(); const state = useDualPonState(deviceId.value)
const filter = ref<Filter>('all'); const expanded = ref(''); const pendingDelete = ref(''); const confirmClear = ref(false)
const filters = computed<Array<{ value: Filter; label: string }>>(() => [{ value: 'all', label: t('dualPon.all') }, { value: 'network', label: t('dualPon.networkShort') }, { value: 'power', label: t('dualPon.powerShort') }, { value: 'cable', label: 'RJ45' }])
const filteredRecords = computed(() => filter.value === 'all' ? state.persisted.records : state.persisted.records.filter(record => record.kind === filter.value))
const closeConfirm = () => { pendingDelete.value = ''; confirmClear.value = false }
const confirmAction = () => { if (pendingDelete.value) state.removeRecord(pendingDelete.value); else state.clearRecords(); closeConfirm() }
</script>

<style scoped lang="scss">
@use './dualPonUi.scss' as ui;
.clear-action { @include ui.reset-button; min-width: 44px; min-height: 44px; border-radius: 10px; background: transparent; color: ui.$danger; font-size: 11px; font-weight: 700; }.records-page { @include ui.page-padding; min-height: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; }.filter-tabs { flex: 0 0 auto; display: grid; grid-template-columns: repeat(4,1fr); padding: 4px; border-radius: 12px; background: #eaf0f7; }.filter-tabs button { @include ui.reset-button; min-height: 40px; border-radius: 9px; background: transparent; color: ui.$sub; font-size: 11px; font-weight: 700; }.filter-tabs button.active { background: #fff; color: ui.$primary; box-shadow: 0 3px 10px rgba(32,50,78,.09); }.empty-state { min-height: 280px; flex: 1 1 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px 22px 48px; box-sizing: border-box; text-align: center; }.empty-state img { width: 44px; height: 44px; display: block; flex: 0 0 auto; object-fit: contain; opacity: .55; }.empty-state h2 { width: 100%; margin: 14px 0 0; color: ui.$text; font-size: 14px; text-align: center; }.empty-state p { width: min(100%,220px); margin: 7px 0 0; color: ui.$sub; font-size: 11px; line-height: 1.5; text-align: center; }.record-list { display: flex; flex-direction: column; gap: 9px; }.record-item { @include ui.surface; overflow: hidden; box-shadow: none; }.record-item.result-pass { border-left: 3px solid ui.$success; }.record-item.result-fail { border-left: 3px solid ui.$danger; }.record-item.result-saved { border-left: 3px solid ui.$primary; }.record-main { @include ui.reset-button; width: 100%; min-height: 68px; display: grid; grid-template-columns: 38px minmax(0,1fr) 18px; gap: 9px; align-items: center; padding: 9px 11px; background: #fff; text-align: left; }.record-mark { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 10px; background: ui.$primary-soft; }.record-mark img { width: 21px; }.record-main strong,.record-main small { display: block; }.record-main strong { color: ui.$text; font-size: 11px; }.record-main small { margin-top: 4px; overflow: hidden; color: ui.$sub; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.record-main i { color: ui.$sub; font-size: 13px; font-style: normal; }.record-detail { padding: 0 11px 11px 58px; border-top: 1px solid ui.$border; }.record-detail > div { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf1f6; }.record-detail span { color: ui.$sub; font-size: 11px; }.record-detail strong { @include ui.data-number; font-size: 11px; }.record-detail > button { @include ui.reset-button; width: 100%; min-height: 42px; margin-top: 5px; border-radius: 9px; background: #fff1f2; color: ui.$danger; font-size: 11px; font-weight: 700; }
.dialog-backdrop { position: absolute; inset: 0; z-index: 60; display: grid; place-items: center; padding: 20px; background: rgba(4,10,19,.62); }.confirm-dialog { width: 100%; box-sizing: border-box; padding: 18px; border-radius: 16px; background: #fff; }.confirm-dialog h2 { margin: 0; font-size: 14px; }.confirm-dialog p { margin: 8px 0 17px; color: ui.$sub; font-size: 11px; line-height: 1.55; }.confirm-dialog > div { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }.confirm-dialog button { @include ui.reset-button; min-height: 46px; border-radius: 11px; background: #edf2f7; font-weight: 700; }.confirm-dialog button.danger { background: ui.$danger; color: #fff; }
</style>
