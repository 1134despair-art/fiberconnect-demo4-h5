<template>
  <div class="app-container otdr-app-page smart-otdr-landscape-page">
    <div class="content-flex hide-scrollbar">
      <SmartOtdrPageShell title="OTDR测量" :max-width="812" :show-quick-panel="true" @back="goBack">
        <template #actions>
          <div v-if="loadedFile" class="landscape-file-pill" :title="loadedFile.name">
            {{ loadedFile.name }}
          </div>
          <div class="landscape-status" :class="measureStatus">
            <span class="landscape-status__dot"></span>
            {{ resultViewModeLabel }}
          </div>
        </template>

        <main class="otdr-workbench">
          <section class="curve-workspace">
            <SmartOtdrCurveCard
              class="workbench-curve-card"
              :measure-status="measureStatus"
              :parameter-form="savedParameterForm"
              :progress-percent="measureProgress.percent"
              :remaining-seconds="measureProgress.remainingSeconds"
              :trace-data="resultData.trace"
              :event-count="resultData.events.length"
              :selected-event-id="selectedEventId"
              :zoom-level="zoomLevel"
              :read-mode="readMode"
              :ab-selection="abSelection"
              @tool-change="handleCurveToolChange"
              @event-select="selectedEventId = $event"
              @point-select="handleTracePointSelect"
            />

            <div v-if="measureStatus !== 'done'" class="measure-state-overlay" :class="measureStatus">
              <div class="measure-state-spinner" aria-hidden="true"></div>
              <strong>{{ measureStateTitle }}</strong>
              <span>{{ measureStateDescription }}</span>
              <div v-if="measureStatus === 'running'" class="state-progress" :class="{ indeterminate: isRealtimeMode }">
                <div class="state-progress-fill" :style="isRealtimeMode ? undefined : { width: `${measureProgress.percent}%` }"></div>
              </div>
            </div>

            <div class="curve-command-strip" aria-label="曲线工具">
              <button
                v-for="tool in curveTools"
                :key="tool.key"
                class="result-tool-btn"
                :class="{ active: isCurveToolActive(tool.key), disabled: tool.disabled }"
                type="button"
                :disabled="tool.disabled"
                :title="tool.label"
                @click="handleCurveToolChange(tool.key)"
              >
                <span class="result-tool-icon">{{ tool.icon }}</span>
                <span class="result-tool-label">{{ tool.label }}</span>
              </button>
            </div>
          </section>

          <aside class="measure-control-rail">
            <div class="rail-section-title">测量参数</div>
            <div class="rail-metric-grid">
              <button class="rail-metric" type="button" :disabled="measureStatus === 'running'" @click="openSettingsModal('parameter')">
                <span>波长</span><strong>{{ metaDisplay.wavelength }}</strong>
              </button>
              <button class="rail-metric" type="button" :disabled="measureStatus === 'running'" @click="openSettingsModal('parameter')">
                <span>脉宽</span><strong>{{ metaDisplay.pulseWidth }}</strong>
              </button>
              <div class="rail-metric"><span>A-B</span><strong>{{ metaDisplay.abDistance }}</strong></div>
              <div class="rail-metric"><span>损耗</span><strong>{{ metaDisplay.abLoss }}</strong></div>
              <div class="rail-metric wide"><span>平均损耗</span><strong>{{ metaDisplay.abAvgLoss }}</strong></div>
            </div>

            <div class="rail-ab-row">
              <div><span>A</span><strong>{{ metaDisplay.pointA.distance }}</strong></div>
              <div><span>B</span><strong>{{ metaDisplay.pointB.distance }}</strong></div>
            </div>

            <button
              v-if="measureStatus !== 'running'"
              class="action-primary"
              type="button"
              @click="startMeasure"
            >
              {{ measureStatus === 'done' ? '重新测试' : '开始测试' }}
            </button>
            <button v-else class="action-primary danger" type="button" @click="stopMeasure">
              {{ isRealtimeMode ? '结束测量' : '停止测试' }}
            </button>

            <div class="rail-action-grid">
              <button class="action-secondary" type="button" :disabled="measureStatus !== 'done'" @click="saveResult">保存</button>
              <button class="action-secondary" type="button" :disabled="measureStatus === 'running'" @click="openSettingsModal('parameter')">设置</button>
              <button class="action-secondary" type="button" @click="goFileManager">文件</button>
              <button class="action-secondary" type="button" :disabled="measureStatus !== 'done'" @click="goEventMap">事件地图</button>
            </div>
          </aside>

          <section class="result-list-card">
            <div class="result-list-head">
              <div class="result-list-title">{{ resultViewTitle }}</div>
              <div class="result-list-mode">{{ resultViewModeLabel }}</div>
            </div>
            <div class="result-list-table">
              <div class="result-list-row head" :style="{ gridTemplateColumns: resultGridTemplate }">
                <span v-for="cell in resultTableHeaders" :key="cell">{{ cell }}</span>
              </div>
              <div ref="resultListBody" class="result-list-body">
                <button
                  v-for="row in activeResultRows"
                  :key="row.id"
                  class="result-list-row body"
                  :class="{ active: row.eventId !== null && row.eventId === selectedEventId }"
                  :style="{ gridTemplateColumns: resultGridTemplate }"
                  type="button"
                  @click="handleResultRowClick(row)"
                >
                  <span v-for="cell in row.cells" :key="`${row.id}-${cell}`">{{ cell }}</span>
                </button>
              </div>
            </div>
          </section>
        </main>
      </SmartOtdrPageShell>
    </div>

    <div v-if="!isLandscape && !landscapeHintDismissed" class="landscape-rotate-hint">
      <span class="landscape-rotate-icon" aria-hidden="true"></span>
      <strong>请横屏使用</strong>
      <span>横屏可完整查看曲线、参数与事件表</span>
      <button class="landscape-continue-btn" type="button" @click="landscapeHintDismissed = true">继续使用</button>
    </div>

    <SmartOtdrDialogShell
      v-if="showSettingsModal"
      title="OTDR参数设置"
      close-text="关闭"
      :max-width="780"
      max-height="calc(100dvh - 16px)"
      layout="landscape"
      @close="closeSettingsModal"
    >
      <template #default>
        <div class="settings-dialog-layout">
          <div class="modal-tab-row">
            <button
              class="modal-tab"
              :class="{ active: settingsTab === 'parameter' }"
              type="button"
              @click="settingsTab = 'parameter'"
            >
              测量参数
            </button>
            <button
              class="modal-tab"
              :class="{ active: settingsTab === 'threshold' }"
              type="button"
              @click="settingsTab = 'threshold'"
            >
              阈值参数
            </button>
          </div>

          <div class="modal-body">
            <SmartOtdrParameterPanel
              v-if="settingsTab === 'parameter'"
              :form="parameterDraft"
              :disabled="measureStatus === 'running'"
              :calibration-state="calibrationState"
              :dirty="parameterDirty"
              :saved-at="parameterSavedAt"
              :status-text="parameterStatusNotice.text"
              :status-tone="parameterStatusNotice.tone"
              @update:form="updateParameterForm"
              @request-calibration="showCalibrationDialog = true"
              @save="saveParameterForm"
            />

            <SmartOtdrThresholdPanel
              v-else
              :form="thresholdDraft"
              :disabled="measureStatus === 'running'"
              :dirty="thresholdDirty"
              :saved-at="thresholdSavedAt"
              :status-text="thresholdStatusNotice.text"
              :status-tone="thresholdStatusNotice.tone"
              @update:form="updateThresholdForm"
              @update:pass-rules="updatePassRules"
              @reset-default="resetThresholdForm"
              @save="saveThresholdForm"
            />
          </div>
        </div>
      </template>
    </SmartOtdrDialogShell>

    <SmartOtdrDialogShell
      v-if="showCalibrationDialog"
      :title="t('deviceDetail.smartOtdrCalibrationConfirm')"
      close-text="取消"
      :max-width="560"
      max-height="calc(100dvh - 32px)"
      @close="showCalibrationDialog = false"
    >
      <template #default>
        <div class="dialog-title">{{ t('deviceDetail.smartOtdrCalibrationConfirm') }}</div>
        <div class="dialog-desc">{{ t('deviceDetail.smartOtdrCalibrationDesc') }}</div>
      </template>
      <template #footer>
        <div class="dialog-actions">
          <button class="dialog-btn secondary" type="button" @click="showCalibrationDialog = false">
            {{ t('common.cancel') }}
          </button>
          <button class="dialog-btn primary" type="button" :disabled="calibrationState.loading" @click="confirmCalibration">
            {{ calibrationState.loading ? t('deviceDetail.smartOtdrCalibrationLoading') : t('common.confirm') }}
          </button>
        </div>
      </template>
    </SmartOtdrDialogShell>

    <div v-if="toastMessage" class="smart-toast">{{ toastMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SmartOtdrDialogShell from '../components/SmartOtdrDialogShell.vue'
import SmartOtdrCurveCard from '../components/SmartOtdrCurveCard.vue'
import SmartOtdrPageShell from '../components/SmartOtdrPageShell.vue'
import SmartOtdrParameterPanel from '../components/SmartOtdrParameterPanel.vue'
import SmartOtdrThresholdPanel from '../components/SmartOtdrThresholdPanel.vue'
import { useLandscapeScreen } from '../components/useLandscapeScreen'
import type {
  CalibrationState,
  MeasureStatus,
  OtdrAbSelection,
  OtdrConfigUsageNotice,
  OtdrCurveTool,
  OtdrEventItem,
  OtdrReadMode,
  OtdrResultViewMode,
  OtdrResultData,
  OtdrZoomLevel,
  ParameterForm,
  PassRuleGroup,
  ThresholdForm,
  TracePoint
} from '../components/smartOtdrTypes'

type StorageKey = 'internal' | 'sd' | 'usb'
type FileNodeType = 'folder' | 'file'
type FileKind = 'sor' | 'event-map' | 'loss-test' | 'other'

type LoadedSmartOtdrFile = {
  fileId: string
  name: string
  kind: 'sor' | 'event-map'
  updatedAt: string
  storage: StorageKey
  storageLabel: string
}

type FileNode = {
  id: string
  name: string
  type: FileNodeType
  kind?: FileKind
  updatedAt: string
  parentId: string | null
  storage: StorageKey
}

type FileManagerPersistedState = {
  nodes: FileNode[]
  activeStorage: StorageKey
  activeFolderId: string
  selectedNodeId: string
  clipboardState: {
    mode: 'copy' | 'cut' | null
    nodeId: string | null
  }
  activeView: 'manager' | 'settings'
  activeSettingsGroup: 'basic' | 'advanced'
  activeSettingKey: string
  savedFileSettings: {
    storagePath: StorageKey
    fileName: string
    fiberId: string
    createFolderByDate: boolean
    autoSave: boolean
    saveFormat: 'sor' | 'sor+pdf' | 'pdf'
    namingRule: '①+④' | '①+②+④' | '①+②+③+④'
    tester: string
    taskId: string
    cableId: string
    startPoint: string
    endPoint: string
    direction: 'O>E' | 'E>O'
    comment: string
  }
}

const SMART_OTDR_LOADED_FILE_KEY = 'smart-otdr-loaded-file'
const FILE_MANAGER_STATE_KEY = 'smart-otdr-file-manager-state'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const deviceId = computed(() => String(route.params.id || ''))

const { isLandscape } = useLandscapeScreen()
const landscapeHintDismissed = ref(false)

type ResultTableRow = {
  id: string
  eventId: number | null
  cells: string[]
}

const createDefaultParameterForm = (): ParameterForm => ({
  wavelength: '1550nm',
  range: '100m',
  pulseWidth: '5ns',
  measurementMode: 'average',
  measureTimeMode: '10s',
  customMeasureSeconds: '10',
  refractiveIndex1310: '1.467700',
  refractiveIndex1550: '1.468325',
  launchFiberMode: 'none',
  launchFiberValue: 'xx',
  receiveFiberMode: 'none',
  receiveFiberValue: 'xx',
  unit: 'km'
})

const VALID_PARAMETER_RANGES: ParameterForm['range'][] = [
  '100m',
  '500m',
  '1km',
  '2km',
  '5km',
  '10km',
  '20km',
  '40km',
  '60km',
  '90km',
  '100km',
  '120km',
  '150km',
  '200km'
]

const VALID_PARAMETER_PULSES: ParameterForm['pulseWidth'][] = [
  '5ns',
  '10ns',
  '20ns',
  '50ns',
  '100ns',
  '275ns',
  '500ns',
  '1us',
  '2us',
  '5us',
  '10us'
]

const VALID_PARAMETER_TIME_MODES: ParameterForm['measureTimeMode'][] = [
  '10s',
  '15s',
  '30s',
  'custom'
]

const VALID_FIBER_MODES: ParameterForm['launchFiberMode'][] = ['none', 'length', 'event']
const VALID_PARAMETER_UNITS: ParameterForm['unit'][] = ['km', 'kfeet', 'miles']

const normalizeParameterForm = (raw?: Partial<ParameterForm>): ParameterForm => {
  const defaults = createDefaultParameterForm()
  const legacyRealtimeMode = String((raw as Record<string, unknown> | undefined)?.measureTimeMode) === 'real-time'

  return {
    ...defaults,
    ...raw,
    wavelength: ['1310nm', '1550nm', '1310+1550'].includes(String(raw?.wavelength))
      ? (raw?.wavelength as ParameterForm['wavelength'])
      : defaults.wavelength,
    range: VALID_PARAMETER_RANGES.includes(raw?.range as ParameterForm['range'])
      ? (raw?.range as ParameterForm['range'])
      : defaults.range,
    pulseWidth: VALID_PARAMETER_PULSES.includes(raw?.pulseWidth as ParameterForm['pulseWidth'])
      ? (raw?.pulseWidth as ParameterForm['pulseWidth'])
      : defaults.pulseWidth,
    measurementMode: raw?.measurementMode === 'real-time' || legacyRealtimeMode ? 'real-time' : 'average',
    measureTimeMode: VALID_PARAMETER_TIME_MODES.includes(raw?.measureTimeMode as ParameterForm['measureTimeMode'])
      ? (raw?.measureTimeMode as ParameterForm['measureTimeMode'])
      : defaults.measureTimeMode,
    customMeasureSeconds: raw?.customMeasureSeconds || defaults.customMeasureSeconds,
    refractiveIndex1310: raw?.refractiveIndex1310 || defaults.refractiveIndex1310,
    refractiveIndex1550: raw?.refractiveIndex1550 || defaults.refractiveIndex1550,
    launchFiberMode: VALID_FIBER_MODES.includes(raw?.launchFiberMode as ParameterForm['launchFiberMode'])
      ? (raw?.launchFiberMode as ParameterForm['launchFiberMode'])
      : defaults.launchFiberMode,
    launchFiberValue: raw?.launchFiberValue || defaults.launchFiberValue,
    receiveFiberMode: VALID_FIBER_MODES.includes(raw?.receiveFiberMode as ParameterForm['receiveFiberMode'])
      ? (raw?.receiveFiberMode as ParameterForm['receiveFiberMode'])
      : defaults.receiveFiberMode,
    receiveFiberValue: raw?.receiveFiberValue || defaults.receiveFiberValue,
    unit: VALID_PARAMETER_UNITS.includes(raw?.unit as ParameterForm['unit'])
      ? (raw?.unit as ParameterForm['unit'])
      : defaults.unit
  }
}

const getParameterValidationError = (form: ParameterForm) => {
  const refractive1310 = Number(form.refractiveIndex1310)
  const refractive1550 = Number(form.refractiveIndex1550)

  if (!Number.isFinite(refractive1310) || refractive1310 < 1 || refractive1310 > 2) {
    return '请输入 1.000000～2.000000 的 1310nm 折射率'
  }
  if (!Number.isFinite(refractive1550) || refractive1550 < 1 || refractive1550 > 2) {
    return '请输入 1.000000～2.000000 的 1550nm 折射率'
  }

  if (form.measurementMode === 'average' && form.measureTimeMode === 'custom') {
    const customSeconds = Number(form.customMeasureSeconds)
    if (!Number.isInteger(customSeconds) || customSeconds < 1 || customSeconds > 3600) {
      return '自定义测量时间需为 1～3600 秒的整数'
    }
  }

  const validateFiberValue = (mode: ParameterForm['launchFiberMode'], value: string, label: string) => {
    if (mode === 'none') return ''
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue) || numericValue <= 0) return `${label}需填写大于 0 的数值`
    if (mode === 'event' && !Number.isInteger(numericValue)) return `${label}事件编号需为整数`
    return ''
  }

  return validateFiberValue(form.launchFiberMode, form.launchFiberValue, '引导光纤')
    || validateFiberValue(form.receiveFiberMode, form.receiveFiberValue, '接收光纤')
}

const createDefaultThresholdForm = (): ThresholdForm => ({
  lossMode: 'custom',
  lossThreshold: '0.20',
  reflectMode: 'custom',
  reflectThreshold: '0.20',
  endMode: 'auto',
  endThreshold: '5.00',
  backscatter1310: '1.50',
  backscatter1550: '1.48',
  passRules: {
    reflectEventEnabled: true,
    reflectEventValue: '0.20',
    nonReflectEventEnabled: true,
    nonReflectEventValue: '0.20',
    totalLossEnabled: true,
    totalLossValue: '1.50',
    reflectEnabled: false,
    reflectValue: '0.00',
    avgLoss1310Enabled: true,
    avgLoss1310Value: '0.35',
    avgLoss1550Enabled: true,
    avgLoss1550Value: '0.32'
  }
})

const normalizeThresholdForm = (raw?: Partial<ThresholdForm>): ThresholdForm => {
  const defaults = createDefaultThresholdForm()

  return {
    ...defaults,
    ...raw,
    lossMode: raw?.lossMode === 'custom' ? 'custom' : raw?.lossMode === 'auto' ? 'auto' : defaults.lossMode,
    lossThreshold: raw?.lossThreshold || defaults.lossThreshold,
    reflectMode: raw?.reflectMode === 'custom' ? 'custom' : raw?.reflectMode === 'auto' ? 'auto' : defaults.reflectMode,
    reflectThreshold: raw?.reflectThreshold || defaults.reflectThreshold,
    endMode: raw?.endMode === 'custom' ? 'custom' : raw?.endMode === 'auto' ? 'auto' : defaults.endMode,
    endThreshold: raw?.endThreshold || defaults.endThreshold,
    backscatter1310: raw?.backscatter1310 || defaults.backscatter1310,
    backscatter1550: raw?.backscatter1550 || defaults.backscatter1550,
    passRules: {
      ...defaults.passRules,
      ...(raw?.passRules || {})
    }
  }
}

const createEmptySummary = (): OtdrResultData['summary'] => ({
  totalLoss: '--',
  averageLoss: '--',
  eventCount: 0,
  maxReflectance: '--',
  conclusion: 'pass',
  conclusionText: t('deviceDetail.smartOtdrConclusionPass')
})

const createDefaultFileManagerState = (): FileManagerPersistedState => ({
  nodes: [
    { id: 'internal-root', name: 'Disk', type: 'folder', updatedAt: '2026-01-14', parentId: null, storage: 'internal' },
    { id: 'internal-otdr', name: 'OTDR', type: 'folder', updatedAt: '2026-06-24 10:32', parentId: 'internal-root', storage: 'internal' },
    { id: 'internal-event', name: '事件地图', type: 'folder', updatedAt: '2026-06-24 10:33', parentId: 'internal-root', storage: 'internal' },
    { id: 'internal-file-1', name: 'OTDR_20260624_103221.sor', type: 'file', kind: 'sor', updatedAt: '2026-06-24 10:32', parentId: 'internal-otdr', storage: 'internal' },
    { id: 'internal-file-2', name: 'OTDR_20260625_081122.sor', type: 'file', kind: 'sor', updatedAt: '2026-06-25 08:11', parentId: 'internal-otdr', storage: 'internal' },
    { id: 'internal-file-3', name: 'EVENT_MAP_20260624_103221.json', type: 'file', kind: 'event-map', updatedAt: '2026-06-24 10:33', parentId: 'internal-event', storage: 'internal' },
    { id: 'sd-root', name: 'SD卡', type: 'folder', updatedAt: '2026-01-14', parentId: null, storage: 'sd' },
    { id: 'sd-backup', name: '备份目录', type: 'folder', updatedAt: '2026-06-23 18:00', parentId: 'sd-root', storage: 'sd' },
    { id: 'sd-file-1', name: 'OTDR_20260620_145501.sor', type: 'file', kind: 'sor', updatedAt: '2026-06-20 14:55', parentId: 'sd-backup', storage: 'sd' },
    { id: 'sd-file-2', name: 'EVENT_MAP_20260620_145645.json', type: 'file', kind: 'event-map', updatedAt: '2026-06-20 14:56', parentId: 'sd-backup', storage: 'sd' },
    { id: 'usb-root', name: 'U盘', type: 'folder', updatedAt: '2026-01-14', parentId: null, storage: 'usb' },
    { id: 'usb-share', name: '共享文件夹', type: 'folder', updatedAt: '2026-06-21 09:20', parentId: 'usb-root', storage: 'usb' },
    { id: 'usb-file-1', name: 'OTDR_20260618_100012.sor', type: 'file', kind: 'sor', updatedAt: '2026-06-18 10:00', parentId: 'usb-share', storage: 'usb' },
    { id: 'usb-file-2', name: 'EVENT_MAP_20260618_100138.json', type: 'file', kind: 'event-map', updatedAt: '2026-06-18 10:01', parentId: 'usb-share', storage: 'usb' }
  ],
  activeStorage: 'internal',
  activeFolderId: 'internal-root',
  selectedNodeId: '',
  clipboardState: {
    mode: null,
    nodeId: null
  },
  activeView: 'manager',
  activeSettingsGroup: 'basic',
  activeSettingKey: 'storagePath',
  savedFileSettings: {
    storagePath: 'internal',
    fileName: 'xx',
    fiberId: 'xx',
    createFolderByDate: false,
    autoSave: true,
    saveFormat: 'sor',
    namingRule: '①+④',
    tester: 'xx',
    taskId: 'xx',
    cableId: 'xx',
    startPoint: 'xx',
    endPoint: 'xx',
    direction: 'O>E',
    comment: 'xx'
  }
})

function createMockTraceData(seed = 0): TracePoint[] {
  const variation = (seed % 5) * 0.55
  return [
    { x: 6, y: 48 },
    { x: 18, y: 51 },
    { x: 38, y: 57 },
    { x: 54, y: 69 },
    { x: 78, y: 108, highlight: true },
    { x: 126, y: 116 + variation },
    { x: 174, y: 123 + variation },
    { x: 204, y: 127 },
    { x: 210, y: 83 - variation, highlight: true },
    { x: 218, y: 96 },
    { x: 230, y: 126 },
    { x: 268, y: 133 },
    { x: 296, y: 139 },
    { x: 306, y: 132, highlight: true },
    { x: 314, y: 141 },
    { x: 323, y: 135 },
    { x: 331, y: 144 },
    { x: 340, y: 140 },
    { x: 348, y: 148, highlight: true }
  ]
}

const cloneData = <T>(source: T): T => JSON.parse(JSON.stringify(source)) as T
const isSameData = <T>(left: T, right: T) => JSON.stringify(left) === JSON.stringify(right)

const measureStatus = ref<MeasureStatus>('idle')
const showCalibrationDialog = ref(false)
const showSettingsModal = ref(false)
const settingsTab = ref<'parameter' | 'threshold'>('parameter')
const selectedEventId = ref<number | null>(null)
const resultViewMode = ref<OtdrResultViewMode>('result-list')
const resultListBody = ref<HTMLElement | null>(null)
const zoomLevel = ref<OtdrZoomLevel>(1)
const readMode = ref<OtdrReadMode>('none')
const abSelection = ref<OtdrAbSelection>({ startIndex: 2, endIndex: 8 })
const parameterSavedAt = ref('')
const thresholdSavedAt = ref('')
const loadedFile = ref<LoadedSmartOtdrFile | null>(null)
const toastMessage = ref('')

const parameterDraft = reactive<ParameterForm>(normalizeParameterForm())
const savedParameterForm = reactive<ParameterForm>(normalizeParameterForm())
const thresholdDraft = reactive<ThresholdForm>(normalizeThresholdForm())
const savedThresholdForm = reactive<ThresholdForm>(normalizeThresholdForm())

const measureProgress = reactive({
  percent: 0,
  remainingSeconds: 0,
  elapsedSeconds: 0
})

const isRealtimeMode = computed(() => savedParameterForm.measurementMode === 'real-time')

const measureStateTitle = computed(() => {
  if (measureStatus.value !== 'running') return '等待测试'
  if (isRealtimeMode.value) return `实时测量 ${measureProgress.elapsedSeconds}s`
  return `平均测量 ${measureProgress.remainingSeconds}s`
})

const measureStateDescription = computed(() => {
  if (measureStatus.value !== 'running') return '确认参数后开始'
  if (isRealtimeMode.value) return '持续采集中 · 请手动结束'
  return `${measureProgress.percent}%`
})

const calibrationState = reactive<CalibrationState>({
  loading: false,
  lastCalibratedAt: '',
  result: ''
})

const resultData = reactive<OtdrResultData>({
  trace: [],
  events: [],
  summary: createEmptySummary(),
  testedAt: ''
})

const parameterDirty = computed(() => !isSameData(parameterDraft, savedParameterForm))
const thresholdDirty = computed(() => !isSameData(thresholdDraft, savedThresholdForm))

const parameterStatusNotice = computed<OtdrConfigUsageNotice>(() => {
  if (parameterDirty.value) {
    return {
      text: t('deviceDetail.smartOtdrSaveHintPending'),
      tone: 'warning'
    }
  }

  return {
    text: t('deviceDetail.smartOtdrSaveHintSaved'),
    tone: parameterSavedAt.value ? 'success' : 'default'
  }
})

const thresholdStatusNotice = computed<OtdrConfigUsageNotice>(() => {
  if (thresholdDirty.value) {
    return {
      text: t('deviceDetail.smartOtdrThresholdHintPending'),
      tone: 'warning'
    }
  }

  return {
    text: t('deviceDetail.smartOtdrThresholdHintSaved'),
    tone: thresholdSavedAt.value ? 'success' : 'default'
  }
})

const readNumber = (value: string, fallback = 0) => {
  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

const getClampedAbSelection = (trace: TracePoint[]) => {
  if (!trace.length) return null
  const startIndex = Math.min(abSelection.value.startIndex, Math.max(0, trace.length - 2))
  const endIndex = Math.max(startIndex + 1, Math.min(abSelection.value.endIndex, trace.length - 1))
  return {
    startIndex,
    endIndex,
    start: trace[startIndex],
    end: trace[endIndex]
  }
}

const currentPointSelection = computed(() => {
  const selection = getClampedAbSelection(resultData.trace)
  if (!selection || measureStatus.value !== 'done') return null

  const pointA = {
    distance: `${(selection.start.x / 36).toFixed(2)}km`,
    value: `${Math.max(0, ((210 - selection.start.y) / 7.5)).toFixed(1)}dB`
  }
  const pointB = {
    distance: `${(selection.end.x / 36).toFixed(2)}km`,
    value: `${Math.max(0, ((210 - selection.end.y) / 7.5)).toFixed(1)}dB`
  }

  const distance = Math.abs(selection.end.x - selection.start.x) / 36
  const loss = Math.abs(selection.end.y - selection.start.y) / 7.5
  const avgLoss = distance > 0 ? `${(loss / distance).toFixed(3)}dB/km` : resultData.summary.averageLoss

  return {
    pointA,
    pointB,
    ab: {
      distance: `${distance.toFixed(2)}km`,
      loss: `${loss.toFixed(2)}dB`,
      avgLoss
    }
  }
})

const metaDisplay = computed(() => {
  const fallbackPoint = {
    distance: '0.00km',
    value: '0.0dB'
  }

  return {
    wavelength: savedParameterForm.wavelength,
    pulseWidth: savedParameterForm.pulseWidth,
    abDistance: currentPointSelection.value ? currentPointSelection.value.ab.distance : '0.00km',
    abLoss: currentPointSelection.value ? currentPointSelection.value.ab.loss : '0.00dB',
    abAvgLoss: currentPointSelection.value ? currentPointSelection.value.ab.avgLoss : (resultData.summary.averageLoss || '0.000dB/km'),
    pointA: currentPointSelection.value
      ? currentPointSelection.value.pointA
      : fallbackPoint,
    pointB: currentPointSelection.value
      ? currentPointSelection.value.pointB
      : fallbackPoint
  }
})

const resultViewTitle = computed(() => {
  if (resultViewMode.value === 'event-list') return '事件列表'
  if (resultViewMode.value === 'event-compare') return '事件对比'
  return '结果列表'
})

const curveTools = computed(() => [
  { key: 'zoom-in' as const, label: '放大', icon: '+', disabled: zoomLevel.value >= 3 },
  { key: 'zoom-out' as const, label: '缩小', icon: '-', disabled: zoomLevel.value <= 1 },
  { key: 'reset' as const, label: '1:1', icon: '1:1', disabled: zoomLevel.value === 1 && readMode.value === 'none' },
  { key: 'point-a' as const, label: 'A', icon: 'A', disabled: measureStatus.value !== 'done' || resultData.trace.length < 2 },
  { key: 'point-b' as const, label: 'B', icon: 'B', disabled: measureStatus.value !== 'done' || resultData.trace.length < 2 },
  { key: 'ab' as const, label: 'AB', icon: 'AB', disabled: measureStatus.value !== 'done' || resultData.trace.length < 2 },
  { key: 'event-list' as const, label: '事件', icon: 'E', disabled: false },
  { key: 'result-list' as const, label: '结果', icon: 'R', disabled: false },
  { key: 'event-compare' as const, label: '对比', icon: 'C', disabled: false }
])

const isCurveToolActive = (tool: OtdrCurveTool) => {
  if (tool === 'point-a' || tool === 'point-b' || tool === 'ab') return readMode.value === tool
  if (tool === 'event-list' || tool === 'result-list' || tool === 'event-compare') {
    return resultViewMode.value === tool
  }
  return false
}

const resultViewModeLabel = computed(() => {
  if (measureStatus.value === 'done') return '已完成'
  if (measureStatus.value === 'running') return '测试中'
  return '待测'
})

const resultGridTemplate = computed(() => {
  if (resultViewMode.value === 'event-list') {
    return '52px minmax(92px, 1.1fr) repeat(3, minmax(82px, 1fr))'
  }

  if (resultViewMode.value === 'event-compare') {
    return '96px repeat(4, minmax(82px, 1fr))'
  }

  return '52px minmax(84px, 1fr) repeat(6, minmax(82px, 1fr))'
})

const resultTableHeaders = computed(() => {
  if (resultViewMode.value === 'event-list') {
    return ['序号', '事件类型', '距离', '损耗', '反射']
  }

  if (resultViewMode.value === 'event-compare') {
    return ['对比项', '当前值', '对比值', '差值', '结论']
  }

  return ['序号', '类型', '距离(km)', '区段(km)', '损耗(dB)', '总损耗(dB)', '斜率(dB/km)', '反射(dB)']
})

const createEmptyRows = (columnCount: number, rowCount = 3): ResultTableRow[] => {
  return Array.from({ length: rowCount }, (_, index) => ({
    id: `empty-${columnCount}-${index}`,
    eventId: null,
    cells: Array.from({ length: columnCount }, () => '--')
  }))
}

const resultRows = computed<ResultTableRow[]>(() => {
  return resultData.events.map((event, index, events) => {
    const currentDistance = readNumber(event.distance)
    const prevDistance = index === 0 ? 0 : readNumber(events[index - 1].distance)
    const sectionDistance = Math.max(0, currentDistance - prevDistance)
    const loss = readNumber(event.loss)
    const slope = sectionDistance > 0 ? `${(loss / sectionDistance).toFixed(2)}` : '--'

    return {
      id: `result-${event.id}`,
      eventId: event.id,
      cells: [
        String(event.id),
        event.type,
        currentDistance ? currentDistance.toFixed(2) : '--',
        sectionDistance ? sectionDistance.toFixed(2) : '--',
        loss ? loss.toFixed(2) : '--',
        readNumber(event.totalLoss).toFixed(2),
        slope,
        readNumber(event.reflect).toFixed(0)
      ]
    }
  })
})

const eventRows = computed<ResultTableRow[]>(() => {
  return resultData.events.map(event => ({
    id: `event-${event.id}`,
    eventId: event.id,
    cells: [
      String(event.id),
      event.type,
      event.distance,
      event.loss,
      event.reflect
    ]
  }))
})

const compareRows = computed<ResultTableRow[]>(() => {
  const first = resultData.events[0]
  const last = resultData.events[resultData.events.length - 1]

  if (!first || !last) return []

  const distanceDelta = (readNumber(last.distance) - readNumber(first.distance)).toFixed(2)
  const lossDelta = (readNumber(last.loss) - readNumber(first.loss)).toFixed(2)
  const reflectDelta = (readNumber(last.reflect) - readNumber(first.reflect)).toFixed(0)

  return [
    {
      id: 'compare-distance',
      eventId: first.id,
      cells: ['距离', first.distance, last.distance, `${distanceDelta}km`, '区段增大']
    },
    {
      id: 'compare-loss',
      eventId: last.id,
      cells: ['损耗', first.loss, last.loss, `${lossDelta}dB`, lossDelta.startsWith('-') ? '当前更低' : '当前更高']
    },
    {
      id: 'compare-reflect',
      eventId: last.id,
      cells: ['反射', first.reflect, last.reflect, `${reflectDelta}dB`, reflectDelta.startsWith('-') ? '反射降低' : '反射升高']
    }
  ]
})

const activeResultRows = computed<ResultTableRow[]>(() => {
  if (measureStatus.value !== 'done') {
    return createEmptyRows(resultTableHeaders.value.length)
  }

  if (resultViewMode.value === 'event-list') return eventRows.value
  if (resultViewMode.value === 'event-compare') return compareRows.value.length ? compareRows.value : createEmptyRows(resultTableHeaders.value.length)
  return resultRows.value
})

const getMeasureSeconds = () => {
  if (savedParameterForm.measureTimeMode === 'custom') {
    return Math.min(3600, Math.max(1, Number.parseInt(savedParameterForm.customMeasureSeconds, 10) || 10))
  }

  return Number.parseInt(savedParameterForm.measureTimeMode, 10) || 10
}

const createMockEvents = (): OtdrEventItem[] => [
  { id: 1, name: '事件1', type: '连接点', distance: '0.52km', loss: '0.13dB', reflect: '-45dB', totalLoss: '0.13dB', pass: true, detail: '连接点前后损耗稳定。' },
  { id: 2, name: '事件2', type: '熔接点', distance: '2.48km', loss: '0.21dB', reflect: '-52dB', totalLoss: '0.34dB', pass: true, detail: '熔接损耗在可接受范围内。' },
  { id: 3, name: '事件3', type: '弯折点', distance: '5.16km', loss: '0.36dB', reflect: '-39dB', totalLoss: '0.70dB', pass: false, detail: '存在明显弯折衰减。' },
  { id: 4, name: '事件4', type: '末端', distance: '9.95km', loss: '0.84dB', reflect: '-34dB', totalLoss: '1.54dB', pass: true, detail: '末端事件识别完成。' }
]

const createMockSummary = (events: OtdrEventItem[]) => {
  const failed = events.some(item => !item.pass)
  return {
    totalLoss: '1.54dB',
    averageLoss: '0.22dB/km',
    eventCount: events.length,
    maxReflectance: '-34dB',
    conclusion: failed ? 'fail' : 'pass',
    conclusionText: failed ? t('deviceDetail.smartOtdrConclusionFail') : t('deviceDetail.smartOtdrConclusionPass')
  } as OtdrResultData['summary']
}

const buildLoadedFileResult = (file: LoadedSmartOtdrFile): OtdrResultData => {
  const hash = Array.from(file.fileId).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const totalDistance = 6 + (hash % 7)
  const eventCount = 4
  const sourceLabel = file.kind === 'event-map' ? '事件地图' : 'OTDR'
  const trace = createMockTraceData(hash)

  const events = Array.from({ length: eventCount }, (_, index) => {
    const distance = Number((((index + 1) / eventCount) * totalDistance).toFixed(2))
    const loss = Number((0.08 + index * 0.09 + (hash % 5) * 0.02).toFixed(2))
    const totalLoss = Number((loss + index * 0.14).toFixed(2))
    const reflect = -(39 + index * 3 + (hash % 4))
    const pass = index !== eventCount - 1 || hash % 2 === 0

    return {
      id: index + 1,
      name: `事件${index + 1}`,
      type: index === eventCount - 1 ? '末端' : index % 2 === 0 ? '连接点' : '熔接点',
      distance: `${distance}km`,
      loss: `${loss.toFixed(2)}dB`,
      reflect: `${reflect}dB`,
      totalLoss: `${totalLoss.toFixed(2)}dB`,
      pass,
      detail: `已根据${sourceLabel}文件 ${file.name} 生成 Mock 识别结果。`
    }
  })

  const hasFail = events.some(item => !item.pass)

  return {
    trace,
    events,
    summary: {
      totalLoss: `${(1.12 + (hash % 9) * 0.11).toFixed(2)}dB`,
      averageLoss: `${(0.16 + (hash % 5) * 0.03).toFixed(2)}dB/km`,
      eventCount,
      maxReflectance: `${-(33 + (hash % 7))}dB`,
      conclusion: hasFail ? 'fail' : 'pass',
      conclusionText: hasFail ? t('deviceDetail.smartOtdrConclusionFail') : t('deviceDetail.smartOtdrConclusionPass')
    },
    testedAt: file.updatedAt
  }
}

const readLoadedFile = () => {
  const raw = sessionStorage.getItem(SMART_OTDR_LOADED_FILE_KEY)
  if (!raw) {
    loadedFile.value = null
    return
  }

  try {
    const parsed = JSON.parse(raw) as Omit<LoadedSmartOtdrFile, 'storageLabel'>
    const storageLabelMap: Record<StorageKey, string> = {
      internal: '内部存储',
      sd: 'SD卡',
      usb: 'U盘'
    }

    loadedFile.value = {
      ...parsed,
      storageLabel: storageLabelMap[parsed.storage]
    }
  } catch {
    loadedFile.value = null
  }
}

const clearLoadedFileState = () => {
  sessionStorage.removeItem(SMART_OTDR_LOADED_FILE_KEY)
  loadedFile.value = null
}

const applyLoadedFileResult = () => {
  if (!loadedFile.value) return

  const nextResult = buildLoadedFileResult(loadedFile.value)
  resetCurveInteractiveState()
  measureStatus.value = 'done'
  resultData.trace = nextResult.trace
  resultData.events = nextResult.events
  resultData.summary = nextResult.summary
  resultData.testedAt = nextResult.testedAt
  selectedEventId.value = nextResult.events[0]?.id || null
  showToast(`已识别文件 ${loadedFile.value.name}`)
}

const readFileManagerState = (): FileManagerPersistedState => {
  const raw = sessionStorage.getItem(FILE_MANAGER_STATE_KEY)
  if (!raw) return createDefaultFileManagerState()

  try {
    const parsed = JSON.parse(raw) as Partial<FileManagerPersistedState>
    return {
      ...createDefaultFileManagerState(),
      ...parsed,
      nodes: Array.isArray(parsed.nodes) && parsed.nodes.length ? parsed.nodes as FileNode[] : createDefaultFileManagerState().nodes,
      savedFileSettings: {
        ...createDefaultFileManagerState().savedFileSettings,
        ...(parsed.savedFileSettings || {})
      }
    }
  } catch {
    return createDefaultFileManagerState()
  }
}

const getPreferredFolderId = (storage: StorageKey, nodes: FileNode[]) => {
  const fallbackMap: Record<StorageKey, string[]> = {
    internal: ['internal-otdr', 'internal-root'],
    sd: ['sd-backup', 'sd-root'],
    usb: ['usb-share', 'usb-root']
  }

  const target = fallbackMap[storage].find(id => nodes.some(node => node.id === id))
  return target || `${storage}-root`
}

const getUniqueFileName = (nodes: FileNode[], baseName: string, parentId: string, storage: StorageKey) => {
  if (!nodes.some(node => node.parentId === parentId && node.storage === storage && node.name === baseName)) {
    return baseName
  }

  const dotIndex = baseName.lastIndexOf('.')
  const namePart = baseName.slice(0, dotIndex)
  const extPart = baseName.slice(dotIndex)
  let index = 1
  let nextName = `${namePart}(${index})${extPart}`

  while (nodes.some(node => node.parentId === parentId && node.storage === storage && node.name === nextName)) {
    index += 1
    nextName = `${namePart}(${index})${extPart}`
  }

  return nextName
}

const createSorFileNode = (nodes: FileNode[], storage: StorageKey, parentId: string, updatedAt: string): FileNode => {
  const timestamp = updatedAt.replace(/[^\d]/g, '').slice(0, 12) || `${Date.now()}`.slice(0, 12)
  const baseName = `OTDR_${timestamp}.sor`

  return {
    id: `measure-file-${Date.now()}`,
    name: getUniqueFileName(nodes, baseName, parentId, storage),
    type: 'file',
    kind: 'sor',
    updatedAt,
    parentId,
    storage
  }
}

let progressTimer: number | null = null
let toastTimer: number | null = null

const resetCurveInteractiveState = (keepResultMode = false) => {
  zoomLevel.value = 1
  readMode.value = 'none'
  abSelection.value = { startIndex: 2, endIndex: 8 }
  if (!keepResultMode) {
    resultViewMode.value = 'result-list'
  }
}

const clearProgressTimer = () => {
  if (progressTimer !== null) {
    window.clearInterval(progressTimer)
    progressTimer = null
  }
}

const showToast = (message: string) => {
  toastMessage.value = message
  if (toastTimer !== null) {
    window.clearTimeout(toastTimer)
  }
  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
    toastTimer = null
  }, 1800)
}

const handleCurveToolChange = (tool: OtdrCurveTool) => {
  if (tool === 'zoom-in') {
    if (zoomLevel.value < 3) {
      zoomLevel.value = (zoomLevel.value + 1) as OtdrZoomLevel
    }
    return
  }

  if (tool === 'zoom-out') {
    if (zoomLevel.value > 1) {
      zoomLevel.value = (zoomLevel.value - 1) as OtdrZoomLevel
    }
    return
  }

  if (tool === 'reset') {
    zoomLevel.value = 1
    readMode.value = 'none'
    return
  }

  if (tool === 'point-a' || tool === 'point-b' || tool === 'ab') {
    if (measureStatus.value !== 'done' || resultData.trace.length < 2) return
    readMode.value = readMode.value === tool ? 'none' : tool
    return
  }

  resultViewMode.value = tool
  window.requestAnimationFrame(() => {
    if (resultListBody.value) resultListBody.value.scrollTop = 0
  })
}

const handleResultRowClick = (row: ResultTableRow) => {
  if (row.eventId === null) return
  selectedEventId.value = row.eventId
}

const handleTracePointSelect = (pointIndex: number) => {
  const trace = resultData.trace
  if (measureStatus.value !== 'done' || !trace.length) return

  const safeIndex = Math.max(0, Math.min(pointIndex, trace.length - 1))

  if (readMode.value === 'point-a') {
    abSelection.value = {
      startIndex: Math.min(safeIndex, abSelection.value.endIndex - 1),
      endIndex: abSelection.value.endIndex
    }
    return
  }

  if (readMode.value === 'point-b') {
    abSelection.value = {
      startIndex: abSelection.value.startIndex,
      endIndex: Math.max(safeIndex, abSelection.value.startIndex + 1)
    }
    return
  }

  if (readMode.value === 'ab') {
    const distanceToStart = Math.abs(safeIndex - abSelection.value.startIndex)
    const distanceToEnd = Math.abs(safeIndex - abSelection.value.endIndex)

    if (distanceToStart <= distanceToEnd) {
      abSelection.value = {
        startIndex: Math.min(safeIndex, abSelection.value.endIndex - 1),
        endIndex: abSelection.value.endIndex
      }
    } else {
      abSelection.value = {
        startIndex: abSelection.value.startIndex,
        endIndex: Math.max(safeIndex, abSelection.value.startIndex + 1)
      }
    }
  }
}

const openSettingsModal = (tab: 'parameter' | 'threshold' = 'parameter') => {
  if (measureStatus.value === 'running') return
  settingsTab.value = tab
  showSettingsModal.value = true
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}

const startMeasure = () => {
  clearProgressTimer()
  closeSettingsModal()
  showCalibrationDialog.value = false
  clearLoadedFileState()
  resetCurveInteractiveState(true)

  measureStatus.value = 'running'
  selectedEventId.value = null
  resultData.trace = []
  resultData.events = []
  resultData.summary = createEmptySummary()
  resultData.testedAt = ''
  measureProgress.percent = 0
  measureProgress.elapsedSeconds = 0
  measureProgress.remainingSeconds = isRealtimeMode.value ? 0 : getMeasureSeconds()

  progressTimer = window.setInterval(() => {
    measureProgress.elapsedSeconds += 1

    if (isRealtimeMode.value) {
      measureProgress.percent = 100
      return
    }

    if (measureProgress.remainingSeconds > 0) {
      measureProgress.remainingSeconds -= 1
      const total = getMeasureSeconds()
      measureProgress.percent = Math.min(100, Math.round(((total - measureProgress.remainingSeconds) / total) * 100))
      return
    }

    finishMeasure()
  }, 1000)
}

const cancelMeasure = () => {
  clearProgressTimer()
  resetCurveInteractiveState()
  measureStatus.value = 'idle'
  selectedEventId.value = null
  measureProgress.percent = 0
  measureProgress.remainingSeconds = 0
  measureProgress.elapsedSeconds = 0
  resultData.trace = []
  resultData.events = []
  resultData.summary = createEmptySummary()
  resultData.testedAt = ''
  showToast('已停止测试')
}

const stopMeasure = () => {
  if (isRealtimeMode.value) {
    finishMeasure()
    showToast('实时测量已结束')
    return
  }

  cancelMeasure()
}

const finishMeasure = () => {
  clearProgressTimer()
  const events = createMockEvents()
  const testedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  const nextResult: OtdrResultData = {
    trace: createMockTraceData(),
    events,
    summary: createMockSummary(events),
    testedAt
  }

  measureStatus.value = 'done'
  zoomLevel.value = 1
  readMode.value = 'none'
  measureProgress.percent = 100
  resultData.trace = nextResult.trace
  resultData.events = nextResult.events
  resultData.summary = nextResult.summary
  resultData.testedAt = nextResult.testedAt
  selectedEventId.value = events[0]?.id || null
}

const updateParameterForm = (payload: Partial<ParameterForm>) => {
  Object.assign(parameterDraft, payload)
}

const updateThresholdForm = (payload: Partial<ThresholdForm>) => {
  Object.assign(thresholdDraft, payload)
}

const updatePassRules = (payload: Partial<PassRuleGroup>) => {
  Object.assign(thresholdDraft.passRules, payload)
}

const saveParameterForm = () => {
  const normalized = normalizeParameterForm(cloneData(parameterDraft))
  const validationError = getParameterValidationError(normalized)
  if (validationError) {
    showToast(validationError)
    return
  }

  Object.assign(parameterDraft, normalized)
  Object.assign(savedParameterForm, normalized)
  parameterSavedAt.value = new Date().toLocaleString('zh-CN', { hour12: false })
  showToast('测量参数已保存')
}

const resetThresholdForm = () => {
  Object.assign(thresholdDraft, normalizeThresholdForm())
  showToast('阈值已恢复默认')
}

const saveThresholdForm = () => {
  const normalized = normalizeThresholdForm(cloneData(thresholdDraft))
  Object.assign(thresholdDraft, normalized)
  Object.assign(savedThresholdForm, normalized)
  thresholdSavedAt.value = new Date().toLocaleString('zh-CN', { hour12: false })
  showToast('阈值参数已保存')
}

const saveResult = () => {
  if (measureStatus.value !== 'done' || !resultData.testedAt) return

  const managerState = readFileManagerState()
  const targetStorage = managerState.savedFileSettings.storagePath || 'internal'
  const targetParentId = getPreferredFolderId(targetStorage, managerState.nodes)
  const nextNode = createSorFileNode(managerState.nodes, targetStorage, targetParentId, resultData.testedAt)

  managerState.nodes = [nextNode, ...managerState.nodes]
  managerState.activeStorage = targetStorage
  managerState.activeFolderId = targetParentId
  managerState.selectedNodeId = nextNode.id
  managerState.activeView = 'manager'

  sessionStorage.setItem(FILE_MANAGER_STATE_KEY, JSON.stringify(managerState))
  showToast(`已保存 ${nextNode.name}`)
}

const confirmCalibration = async () => {
  if (measureStatus.value === 'running') return

  calibrationState.loading = true
  await new Promise(resolve => setTimeout(resolve, 1200))
  calibrationState.loading = false
  calibrationState.lastCalibratedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  calibrationState.result = t('deviceDetail.smartOtdrCalibrationSuccess')
  showCalibrationDialog.value = false
  showToast('校准已完成')
}

const goBack = () => router.push(`/device/${deviceId.value}`)
const goFileManager = () => router.push(`/device/${deviceId.value}/files`)
const goEventMap = () => router.push(`/device/${deviceId.value}/event-map`)

readLoadedFile()
applyLoadedFileResult()

onBeforeUnmount(() => {
  clearProgressTimer()
  if (toastTimer !== null) {
    window.clearTimeout(toastTimer)
  }
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

.otdr-app-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.measure-overview-card,
.measure-state-card,
.action-grid,
.result-list-card {
  @include ui.smart-otdr-app-surface;
  border-color: rgba(59, 130, 246, 0.10);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.measure-overview-card {
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.measure-overview-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.loaded-file-pill {
  min-width: 0;
  width: fit-content;
  max-width: 100%;
  padding: 12px 14px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
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

.measure-metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.measure-metric-item,
.measure-point-card {
  @include ui.smart-otdr-soft-surface;
  padding: 12px 14px;
  border-color: rgba(59, 130, 246, 0.10);
  background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
  box-shadow: none;
}

.measure-metric-label,
.measure-point-tag {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  color: #64748b;
  letter-spacing: 0.04em;
}

.measure-metric-value {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: #0f172a;
}

.measure-point-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.measure-point-main {
  margin-top: 6px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  color: #0f172a;
}

.measure-point-sub {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #2563eb;
}

.workbench-curve-card {
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(59, 130, 246, 0.10);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.measure-state-card {
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.measure-state-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg, #2563eb 0%, #60a5fa 100%);
}

.state-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.state-card-desc {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

.measure-state-card.running {
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.state-progress {
  margin-top: 12px;
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.24);
  overflow: hidden;
}

.state-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb 0%, #60a5fa 100%);
}

.state-progress.indeterminate .state-progress-fill {
  width: 38%;
  animation: realtime-progress 1.15s ease-in-out infinite;
}

@keyframes realtime-progress {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(330%); }
}

@media (prefers-reduced-motion: reduce) {
  .state-progress.indeterminate .state-progress-fill {
    width: 100%;
    animation: none;
    opacity: 0.55;
  }
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.action-primary,
.action-secondary,
.dialog-btn,
.modal-tab,
.modal-close {
  min-height: 48px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.action-primary {
  grid-column: 1 / -1;
  @include ui.smart-otdr-primary-button;

  &.danger {
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  }
}

.action-secondary {
  @include ui.smart-otdr-secondary-button;
}

.action-secondary:disabled,
.action-primary:disabled,
.dialog-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.result-list-card {
  padding: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.result-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  padding: 2px 4px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.result-list-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.result-list-mode {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
}

.result-tool-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.result-tool-btn {
  min-height: 52px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  color: #1e3a8a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    background: linear-gradient(135deg, #2563eb 0%, #4f8cff 100%);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 10px 18px rgba(37, 99, 235, 0.22);
  }

  &.disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.result-tool-icon {
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.result-tool-label {
  font-size: 11px;
  line-height: 1;
}

.result-list-table {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 16px;
  border: 1px solid #dbeafe;
  background: #ffffff;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.7) rgba(226, 232, 240, 0.7);
}

.result-list-body {
  min-width: 640px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.7) transparent;
}

.result-list-table::-webkit-scrollbar {
  height: 6px;
}

.result-list-table::-webkit-scrollbar-track {
  background: rgba(226, 232, 240, 0.7);
  border-radius: 999px;
}

.result-list-table::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.8);
  border-radius: 999px;
}

.result-list-row {
  width: 100%;
  min-width: 640px;
  display: grid;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  text-align: left;
  border: none;
  background: transparent;
  box-sizing: border-box;

  span {
    font-size: 12px;
    color: #334155;
    white-space: nowrap;
  }
}

.result-list-row.head {
  position: static;
  z-index: 1;
  background: #eef4ff;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);

  span {
    color: #64748b;
    font-weight: 600;
  }
}

.result-list-row.body {
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  cursor: pointer;

  &:hover {
    background: rgba(37, 99, 235, 0.06);
  }

  &.active {
    background: rgba(37, 99, 235, 0.1);

    span {
      color: #1d4ed8;
      font-weight: 600;
    }
  }
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px 10px;
}

.modal-title,
.dialog-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.modal-tab-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  margin-bottom: 8px;
  border: 1px solid #d8e2ef;
  border-radius: 10px;
  background: #eef3f9;
}

.settings-dialog-layout {
  width: 100%;
  min-height: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.modal-tab {
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  @include ui.smart-otdr-secondary-button;
  color: #64748b;

  &.active {
    @include ui.smart-otdr-primary-button;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.16);
  }
}

.modal-body {
  flex: 1;
  min-height: 0;
  padding: 0 2px 4px 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.dialog-desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.dialog-btn.primary {
  padding: 0 18px;
  @include ui.smart-otdr-primary-button;
}

.dialog-btn.secondary {
  padding: 0 16px;
  @include ui.smart-otdr-secondary-button;
  color: #475569;
}

.smart-toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  z-index: 40;
  transform: translateX(-50%);
  max-width: calc(100vw - 48px);
  padding: 12px 18px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.88);
  color: #ffffff;
  font-size: 13px;
  line-height: 1.4;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.22);
}

@media (max-width: 768px) {
  .measure-proto-head {
    gap: 6px 10px;
    font-size: 12px;
  }

  .result-list-head,
  .dialog-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-tool-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .otdr-app-main {
    padding: 0;
  }

  .action-grid,
  .result-tool-row {
    grid-template-columns: 1fr;
  }

  .action-primary {
    grid-column: auto;
  }

  .measure-overview-top {
    flex-direction: column;
    align-items: stretch;
  }

  .measure-overview-badge {
    width: fit-content;
  }

  .measure-metric-grid,
  .measure-point-grid,
  .modal-head {
    flex-direction: column;
    align-items: flex-start;
  }

}

/* OTDR professional landscape workbench */
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
  background: #94a3b8;
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

.landscape-status.done .landscape-status__dot {
  background: #16a34a;
}

.otdr-workbench {
  width: 100%;
  height: auto;
  min-width: 0;
  min-height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  grid-template-rows: 320px minmax(190px, auto);
  grid-template-areas:
    'curve controls'
    'table table';
  align-content: start;
  gap: 12px 8px;
  padding-bottom: 4px;
}

.curve-workspace {
  grid-area: curve;
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #26364c;
  border-radius: 8px;
  background: #0b1423;
}

.workbench-curve-card {
  flex: 1;
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #0b1423;
  box-shadow: none;
  overflow: hidden;
}

.workbench-curve-card :deep(.card-head) {
  display: none;
}

.workbench-curve-card :deep(.curve-stage) {
  height: 100%;
  min-height: 0;
  border-radius: 0;
  box-shadow: none;
}

.workbench-curve-card :deep(.curve-svg) {
  height: 100%;
}

.workbench-curve-card :deep(.curve-toolbar) {
  gap: 6px;
  padding: 5px 8px;
  font-size: 10px;
}

.workbench-curve-card :deep(.curve-toolbar span) {
  padding: 3px 6px;
}

.workbench-curve-card :deep(.ab-pill) {
  top: 34px;
  right: 8px;
  padding: 4px 8px;
}

.curve-command-strip {
  flex: 0 0 40px;
  display: grid;
  grid-template-columns: repeat(9, minmax(42px, 1fr));
  gap: 4px;
  padding: 4px;
  border-top: 1px solid #26364c;
  background: #132238;
  overflow-x: auto;
}

.result-tool-btn {
  min-width: 42px;
  min-height: 28px;
  padding: 0 5px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 6px;
  flex-direction: row;
  gap: 3px;
  background: rgba(255, 255, 255, 0.04);
  color: #cbd5e1;
  box-shadow: none;
}

.result-tool-btn.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
  box-shadow: none;
}

.result-tool-icon,
.result-tool-label {
  font-size: 10px;
}

.measure-state-overlay {
  position: absolute;
  top: 48%;
  left: 50%;
  z-index: 5;
  min-width: 120px;
  transform: translate(-50%, -50%);
  padding: 10px 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  display: grid;
  justify-items: center;
  gap: 4px;
  background: rgba(11, 20, 35, 0.9);
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(2, 6, 23, 0.3);
}

.measure-state-overlay strong {
  font-size: 12px;
}

.measure-state-overlay span {
  color: #94a3b8;
  font-size: 10px;
}

.measure-state-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(148, 163, 184, 0.32);
  border-top-color: #60a5fa;
  border-radius: 50%;
}

.measure-state-overlay.running .measure-state-spinner {
  animation: otdr-spin 0.9s linear infinite;
}

.measure-state-overlay .state-progress {
  width: 112px;
  height: 5px;
  margin-top: 2px;
}

@keyframes otdr-spin {
  to { transform: rotate(360deg); }
}

.measure-control-rail {
  grid-area: controls;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #ffffff;
  overflow: hidden;
}

.rail-section-title {
  color: #0f172a;
  font-size: 11px;
  font-weight: 700;
}

.rail-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.rail-metric {
  min-width: 0;
  min-height: 32px;
  padding: 4px 7px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
  text-align: left;
}

button.rail-metric {
  cursor: pointer;
}

.rail-metric.wide {
  grid-column: 1 / -1;
}

.rail-metric strong {
  min-width: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail-ab-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.rail-ab-row > div {
  min-height: 30px;
  padding: 4px 7px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #eff6ff;
  color: #2563eb;
  font-size: 10px;
}

.rail-ab-row strong {
  color: #1e3a8a;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.measure-control-rail .action-primary,
.measure-control-rail .action-secondary {
  min-height: 36px;
  border-radius: 7px;
  font-size: 11px;
}

.measure-control-rail .action-primary {
  grid-column: auto;
  min-height: 38px;
}

.rail-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.result-list-card {
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

.result-list-head {
  min-height: 24px;
  margin: 0;
  padding: 0 4px 5px;
  flex-direction: row;
  align-items: center;
}

.result-list-title {
  font-size: 11px;
}

.result-list-mode {
  padding: 2px 7px;
  font-size: 9px;
}

.result-list-table {
  height: 150px;
  border-radius: 5px;
  overflow-x: auto;
  overflow-y: hidden;
}

.result-list-row {
  min-width: 620px;
  gap: 5px;
  padding: 5px 7px;
}

.result-list-body {
  min-width: 620px;
}

.result-list-row span {
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

  .otdr-workbench {
    grid-template-columns: minmax(0, 1fr) 164px;
    grid-template-rows: 320px minmax(190px, auto);
  }

  .measure-control-rail {
    padding: 8px;
  }

  .landscape-file-pill {
    display: none;
  }

  .curve-command-strip {
    grid-template-columns: repeat(9, 46px);
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

@media (prefers-reduced-motion: reduce) {
  .measure-state-overlay.running .measure-state-spinner {
    animation: none;
  }
}
</style>
