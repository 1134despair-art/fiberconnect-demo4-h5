<template>
  <div class="app-container otdr-app-page smart-otdr-landscape-page">
    <div class="content-flex hide-scrollbar">
      <SmartOtdrPageShell title="事件地图" :max-width="812" :show-quick-panel="true" @back="goBack">
        <template #actions>
          <div class="landscape-file-pill" :title="eventMapResult.filename">{{ eventMapResult.filename }}</div>
          <div class="landscape-status" :class="{ running: isRunning }">
            <span class="landscape-status__dot"></span>
            {{ isRunning ? t('deviceDetail.eventMapRunning') : t('deviceDetail.eventMapIdle') }}
          </div>
        </template>

        <main class="event-map-workbench">
          <section class="event-map-card">
            <div class="card-head">
              <div class="card-title">链路事件视图</div>
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
                  @click="selectedNodeId = node.id"
                ></button>
                <span class="link-overview__window"></span>
              </div>

              <div class="topology-scroll">
                <div class="topology-chain" :style="{ minWidth: topologyMinWidth }">
                  <div class="topology-chain__line"></div>
                  <button
                  v-for="node in eventMapResult.nodes"
                    :key="`${node.id}-topology`"
                    class="topology-node"
                    :class="[node.type, getNodeTone(node), { active: selectedNodeId === node.id }]"
                    type="button"
                    @click="selectedNodeId = node.id"
                  >
                    <span class="topology-node__distance">{{ node.distance }}</span>
                    <span class="topology-node__card">
                      <span class="topology-node__glyph" aria-hidden="true">
                        <span></span>
                      </span>
                    </span>
                    <span class="topology-node__index">{{ node.label }}</span>
                    <span class="topology-node__type">{{ getNodeTitle(node) }}</span>
                  </button>
                </div>
              </div>

              <div class="topology-selection">
                <span>当前事件</span>
                <strong>{{ selectedNodeTitle }}</strong>
                <span>{{ selectedNodeDistance }}</span>
              </div>
            </div>
          </section>

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

            <button class="action-primary" type="button" :disabled="isRunning" @click="runEventMapTest">
              {{ isRunning ? '分析中' : t('deviceDetail.eventMapRun') }}
            </button>
            <div class="rail-action-grid">
              <button class="action-secondary" type="button" @click="saveEventMapResult">{{ t('deviceDetail.eventMapSave') }}</button>
              <button class="action-secondary" type="button" :disabled="isRunning" @click="openSettingsDialog('parameter')">{{ t('deviceDetail.eventMapSettings') }}</button>
              <button class="action-secondary" type="button" @click="goToOtdr">返回OTDR</button>
              <button class="action-secondary" type="button" @click="goToFiles">文件</button>
            </div>
            <div class="rail-save-state">
              <span>{{ t('deviceDetail.eventMapSavedAt') }} {{ lastSavedAt || '--' }}</span>
              <strong v-if="saveFeedback">{{ saveFeedback }}</strong>
            </div>
          </aside>

          <section class="event-table-card">
            <div class="result-list-head">
              <div class="result-list-title">{{ t('deviceDetail.eventMapTable') }}</div>
              <div class="result-list-mode">{{ eventMapResult.summaryMetrics.eventCount }} 个事件</div>
            </div>
            <div class="event-table full-table">
              <div class="table-row table-head full">
                <span>序号</span>
                <span>类型</span>
                <span>{{ t('deviceDetail.eventMapDistanceKm') }}</span>
                <span>{{ t('deviceDetail.eventMapSectionKm') }}</span>
                <span>{{ t('deviceDetail.eventMapLossDb') }}</span>
                <span>{{ t('deviceDetail.eventMapTotalLossDb') }}</span>
                <span>{{ t('deviceDetail.eventMapSlopeDbPerKm') }}</span>
                <span>{{ t('deviceDetail.eventMapReflectDb') }}</span>
              </div>
              <div v-for="item in eventMapResult.events" :key="item.id" class="table-row full">
                <span>{{ item.id }}</span>
                <span>{{ item.type }}</span>
                <span>{{ item.distance }}</span>
                <span>{{ item.section }}</span>
                <span>{{ item.loss }}</span>
                <span>{{ item.totalLoss }}</span>
                <span>{{ item.slope }}</span>
                <span>{{ item.reflect }}</span>
              </div>
            </div>
          </section>
        </main>
      </SmartOtdrPageShell>
    </div>

    <div v-if="!isLandscape && !landscapeHintDismissed" class="landscape-rotate-hint">
      <span class="landscape-rotate-icon" aria-hidden="true"></span>
      <strong>请横屏使用</strong>
      <span>横屏可完整查看链路、摘要与事件表</span>
      <button class="landscape-continue-btn" type="button" @click="landscapeHintDismissed = true">继续使用</button>
    </div>

    <SmartOtdrDialogShell
      v-if="isSettingsDialogVisible"
      title="设置"
      close-text="关闭"
      :max-width="720"
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

        <div v-if="settingsTab === 'parameter'" class="settings-panel">
          <section v-for="group in parameterGroups" :key="group.key" class="settings-group-card">
            <div class="settings-group-title">{{ group.label }}</div>
            <div class="settings-option-grid">
              <button
                v-for="option in group.options"
                :key="option"
                class="settings-option-btn"
                :class="{ active: group.value === option }"
                type="button"
                @click="updateParameterOption(group.key, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>
        </div>

        <div v-else class="settings-panel">
          <section class="settings-group-card">
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

          <section class="settings-group-card">
            <div class="settings-group-title">{{ t('deviceDetail.eventMapSplitter') }}</div>
            <label v-for="item in splitterRows" :key="item.key" class="settings-form-row">
              <span class="splitter-label">{{ item.label }}</span>
              <div class="value-wrap">
                <input v-model="splitterState[item.key]" class="value-input" type="text" />
                <span class="unit-text">dB</span>
              </div>
            </label>
          </section>
        </div>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SmartOtdrDialogShell from '../components/SmartOtdrDialogShell.vue'
import SmartOtdrPageShell from '../components/SmartOtdrPageShell.vue'
import { useLandscapeScreen } from '../components/useLandscapeScreen'

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
const { t } = useI18n()
const FILE_MANAGER_STATE_KEY = 'smart-otdr-file-manager-state'
const SMART_OTDR_LOADED_FILE_KEY = 'smart-otdr-loaded-file'

const { isLandscape } = useLandscapeScreen()
const landscapeHintDismissed = ref(false)

const settingsTab = ref<SettingsTab>('parameter')
const isSettingsDialogVisible = ref(false)
const isRunning = ref(false)
const lastSavedAt = ref('')
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

const createDefaultEventMapResult = (): EventMapResult => createEventMapResult('1km', 'EVENT_MAP_20260101_01.json')

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

const topologyMinWidth = computed(() => `${Math.max(520, eventMapResult.value.nodes.length * 104)}px`)

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

const storageKey = computed(() => `smart_otdr_event_map_v2_${route.params.id}`)

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
  const raw = sessionStorage.getItem(storageKey.value)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw) as {
      parameterState?: typeof parameterState
      thresholdState?: ThresholdState
      splitterState?: SplitterState
      eventMapResult?: EventMapResult
      lastSavedAt?: string
    }

    if (parsed.parameterState) Object.assign(parameterState, parsed.parameterState)
    if (parsed.thresholdState) Object.assign(thresholdState, parsed.thresholdState)
    if (parsed.splitterState) Object.assign(splitterState, parsed.splitterState)
    if (parsed.eventMapResult) eventMapResult.value = normalizeEventMapResult(parsed.eventMapResult)
    if (parsed.lastSavedAt) lastSavedAt.value = parsed.lastSavedAt
  } catch {
    // Ignore invalid session storage payload and keep defaults.
  }
}

const goBack = () => {
  router.push(`/device/${deviceId}`)
}

const goToOtdr = () => {
  router.push(`/device/${route.params.id}/smart-otdr`)
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
}

const persistEventMapState = () => {
  lastSavedAt.value = new Date().toLocaleString()
  sessionStorage.setItem(storageKey.value, JSON.stringify({
    parameterState: { ...parameterState },
    thresholdState: { ...thresholdState },
    splitterState: { ...splitterState },
    eventMapResult: eventMapResult.value,
    lastSavedAt: lastSavedAt.value
  }))
}

const readFileManagerState = (): EventMapFileManagerState => {
  const raw = sessionStorage.getItem(FILE_MANAGER_STATE_KEY)
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

  sessionStorage.setItem(FILE_MANAGER_STATE_KEY, JSON.stringify({
    ...managerState,
    nodes,
    activeStorage: storage,
    activeFolderId: preferredFolderId,
    selectedNodeId: nextFile.id
  }))
}

const saveEventMapResult = () => {
  persistEventMapState()
  saveResultToFileManager()
  saveFeedback.value = t('deviceDetail.eventMapSaveSuccess')
}

const loadSelectedEventMapFile = () => {
  const raw = sessionStorage.getItem(SMART_OTDR_LOADED_FILE_KEY)
  if (!raw) return
  try {
    const loadedFile = JSON.parse(raw) as LoadedEventMapFile
    if (loadedFile.kind !== 'event-map') return
    eventMapResult.value = loadedFile.payload
      ? normalizeEventMapResult(loadedFile.payload)
      : createEventMapResult(parameterState.range, loadedFile.name)
    eventMapResult.value.filename = loadedFile.name
    selectedNodeId.value = 'start'
  } catch {
    // Keep the current result when the selected file payload is invalid.
  }
}

onMounted(() => {
  loadSavedState()
  loadSelectedEventMapFile()
})
</script>

<style scoped lang="scss">
@use '../components/smartOtdrUi.scss' as ui;

.otdr-app-page {
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

.otdr-app-page :deep(.smart-otdr-shell) {
  border-radius: 0;
  border: 0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: none;
  overflow: hidden;
}

.otdr-app-page :deep(.smart-otdr-shell__header) {
  padding: 14px 16px 10px;
}

.otdr-app-page :deep(.smart-otdr-shell__body) {
  padding: 8px 16px 110px;
}

.event-map-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.event-overview-card,
.event-map-card,
.event-table-card,
.event-action-card {
  @include ui.smart-otdr-app-surface;
  border-color: rgba(59, 130, 246, 0.10);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.event-overview-card {
  padding: 16px;
}

.event-overview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.loaded-file-pill {
  min-width: 0;
  width: fit-content;
  max-width: 100%;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  color: #2563eb;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.loaded-file-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb 0%, #60a5fa 100%);
  flex-shrink: 0;
}

.loaded-file-pill__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-overview-status {
  flex-shrink: 0;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.event-overview-status.running {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
}

.event-metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.event-metric-item,
.event-summary-card {
  @include ui.smart-otdr-soft-surface;
  padding: 12px 14px;
}

.event-metric-label,
.event-summary-label {
  font-size: 12px;
  color: #64748b;
}

.event-metric-value,
.event-summary-value {
  margin-top: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.event-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.event-map-card,
.event-table-card,
.event-action-card {
  padding: 12px;
}

.card-head,
.result-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 2px 4px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.card-title,
.result-list-title,
.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px 10px;
  font-size: 12px;
  color: #64748b;
}

.result-list-mode {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
}

.map-canvas {
  margin-top: 12px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #07162f 0%, #0b2144 100%);
  color: #dbeafe;
}

.trace-panel {
  position: relative;
  height: 248px;
  border-radius: 18px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.2), transparent 32%),
    linear-gradient(180deg, rgba(2, 6, 23, 0.34) 0%, rgba(15, 23, 42, 0.18) 100%);
  border: 1px solid rgba(147, 197, 253, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.trace-grid {
  position: absolute;
  inset: 16px 12px 40px;
  border-radius: 12px;
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.16) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
  background-size: 20% 100%, 100% 25%;
}

.trace-svg {
  position: absolute;
  inset: 16px 12px 40px;
  width: calc(100% - 24px);
  height: calc(100% - 56px);
}

.trace-shadow {
  fill: none;
  stroke: rgba(56, 189, 248, 0.28);
  stroke-width: 2.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trace-line {
  fill: none;
  stroke: #38bdf8;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.55));
}

.trace-drop {
  stroke: rgba(148, 163, 184, 0.34);
  stroke-width: 0.4;
  stroke-dasharray: 1.2 1.4;
}

.trace-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1;
}

.marker-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow:
    0 0 0 4px rgba(56, 189, 248, 0.18),
    0 0 12px rgba(56, 189, 248, 0.72);
}

.marker-badge {
  min-width: 44px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.28);
  color: #e0f2fe;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.trace-marker.start .marker-dot {
  background: #94a3b8;
  box-shadow:
    0 0 0 4px rgba(148, 163, 184, 0.16),
    0 0 8px rgba(148, 163, 184, 0.5);
}

.trace-marker.end .marker-dot {
  background: #f59e0b;
  box-shadow:
    0 0 0 4px rgba(245, 158, 11, 0.18),
    0 0 12px rgba(245, 158, 11, 0.6);
}

.trace-scale {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 8px;
  height: 28px;
}

.scale-item {
  position: absolute;
  bottom: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.scale-line {
  width: 1px;
  height: 8px;
  background: rgba(191, 219, 254, 0.5);
}

.scale-label {
  font-size: 10px;
  color: rgba(219, 234, 254, 0.82);
}

.trace-event-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.trace-event-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.38);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.trace-event-chip.start {
  border-color: rgba(148, 163, 184, 0.34);
}

.trace-event-chip.end {
  border-color: rgba(245, 158, 11, 0.35);
}

.chip-label {
  font-size: 11px;
  font-weight: 700;
  color: #f8fafc;
}

.chip-distance {
  font-size: 11px;
  color: rgba(219, 234, 254, 0.8);
}

.event-table {
  margin-top: 12px;
  border-radius: 16px;
  border: 1px solid #dbeafe;
  background: #ffffff;
}

.event-table.full-table {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.7) rgba(226, 232, 240, 0.7);
}

.event-table.full-table::-webkit-scrollbar {
  height: 6px;
}

.event-table.full-table::-webkit-scrollbar-track {
  background: rgba(226, 232, 240, 0.7);
  border-radius: 999px;
}

.event-table.full-table::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.8);
  border-radius: 999px;
}

.table-row {
  display: grid;
  grid-template-columns: 50px 1fr 88px 96px 56px;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  font-size: 12px;
  color: #334155;
}

.table-row + .table-row {
  border-top: 1px solid #f1f5f9;
}

.table-head {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #eef4ff;
  font-weight: 600;
  color: #64748b;
}

.table-row.full {
  min-width: 760px;
  grid-template-columns: 52px 88px repeat(6, minmax(84px, 1fr));
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.action-primary,
.action-secondary,
.dialog-btn,
.modal-tab,
.settings-option-btn {
  min-height: 48px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.dialog-btn {
  min-width: 88px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  flex: 0 0 auto;
}

.action-primary {
  grid-column: 1 / -1;
  @include ui.smart-otdr-primary-button;
}

.action-secondary,
.footer-file-btn,
.modal-tab,
.settings-option-btn,
.dialog-btn.secondary {
  @include ui.smart-otdr-secondary-button;
}

.dialog-btn.primary {
  @include ui.smart-otdr-primary-button;
}

.action-primary:disabled,
.action-secondary:disabled,
.dialog-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.footer-info {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  font-size: 12px;
  color: #64748b;
}

.footer-copy {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.save-feedback {
  color: #16a34a;
  font-weight: 700;
}

.footer-file-btn {
  flex-shrink: 0;
  min-width: 96px;
  min-height: 36px;
  padding: 0 16px;
  border-radius: 999px;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px 10px;
}

.modal-tab-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 12px 2px 16px;
}

.modal-tab {
  width: 100%;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  color: #64748b;
}

.modal-tab.active,
.settings-option-btn.active {
  @include ui.smart-otdr-primary-button;
  color: #ffffff;
}

.settings-panel {
  display: grid;
  gap: 12px;
}

.settings-group-card {
  @include ui.smart-otdr-setting-card;
  padding: 14px;
}

.settings-group-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
}

.settings-option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.settings-option-btn {
  min-height: 44px;
  border-radius: 16px;
}

.settings-form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
}

.settings-form-row + .settings-form-row {
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.checkbox-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.splitter-label {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.value-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-input {
  width: 86px;
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
}

.unit-text {
  font-size: 12px;
  color: #64748b;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
  padding-top: 4px;
}

@media (max-width: 768px) {
  .event-metric-grid,
  .event-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .trace-panel {
    height: 272px;
  }

  .trace-event-list {
    flex-direction: column;
  }

  .table-row.full {
    min-width: 720px;
  }

  .settings-form-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-info,
  .card-head,
  .result-list-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-meta {
    justify-content: flex-start;
  }
}

@media (max-width: 520px) {
  .content-flex {
    padding: 0 0 20px;
  }

  .otdr-app-page :deep(.smart-otdr-shell__header) {
    padding: 12px 14px 8px;
  }

  .otdr-app-page :deep(.smart-otdr-shell__body) {
    padding: 8px 14px 110px;
  }

  .event-overview-top {
    flex-direction: column;
    align-items: stretch;
  }

  .event-metric-grid,
  .event-summary-grid,
  .action-grid,
  .modal-tab-row,
  .settings-option-grid {
    grid-template-columns: 1fr;
  }

  .dialog-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
  }

  .dialog-btn {
    width: 100%;
    min-width: 0;
  }

  .action-primary {
    grid-column: auto;
  }

  .footer-file-btn {
    width: 100%;
  }

  .value-wrap {
    width: 100%;
  }

  .value-input {
    flex: 1;
    width: auto;
  }
}

/* Event map landscape workbench */
.app-container.smart-otdr-landscape-page {
  width: min(812px, calc(100vw - 40px));
  max-width: 812px;
  height: min(375px, calc(100dvh - 40px));
  max-height: 375px;
  min-height: 0;
  border-radius: 22px;
  background: #f4f7fb;
}

.smart-otdr-landscape-page .content-flex {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

.smart-otdr-landscape-page :deep(.smart-otdr-shell) {
  width: 100%;
  max-width: none;
  height: 100%;
  min-height: 0;
}

.smart-otdr-landscape-page :deep(.smart-otdr-shell__header) {
  min-height: 52px;
  padding: 4px 10px;
  border-bottom: 1px solid #d8e2ef;
  background: #ffffff;
  box-sizing: border-box;
}

.smart-otdr-landscape-page :deep(.smart-otdr-shell__title) {
  padding: 0 10px;
  font-size: 16px;
  text-align: left;
}

.smart-otdr-landscape-page :deep(.smart-otdr-shell__body) {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
}

.landscape-file-pill {
  max-width: 150px;
  overflow: hidden;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.landscape-status {
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid #d8e2ef;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.landscape-status__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #16a34a;
}

.landscape-status.running {
  border-color: rgba(37, 99, 235, 0.22);
  background: #eff6ff;
  color: #1d4ed8;
}

.landscape-status.running .landscape-status__dot {
  background: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.event-map-workbench {
  width: 100%;
  height: auto;
  min-width: 0;
  min-height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  grid-template-rows: 320px minmax(190px, auto);
  grid-template-areas:
    'map controls'
    'table table';
  align-content: start;
  gap: 12px 8px;
  padding-bottom: 4px;
}

.event-map-card {
  grid-area: map;
  min-width: 0;
  min-height: 0;
  padding: 6px;
  border: 1px solid #26364c;
  border-radius: 8px;
  background: #0b1423;
  box-shadow: none;
  overflow: hidden;
}

.event-map-card .card-head {
  min-height: 28px;
  padding: 0 4px 5px;
  border-color: #26364c;
  flex-direction: row;
  align-items: center;
}

.event-map-card .card-title {
  color: #e2e8f0;
  font-size: 11px;
}

.event-map-card .card-meta {
  gap: 4px 8px;
  color: #94a3b8;
  font-size: 9px;
}

.event-map-card .card-meta strong {
  color: #38bdf8;
}

.map-canvas {
  height: calc(100% - 28px);
  margin-top: 0;
  padding: 7px 8px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  background: #0b1423;
  box-sizing: border-box;
}

.link-overview {
  position: relative;
  flex: 0 0 34px;
  min-height: 34px;
  margin: 0 8px;
}

.link-overview__track {
  position: absolute;
  left: 0;
  right: 0;
  top: 15px;
  height: 7px;
  border-radius: 999px;
  background: #334155;
  box-shadow: inset 0 1px 2px rgba(2, 6, 23, 0.52);
}

.link-overview__marker {
  position: absolute;
  top: 11px;
  z-index: 2;
  width: 7px;
  height: 15px;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 2px;
  transform: translateX(-50%);
  background: #22c55e;
  cursor: pointer;
}

.link-overview__marker.start {
  background: #38bdf8;
}

.link-overview__marker.end,
.link-overview__marker.warning {
  background: #f59e0b;
}

.link-overview__marker.active {
  width: 10px;
  top: 8px;
  height: 21px;
  background: #f97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.18);
}

.link-overview__window {
  position: absolute;
  left: 10%;
  right: 10%;
  top: 6px;
  height: 25px;
  border: 1px solid rgba(56, 189, 248, 0.48);
  border-radius: 5px;
  pointer-events: none;
}

.topology-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: #475569 transparent;
}

.topology-scroll::-webkit-scrollbar {
  height: 4px;
}

.topology-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #475569;
}

.topology-chain {
  position: relative;
  height: 166px;
  padding: 0 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
  align-items: center;
  box-sizing: border-box;
}

.topology-chain__line {
  position: absolute;
  left: 54px;
  right: 54px;
  top: 94px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8 0%, #22c55e 78%, #f59e0b 100%);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.topology-node {
  position: relative;
  z-index: 1;
  min-width: 0;
  min-height: 142px;
  padding: 0 4px;
  border: 0;
  display: grid;
  grid-template-rows: 24px 58px 20px 20px;
  align-items: center;
  justify-items: center;
  background: transparent;
  color: #dbeafe;
  cursor: pointer;
}

.topology-node__distance {
  color: #bfdbfe;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.topology-node__card {
  width: 58px;
  height: 52px;
  border: 2px solid #22c55e;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  box-shadow: 0 5px 12px rgba(2, 6, 23, 0.24);
}

.topology-node__glyph {
  position: relative;
  width: 34px;
  height: 14px;
  border-radius: 3px;
  background: #3b82f6;
}

.topology-node__glyph::before,
.topology-node__glyph::after {
  content: '';
  position: absolute;
  top: 5px;
  width: 10px;
  height: 4px;
  background: #f59e0b;
}

.topology-node__glyph::before {
  right: 100%;
}

.topology-node__glyph::after {
  left: 100%;
}

.topology-node.splice .topology-node__glyph {
  width: 38px;
  height: 5px;
  border-radius: 999px;
}

.topology-node.splice .topology-node__glyph span {
  position: absolute;
  left: 15px;
  top: -8px;
  width: 8px;
  height: 20px;
  border-radius: 2px;
  background: #0ea5e9;
}

.topology-node.danger .topology-node__card {
  border-color: #ef4444;
}

.topology-node.danger .topology-node__glyph {
  width: 0;
  height: 0;
  border-top: 14px solid transparent;
  border-bottom: 14px solid transparent;
  border-left: 24px solid #38bdf8;
  border-radius: 2px;
  background: transparent;
}

.topology-node.end .topology-node__card {
  border-color: #f59e0b;
}

.topology-node.end .topology-node__glyph {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: #f59e0b;
}

.topology-node.start .topology-node__card {
  border-color: #cbd5e1;
}

.topology-node.start .topology-node__glyph {
  width: 34px;
  height: 18px;
  border-radius: 4px;
  background: #94a3b8;
}

.topology-node.active .topology-node__card {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2), 0 8px 18px rgba(2, 6, 23, 0.3);
}

.topology-node__index {
  min-width: 24px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #132238;
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
}

.topology-node.active .topology-node__index {
  background: #f97316;
}

.topology-node__type {
  max-width: 88px;
  overflow: hidden;
  color: #94a3b8;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topology-selection {
  flex: 0 0 26px;
  min-height: 26px;
  padding: 0 9px;
  border: 1px solid #26364c;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #132238;
  color: #94a3b8;
  font-size: 9px;
}

.topology-selection strong {
  color: #f8fafc;
}

.topology-selection span:last-child {
  margin-left: auto;
  color: #38bdf8;
  font-variant-numeric: tabular-nums;
}

.trace-panel {
  flex: 1;
  min-height: 0;
  height: auto;
  border-radius: 5px;
}

.trace-grid {
  inset: 8px 8px 26px;
}

.trace-svg {
  inset: 8px 8px 26px;
  width: calc(100% - 16px);
  height: calc(100% - 34px);
}

.trace-scale {
  left: 8px;
  right: 8px;
  bottom: 3px;
  height: 20px;
}

.scale-item {
  gap: 2px;
}

.scale-label {
  font-size: 8px;
}

.trace-marker {
  gap: 4px;
}

.marker-dot {
  width: 7px;
  height: 7px;
}

.marker-badge {
  min-width: 32px;
  padding: 2px 5px;
  font-size: 8px;
}

.trace-event-list {
  flex: 0 0 28px;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 4px;
  margin-top: 4px;
  overflow-x: auto;
}

.trace-event-chip {
  flex: 0 0 auto;
  padding: 4px 7px;
  border-radius: 5px;
  gap: 5px;
}

.chip-label,
.chip-distance {
  font-size: 8px;
}

.event-control-rail {
  grid-area: controls;
  min-width: 0;
  min-height: 0;
  padding: 8px;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: #ffffff;
  overflow: hidden;
}

.rail-section-title {
  color: #0f172a;
  font-size: 11px;
  font-weight: 700;
}

.event-control-rail .event-metric-grid,
.event-control-rail .event-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  margin: 0;
}

.event-control-rail .event-summary-grid {
  grid-template-columns: 1fr;
}

.event-control-rail .event-metric-item:nth-child(-n + 3) {
  display: none;
}

.event-control-rail .event-metric-item,
.event-control-rail .event-summary-card {
  min-width: 0;
  min-height: 28px;
  padding: 4px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  background: #f8fafc;
  color: #64748b;
  font-size: 10px;
}

.event-control-rail .event-summary-card {
  min-height: 30px;
  background: #eff6ff;
  color: #2563eb;
}

.event-control-rail .wide {
  grid-column: 1 / -1;
}

.event-control-rail .event-metric-item.wide {
  grid-column: 1 / -1;
}

.event-control-rail strong {
  min-width: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-control-rail .event-summary-card strong {
  color: #1e3a8a;
}

.event-control-rail .action-primary,
.event-control-rail .action-secondary {
  min-height: 34px;
  border-radius: 7px;
  font-size: 10px;
}

.event-control-rail .action-primary {
  grid-column: auto;
  min-height: 38px;
}

.rail-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.rail-save-state {
  min-height: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  color: #64748b;
  font-size: 9px;
}

.rail-save-state strong {
  color: #16a34a;
  font-size: 9px;
}

.event-table-card {
  grid-area: table;
  min-width: 0;
  min-height: 0;
  min-height: 190px;
  padding: 8px;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: none;
  overflow: hidden;
}

.event-table-card .result-list-head {
  min-height: 24px;
  padding: 0 4px 5px;
  flex-direction: row;
  align-items: center;
}

.event-table-card .result-list-title {
  font-size: 11px;
}

.event-table-card .result-list-mode {
  padding: 2px 7px;
  font-size: 9px;
}

.event-table {
  height: 150px;
  margin-top: 0;
  border-radius: 5px;
  overflow: auto;
}

.table-row.full {
  min-width: 680px;
  grid-template-columns: 38px 70px repeat(6, minmax(68px, 1fr));
  gap: 5px;
  padding: 5px 7px;
  font-size: 10px;
}

.landscape-rotate-hint {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  background: #f4f7fb;
  color: #0f172a;
  text-align: center;
}

.landscape-rotate-hint strong {
  font-size: 18px;
}

.landscape-rotate-hint > span:nth-child(3) {
  color: #64748b;
  font-size: 12px;
}

.landscape-rotate-icon {
  position: relative;
  width: 56px;
  height: 34px;
  border: 3px solid #2563eb;
  border-radius: 8px;
}

.landscape-rotate-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #2563eb;
  transform: translateY(-50%);
}

.landscape-continue-btn {
  min-width: 112px;
  min-height: 40px;
  margin-top: 6px;
  padding: 0 18px;
  border: 0;
  border-radius: 6px;
  background: #2563eb;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
}

@media (max-width: 720px) and (orientation: landscape) {
  .app-container.smart-otdr-landscape-page {
    width: calc(100vw - 16px);
    height: calc(100dvh - 16px);
    max-width: none;
    max-height: none;
    border-radius: 16px;
  }

  .event-map-workbench {
    grid-template-columns: minmax(0, 1fr) 164px;
    grid-template-rows: 304px minmax(190px, auto);
  }

  .landscape-file-pill {
    display: none;
  }

  .event-control-rail .event-metric-item:nth-child(-n + 3),
  .event-control-rail .rail-save-state {
    display: none;
  }

  .event-control-rail .event-metric-item.wide {
    grid-column: auto;
  }
}

@media (max-width: 700px) {
  .app-container.smart-otdr-landscape-page {
    width: calc(100vw - 24px);
    height: calc(100dvh - 24px);
    max-width: none;
    max-height: none;
  }
}
</style>
