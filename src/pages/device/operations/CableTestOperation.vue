<template>
  <div class="app-container cable-test-page">
    <div class="content-flex hide-scrollbar">
      <SmartOtdrPageShell :title="t('deviceDetail.cableTest')" @back="goBack">
        <div class="cable-test-main">
          <section v-if="activeView === 'menu'" class="cable-menu-view">
            <section class="cable-hero-card">
              <div class="cable-hero-card__top">
                <div class="cable-hero-card__icon">
                  <span class="iconify" data-icon="mdi:lan-connect"></span>
                </div>
                <div class="cable-hero-card__main">
                  <h3 class="cable-hero-card__title">{{ t('deviceDetail.cableTest') }}</h3>
                  <div class="cable-hero-card__meta">线序、线长、寻线</div>
                </div>
              </div>

              <div class="cable-hero-card__status-row">
                <div class="cable-status-pill">设备能力</div>
                <div class="cable-hero-card__status-text">支持线序、线长、寻线检测</div>
              </div>

              <div class="cable-summary-grid">
                <div v-for="item in menuSummaryItems" :key="item.key" class="cable-summary-item">
                  <div class="cable-summary-item__label">{{ item.label }}</div>
                  <div class="cable-summary-item__value">{{ item.value }}</div>
                </div>
              </div>
            </section>

            <section class="cable-entry-section cable-entry-group">
              <div class="smart-section-head">
                <h3 class="section-title">检测入口</h3>
              </div>

              <div class="cable-entry-grid">
                <button
                  v-for="item in toolCards"
                  :key="item.key"
                  class="cable-entry-card"
                  type="button"
                  @click="openTool(item.key)"
                >
                  <div class="cable-entry-card__icon">
                    <span class="iconify" :data-icon="item.icon"></span>
                  </div>
                  <div class="cable-entry-card__title">{{ item.label }}</div>
                </button>
              </div>
            </section>

            <section class="cable-footer-card">
              <div class="cable-footer-card__label">最近操作</div>
              <div class="cable-footer-card__value">上次模式 {{ lastToolLabel }}</div>
            </section>
          </section>

          <section v-else class="cable-detail-view">
            <section class="cable-detail-hero-card">
              <div class="cable-detail-hero-card__top">
                <div class="cable-detail-hero-card__title-group">
                  <h3 class="section-title">{{ currentTool.label }}</h3>
                  <div class="cable-detail-hero-card__meta">{{ boardStatusText }}</div>
                </div>
                <div class="cable-status-chip">
                  {{ boardStatusText }}
                </div>
              </div>

              <div class="cable-detail-hero-card__controls">
                <div class="standard-switch">
                  <button
                    class="seg-btn"
                    :class="{ active: standard === 'T568B' }"
                    type="button"
                    @click="changeStandard('T568B')"
                  >
                    T568B
                  </button>
                  <button
                    class="seg-btn"
                    :class="{ active: standard === 'T568A' }"
                    type="button"
                    @click="changeStandard('T568A')"
                  >
                    T568A
                  </button>
                </div>
              </div>

              <div class="cable-detail-hero-card__metrics">
                <div class="cable-inline-metric">
                  <span class="cable-inline-metric__label">标准</span>
                  <span class="cable-inline-metric__value">{{ standard }}</span>
                </div>
                <div class="cable-inline-metric">
                  <span class="cable-inline-metric__label">异常端口</span>
                  <span class="cable-inline-metric__value">{{ abnormalPortText }}</span>
                </div>
              </div>

              <div class="cable-warning-tip">{{ warningText }}</div>

              <button class="action-primary" type="button" @click="runCurrentTest" :disabled="running">
                {{ primaryActionText }}
              </button>
            </section>

            <section class="cable-board-card">
              <div class="board-card__head">
                <div class="board-card__title-group">
                  <h3 class="section-title">检测结果</h3>
                  <div class="board-card__meta">{{ currentTool.label }} · {{ standard }}</div>
                </div>
                <span class="cable-status-chip">{{ boardStatusText }}</span>
              </div>

              <div class="test-board">
                <div class="port-list">
                  <div v-for="row in displayRows" :key="row.port" class="port-row">
                    <div class="port-label">Port-{{ row.port }}</div>
                    <div class="port-wire" :style="{ background: row.barBg }"></div>

                    <template v-if="activeView === 'wire-order'">
                      <div class="port-cell">
                        <span class="status-tag" :class="row.statusClass">{{ row.statusText }}</span>
                      </div>
                    </template>

                    <template v-else-if="activeView === 'length'">
                      <div class="port-cell">
                        <span class="length-badge">{{ row.lengthText }}</span>
                      </div>
                    </template>

                    <template v-else>
                      <div class="port-cell">
                        <span class="iconify seek-icon" :class="{ active: seekEnabled }" data-icon="mdi:access-point"></span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <div class="cable-result-note">{{ resultText }}</div>
            </section>

            <section class="cable-actions-card">
              <button class="action-secondary" type="button" @click="activeView = 'menu'">返回菜单</button>
            </section>
          </section>
        </div>
      </SmartOtdrPageShell>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SmartOtdrPageShell from '../components/SmartOtdrPageShell.vue'

type StandardType = 'T568A' | 'T568B'
type ToolView = 'menu' | 'wire-order' | 'length' | 'seek'
type PortStatus = 'idle' | 'pass' | 'broken'

interface ToolCard {
  key: Exclude<ToolView, 'menu'>
  label: string
  icon: string
}

interface MenuSummaryItem {
  key: string
  label: string
  value: string
}

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const activeView = ref<ToolView>('menu')
const lastSelectedView = ref<Exclude<ToolView, 'menu'>>('wire-order')
const standard = ref<StandardType>('T568B')
const running = ref(false)
const resultReady = ref(false)
const seekEnabled = ref(false)

const barPalette: Record<number, string> = {
  1: 'repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 12px, #22c55e 12px, #22c55e 24px)',
  2: '#22c55e',
  3: 'repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 12px, #f59e0b 12px, #f59e0b 24px)',
  4: '#60a5fa',
  5: 'repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 12px, #60a5fa 12px, #60a5fa 24px)',
  6: '#f59e0b',
  7: 'repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 12px, #8b5cf6 12px, #8b5cf6 24px)',
  8: '#8b5cf6'
}

const toolCards = computed<ToolCard[]>(() => [
  {
    key: 'wire-order',
    label: t('deviceDetail.lineOrder'),
    icon: 'mdi:call-split'
  },
  {
    key: 'length',
    label: t('deviceDetail.lineLength'),
    icon: 'mdi:ruler'
  },
  {
    key: 'seek',
    label: t('deviceDetail.findLine'),
    icon: 'mdi:radar'
  }
])

const menuSummaryItems = computed<MenuSummaryItem[]>(() => [
  {
    key: 'wire-order',
    label: '线序检测',
    value: '8 芯状态'
  },
  {
    key: 'length',
    label: '线长检测',
    value: '逐芯长度'
  },
  {
    key: 'seek',
    label: '寻线模式',
    value: '信号输出'
  }
])

const currentTool = computed(() => {
  const activeKey = activeView.value === 'menu' ? lastSelectedView.value : activeView.value
  return toolCards.value.find(item => item.key === activeKey) ?? toolCards.value[0]
})

const lastToolLabel = computed(() => currentTool.value.label)

const warningText = computed(() => {
  if (activeView.value === 'seek') return '请用寻线模块进行寻线，开启后显示全部端口信号。'
  return '测试前请接入远端模块，未接入时结果仅作为 Mock 展示。'
})

const boardStatusText = computed(() => {
  if (running.value) return activeView.value === 'seek' ? '寻线中' : '检测中'
  if (activeView.value === 'seek') return seekEnabled.value ? '已开启' : '未开启'
  return resultReady.value ? '已完成' : '待测'
})

const failPorts = computed(() => (standard.value === 'T568B' ? [2] : [6]))
const lengthValues = computed(() => (
  standard.value === 'T568B'
    ? [38.6, 38.4, 0, 38.2, 38.3, 38.1, 37.9, 37.8]
    : [37.8, 37.9, 38.1, 38.3, 38.2, 0, 38.4, 38.6]
))

const displayRows = computed(() => {
  return Array.from({ length: 8 }, (_, index) => {
    const port = index + 1
    const isBroken = failPorts.value.includes(port)
    const status: PortStatus = !resultReady.value && !seekEnabled.value
      ? 'idle'
      : isBroken
        ? 'broken'
        : 'pass'

    return {
      port,
      barBg: barPalette[port],
      statusText: status === 'broken' ? '断路' : status === 'pass' ? '通过' : '--',
      statusClass: status === 'broken' ? 'fail' : status === 'pass' ? 'pass' : 'idle',
      lengthText: resultReady.value ? `${lengthValues.value[index].toFixed(1)}m` : '--'
    }
  })
})

const resultText = computed(() => {
  if (activeView.value === 'seek') {
    return seekEnabled.value ? '全部端口已输出寻线信号，可配合寻线模块查线。' : '当前未开启寻线输出。'
  }

  if (!resultReady.value) return '点击开启后生成当前模式的检测结果。'
  if (activeView.value === 'wire-order') {
    return failPorts.value.length ? `检测完成，Port-${failPorts.value[0]} 存在异常。` : '线序检测全部通过。'
  }
  return failPorts.value.length ? `线长检测完成，Port-${failPorts.value[0]} 未连接。` : '线长检测完成。'
})

const abnormalPortText = computed(() => {
  if (activeView.value === 'seek') return seekEnabled.value ? '全部端口' : '--'
  return failPorts.value.length ? `Port-${failPorts.value[0]}` : '无'
})

const primaryActionText = computed(() => {
  if (running.value) return activeView.value === 'seek' ? '开启中...' : '检测中...'
  if (activeView.value === 'seek') return seekEnabled.value ? '关闭寻线' : '开启寻线'
  return '开启检测'
})

const goBack = () => {
  router.push(`/device/${String(route.params.id || '')}`)
}

const openTool = (tool: Exclude<ToolView, 'menu'>) => {
  lastSelectedView.value = tool
  activeView.value = tool
}

const resetResultState = () => {
  resultReady.value = false
  seekEnabled.value = false
}

const changeStandard = (next: StandardType) => {
  standard.value = next
  resetResultState()
}

const runCurrentTest = async () => {
  if (running.value) return
  running.value = true

  if (activeView.value === 'seek') {
    await new Promise(resolve => setTimeout(resolve, 500))
    seekEnabled.value = !seekEnabled.value
    resultReady.value = false
    running.value = false
    return
  }

  await new Promise(resolve => setTimeout(resolve, 900))
  resultReady.value = true
  seekEnabled.value = false
  running.value = false
}
</script>

<style scoped lang="scss">
@use '../components/smartOtdrUi.scss' as ui;

.cable-test-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: linear-gradient(180deg, #f6f8fc 0%, #edf3ff 100%);
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

.cable-test-page :deep(.smart-otdr-shell) {
  border-radius: 0;
  border: 0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: none;
  overflow: hidden;
}

.cable-test-page :deep(.smart-otdr-shell__header) {
  padding: 14px 16px 10px;
}

.cable-test-page :deep(.smart-otdr-shell__body) {
  padding: 8px 16px 110px;
}

.cable-test-main,
.cable-menu-view,
.cable-detail-view,
.cable-summary-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.smart-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.cable-hero-card,
.cable-footer-card,
.cable-entry-group,
.cable-detail-hero-card,
.cable-board-card,
.cable-actions-card {
  width: 100%;
  box-sizing: border-box;
  @include ui.smart-otdr-app-surface;
  padding: 16px;
}

.cable-entry-section {
  width: 100%;
  display: block;
}

.cable-entry-grid {
  width: 100%;
}

.cable-hero-card__eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
}

.cable-hero-card__top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.cable-hero-card__icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 28px;
  flex-shrink: 0;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.18);
}

.cable-hero-card__main {
  flex: 1;
  min-width: 0;
}

.cable-hero-card__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.cable-hero-card__meta,
.cable-detail-hero-card__meta,
.cable-footer-card__label,
.cable-warning-tip,
.cable-result-note {
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.cable-menu-view {
  gap: 16px;
}

.cable-hero-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cable-hero-card__meta {
  margin-top: 8px;
}

.cable-hero-card__status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(239, 246, 255, 0.9);
  border: 1px solid rgba(191, 219, 254, 0.9);
}

.cable-status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  flex-shrink: 0;
}

.cable-hero-card__status-text {
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
}

.cable-entry-section {
  margin-top: 0;
}

.cable-entry-section .smart-section-head {
  margin-bottom: 10px;
}

.cable-detail-hero-card__top,
.cable-detail-hero-card__controls,
.board-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cable-detail-hero-card__title-group {
  flex: 1;
  min-width: 0;
}

.cable-detail-view {
  gap: 12px;
}

.standard-switch {
  display: inline-flex;
  gap: 8px;
  padding: 4px;
  border-radius: 999px;
  background: #eff6ff;
}

.seg-btn {
  min-width: 72px;
  height: 34px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.seg-btn.active {
  @include ui.smart-otdr-primary-button;
  color: #ffffff;
}

.cable-status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.cable-detail-hero-card__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 2px;
}

.cable-inline-metric {
  border-radius: 14px;
  background: #f3f7ff;
  border: 1px solid rgba(59, 130, 246, 0.10);
  padding: 10px 12px;
}

.cable-inline-metric__label {
  display: block;
  font-size: 11px;
  color: #64748b;
}

.cable-inline-metric__value {
  display: block;
  margin-top: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.cable-summary-grid,
.cable-entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.cable-summary-item {
  @include ui.smart-otdr-setting-card;
  min-width: 0;
  padding: 14px;
}

.cable-summary-item__label,
.cable-footer-card__label {
  font-size: 12px;
  color: #64748b;
}

.cable-summary-item__value,
.cable-footer-card__value {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.cable-entry-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.cable-entry-card {
  @include ui.smart-otdr-setting-card;
  min-height: 112px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 12px;
  cursor: pointer;
  text-align: left;
}

.cable-entry-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eef4ff;
  color: #1d4ed8;
  font-size: 18px;
}

.cable-entry-card__title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: #0f172a;
}

.cable-detail-hero-card,
.cable-board-card,
.cable-actions-card {
  padding: 14px;
}

.board-card__title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.board-card__meta {
  font-size: 12px;
  color: rgba(219, 234, 254, 0.78);
}

.cable-board-card {
  background: linear-gradient(180deg, #0f223f 0%, #112a4f 100%);
  border: 1px solid rgba(96, 165, 250, 0.16);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.18);
}

.board-card__head {
  margin-bottom: 12px;
}

.board-card__head .section-title {
  color: #f8fbff;
}

.test-board {
  padding: 12px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(7, 22, 47, 0.96) 0%, rgba(11, 33, 68, 0.98) 100%);
  border: 1px solid rgba(148, 163, 184, 0.12);
  color: #dbeafe;
}

.port-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.port-row {
  display: grid;
  grid-template-columns: 62px 1fr 72px;
  align-items: center;
  gap: 10px;
}

.port-label {
  padding: 6px 8px;
  border-radius: 8px;
  background: #06b6d4;
  color: #ecfeff;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.port-wire {
  height: 8px;
  border-radius: 999px;
}

.port-cell {
  display: flex;
  justify-content: flex-end;
}

.status-tag,
.length-badge {
  min-width: 62px;
  padding: 6px 8px;
  border-radius: 8px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
}

.status-tag.pass,
.length-badge {
  background: #4ade80;
  color: #f0fdf4;
}

.status-tag.fail {
  background: #ef4444;
  color: #fff1f2;
}

.status-tag.idle {
  background: rgba(148, 163, 184, 0.4);
  color: #e2e8f0;
}

.seek-icon {
  font-size: 24px;
  color: rgba(96, 165, 250, 0.55);
}

.seek-icon.active {
  color: #60a5fa;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.55);
}

.cable-result-note {
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.12);
  padding: 12px 14px;
  color: #dbeafe;
}

.cable-actions-card {
  padding: 10px 14px 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.cable-footer-card {
  padding: 12px 14px;
  box-shadow: none;
}

.cable-entry-group,
.cable-footer-card {
  padding: 16px;
}

.cable-entry-group {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.action-primary,
.action-secondary {
  min-height: 48px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.action-primary {
  margin-top: 14px;
  @include ui.smart-otdr-primary-button;
}

.action-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-secondary {
  width: 100%;
  @include ui.smart-otdr-secondary-button;
}

@media (max-width: 768px) {
  .cable-summary-grid,
  .cable-entry-grid {
    grid-template-columns: 1fr;
  }

  .cable-detail-hero-card__top,
  .cable-detail-hero-card__controls,
  .board-card__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .cable-detail-hero-card__metrics {
    grid-template-columns: 1fr;
  }

  .port-row {
    grid-template-columns: 58px 1fr 66px;
  }
}

@media (max-width: 520px) {
  .content-flex {
    padding: 0 0 20px;
  }

  .cable-test-page :deep(.smart-otdr-shell__header) {
    padding: 12px 14px 8px;
  }

  .cable-test-page :deep(.smart-otdr-shell__body) {
    padding: 8px 14px 110px;
  }

  .test-board {
    padding: 12px;
  }
}

/* Compact entry layout shared with the smart OTDR device home. */
.cable-test-page { background: #f7f9fc; }
.cable-test-page :deep(.smart-otdr-shell__body) { padding: 14px; }
.cable-test-main,
.cable-menu-view { gap: 12px; }
.cable-hero-card,
.cable-footer-card { border: 1px solid #d8e2ef; border-radius: 12px; background: #ffffff; box-shadow: none; }
.cable-hero-card { padding: 14px; gap: 12px; }
.cable-hero-card__icon { width: 44px; height: 44px; border-radius: 10px; }
.cable-hero-card__title { font-size: 17px; }
.cable-hero-card__meta { margin-top: 3px; font-size: 11px; }
.cable-hero-card__status-row { padding: 9px 10px; border-radius: 8px; }
.cable-summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; overflow: hidden; border: 1px solid #d8e2ef; border-radius: 10px; }
.cable-summary-item { min-height: 54px; padding: 8px 4px; border: 0; border-right: 1px solid #d8e2ef; border-radius: 0; background: #ffffff; text-align: center; box-shadow: none; }
.cable-summary-item:last-child { border-right: 0; }
.cable-summary-item__label { font-size: 9px; }
.cable-summary-item__value { margin-top: 4px; font-size: 11px; }
.cable-entry-section { padding: 0; border: 0; background: transparent; box-shadow: none; }
.cable-entry-section .smart-section-head { margin: 0 0 8px; }
.cable-entry-grid { grid-template-columns: 1fr; gap: 8px; }
.cable-entry-card { position: relative; min-height: 62px; flex-direction: row; justify-content: flex-start; gap: 10px; padding: 9px 40px 9px 10px; border: 1px solid #d8e2ef; border-radius: 10px; background: #ffffff; box-shadow: none; text-align: left; }
.cable-entry-card::after { content: '›'; position: absolute; right: 14px; color: #64748b; font-size: 18px; }
.cable-entry-card__icon { width: 36px; height: 36px; border-radius: 9px; }
.cable-entry-card__title { font-size: 12px; }
.cable-footer-card { padding: 10px 12px; }

@media (max-width: 520px) {
  .cable-test-page :deep(.smart-otdr-shell__body) { padding: 14px; }
  .cable-summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .cable-entry-grid { grid-template-columns: 1fr; }
}
</style>
