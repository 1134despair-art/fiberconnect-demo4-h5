<template>
  <div class="app-container">
    <div class="content-flex hide-scrollbar">
      <SmartOtdrPageShell :title="shellTitle" @back="handleShellBack">
      <div class="page-body">
          <details v-if="activeView === 'manager'" class="reports-disclosure"><summary>PDF 检测报告</summary><SmartOtdrReports /></details>
          <p v-if="legacyFilesAvailable" class="legacy-import"><button type="button" @click="importLegacyFiles">将旧版文件导入当前设备</button></p>
        <section v-if="activeView !== 'manager'" class="status-card">
          <div>
            <div class="status-title">{{ fileSettingsStatusTitle }}</div>
            <div class="status-sub">
              {{ fileSettingsStatusSub }}
            </div>
          </div>
          <div class="status-side">
            <div class="status-chip">文件工具</div>
            <div v-if="actionMessage" class="status-message">{{ actionMessage }}</div>
          </div>
        </section>

        <p v-if="activeView === 'manager' && actionMessage" class="status-message" role="status">{{ actionMessage }}</p>

        <nav class="breadcrumb" v-if="activeView === 'manager'">
          <span v-for="(item, index) in breadcrumbs" :key="item" class="crumb">
            {{ item }}<span v-if="index < breadcrumbs.length - 1"> / </span>
          </span>
        </nav>

        <section class="storage-switch" v-if="activeView === 'manager'">
          <button
            v-for="item in storageTabs"
            :key="item.key"
            class="storage-btn"
            :class="{ active: activeStorage === item.key }"
            type="button"
            @click="switchStorage(item.key)"
          >
            {{ item.label }}
          </button>
        </section>

        <section v-if="activeView === 'manager'" class="file-manager-shell">
          <section class="manager-overview-card">
            <div class="overview-head">
              <div>
                <div class="pane-title">{{ storageSummary.current }}</div>
              </div>

            </div>

            <div class="overview-grid">
              <div class="overview-metric">
                <span class="overview-label">已用空间</span>
                <strong>{{ storageSummary.used }}</strong>
              </div>
              <div class="overview-metric">
                <span class="overview-label">剩余空间</span>
                <strong>{{ storageSummary.free }}</strong>
              </div>
              <div class="overview-metric">
                <span class="overview-label">当前目录</span>
                <strong>{{ currentFolderName }}</strong>
              </div>
              <div class="overview-metric">
                <span class="overview-label">选中状态</span>
                <strong>{{ selectedNode ? '已选择 1 项' : '未选择' }}</strong>
              </div>
            </div>
          </section>

          <details class="manager-directory-card">
            <summary>文件目录</summary>


            <div class="tree-list manager-tree-list">
              <button
                v-for="folder in treeNodes"
                :key="folder.id"
                class="tree-node"
                :class="{ active: activeFolderId === folder.id }"
                :style="{ paddingLeft: `${16 + folder.depth * 18}px` }"
                type="button"
                @click="openFolder(folder.id)"
              >
                <span class="tree-icon"><img :src="smartOtdrIcons.folder" alt="" /></span>
                <span class="tree-label">{{ folder.name }}</span>
              </button>
            </div>
          </details>

          <section class="manager-files-card">
            <div class="pane-head">
              <div>
                <div class="pane-title">{{ currentFolderName }}</div>
              </div>
              <div class="selected-tag" v-if="selectedNode">
                已选：{{ selectedNode.name }}
              </div>
            </div>

            <div class="table-head">
              <span>文件名</span>
              <span>日期</span>
            </div>

            <div v-if="visibleNodes.length" class="table-body">
              <div
                v-for="node in visibleNodes"
                :key="node.id"
                class="file-row"
                :class="{ active: selectedNodeId === node.id }"
                role="button" tabindex="0" :aria-label="node.name" :aria-pressed="selectedNodeId === node.id"
                @keydown.enter.prevent="selectNode(node.id)" @keydown.space.prevent="selectNode(node.id)"
                @click="selectNode(node.id)"
                @dblclick="node.type === 'folder' ? openFolder(node.id) : undefined"
              >
                <div class="file-main">
                  <div class="file-line">
                    <span class="file-icon"><img :src="fileNodeIcon(node)" alt="" /></span>
                    <span class="file-name">{{ node.name }}</span>
                    <span v-if="loadedFileId === node.id" class="loaded-badge">已加载</span>
                  </div>
                  <div class="file-meta">{{ node.type === 'folder' ? '文件夹' : fileKindLabelMap[node.kind || 'other'] }}</div>
                </div>
                <div class="file-date">{{ node.updatedAt }}<button v-if="node.type === 'folder'" type="button" class="folder-open" :aria-label="'打开' + node.name" @click.stop="openFolder(node.id)">打开</button></div>
              </div>
            </div>

            <div v-else class="empty-state">
                  当前目录暂无文件
            </div>
          </section>

          <section class="manager-actions-card">
            <div class="pane-head">
              <div>
                <div class="pane-title">操作</div>
              </div>
            </div>

            <div class="action-grid">
              <button
                class="action-btn primary"
                type="button"
                :disabled="!canLoad"
                @click="loadSorFile"
              >
                加载
              </button>
              <button class="action-btn" type="button" :disabled="!selectedNode || selectedNode.type !== 'file'" @click="exportNode">导出</button>
              <button class="action-btn" type="button" :disabled="!selectedNode" @click="copyNode">复制</button>
              <button class="action-btn" type="button" :disabled="!selectedNode" @click="cutNode">剪切</button>
              <button class="action-btn" type="button" :disabled="!clipboardState.mode" @click="pasteNode">粘贴</button>
              <button class="action-btn" type="button" :disabled="!selectedNode" @click="renameNode">重命名</button>
              <button class="action-btn danger" type="button" :disabled="!selectedNode" @click="deleteNode">删除</button>
              <button class="action-btn" type="button" @click="openFileSettings">文件设置</button>
              <button class="action-btn back" type="button" @click="goBackByTreeState">返回</button>
            </div>
          </section>
        </section>

        <section v-else class="file-settings-shell">
          <div class="settings-topbar">
            <button
              class="settings-tab"
              :class="{ active: activeSettingsGroup === 'basic' }"
              type="button"
              @click="switchSettingsGroup('basic')"
            >
              基本设置
            </button>
            <button
              class="settings-tab"
              :class="{ active: activeSettingsGroup === 'advanced' }"
              type="button"
              @click="switchSettingsGroup('advanced')"
            >
              高级设置
            </button>
          </div>

          <section class="settings-editor-card">
            <div class="settings-card-head">
              <div>
                <div class="pane-title">{{ currentSettingMeta.label }}</div>
              </div>
              <div class="selected-tag" :class="{ dirty: fileSettingsDirty }">
                {{ fileSettingsDirty ? '未保存' : '已保存' }}
              </div>
            </div>

            <div class="settings-editor-body">
              <div v-if="activeSettingKey === 'storagePath'" class="editor-group smart-choice-grid">
                <button  type="button" class="smart-choice-button" :class="{ active: fileSettingsDraft.storagePath === 'internal' }" :aria-pressed="fileSettingsDraft.storagePath === 'internal'" @click="fileSettingsDraft.storagePath = 'internal'">内部存储</button>
                <button  type="button" class="smart-choice-button" :class="{ active: fileSettingsDraft.storagePath === 'sd' }" :aria-pressed="fileSettingsDraft.storagePath === 'sd'" @click="fileSettingsDraft.storagePath = 'sd'">SD卡</button>
                <button  type="button" class="smart-choice-button" :class="{ active: fileSettingsDraft.storagePath === 'usb' }" :aria-pressed="fileSettingsDraft.storagePath === 'usb'" @click="fileSettingsDraft.storagePath = 'usb'">U盘</button>
              </div>

              <div v-else-if="activeSettingKey === 'fileName'" class="editor-group">
                <input v-model="fileSettingsDraft.fileName" class="editor-input" type="text" />
              </div>

              <div v-else-if="activeSettingKey === 'fiberId'" class="editor-group">
                <input v-model="fileSettingsDraft.fiberId" class="editor-input" type="text" />
              </div>

              <div v-else-if="activeSettingKey === 'createFolderByDate'" class="editor-group">
                <label class="switch-row">
                  <input v-model="fileSettingsDraft.createFolderByDate" type="checkbox" />
                <span>按日期自动建目录</span>
                </label>
              </div>

              <div v-else-if="activeSettingKey === 'autoSave'" class="editor-group smart-choice-grid">
                <button  type="button" class="smart-choice-button" :class="{ active: fileSettingsDraft.autoSave }" :aria-pressed="fileSettingsDraft.autoSave" @click="fileSettingsDraft.autoSave = true">是</button>
                <button  type="button" class="smart-choice-button" :class="{ active: !fileSettingsDraft.autoSave }" :aria-pressed="!fileSettingsDraft.autoSave" @click="fileSettingsDraft.autoSave = false">否</button>
              </div>

              <div v-else-if="activeSettingKey === 'saveFormat'" class="editor-group smart-choice-grid">
                <button v-for="item in saveFormatOptions" :key="item.value" type="button" class="smart-choice-button" :class="{ active: fileSettingsDraft.saveFormat === item.value }" :aria-pressed="fileSettingsDraft.saveFormat === item.value" @click="fileSettingsDraft.saveFormat = item.value">{{ item.label }}</button>
              </div>

              <div v-else-if="activeSettingKey === 'namingRule'" class="editor-group smart-choice-grid">
                <button v-for="item in namingRuleOptions" :key="item.value" type="button" class="smart-choice-button" :class="{ active: fileSettingsDraft.namingRule === item.value }" :aria-pressed="fileSettingsDraft.namingRule === item.value" @click="fileSettingsDraft.namingRule = item.value">{{ item.label }}</button>
                <div class="rule-tip-list">
                  <div class="rule-tip-item">① 文件名</div>
                  <div class="rule-tip-item">② 波长</div>
                  <div class="rule-tip-item">③ 测量脉宽</div>
                  <div class="rule-tip-item">④ 光纤号</div>
                </div>
              </div>

              <div v-else-if="activeSettingKey === 'tester'" class="editor-group">
                <input v-model="fileSettingsDraft.tester" class="editor-input" type="text" />
              </div>

              <div v-else-if="activeSettingKey === 'taskId'" class="editor-group">
                <input v-model="fileSettingsDraft.taskId" class="editor-input" type="text" />
              </div>

              <div v-else-if="activeSettingKey === 'cableId'" class="editor-group">
                <input v-model="fileSettingsDraft.cableId" class="editor-input" type="text" />
              </div>

              <div v-else-if="activeSettingKey === 'startPoint'" class="editor-group">
                <input v-model="fileSettingsDraft.startPoint" class="editor-input" type="text" />
              </div>

              <div v-else-if="activeSettingKey === 'endPoint'" class="editor-group">
                <input v-model="fileSettingsDraft.endPoint" class="editor-input" type="text" />
              </div>

              <div v-else-if="activeSettingKey === 'direction'" class="editor-group smart-choice-grid">
                <button type="button" class="smart-choice-button" :class="{ active: fileSettingsDraft.direction === 'O>E' }" :aria-pressed="fileSettingsDraft.direction === 'O>E'" @click="fileSettingsDraft.direction = 'O>E'">O&gt;E</button>
                <button type="button" class="smart-choice-button" :class="{ active: fileSettingsDraft.direction === 'E>O' }" :aria-pressed="fileSettingsDraft.direction === 'E>O'" @click="fileSettingsDraft.direction = 'E>O'">E&gt;O</button>
              </div>

              <div v-else-if="activeSettingKey === 'comment'" class="editor-group">
                <input v-model="fileSettingsDraft.comment" class="editor-input" type="text" />
              </div>
            </div>
          </section>

          <section class="settings-list-card">
            <div class="pane-head settings-list-head">
              <div>
                <div class="pane-title">{{ activeSettingsGroup === 'basic' ? '基本设置项' : '高级设置项' }}</div>
              </div>
            </div>

            <div class="settings-menu-list settings-menu-list-card">
              <button
                v-for="item in currentSettingsMenu"
                :key="item.key"
                class="settings-menu-item"
                :class="{ active: activeSettingKey === item.key }"
                type="button"
                @click="activeSettingKey = item.key"
              >
                {{ item.label }}
              </button>
            </div>
          </section>

          <div class="settings-bottombar">
            <button class="bottom-btn primary" type="button" @click="saveFileSettings">保存</button>
            <button class="bottom-btn" type="button" @click="backToFileManager">返回</button>
          </div>
        </section>
      </div>
      </SmartOtdrPageShell>
    </div>
    <SmartOtdrDialogShell v-if="fileDialog" :title="fileDialog === 'rename' ? '重命名' : '删除文件'" :show-close="false" :max-width="360" @close="fileDialog = ''">
      <label v-if="fileDialog === 'rename'" class="file-dialog-field">文件名称<input v-model="renameDraft" class="editor-input" @keydown.enter="confirmRename" /></label>
      <p v-else class="file-dialog-message">确认删除 {{ fileDialogTarget?.name }} 吗？</p>
      <template #footer><div class="smart-dialog-actions"><button type="button" @click="fileDialog = ''">取消</button><button v-if="fileDialog === 'rename'" class="primary" type="button" :disabled="!renameDraft.trim()" @click="confirmRename">确认</button><button v-else class="danger" type="button" @click="confirmDelete">确认删除</button></div></template>
    </SmartOtdrDialogShell>
  </div>
</template>

<script setup lang="ts">
import { scopedKey } from '@/services/scopedStorage'
import { smartOtdrIcons } from '@/assets/icons/iconfont/smart-otdr'
import SmartOtdrDialogShell from '../components/SmartOtdrDialogShell.vue'
import SmartOtdrReports from '../components/SmartOtdrReports.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SmartOtdrPageShell from '../components/SmartOtdrPageShell.vue'

type StorageKey = 'internal' | 'sd' | 'usb'
type FileNodeType = 'folder' | 'file'
type FileKind = 'sor' | 'event-map' | 'loss-test' | 'other'
type FileModuleView = 'manager' | 'settings'
type FileSettingsGroup = 'basic' | 'advanced'
const saveFormatOptions = [
  { label: 'sor', value: 'sor' },
  { label: 'sor+pdf', value: 'sor+pdf' },
  { label: 'pdf', value: 'pdf' }
] as const
const namingRuleOptions = [
  { label: '①+④', value: '①+④' },
  { label: '①+②+④', value: '①+②+④' },
  { label: '①+②+③+④', value: '①+②+③+④' }
] as const
type SaveFormat = (typeof saveFormatOptions)[number]['value']
type NamingRule = (typeof namingRuleOptions)[number]['value']
type Direction = 'O>E' | 'E>O'
type FileSettingKey =
  | 'storagePath'
  | 'fileName'
  | 'fiberId'
  | 'createFolderByDate'
  | 'autoSave'
  | 'saveFormat'
  | 'namingRule'
  | 'tester'
  | 'taskId'
  | 'cableId'
  | 'startPoint'
  | 'endPoint'
  | 'direction'
  | 'comment'

interface FileNode {
  id: string
  name: string
  type: FileNodeType
  kind?: FileKind
  updatedAt: string
  parentId: string | null
  storage: StorageKey
  payload?: unknown
}

interface ClipboardState {
  mode: 'copy' | 'cut' | null
  nodeId: string | null
}

interface LoadedSmartOtdrFile {
  fileId: string
  name: string
  kind: 'sor' | 'event-map'
  updatedAt: string
  storage: StorageKey
  payload?: unknown
}

interface PersistedState {
  nodes: FileNode[]
  activeStorage: StorageKey
  activeFolderId: string
  selectedNodeId: string
  clipboardState: ClipboardState
  activeView: FileModuleView
  activeSettingsGroup: FileSettingsGroup
  activeSettingKey: FileSettingKey
  savedFileSettings: FileSettingsState
}

interface FileSettingsState {
  storagePath: 'internal' | 'sd' | 'usb'
  fileName: string
  fiberId: string
  createFolderByDate: boolean
  autoSave: boolean
  saveFormat: SaveFormat
  namingRule: NamingRule
  tester: string
  taskId: string
  cableId: string
  startPoint: string
  endPoint: string
  direction: Direction
  comment: string
}




const route = useRoute()
const router = useRouter()
const deviceId = String(route.params.id || '')
const SMART_OTDR_LOADED_FILE_KEY = scopedKey('otdr-loaded-file', deviceId)
const FILE_MANAGER_STATE_KEY = scopedKey('otdr-files', deviceId)

const legacyRaw = sessionStorage.getItem('smart-otdr-file-manager-state') || localStorage.getItem('smart-otdr-file-manager-state')
const legacyFilesAvailable = ref(!!legacyRaw && !localStorage.getItem(scopedKey('otdr-legacy-imported', deviceId)))
const importLegacyFiles = () => {
 try {
  const legacy = JSON.parse(legacyRaw || '{}')
  if (!Array.isArray(legacy.nodes)) throw new Error('invalid')
  const combined = normalizeNodesForManager([...nodes.value, ...legacy.nodes.filter((n: FileNode) => !nodes.value.some(current => current.id === n.id))])
  localStorage.setItem(FILE_MANAGER_STATE_KEY, JSON.stringify({ nodes: combined, activeStorage: activeStorage.value, activeFolderId: activeFolderId.value, savedFileSettings: savedFileSettings.value }))
  nodes.value = combined
  localStorage.setItem(scopedKey('otdr-legacy-imported', deviceId), 'true')
  legacyFilesAvailable.value = false; actionMessage.value = '旧版文件已导入，原文件保留'
 } catch { actionMessage.value = '导入失败，原文件保留，请检查存储空间或文件格式' }
}

const storageTabs = [
  { key: 'internal' as StorageKey, label: '内部存储' },
  { key: 'sd' as StorageKey, label: 'SD卡' },
  { key: 'usb' as StorageKey, label: 'U盘' }
]

const storageUsageMap: Record<StorageKey, { label: string; used: string; free: string }> = {
  internal: { label: '内部存储', used: '1.8GB', free: '6.2GB' },
  sd: { label: 'SD卡', used: '4.4GB', free: '27.6GB' },
  usb: { label: 'U盘', used: '2.1GB', free: '13.9GB' }
}

const fileKindLabelMap: Record<FileKind, string> = {
  sor: 'SOR文件',
  'event-map': '事件地图',
  'loss-test': '损耗测试',
  other: '其他文件'
}

const isStorageKey = (value: unknown): value is StorageKey =>
  value === 'internal' || value === 'sd' || value === 'usb'

const isSaveFormat = (value: unknown): value is SaveFormat =>
  saveFormatOptions.some(item => item.value === value)

const getFileKindByName = (name: string): FileKind => {
  const lowerName = name.toLowerCase()
  if (lowerName.endsWith('.sor')) return 'sor'
  if (lowerName.endsWith('.json')) return 'event-map'
  if (lowerName.endsWith('.csv')) return 'loss-test'
  return 'other'
}

const fileNodeIcon = (node: FileNode): string => {
  if (node.type === 'folder') return smartOtdrIcons.folder
  if (/\.pdf$/i.test(node.name)) return smartOtdrIcons.pdf
  if (/\.(png|jpe?g|webp)$/i.test(node.name)) return smartOtdrIcons.image
  if (getFileKindByName(node.name) === 'sor') return smartOtdrIcons.measure
  if (getFileKindByName(node.name) === 'event-map') return smartOtdrIcons.event
  return smartOtdrIcons.file
}

const normalizeNode = (node: FileNode): FileNode => ({
  ...node,
  kind: node.type === 'file' ? getFileKindByName(node.name) : node.kind
})

const isLoadableOtdrFile = (node: FileNode | null) =>
  !!node
  && node.type === 'file'
  && ['sor', 'event-map'].includes(getFileKindByName(node.name))

const normalizeNodesForManager = (items: FileNode[]) => {
  const blockedFolderIds = new Set(
    items
      .filter(node => node.type === 'folder' && (node.name === '损耗测试' || node.id.includes('loss')))
      .map(node => node.id)
  )

  return items
    .filter(node => {
      if (node.type === 'file' && getFileKindByName(node.name) === 'loss-test') return false
      if (blockedFolderIds.has(node.id)) return false
      if (node.parentId && blockedFolderIds.has(node.parentId)) return false
      return true
    })
    .map(normalizeNode)
}

const createDefaultFileSettings = (): FileSettingsState => ({
  storagePath: 'internal',
  fileName: 'OTDR',
  fiberId: 'Fiber-01',
  createFolderByDate: true,
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
})

const normalizeDirection = (value: unknown): Direction => {
  if (value === 'E>O' || value === 'reverse') return 'E>O'
  return 'O>E'
}

const normalizeNamingRule = (value: unknown): NamingRule => {
  if (value === '①+④' || value === 'time') return '①+④'
  if (value === '①+②+④' || value === 'prefix-time') return '①+②+④'
  if (value === '①+②+③+④' || value === 'task-time') return '①+②+③+④'
  return '①+④'
}

const normalizeFileSettings = (value?: Partial<FileSettingsState> & {
  storagePath?: string
  saveFormat?: string
  namingRule?: string
  direction?: string
}): FileSettingsState => {
  const defaults = createDefaultFileSettings()

  return {
    storagePath: isStorageKey(value?.storagePath) ? value.storagePath : defaults.storagePath,
    fileName: typeof value?.fileName === 'string' ? value.fileName : defaults.fileName,
    fiberId: typeof value?.fiberId === 'string' ? value.fiberId : defaults.fiberId,
    createFolderByDate: typeof value?.createFolderByDate === 'boolean' ? value.createFolderByDate : defaults.createFolderByDate,
    autoSave: typeof value?.autoSave === 'boolean' ? value.autoSave : defaults.autoSave,
    saveFormat: isSaveFormat(value?.saveFormat) ? value.saveFormat : defaults.saveFormat,
    namingRule: normalizeNamingRule(value?.namingRule),
    tester: typeof value?.tester === 'string' ? value.tester : defaults.tester,
    taskId: typeof value?.taskId === 'string' ? value.taskId : defaults.taskId,
    cableId: typeof value?.cableId === 'string' ? value.cableId : defaults.cableId,
    startPoint: typeof value?.startPoint === 'string' ? value.startPoint : defaults.startPoint,
    endPoint: typeof value?.endPoint === 'string' ? value.endPoint : defaults.endPoint,
    direction: normalizeDirection(value?.direction),
    comment: typeof value?.comment === 'string' ? value.comment : defaults.comment
  }
}

const createDefaultNodes = (): FileNode[] => {
  const items: FileNode[] = [
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
  ]

  return normalizeNodesForManager(items)
}

const nodes = ref<FileNode[]>(createDefaultNodes())
const activeStorage = ref<StorageKey>('internal')
const activeFolderId = ref('internal-root')
const selectedNodeId = ref('')
const activeView = ref<FileModuleView>('manager')
const activeSettingsGroup = ref<FileSettingsGroup>('basic')
const activeSettingKey = ref<FileSettingKey>('storagePath')
const clipboardState = ref<ClipboardState>({
  mode: null,
  nodeId: null
})
const actionMessage = ref('')
const loadedFileId = ref('')
const fileSettingsDraft = ref<FileSettingsState>(normalizeFileSettings())
const savedFileSettings = ref<FileSettingsState>(normalizeFileSettings())

const basicSettingsMenu = [
  { key: 'storagePath' as FileSettingKey, label: '存储路径' },
  { key: 'fileName' as FileSettingKey, label: '文件名' },
  { key: 'fiberId' as FileSettingKey, label: '光纤号' },
  { key: 'createFolderByDate' as FileSettingKey, label: '按日期创建文件夹' },
  { key: 'autoSave' as FileSettingKey, label: '自动保存' },
  { key: 'saveFormat' as FileSettingKey, label: '存储格式' },
  { key: 'namingRule' as FileSettingKey, label: '文件命名方式' },
  { key: 'tester' as FileSettingKey, label: '测试员' }
]

const advancedSettingsMenu = [
  { key: 'taskId' as FileSettingKey, label: '任务号' },
  { key: 'cableId' as FileSettingKey, label: '光缆编号' },
  { key: 'startPoint' as FileSettingKey, label: '起点' },
  { key: 'endPoint' as FileSettingKey, label: '终点' },
  { key: 'direction' as FileSettingKey, label: '方向' },
  { key: 'comment' as FileSettingKey, label: '注释' }
]

const getNodeById = (id: string) => nodes.value.find(node => node.id === id) ?? null

const currentFolder = computed(() => getNodeById(activeFolderId.value))
const currentFolderName = computed(() => currentFolder.value?.name ?? '--')
const selectedNode = computed(() => getNodeById(selectedNodeId.value))
const visibleNodes = computed(() => {
  const folderList = nodes.value
    .filter(node => node.parentId === activeFolderId.value)
    .sort((left, right) => {
      if (left.type !== right.type) return left.type === 'folder' ? -1 : 1
      return left.name.localeCompare(right.name, 'zh-CN')
    })
  return folderList
})
const canLoad = computed(() => isLoadableOtdrFile(selectedNode.value))
const currentSettingsMenu = computed(() =>
  activeSettingsGroup.value === 'basic' ? basicSettingsMenu : advancedSettingsMenu
)
const currentSettingMeta = computed(() =>
  [...basicSettingsMenu, ...advancedSettingsMenu].find(item => item.key === activeSettingKey.value) ?? basicSettingsMenu[0]
)
const fileSettingsDirty = computed(
  () => JSON.stringify(fileSettingsDraft.value) !== JSON.stringify(savedFileSettings.value)
)
const fileSettingsStatusTitle = computed(() => `文件设置 · ${activeSettingsGroup.value === 'basic' ? '基本设置' : '高级设置'}`)
const fileSettingsStatusSub = computed(() =>
  `当前配置项 ${currentSettingMeta.value.label} · ${fileSettingsDirty.value ? '存在未保存修改' : '已保存到本地'}`
)
const shellTitle = computed(() => (activeView.value === 'manager' ? '文件管理' : '文件设置'))

const getRootFolderId = (storage: StorageKey) => `${storage}-root`

const getFolderPath = (folderId: string) => {
  const result: string[] = ['文件管理']
  let cursor = getNodeById(folderId)
  const chain: string[] = []

  while (cursor) {
    chain.unshift(cursor.name)
    cursor = cursor.parentId ? getNodeById(cursor.parentId) : null
  }

  return result.concat(chain)
}

const breadcrumbs = computed(() => getFolderPath(activeFolderId.value))

const storageSummary = computed(() => {
  const meta = storageUsageMap[activeStorage.value]
  return {
    current: meta.label,
    used: meta.used,
    free: meta.free
  }
})

const buildTreeNodes = (parentId: string | null, depth: number): Array<FileNode & { depth: number }> => {
  const folders = nodes.value
    .filter(node => node.storage === activeStorage.value && node.type === 'folder' && node.parentId === parentId)
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))

  return folders.flatMap(folder => [{ ...folder, depth }, ...buildTreeNodes(folder.id, depth + 1)])
}

const treeNodes = computed(() => buildTreeNodes(null, 0))

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

const getChildren = (parentId: string) => nodes.value.filter(node => node.parentId === parentId)

const collectDescendantIds = (id: string): string[] => {
  const children = getChildren(id)
  return [id, ...children.flatMap(child => collectDescendantIds(child.id))]
}

const isDescendantFolder = (possibleParentId: string, sourceId: string) => {
  const descendants = collectDescendantIds(sourceId)
  return descendants.includes(possibleParentId)
}

const getUniqueName = (baseName: string, parentId: string, storage: StorageKey, ignoreId?: string) => {
  const siblings = nodes.value.filter(node => node.parentId === parentId && node.storage === storage && node.id !== ignoreId)
  if (!siblings.some(node => node.name === baseName)) return baseName

  const dotIndex = baseName.lastIndexOf('.')
  const hasExt = dotIndex > 0
  const namePart = hasExt ? baseName.slice(0, dotIndex) : baseName
  const extPart = hasExt ? baseName.slice(dotIndex) : ''
  let index = 1
  let nextName = `${namePart}(${index})${extPart}`

  while (siblings.some(node => node.name === nextName)) {
    index += 1
    nextName = `${namePart}(${index})${extPart}`
  }

  return nextName
}

const cloneNodeTree = (sourceId: string, newParentId: string, targetStorage: StorageKey): FileNode[] => {
  const source = getNodeById(sourceId)
  if (!source) return []

  const nextId = createId()
  const clonedNode: FileNode = {
    ...source,
    id: nextId,
    parentId: newParentId,
    storage: targetStorage,
    name: getUniqueName(source.name, newParentId, targetStorage)
  }

  const childClones = getChildren(sourceId).flatMap(child => cloneNodeTree(child.id, nextId, targetStorage))
  return [normalizeNode(clonedNode), ...childClones]
}

const moveNodeTree = (sourceId: string, newParentId: string, targetStorage: StorageKey) => {
  const ids = collectDescendantIds(sourceId)
  const idSet = new Set(ids)
  const source = getNodeById(sourceId)
  if (!source) return

  nodes.value = nodes.value.map(node => {
    if (!idSet.has(node.id)) return node

    if (node.id === sourceId) {
      return {
        ...node,
        parentId: newParentId,
        storage: targetStorage,
        name: getUniqueName(node.name, newParentId, targetStorage, node.id)
      }
    }

    return {
      ...node,
      storage: targetStorage
    }
  })
}

const readLoadedFile = () => {
  const raw = localStorage.getItem(SMART_OTDR_LOADED_FILE_KEY)
  if (!raw) {
    loadedFileId.value = ''
    return
  }

  try {
    const parsed = JSON.parse(raw) as LoadedSmartOtdrFile
    loadedFileId.value = parsed.fileId
  } catch {
    loadedFileId.value = ''
  }
}

const restoreFileManagerState = () => {
  const raw = localStorage.getItem(FILE_MANAGER_STATE_KEY)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw) as PersistedState
    if (Array.isArray(parsed.nodes) && parsed.nodes.length) {
      nodes.value = normalizeNodesForManager(parsed.nodes as FileNode[])
    }
    if (parsed.activeStorage) {
      activeStorage.value = parsed.activeStorage
    }
    if (parsed.activeFolderId && getNodeById(parsed.activeFolderId)) {
      activeFolderId.value = parsed.activeFolderId
    } else {
      activeFolderId.value = getRootFolderId(activeStorage.value)
    }
    if (parsed.selectedNodeId && getNodeById(parsed.selectedNodeId)) {
      selectedNodeId.value = parsed.selectedNodeId
    }
    if (parsed.clipboardState) {
      clipboardState.value = parsed.clipboardState
    }
    if (parsed.activeView) {
      activeView.value = parsed.activeView
    }
    if (parsed.activeSettingsGroup) {
      activeSettingsGroup.value = parsed.activeSettingsGroup
    }
    if (parsed.activeSettingKey) {
      activeSettingKey.value = parsed.activeSettingKey
    }
    if (parsed.savedFileSettings) {
      const normalizedSettings = normalizeFileSettings(parsed.savedFileSettings)
      savedFileSettings.value = normalizedSettings
      fileSettingsDraft.value = JSON.parse(JSON.stringify(normalizedSettings)) as FileSettingsState
    }
  } catch {
    nodes.value = createDefaultNodes()
  }
}

restoreFileManagerState()
readLoadedFile()

if (savedFileSettings.value.storagePath) {
  activeStorage.value = savedFileSettings.value.storagePath
  const currentFolderNode = getNodeById(activeFolderId.value)
  if (!currentFolderNode || currentFolderNode.storage !== activeStorage.value) {
    activeFolderId.value = getRootFolderId(activeStorage.value)
  }
}

watch(
  [nodes, activeStorage, activeFolderId, selectedNodeId, clipboardState, activeView, activeSettingsGroup, activeSettingKey, savedFileSettings],
  () => {
    const payload: PersistedState = {
      nodes: nodes.value,
      activeStorage: activeStorage.value,
      activeFolderId: activeFolderId.value,
      selectedNodeId: selectedNodeId.value,
      clipboardState: clipboardState.value,
      activeView: activeView.value,
      activeSettingsGroup: activeSettingsGroup.value,
      activeSettingKey: activeSettingKey.value,
      savedFileSettings: savedFileSettings.value
    }
    try { localStorage.setItem(FILE_MANAGER_STATE_KEY, JSON.stringify(payload)) }
    catch { actionMessage.value = '文件操作未保存，存储空间不足，请导出后重试' }
  },
  { deep: true }
)

const selectNode = (id: string) => {
  selectedNodeId.value = id
  actionMessage.value = ''
}

const openFolder = (id: string) => {
  const target = getNodeById(id)
  if (!target || target.type !== 'folder') return
  activeFolderId.value = target.id
  selectedNodeId.value = target.id
  actionMessage.value = ''
}

const switchStorage = (key: StorageKey) => {
  activeStorage.value = key
  activeFolderId.value = getRootFolderId(key)
  selectedNodeId.value = ''
  actionMessage.value = ''
}

const openFileSettings = () => {
  activeView.value = 'settings'
  actionMessage.value = ''
}

const switchSettingsGroup = (group: FileSettingsGroup) => {
  activeSettingsGroup.value = group
  activeSettingKey.value = group === 'basic' ? 'storagePath' : 'taskId'
}

const backToFileManager = () => {
  activeView.value = 'manager'
  actionMessage.value = ''
}

const handleShellBack = () => {
  if (activeView.value === 'settings') {
    backToFileManager()
    return
  }

  router.push(`/device/${deviceId}`)
}

const copyNode = () => {
  if (!selectedNode.value) return
  clipboardState.value = { mode: 'copy', nodeId: selectedNode.value.id }
  actionMessage.value = `已复制 ${selectedNode.value.name}`
}

const cutNode = () => {
  if (!selectedNode.value) return
  clipboardState.value = { mode: 'cut', nodeId: selectedNode.value.id }
  actionMessage.value = `已剪切 ${selectedNode.value.name}`
}

const pasteNode = () => {
  const { mode, nodeId } = clipboardState.value
  if (!mode || !nodeId) return

  const source = getNodeById(nodeId)
  if (!source) return

  if (source.type === 'folder' && isDescendantFolder(activeFolderId.value, source.id)) {
    actionMessage.value = '不能粘贴到自身子目录中'
    return
  }

  if (mode === 'copy') {
    nodes.value = [...nodes.value, ...cloneNodeTree(nodeId, activeFolderId.value, activeStorage.value)]
    actionMessage.value = '已完成复制粘贴'
  } else {
    moveNodeTree(nodeId, activeFolderId.value, activeStorage.value)
    actionMessage.value = '已完成剪切粘贴'
  }

  clipboardState.value = { mode: null, nodeId: null }
  selectedNodeId.value = ''
}

const fileDialog = ref<'' | 'rename' | 'delete'>('')
const fileDialogTargetId = ref('')
const renameDraft = ref('')
const fileDialogTarget = computed(() => getNodeById(fileDialogTargetId.value))
const renameNode = () => {
  if (!selectedNode.value) return
  fileDialogTargetId.value = selectedNode.value.id
  renameDraft.value = selectedNode.value.name
  fileDialog.value = 'rename'
}
const deleteNode = () => {
  if (!selectedNode.value) return
  fileDialogTargetId.value = selectedNode.value.id
  fileDialog.value = 'delete'
}
const confirmRename = () => {
  const nextName = renameDraft.value.trim()
  if (!nextName || !fileDialogTarget.value) return
  const index = nodes.value.findIndex(node => node.id === fileDialogTargetId.value)
  if (index < 0) return

  const current = nodes.value[index]
  const parentId = current.parentId ?? getRootFolderId(current.storage)

  nodes.value[index] = {
    ...current,
    name: getUniqueName(nextName, parentId, current.storage, current.id)
  }
  nodes.value[index] = normalizeNode(nodes.value[index])

  actionMessage.value = '重命名成功'
  fileDialog.value = ''
}

const confirmDelete = () => {
  if (!fileDialogTarget.value) return
  const ids = collectDescendantIds(fileDialogTargetId.value)
  nodes.value = nodes.value.filter(node => !ids.includes(node.id))

  if (ids.includes(loadedFileId.value)) {
    localStorage.removeItem(SMART_OTDR_LOADED_FILE_KEY)
    loadedFileId.value = ''
  }

  selectedNodeId.value = ''
  actionMessage.value = '删除成功'
  fileDialog.value = ''
}

const goBackByTreeState = () => {
  const folder = currentFolder.value
  if (folder?.parentId) {
    openFolder(folder.parentId)
    return
  }

  router.push(`/device/${deviceId}`)
}

const loadSorFile = () => {
  if (!isLoadableOtdrFile(selectedNode.value)) return
  const fileNode = selectedNode.value
  if (!fileNode) return

  const payload: LoadedSmartOtdrFile = {
    fileId: fileNode.id,
    name: fileNode.name,
    kind: fileNode.kind === 'event-map' ? 'event-map' : 'sor',
    updatedAt: fileNode.updatedAt,
    storage: fileNode.storage,
    payload: fileNode.payload
  }

  localStorage.setItem(SMART_OTDR_LOADED_FILE_KEY, JSON.stringify(payload))
  loadedFileId.value = payload.fileId
  router.push(fileNode.kind === 'event-map'
    ? `/device/${deviceId}/event-map`
    : `/device/${deviceId}/smart-otdr`)
}

const exportNode = () => {
  const fileNode = selectedNode.value
  if (!fileNode || fileNode.type !== 'file') return

  const exportPayload = JSON.stringify({
    format: 'smart-otdr-demo-export-v1',
    notice: '前端交互演示数据，不是 IEC 标准 SOR 文件',
    deviceId,
    file: {
      name: fileNode.name,
      type: fileKindLabelMap[fileNode.kind || 'other'],
      updatedAt: fileNode.updatedAt,
      storage: storageUsageMap[fileNode.storage].label,
      payload: fileNode.payload || null
    }
  }, null, 2)
  const blob = new Blob([exportPayload], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${fileNode.name.replace(/\.[^.]+$/, '')}.demo.json`
  anchor.click()
  URL.revokeObjectURL(url)
  actionMessage.value = '演示数据已导出为 JSON（非标准 SOR）'
}

const saveFileSettings = () => {
  savedFileSettings.value = JSON.parse(JSON.stringify(fileSettingsDraft.value)) as FileSettingsState
  activeStorage.value = savedFileSettings.value.storagePath
  activeFolderId.value = getRootFolderId(savedFileSettings.value.storagePath)
  selectedNodeId.value = ''
  actionMessage.value = '文件设置已保存'
}
</script>

<style scoped lang="scss">
@use '../components/smartOtdrChoices.scss';
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

.page-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-card,
.storage-switch {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 22px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.status-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  position: relative;
  overflow: hidden;
}

.status-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg, #2563eb 0%, #60a5fa 100%);
}

.status-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.status-sub,
.breadcrumb,
.pane-desc,
.file-meta,
.file-date {
  font-size: 13px;
  color: #64748b;
}

.status-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-chip,
.loaded-badge,
.selected-tag {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-chip {
  background: #eff6ff;
  color: #1d4ed8;
}

.status-message {
  font-size: 12px;
  color: #1d4ed8;
  max-width: 160px;
  text-align: right;
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 6px;
}

.storage-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 12px;
  align-items: center;
}

.storage-btn {
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 14px;
  background: #f8fbff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 14px;
  cursor: pointer;
}

.storage-btn.active {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
}

.file-manager-shell,
.file-settings-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.manager-overview-card,
.manager-directory-card,
.manager-files-card,
.manager-actions-card,
.settings-editor-card,
.settings-list-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 22px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.pane-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.overview-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 12px 16px 16px;
}

.overview-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.overview-label {
  font-size: 12px;
  color: #64748b;
}

.overview-metric strong {
  font-size: 16px;
  color: #0f172a;
}

.tree-list {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
}

.manager-tree-list {
  padding-bottom: 10px;
}

.settings-menu-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  border: none;
  background: transparent;
  color: #334155;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.tree-node.active {
  background: linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%);
  color: #1d4ed8;
  font-weight: 700;
}

.settings-menu-item {
  width: 100%;
  min-height: 46px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  padding: 0 14px;
  cursor: pointer;
}

.settings-menu-item.active {
  background: linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%);
  border-color: #bfdbfe;
  color: #1d4ed8;
  font-weight: 700;
}

.settings-topbar,
.settings-bottombar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.settings-tab,
.bottom-btn {
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  background: #f8fbff;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.settings-tab.active,
.bottom-btn.primary {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
}

.settings-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 0;
}

.settings-list-head {
  border-bottom: none;
}

.settings-menu-list-card {
  padding: 0 16px 14px;
}

.tree-icon {
  width: 14px;
  color: #64748b;
}

.tree-label {
  min-width: 0;
  word-break: break-all;
}

.selected-tag {
  background: #eff6ff;
  color: #1d4ed8;
}

.selected-tag.dirty {
  background: #fff7ed;
  color: #c2410c;
}

.table-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px;
  gap: 16px;
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.table-body {
  display: flex;
  flex-direction: column;
}

.file-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  cursor: pointer;
}

.file-row.active {
  background: #eff6ff;
}

.file-main {
  min-width: 0;
}

.file-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  min-width: 0;
}

.file-icon {
  color: #64748b;
  flex: 0 0 auto;
}

.file-name {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  text-align: left;
  word-break: break-all;
}

.loaded-badge {
  background: #dcfce7;
  color: #047857;
  flex: 0 0 auto;
}

.empty-state {
  padding: 48px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 12px 16px 16px;
}

.settings-editor-body {
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-group {
  width: 100%;
}

.editor-input,
.editor-textarea {
  width: 100%;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  color: #0f172a;
  outline: none;
  background: #fff;
}

.editor-textarea {
  resize: vertical;
  min-height: 132px;
}

.editor-input:focus,
.editor-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.radio-row,
.switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  font-size: 14px;
  color: #334155;
}

.rule-tip-list {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fbff;
  border: 1px solid rgba(37, 99, 235, 0.08);
}

.rule-tip-item {
  font-size: 13px;
  line-height: 1.8;
  color: #475569;
}

.action-btn {
  min-height: 48px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 14px;
  background: #f8fbff;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.action-btn.primary {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
}

.action-btn:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
  background: #f8fafc;
  border-color: #e2e8f0;
}

.action-btn:not(:disabled):hover {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.action-btn.danger:not(:disabled) {
  color: #dc2626;
  background: #fff7ed;
  border-color: rgba(251, 146, 60, 0.18);
}

.action-btn.back {
  grid-column: 1 / -1;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

@media (max-width: 1024px) {
  .table-head,
  .file-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .status-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-side {
    align-items: flex-start;
  }

  .status-message {
    max-width: none;
    text-align: left;
  }

  .settings-card-head {
    flex-direction: column;
  }

  .settings-topbar,
  .settings-bottombar {
    grid-template-columns: 1fr;
  }

  .overview-grid,
  .action-grid {
    grid-template-columns: 1fr;
  }

  .settings-editor-card,
  .settings-list-card {
    border-radius: 18px;
  }
}

/* Compact file browser: one page surface, no decorative nested cards. */
.app-container { background: #f7f9fc; }
.page-body { gap: 10px; padding: 14px; }
.status-card,
.storage-switch,
.manager-overview-card,
.manager-directory-card,
.manager-files-card,
.manager-actions-card,
.settings-editor-card,
.settings-list-card {
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: none;
}
.status-card { min-height: 60px; padding: 10px 12px; }
.status-card::before { width: 3px; background: #2563eb; }
.status-title { margin-bottom: 2px; font-size: 14px; }
.status-sub,
.breadcrumb,
.pane-desc,
.file-meta,
.file-date { font-size:12px; }
.status-side { flex-direction: row; align-items: center; }
.status-chip,
.loaded-badge,
.selected-tag { padding: 4px 8px; border-radius: 6px; font-size:12px; }
.breadcrumb { padding: 0 2px; }
.storage-switch { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 4px; background: #eef3f9; }
.storage-btn { min-height: 40px; padding: 0 6px; border: 0; border-radius: 8px; background: transparent; font-size: 11px; }
.storage-btn.active { background: #2563eb; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.16); }
.file-manager-shell,
.file-settings-shell { gap: 10px; }
.overview-head,
.pane-head { padding: 11px 12px; }
.overview-head { padding-bottom: 0; }
.pane-title { font-size: 14px; }
.overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; margin: 10px 12px 12px; padding: 0; overflow: hidden; border: 1px solid #d8e2ef; border-radius: 10px; }
.overview-metric { min-height: 52px; justify-content: center; gap: 3px; padding: 8px 10px; border: 0; border-right: 1px solid #d8e2ef; border-bottom: 1px solid #d8e2ef; border-radius: 0; background: #ffffff; }
.overview-metric:nth-child(2n) { border-right: 0; }
.overview-metric:nth-last-child(-n + 2) { border-bottom: 0; }
.overview-label { font-size:12px; }
.overview-metric strong { font-size: 13px; }
.tree-node { min-height: 44px; font-size: 12px; }
.table-head { grid-template-columns: minmax(0, 1fr) 88px; gap: 8px; padding: 10px 12px; font-size:12px; }
.file-row { grid-template-columns: minmax(0, 1fr) 88px; gap: 8px; padding: 10px 12px; }
.settings-menu-item,
.settings-tab,
.bottom-btn,
.action-btn { min-height: 44px; border-radius: 8px; font-size: 12px; }

@media (max-width: 768px) {
  .status-card { flex-direction: row; align-items: center; }
  .status-side { align-items: center; }
  .status-message { max-width: 120px; text-align: right; }
  .overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .table-head,
  .file-row { grid-template-columns: minmax(0, 1fr) 88px; }
  .settings-topbar,
  .settings-bottombar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .settings-editor-card,
  .settings-list-card { border-radius: 12px; }
}

.file-dialog-field { display:grid;gap:10px;font-size:13px;color:#334155; }.file-dialog-field input { width:100%;min-height:44px; }.file-dialog-message { font-size:14px;line-height:1.7;color:#475569;overflow-wrap:anywhere; }

.tree-icon { width:22px;flex:0 0 22px; }
.tree-icon img, .file-icon img { display:block;width:22px;height:22px;object-fit:contain;flex-shrink:0; }
.reports-disclosure { order:5;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px; }
.reports-disclosure summary,.manager-directory-card summary {min-height:44px;display:flex;align-items:center;font-size:14px;font-weight:600;cursor:pointer;}
.page-body {display:flex;flex-direction:column;gap:12px;}
.manager-overview-card {padding:12px;}.overview-grid {grid-template-columns:repeat(2,minmax(0,1fr));}
.overview-metric:nth-child(n+3) {display:none;}.manager-directory-card {padding:4px 12px;}
.manager-tree-list {max-height:200px;overflow:auto;}.file-row {min-height:64px;}.file-row:focus-visible {outline:2px solid #2563eb;outline-offset:-2px;}
.folder-open,.legacy-import button {min-height:44px;border:1px solid #dbe5f0;background:#eff6ff;color:#1d4ed8;border-radius:8px;cursor:pointer;}
.manager-actions-card {position:static;box-shadow:none;}
.manager-files-card .table-body {max-height:320px;overflow:auto;}.manager-actions-card .action-grid {grid-template-columns:repeat(3,minmax(0,1fr));}.manager-actions-card .action-btn {min-height:44px;}
.file-date {display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:6px;}
.folder-open {display:block;min-width:44px;flex-shrink:0;}
.overview-head .pane-title {white-space:nowrap;}
</style>
