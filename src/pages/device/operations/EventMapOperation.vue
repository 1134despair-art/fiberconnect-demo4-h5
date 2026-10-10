<template>
  <div class="app-container otdr-app-page smart-otdr-portrait-page">
    <div class="content-flex hide-scrollbar">
      <SmartOtdrPageShell title="事件地图" :max-width="430" :show-quick-panel="false" @back="goBack">
        <template #actions>
          <div class="portrait-status" :class="{ running: isRunning }">
            <span class="portrait-status__dot"></span>
            {{ isRunning ? t('deviceDetail.eventMapRunning') : eventMapResult.events.length ? '已完成' : t('deviceDetail.eventMapIdle') }}
          </div>
          <SmartOtdrQuickPanel inline-trigger />
        </template>

        <main class="event-map-workbench">
          <SmartMeasurementTabs :device-id="deviceId" :busy="isRunning" />
          <p class="portrait-file">{{ eventMapResult.filename }}</p>
          <aside class="event-control-rail">
            <div class="rail-section-title">链路摘要</div>
            <div class="event-metric-grid">
              <div class="event-metric-item"><span>波长</span><strong>{{ parameterState.wavelength }}</strong></div>
              <div class="event-metric-item"><span>量程</span><strong>{{ parameterState.range }}</strong></div>
              <div class="event-metric-item"><span>脉宽</span><strong>{{ parameterState.pulse }}</strong></div>
              <div class="event-metric-item"><span>事件</span><strong>{{ eventMapResult.summaryMetrics.eventCount }}</strong></div>
              <div class="event-metric-item wide"><span>链路长度</span><strong>{{ eventMapResult.summaryMetrics.linkLength }}</strong></div>
            </div>
            <div class="event-summary-grid">
              <div class="event-summary-card"><span>{{ t('deviceDetail.eventMapLinkLoss') }}</span><strong>{{ eventMapResult.summaryMetrics.linkLoss }}</strong></div>
              <div class="event-summary-card"><span>{{ t('deviceDetail.eventMapAvgLoss') }}</span><strong>{{ eventMapResult.summaryMetrics.avgLoss }}</strong></div>
              <div class="event-summary-card wide"><span>{{ t('deviceDetail.eventMapReturnLoss') }}</span><strong>{{ eventMapResult.summaryMetrics.returnLoss }}</strong></div>
            </div>


          </aside>
          <section v-if="eventMapResult.events.length" class="event-map-card">
            <div class="card-head">
              <div class="card-title">链路事件视图</div>
              <div class="topology-navigation" aria-label="切换链路事件">
                <button type="button" aria-label="上一个事件" :disabled="selectedNodeIndex <= 0" @click="selectAdjacentNode(-1)">‹</button>
                <span>{{ selectedNodeIndex + 1 }} / {{ eventMapResult.nodes.length }}</span>
                <button type="button" aria-label="下一个事件" :disabled="selectedNodeIndex >= eventMapResult.nodes.length - 1" @click="selectAdjacentNode(1)">›</button>
              </div>
              <div class="card-meta">
                <span>{{ parameterState.wavelength }}</span>
                <span>{{ parameterState.range }}</span>
                <span>{{ parameterState.pulse }}</span>
                <strong>{{ eventMapResult.totalDistance }}</strong>
              </div>
            </div>

            <div class="map-canvas">
              <div class="link-overview" aria-label="链路事件总览">
                <div class="link-overview__track"></div>
                <button
                  v-for="node in eventMapResult.nodes"
                  :key="`${node.id}-overview`"
                  class="link-overview__marker"
                  :class="[node.type, { active: selectedNodeId === node.id }]"
                  :style="{ left: `${node.position}%` }"
                  type="button"
                  :aria-label="`${getNodeTitle(node)} ${node.distance}`"
                  :aria-pressed="selectedNodeId === node.id"
                  @click="selectedNodeId = node.id"
                ></button>
                <span class="link-overview__window"></span>
              </div>

              <div ref="topologyScroll" class="topology-scroll" aria-label="横向链路，左右滑动查看更多事件" @keydown.left.prevent="selectAdjacentNode(-1)" @keydown.right.prevent="selectAdjacentNode(1)">
                <div class="topology-chain">
                  <div class="topology-chain__line"></div>
                  <button
                  v-for="node in eventMapResult.nodes"
                    :key="`${node.id}-topology`"
                    class="topology-node"
                    :class="[node.type, getNodeTone(node), { active: selectedNodeId === node.id }]"
                    type="button"
                    :aria-pressed="selectedNodeId === node.id"
                    @click="selectedNodeId = node.id"
                  >
                    <span class="topology-node__distance">{{ node.distance }}</span>
                    <span class="topology-node__card">
                      <OtdrEventSymbol :type="getNodeTitle(node)" />
                    </span>
                    <span class="topology-node__index">{{ node.label }}</span>
                    <span class="topology-node__type">{{ getNodeTitle(node) }}</span>
                  </button>
                </div>
              </div>

              <div class="topology-selection">
                <span>当前事件</span>
                <strong>{{ selectedNodeTitle }}</strong>
                <span class="topology-selection__distance">{{ selectedNodeDistance }}</span>
                <span v-if="selectedNode && getNodeEvent(selectedNode)" class="topology-selection__reading">损耗 {{ getNodeEvent(selectedNode)?.loss }} dB · 反射 {{ getNodeEvent(selectedNode)?.reflect }} dB</span>
              </div>
            </div>
          </section>



          <div v-if="!eventMapResult.events.length" class="event-empty">暂无测试结果，请开始测试或加载文件。</div>
          <section v-else class="event-table-card">
            <div class="result-list-head">
              <div class="result-list-title">{{ t('deviceDetail.eventMapTable') }}</div>
              <div class="result-list-mode">{{ eventMapResult.summaryMetrics.eventCount }} 个事件</div>
            </div>
            <div class="smart-result-scroll" role="region" aria-label="事件数据，可左右滑动" tabindex="0">
              <table class="smart-result-table" aria-label="事件数据">
                <thead>
                  <tr>
                    <th scope="col">序号</th>
                    <th scope="col">类型</th>
                    <th scope="col">{{ t('deviceDetail.eventMapDistanceKm') }}</th>
                    <th scope="col">{{ t('deviceDetail.eventMapSectionKm') }}</th>
                    <th scope="col">{{ t('deviceDetail.eventMapLossDb') }}</th>
                    <th scope="col">{{ t('deviceDetail.eventMapTotalLossDb') }}</th>
                    <th scope="col">{{ t('deviceDetail.eventMapSlopeDbPerKm') }}</th>
                    <th scope="col">{{ t('deviceDetail.eventMapReflectDb') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in eventMapResult.events" :key="item.id" class="selectable"
                    :class="{ active: selectedNodeId === `event-${item.id}` }" tabindex="0"
                    :aria-current="selectedNodeId === `event-${item.id}` ? 'true' : undefined"
                    @click="selectedNodeId = `event-${item.id}`"
                    @keydown.enter.prevent="selectedNodeId = `event-${item.id}`"
                    @keydown.space.prevent="selectedNodeId = `event-${item.id}`">
                    <td>{{ item.id }}</td>
                    <td><span class="smart-result-type"><OtdrEventSymbol :type="item.type" compact /></span></td>
                    <td>{{ item.distance }}</td>
                    <td>{{ item.section }}</td>
                    <td>{{ item.loss }}</td>
                    <td>{{ item.totalLoss }}</td>
                    <td>{{ item.slope }}</td>
                    <td>{{ item.reflect }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
        <template #footer>
            <div class="portrait-actions" style="grid-template-columns:repeat(3,minmax(0,1fr))">
              <button class="action-secondary" type="button" @click="saveEventMapResult">{{ t('deviceDetail.eventMapSave') }}</button>
              <button class="action-secondary" type="button" :disabled="isRunning" @click="openSettingsDialog('parameter')">{{ t('deviceDetail.eventMapSettings') }}</button>
              <button class="action-secondary" type="button" @click="goToFiles">文件</button>
            </div>
            <button class="action-primary" type="button" :disabled="isRunning" @click="runEventMapTest">
              {{ isRunning ? '分析中' : t('deviceDetail.eventMapRun') }}
            </button>
            <div class="rail-save-state">
              <span>{{ t('deviceDetail.eventMapSavedAt') }} {{ lastSavedAt || '--' }}</span>
              <strong v-if="saveFeedback">{{ saveFeedback }}</strong>
            </div>
        </template>
      </SmartOtdrPageShell>
    </div>

    <SmartOtdrDialogShell
      v-if="isSettingsDialogVisible"
      title="设置"
      close-text="关闭"
      :max-width="430"
      max-height="calc(100dvh - 32px)"
      @close="closeSettingsDialog"
    >
      <template #default>
        <div class="modal-head">
          <div class="modal-title">事件地图设置</div>
        </div>

        <div class="modal-tab-row">
          <button
            class="modal-tab"
            :class="{ active: settingsTab === 'parameter' }"
            type="button"
            @click="settingsTab = 'parameter'"
          >
            参数设置
          </button>
          <button
            class="modal-tab"
            :class="{ active: settingsTab === 'threshold' }"
            type="button"
            @click="settingsTab = 'threshold'"
          >
            阈值设置
          </button>
        </div>

        <SmartOtdrSettingLayout v-if="settingsTab === 'parameter'" :items="parameterGroups" v-slot="{ activeKey }">
          <section v-for="group in parameterGroups" v-show="activeKey === group.key" :key="group.key" class="settings-group-card">
            <div class="settings-group-title">{{ group.label }}</div>
            <div class="settings-option-grid smart-choice-grid smart-choice-grid--compact">
              <button
                v-for="option in group.options"
                :key="option"
                class="settings-option-btn smart-choice-button"
                :class="{ active: group.value === option }"
                :aria-pressed="group.value === option"
                type="button"
                @click="updateParameterOption(group.key, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>
        </SmartOtdrSettingLayout>

        <SmartOtdrSettingLayout v-else :items="[{ key: 'threshold', label: '合格门限' }, { key: 'splitter', label: '分路器' }]" v-slot="{ activeKey }">
          <section v-show="activeKey === 'threshold'" class="settings-group-card">
            <div class="settings-group-title">{{ t('deviceDetail.eventMapThreshold') }}</div>
            <label v-for="item in thresholdRows" :key="item.key" class="settings-form-row">
              <div class="checkbox-wrap">
                <input v-model="thresholdState[item.enabledKey]" type="checkbox" />
                <span>{{ item.label }}</span>
              </div>
              <div class="value-wrap">
                <input v-model="thresholdState[item.valueKey]" class="value-input" type="text" />
                <span class="unit-text">dB</span>
              </div>
            </label>
          </section>

          <section v-show="activeKey === 'splitter'" class="settings-group-card">
            <div class="settings-group-title">{{ t('deviceDetail.eventMapSplitter') }}</div>
            <label v-for="item in splitterRows" :key="item.key" class="settings-form-row">
              <span class="splitter-label">{{ item.label }}</span>
              <div class="value-wrap">
                <input v-model="splitterState[item.key]" class="value-input" type="text" />
                <span class="unit-text">dB</span>
              </div>
            </label>
          </section>
        </SmartOtdrSettingLayout>
      </template>

      <template #footer>
        <div class="dialog-actions">
          <button class="dialog-btn secondary" type="button" @click="closeSettingsDialog">
            取消
          </button>
          <button class="dialog-btn primary" type="button" @click="saveSettingsAndClose">
            保存
          </button>
        </div>
      </template>
    </SmartOtdrDialogShell>
  </div>
</template>

<script setup lang="ts">
import SmartMeasurementTabs from '../components/SmartMeasurementTabs.vue'
import { readOtdrResult, type OtdrSnapshot } from '@/services/otdrResults'
import { scopedKey } from '@/services/scopedStorage'
import SmartOtdrQuickPanel from '../components/SmartOtdrQuickPanel.vue'
import OtdrEventSymbol from '../components/OtdrEventSymbol.vue'
import SmartOtdrSettingLayout from '../components/SmartOtdrSettingLayout.vue'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SmartOtdrDialogShell from '../components/SmartOtdrDialogShell.vue'
import SmartOtdrPageShell from '../components/SmartOtdrPageShell.vue'

type SettingsTab = 'parameter' | 'threshold'
type ParameterKey = 'wavelength' | 'range' | 'pulse'

type ThresholdState = {
  reflectEventEnabled: boolean
  reflectEvent: string
  nonReflectEventEnabled: boolean
  nonReflectEvent: string
  totalLossEnabled: boolean
  totalLoss: string
  avgLoss1310Enabled: boolean
  avgLoss1310: string
  avgLoss1550Enabled: boolean
  avgLoss1550: string
}

type SplitterState = {
  min1x2: string
  max1x2: string
  min1x4: string
  max1x4: string
  min1x8: string
  max1x8: string
  min1x16: string
}

type EventNode = {
  id: string
  label: string
  distance: string
  position: number
  level: number
  type: 'start' | 'event' | 'end'
}

type EventSummaryMetrics = {
  linkLength: string
  linkLoss: string
  avgLoss: string
  returnLoss: string
  eventCount: string
}

type EventRow = {
  id: number
  type: string
  distance: string
  section: string
  loss: string
  totalLoss: string
  slope: string
  reflect: string
}

type EventMapResult = {
  filename: string
  totalDistance: string
  summaryMetrics: EventSummaryMetrics
  nodes: EventNode[]
  events: EventRow[]
}

type EventMapStorageKey = 'internal' | 'sd' | 'usb'

type EventMapFileNode = {
  id: string
  name: string
  type: 'folder' | 'file'
  kind?: 'sor' | 'event-map' | 'loss-test' | 'other'
  updatedAt: string
  parentId: string | null
  storage: EventMapStorageKey
  payload?: EventMapResult
}

type EventMapFileManagerState = {
  nodes?: EventMapFileNode[]
  activeStorage?: EventMapStorageKey
  activeFolderId?: string
  selectedNodeId?: string
  savedFileSettings?: { storagePath?: EventMapStorageKey }
  [key: string]: unknown
}

type LoadedEventMapFile = {
  fileId: string
  name: string
  kind: 'sor' | 'event-map'
  updatedAt: string
  storage: EventMapStorageKey
  payload?: EventMapResult
}

type ThresholdEnabledKey =
  | 'reflectEventEnabled'
  | 'nonReflectEventEnabled'
  | 'totalLossEnabled'
  | 'avgLoss1310Enabled'
  | 'avgLoss1550Enabled'

type ThresholdValueKey =
  | 'reflectEvent'
  | 'nonReflectEvent'
  | 'totalLoss'
  | 'avgLoss1310'
  | 'avgLoss1550'

type ThresholdRow = {
  key: string
  label: string
  enabledKey: ThresholdEnabledKey
  valueKey: ThresholdValueKey
}

type SplitterRow = {
  key: keyof SplitterState
  label: string
}

const router = useRouter()
const route = useRoute()
const deviceId = String(route.params.id || '')
const SMART_OTDR_LOADED_FILE_KEY = scopedKey('otdr-loaded-file', deviceId)
const FILE_MANAGER_STATE_KEY = scopedKey('otdr-files', deviceId)
const { t } = useI18n()




const settingsTab = ref<SettingsTab>('parameter')
const isSettingsDialogVisible = ref(false)
const isRunning = ref(false)
const lastSavedAt = ref('')
const sourceMeasurementId = ref('')
const resultTimestamp = ref(0)
const saveFeedback = ref('')
const selectedNodeId = ref('start')

const wavelengthOptions = ['1310nm', '1550nm', '1310/1550']
const rangeOptions = ['100m', '500m', '1km', '2km', '5km', '10km', '20km']
const pulseOptions = ['5ns', '10ns', '20ns', '50ns', '100ns', '275ns', '500ns']
const roundTo = (value: number, digits: number) => Number(value.toFixed(digits))
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const parseDistanceLabelToKm = (label: string) => {
  const normalized = label.trim().toLowerCase()

  if (normalized.endsWith('km')) return Number.parseFloat(normalized.replace('km', '')) || 1
  if (normalized.endsWith('m')) return (Number.parseFloat(normalized.replace('m', '')) || 1000) / 1000

  return Number.parseFloat(normalized) || 1
}

const formatDistanceWithUnit = (km: number) => `${km >= 1 ? km.toFixed(2) : km.toFixed(3)}km`
const formatDistanceValue = (km: number) => km.toFixed(3)
const formatDbValue = (value: number, digits = 2) => value.toFixed(digits)
const formatReflectValue = (value: number) => value.toFixed(1)

const createSummaryMetrics = (linkLengthKm: number, linkLoss: number, returnLoss: number, eventCount: number): EventSummaryMetrics => {
  const avgLoss = linkLengthKm > 0 ? linkLoss / linkLengthKm : 0

  return {
    linkLength: formatDistanceWithUnit(linkLengthKm),
    linkLoss: `${formatDbValue(linkLoss)}dB`,
    avgLoss: `${formatDbValue(avgLoss)}dB/km`,
    returnLoss: `${formatReflectValue(returnLoss)}dB`,
    eventCount: String(eventCount)
  }
}

const createEventNodes = (events: EventRow[], linkLengthKm: number): EventNode[] => {
  const nodes: EventNode[] = [
    { id: 'start', label: 'START', distance: '0.000km', position: 3, level: 18, type: 'start' }
  ]

  events.forEach((event, index) => {
    const distanceKm = Number.parseFloat(event.distance) || 0
    const ratio = linkLengthKm > 0 ? clamp(distanceKm / linkLengthKm, 0, 1) : 0
    const levelBase = 24 + ratio * 34 + (index % 2 === 0 ? -4 : 5)
    const isLast = index === events.length - 1

    nodes.push({
      id: `event-${event.id}`,
      label: isLast ? 'END' : String(event.id),
      distance: `${event.distance}km`,
      position: clamp(roundTo(6 + ratio * 88, 2), 6, 94),
      level: clamp(roundTo(levelBase + (isLast ? 10 : 0), 2), 16, 78),
      type: isLast ? 'end' : 'event'
    })
  })

  return nodes
}

const createMockEvents = (rangeLabel = '1km'): EventRow[] => {
  const rangeKm = parseDistanceLabelToKm(rangeLabel)
  const linkLengthKm = roundTo(clamp(rangeKm * 0.63, 0.08, rangeKm), 3)
  const eventRatios = [0.23, 0.49, 0.76, 1]
  const eventTypes = ['连接器', '熔接点', '微弯', '末端']
  const eventLosses = [0.08, 0.12, 0.05, 0.18]
  const eventSlopes = [0.17, 0.19, 0.14, 0.21]
  const eventReflects = [-46.8, -52.1, -49.6, -43.2]
  const events: EventRow[] = []
  let previousDistance = 0
  let cumulativeLoss = 0

  eventRatios.forEach((ratio, index) => {
    const rawDistance = index === eventRatios.length - 1 ? linkLengthKm : roundTo(ratio * linkLengthKm, 3)
    const distanceKm = Math.max(rawDistance, previousDistance + Math.min(0.03, linkLengthKm * 0.08))
    const sectionKm = roundTo(distanceKm - previousDistance, 3)
    const type = eventTypes[index]
    const loss = eventLosses[index]
    cumulativeLoss = roundTo(cumulativeLoss + loss, 2)

    events.push({
      id: index + 1,
      type,
      distance: formatDistanceValue(distanceKm),
      section: formatDistanceValue(sectionKm),
      loss: formatDbValue(loss),
      totalLoss: formatDbValue(cumulativeLoss),
      slope: formatDbValue(eventSlopes[index]),
      reflect: formatReflectValue(eventReflects[index])
    })

    previousDistance = distanceKm
  })

  return events
}

const createEventMapResult = (rangeLabel = '1km', filename = '20260101-01.sor'): EventMapResult => {
  const events = createMockEvents(rangeLabel)
  const linkLengthKm = Number.parseFloat(events[events.length - 1]?.distance || '1') || 1
  const returnLoss = Number.parseFloat(events[events.length - 1]?.reflect || '-42.5') || -42.5

  return {
    filename,
    totalDistance: formatDistanceWithUnit(linkLengthKm),
    summaryMetrics: createSummaryMetrics(
      linkLengthKm,
      Number.parseFloat(events[events.length - 1]?.totalLoss || '0.72') || 0.72,
      returnLoss,
      events.length
    ),
    nodes: createEventNodes(events, linkLengthKm),
    events
  }
}

const createDefaultEventMapResult = (): EventMapResult => ({ filename: '暂无测量结果', totalDistance: '--', summaryMetrics: {linkLength:'--',linkLoss:'--',avgLoss:'--',returnLoss:'--',eventCount:'0'}, nodes: [], events: [] })

const parameterState = reactive({
  wavelength: '1550nm',
  range: '100m',
  pulse: '10ns'
})

const thresholdState = reactive<ThresholdState>({
  reflectEventEnabled: true,
  reflectEvent: '0.20',
  nonReflectEventEnabled: true,
  nonReflectEvent: '0.20',
  totalLossEnabled: true,
  totalLoss: '0.20',
  avgLoss1310Enabled: true,
  avgLoss1310: '0.20',
  avgLoss1550Enabled: true,
  avgLoss1550: '0.20'
})

const splitterState = reactive<SplitterState>({
  min1x2: '3.40',
  max1x2: '4.20',
  min1x4: '6.80',
  max1x4: '7.80',
  min1x8: '10.20',
  max1x8: '11.20',
  min1x16: '13.60'
})

const eventMapResult = ref<EventMapResult>(createDefaultEventMapResult())

const topologyScroll = ref<HTMLElement | null>(null)
const selectedNodeIndex = computed(() => Math.max(0, eventMapResult.value.nodes.findIndex(node => node.id === selectedNodeId.value)))
const selectAdjacentNode = (direction: number) => {
  const next = eventMapResult.value.nodes[selectedNodeIndex.value + direction]
  if (next) selectedNodeId.value = next.id
}

// Overview and data selections also bring the matching horizontal node into view.
watch(selectedNodeId, async () => {
  await nextTick()
  const viewport = topologyScroll.value
  const node = viewport?.querySelector<HTMLElement>('.topology-node.active')
  if (!viewport || !node) return
  const bounds = node.getBoundingClientRect()
  const frame = viewport.getBoundingClientRect()
  viewport.scrollTo({ left: viewport.scrollLeft + bounds.left - frame.left - (frame.width - bounds.width) / 2, behavior: 'auto' })
})

const getNodeEvent = (node: EventNode) => {
  if (node.type === 'start') return null
  const eventId = Number.parseInt(node.id.replace('event-', ''), 10)
  return eventMapResult.value.events.find(item => item.id === eventId) || null
}

const getNodeTitle = (node: EventNode) => {
  if (node.type === 'start') return '链路起点'
  return getNodeEvent(node)?.type || (node.type === 'end' ? '链路末端' : '链路事件')
}

const getNodeTone = (node: EventNode) => {
  const type = getNodeTitle(node)
  if (node.type === 'end') return 'warning'
  if (type.includes('微弯') || type.includes('弯折')) return 'danger'
  if (type.includes('熔接')) return 'splice'
  return 'normal'
}

const selectedNode = computed(() => eventMapResult.value.nodes.find(node => node.id === selectedNodeId.value) || eventMapResult.value.nodes[0])
const selectedNodeTitle = computed(() => selectedNode.value ? getNodeTitle(selectedNode.value) : '--')
const selectedNodeDistance = computed(() => selectedNode.value?.distance || '--')

const thresholdRows: ThresholdRow[] = [
  { key: 'reflectEvent', label: '反射事件', enabledKey: 'reflectEventEnabled', valueKey: 'reflectEvent' },
  { key: 'nonReflectEvent', label: '非反射事件', enabledKey: 'nonReflectEventEnabled', valueKey: 'nonReflectEvent' },
  { key: 'totalLoss', label: '总损耗', enabledKey: 'totalLossEnabled', valueKey: 'totalLoss' },
  { key: 'avgLoss1310', label: '平均损耗 1310', enabledKey: 'avgLoss1310Enabled', valueKey: 'avgLoss1310' },
  { key: 'avgLoss1550', label: '平均损耗 1550', enabledKey: 'avgLoss1550Enabled', valueKey: 'avgLoss1550' }
] 

const splitterRows: SplitterRow[] = [
  { key: 'min1x2', label: '1/2 最小' },
  { key: 'max1x2', label: '1/2 最大' },
  { key: 'min1x4', label: '1/4 最小' },
  { key: 'max1x4', label: '1/4 最大' },
  { key: 'min1x8', label: '1/8 最小' },
  { key: 'max1x8', label: '1/8 最大' },
  { key: 'min1x16', label: '1/16 最小' }
] 

const parameterGroups = computed(() => [
  { key: 'wavelength' as ParameterKey, label: '波长', value: parameterState.wavelength, options: wavelengthOptions },
  { key: 'range' as ParameterKey, label: '测量范围', value: parameterState.range, options: rangeOptions },
  { key: 'pulse' as ParameterKey, label: '测量脉宽', value: parameterState.pulse, options: pulseOptions }
])

const storageKey = computed(() => scopedKey('otdr-event-map', String(route.params.id)))

const normalizeMetricValue = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.replace(/dB\/km|dB|km/g, '').trim()
  return normalized || fallback
}

const normalizeEventRow = (item: Record<string, unknown>, index: number): EventRow => {
  const distance = normalizeMetricValue(item.distance, '0.000')
  const legacyLoss = normalizeMetricValue(item.avgLoss, '0.00')

  return {
    id: typeof item.id === 'number' ? item.id : index + 1,
    type: typeof item.type === 'string' ? item.type : '事件',
    distance,
    section: normalizeMetricValue(item.section, distance),
    loss: normalizeMetricValue(item.loss, legacyLoss),
    totalLoss: normalizeMetricValue(item.totalLoss, legacyLoss),
    slope: normalizeMetricValue(item.slope, '0.00'),
    reflect: normalizeMetricValue(item.reflect, '--')
  }
}

const normalizeEventNode = (item: Record<string, unknown>, index: number, fallbackPosition: number, fallbackLevel: number): EventNode => ({
  id: typeof item.id === 'string' ? item.id : `legacy-${index}`,
  label: typeof item.label === 'string' ? item.label : String(index),
  distance: typeof item.distance === 'string' ? item.distance : '0.000km',
  position: typeof item.position === 'number' ? item.position : fallbackPosition,
  level: typeof item.level === 'number' ? item.level : fallbackLevel,
  type: item.type === 'start' || item.type === 'end' ? item.type : 'event'
})

const normalizeEventMapResult = (result: Partial<EventMapResult>) => {
  const fallback = createDefaultEventMapResult()
  const normalizedEvents = Array.isArray(result.events) && result.events.length
    ? result.events.map((item, index) => normalizeEventRow(item as Record<string, unknown>, index))
    : fallback.events
  const summarySource: Partial<EventSummaryMetrics> = result.summaryMetrics ?? {}
  const normalizedLinkLengthKm = Number.parseFloat(normalizedEvents[normalizedEvents.length - 1]?.distance || '1') || 1
  const normalizedNodes = Array.isArray(result.nodes) && result.nodes.length
    ? result.nodes.map((item, index) => normalizeEventNode(item as Record<string, unknown>, index, 6 + index * 18, 20 + index * 8))
    : createEventNodes(normalizedEvents, normalizedLinkLengthKm)

  return {
    filename: result.filename || fallback.filename,
    totalDistance: result.totalDistance || formatDistanceWithUnit(normalizedLinkLengthKm),
    summaryMetrics: {
      linkLength: summarySource.linkLength || formatDistanceWithUnit(normalizedLinkLengthKm),
      linkLoss: summarySource.linkLoss || `${normalizedEvents[normalizedEvents.length - 1]?.totalLoss || '0.72'}dB`,
      avgLoss: summarySource.avgLoss || fallback.summaryMetrics.avgLoss,
      returnLoss: summarySource.returnLoss || `${normalizedEvents[normalizedEvents.length - 1]?.reflect || '-42.5'}dB`,
      eventCount: summarySource.eventCount || String(normalizedEvents.length)
    },
    nodes: normalizedNodes,
    events: normalizedEvents
  }
}

const loadSavedState = () => {
  const raw = localStorage.getItem(storageKey.value)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw) as {
      parameterState?: typeof parameterState
      thresholdState?: ThresholdState
      splitterState?: SplitterState
      eventMapResult?: EventMapResult
      lastSavedAt?: string
      sourceMeasurementId?: string
      resultTimestamp?: number
    }

    if (parsed.parameterState) Object.assign(parameterState, parsed.parameterState)
    if (parsed.thresholdState) Object.assign(thresholdState, parsed.thresholdState)
    if (parsed.splitterState) Object.assign(splitterState, parsed.splitterState)
    if (parsed.eventMapResult) eventMapResult.value = normalizeEventMapResult(parsed.eventMapResult)
    sourceMeasurementId.value = parsed.sourceMeasurementId || ''
    resultTimestamp.value = parsed.resultTimestamp || 0
    if (parsed.lastSavedAt) lastSavedAt.value = parsed.lastSavedAt
  } catch {
    // Ignore invalid session storage payload and keep defaults.
  }
}

const goBack = () => {
  router.push(`/device/${deviceId}`)
}

const goToFiles = () => {
  router.push(`/device/${route.params.id}/files`)
}

const openSettingsDialog = (tab: SettingsTab = 'parameter') => {
  if (isRunning.value) return
  settingsTab.value = tab
  isSettingsDialogVisible.value = true
}

const closeSettingsDialog = () => {
  isSettingsDialogVisible.value = false
}

const saveSettingsAndClose = () => {
  persistEventMapState()
  isSettingsDialogVisible.value = false
  saveFeedback.value = '设置已保存'
}

const updateParameterOption = (key: ParameterKey, value: string) => {
  if (key === 'wavelength') parameterState.wavelength = value
  if (key === 'range') parameterState.range = value
  if (key === 'pulse') parameterState.pulse = value
}

const buildMockResult = () => {
  const filenameSuffix = parameterState.wavelength.replace('/', '-')
  return createEventMapResult(parameterState.range, `EVENT_MAP_${filenameSuffix}_${Date.now()}.json`)
}

const runEventMapTest = async () => {
  if (isRunning.value) return
  isRunning.value = true
  saveFeedback.value = ''
  await new Promise(resolve => setTimeout(resolve, 900))
  eventMapResult.value = buildMockResult()
  selectedNodeId.value = 'start'
  isRunning.value = false
  sourceMeasurementId.value = ''
  resultTimestamp.value = Date.now()
  persistEventMapState()
}

const persistEventMapState = () => {
  lastSavedAt.value = new Date().toLocaleString()
  localStorage.setItem(storageKey.value, JSON.stringify({
    parameterState: { ...parameterState },
    thresholdState: { ...thresholdState },
    splitterState: { ...splitterState },
    eventMapResult: eventMapResult.value,
    lastSavedAt: lastSavedAt.value,
    sourceMeasurementId: sourceMeasurementId.value,
    resultTimestamp: resultTimestamp.value
  }))
}

const readFileManagerState = (): EventMapFileManagerState => {
  const raw = localStorage.getItem(FILE_MANAGER_STATE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as EventMapFileManagerState
  } catch {
    return {}
  }
}

const saveResultToFileManager = () => {
  const managerState = readFileManagerState()
  const storage = managerState.savedFileSettings?.storagePath || 'internal'
  const nodes = Array.isArray(managerState.nodes) ? managerState.nodes : []
  const rootId = `${storage}-root`
  const preferredFolderId = storage === 'internal' && nodes.some(node => node.id === 'internal-event')
    ? 'internal-event'
    : rootId
  const existingIndex = nodes.findIndex(node => node.type === 'file' && node.name === eventMapResult.value.filename && node.storage === storage)
  const nextFile: EventMapFileNode = {
    id: existingIndex >= 0 ? nodes[existingIndex].id : `event-map-${Date.now()}`,
    name: eventMapResult.value.filename,
    type: 'file',
    kind: 'event-map',
    updatedAt: lastSavedAt.value,
    parentId: preferredFolderId,
    storage,
    payload: eventMapResult.value
  }

  if (!nodes.some(node => node.id === rootId)) {
    nodes.push({ id: rootId, name: storage === 'internal' ? 'Disk' : storage === 'sd' ? 'SD卡' : 'U盘', type: 'folder', updatedAt: lastSavedAt.value, parentId: null, storage })
  }
  if (storage === 'internal' && !nodes.some(node => node.id === 'internal-event')) {
    nodes.push({ id: 'internal-event', name: '事件地图', type: 'folder', updatedAt: lastSavedAt.value, parentId: rootId, storage })
  }

  if (existingIndex >= 0) nodes.splice(existingIndex, 1, nextFile)
  else nodes.unshift(nextFile)

  localStorage.setItem(FILE_MANAGER_STATE_KEY, JSON.stringify({
    ...managerState,
    nodes,
    activeStorage: storage,
    activeFolderId: preferredFolderId,
    selectedNodeId: nextFile.id
  }))
}

const saveEventMapResult = () => {
  if (!eventMapResult.value.events.length) { saveFeedback.value = '请先完成测试'; return }
  try { persistEventMapState(); saveResultToFileManager() }
  catch { saveFeedback.value = '保存失败，请检查存储空间后重试'; return }
  saveFeedback.value = t('deviceDetail.eventMapSaveSuccess')
}

const loadSelectedEventMapFile = () => {
  const raw = localStorage.getItem(SMART_OTDR_LOADED_FILE_KEY)
  if (!raw) return
  try {
    const loadedFile = JSON.parse(raw) as LoadedEventMapFile
    if (loadedFile.kind !== 'event-map') return
    eventMapResult.value = loadedFile.payload
      ? normalizeEventMapResult(loadedFile.payload)
      : createEventMapResult(parameterState.range, loadedFile.name)
    eventMapResult.value.filename = loadedFile.name
    selectedNodeId.value = 'start'
    resultTimestamp.value = Date.now()
    sourceMeasurementId.value = ''
    persistEventMapState()
    localStorage.removeItem(SMART_OTDR_LOADED_FILE_KEY)
  } catch {
    // Keep the current result when the selected file payload is invalid.
  }
}

const applyMeasurement = (snapshot: OtdrSnapshot) => {
 let previous = 0
 const events: EventRow[] = snapshot.result.events.map(event => {
  const distance = Number.parseFloat(event.distance) || 0
  const section = Math.max(0, distance - previous); previous = distance
  const loss = Number.parseFloat(event.loss) || 0
  return { id: event.id, type: event.type, distance: distance.toFixed(3), section: section.toFixed(3), loss: loss.toFixed(2), totalLoss: Number.parseFloat(event.totalLoss).toFixed(2), slope: section ? (loss / section).toFixed(2) : '--', reflect: Number.parseFloat(event.reflect).toFixed(1) }
 })
 const distance = Number.parseFloat(events[events.length - 1]?.distance || '0')
 eventMapResult.value = { filename: snapshot.filename, totalDistance: formatDistanceWithUnit(distance), events, nodes: createEventNodes(events, distance),
  summaryMetrics: { linkLength: formatDistanceWithUnit(distance), linkLoss: snapshot.result.summary.totalLoss, avgLoss: snapshot.result.summary.averageLoss, returnLoss: snapshot.result.summary.maxReflectance, eventCount: String(events.length) } }
 Object.assign(parameterState, { wavelength: snapshot.parameters.wavelength, range: snapshot.parameters.range, pulse: snapshot.parameters.pulseWidth })
 sourceMeasurementId.value = snapshot.id
 resultTimestamp.value = Date.now()
 selectedNodeId.value = 'start'
 persistEventMapState()
}

onMounted(() => {
  loadSavedState()
  const snapshot = readOtdrResult(deviceId)
  if (snapshot && sourceMeasurementId.value !== snapshot.id && (snapshot.selectedAt >= resultTimestamp.value || !eventMapResult.value.events.length)) applyMeasurement(snapshot)
  loadSelectedEventMapFile()
})
</script>

<style scoped lang="scss">
@use '../components/smartOtdrChoices.scss';
@use '../components/smartOtdrPortrait.scss';
@use '../components/smartOtdrResultTable.scss';
.event-empty { padding:32px 16px;text-align:center;color:#64748b;background:white;border-radius:12px;font-size:14px; }
.event-map-workbench { display:flex;flex-direction:column;gap:12px;min-width:0; }.portrait-file { margin:0; }.event-control-rail { padding:12px;border:1px solid #dfe6ee;background:white;border-radius:10px; }.rail-section-title { font-size:13px;font-weight:700;color:#26384e;margin-bottom:10px; }
.event-metric-grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px; }.event-metric-item { display:flex;flex-direction:column;gap:4px;min-width:0; }.event-metric-item span,.event-summary-card span { color:#6c7b8e;font-size:12px; }.event-metric-item strong { color:#233b5a;font-size:12px;overflow-wrap:anywhere; }.event-metric-item.wide { grid-column:span 2; }
.event-summary-grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #edf1f5; }.event-summary-card { display:flex;flex-direction:column;gap:4px;min-width:0; }.event-summary-card strong { color:#1d4ed8;font-size:13px;overflow-wrap:anywhere; }
.event-map-card { min-width:0;padding:12px;border:1px solid #dfe6ee;border-radius:12px;background:white; }.card-head { display:flex;justify-content:space-between;gap:8px;align-items:center; }.card-title { font-size:13px;font-weight:700;color:#26384e; }.card-meta { display:none; }.link-overview { position:relative;height:44px;margin:8px 18px; }.link-overview__track { position:absolute;left:0;right:0;top:18px;height:3px;border-radius:4px;background:#d5dfec; }.link-overview__marker { position:absolute;top:0;transform:translateX(-50%);width:44px;height:44px;padding:0;border:0;background:transparent; }.link-overview__marker::after { content:'';display:block;width:7px;height:15px;margin:auto;border-radius:2px;background:#22a77a; }.link-overview__marker.active::after { background:#2563eb;box-shadow:0 0 0 4px #2563eb18; }.link-overview__marker.end::after { background:#e8a524; }.link-overview__window { display:none; }
/* Match the hardware's left-to-right link: distance, symbol, then index. */
.topology-navigation { display:flex;align-items:center;gap:4px;flex-shrink:0; }
.topology-navigation button { display:grid;place-items:center;width:44px;height:44px;padding:0;border:1px solid #d8e2ee;border-radius:6px;background:#f8fafc;color:#37516e;font-size:23px;cursor:pointer; }
.topology-navigation span { min-width:34px;text-align:center;font-size:12px;color:#718095;font-variant-numeric:tabular-nums; }
.topology-scroll { overflow-x:auto;overflow-y:hidden;max-width:100%;padding-bottom:6px;overscroll-behavior-x:contain;scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:#bdcce0 #f3f6fa; }
.topology-chain { position:relative;display:flex;flex-direction:row;align-items:flex-start;justify-content:space-between;gap:12px;width:max-content;min-width:100%; }
.topology-chain__line { position:absolute;left:34px;right:34px;top:56px;height:3px;background:#b8cce6; }
.topology-node { position:relative;display:grid;grid-template-columns:1fr;grid-template-rows:18px 48px 18px minmax(18px,auto);justify-items:center;align-items:center;gap:6px;flex:0 0 68px;width:68px;min-height:0;padding:8px 2px;border:1px solid transparent;border-radius:9px;background:transparent;text-align:center;cursor:pointer;scroll-snap-align:center; }
.topology-node.active { border-color:#91b4f8;background:#f2f6ff; }
.topology-node__distance { grid-row:1;font-size:12px;line-height:18px;color:#425b77;white-space:nowrap; }
.topology-node__card { grid-row:2;display:grid;place-items:center;width:48px;height:48px;border:1px solid #c9d8eb;border-radius:8px;background:#fff;z-index:1; }
.topology-node__card :deep(svg) { width:38px;height:38px; }
.topology-node__index { grid-row:3;position:static;min-width:18px;padding:1px 4px;border-radius:4px;background:#536c89;color:white;font-size:12px;line-height:16px; }
.topology-node__type { grid-row:4;font-size:12px;line-height:18px;font-weight:650;color:#263c58;overflow-wrap:anywhere; }
.topology-node.danger .topology-node__card { border-color:#ef7777; }.topology-node.danger .topology-node__type { color:#b42318; }
.topology-selection { display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid #e7edf4;font-size:11px;color:#718095; }
.topology-selection strong { color:#1d4ed8; }.topology-selection__distance { margin-left:auto; }.topology-selection__reading { flex-basis:100%;font-size:12px;line-height:1.5; }
.result-list-head { display:flex;justify-content:space-between;margin-bottom:10px; }.result-list-title { color:#26384e;font-size:13px;font-weight:700; }.result-list-mode { font-size:11px;color:#718095; }.event-table-card { min-width:0; }.rail-save-state { display:flex;justify-content:space-between;gap:8px;color:#718095;font-size:12px;margin-top:5px; }.rail-save-state strong { color:#15803d; }
.modal-head { display:none; }.settings-group-title { font-size:14px;font-weight:650;margin-bottom:10px;color:#233a56; }.settings-option-grid { display:grid;gap:8px; }.settings-option-btn { min-height:42px;border:1px solid #d8e2ee;border-radius:8px;background:white;color:#37516e; }.settings-option-btn.active { color:#1d4ed8;border-color:#2563eb;background:#eff6ff; }.settings-form-row { display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid #edf1f5;font-size:12px;flex-wrap:wrap; }.checkbox-wrap,.value-wrap { display:flex;align-items:center;gap:6px; }.value-input { width:65px;min-height:34px;border:1px solid #ccd8e6;border-radius:6px;padding:4px 6px; }.unit-text { color:#718095;font-size:11px; }
</style>
