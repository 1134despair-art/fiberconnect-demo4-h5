<template>
  <PortableOtdrVfl v-if="isPortableOtdr && currentDevice" :device="currentDevice" />
  <SmartOtdrVfl v-else-if="isSmartOtdr && currentDevice" :device="currentDevice" />
  <div v-else class="app-container legacy-operation-page">
    <header class="header">
      <button class="back-btn" type="button" @click="goBack">← {{ t('common.back') }}</button>
      <div class="page-title">{{ $t('device.vfl.title') }}</div>
    </header>

    <div class="content-flex hide-scrollbar">
      <div class="page-body">
        <section class="panel-card status-card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">{{ $t('device.vfl.status') }}</h3>
              <div class="section-desc">{{ pageDescription }}</div>
            </div>
            <div class="status-badge" :class="{ on: vflSettings.status !== 'off' }">
              {{ getModeText() }}
            </div>
          </div>

          <div class="light-screen" :class="{ active: vflSettings.status !== 'off' }">
            <div class="screen-head">
              <span>VFL</span>
              <span>{{ getModeText() }}</span>
            </div>

            <div class="screen-body">
              <div class="laser-graphic" :class="{ active: vflSettings.status !== 'off' }">
                <img
                  :src="vflSettings.status !== 'off' ? vflActiveImg : vflDisabledImg"
                  alt="Laser"
                  class="laser-icon"
                />
                <span class="laser-line"></span>
              </div>

              <div class="screen-reading">
                <span class="reading-wave">650</span>
                <span class="reading-unit">nm</span>
              </div>
            </div>

            <div class="screen-warning">
              {{ vflSettings.status !== 'off' ? '激光发射中，请勿直射人眼！' : '红光源已关闭，开启后开始输出。' }}
            </div>
          </div>
        </section>

        <section class="panel-card action-card">
          <div class="card-title-row action-head">
            <div>
              <h3 class="section-title">{{ $t('device.vfl.control') }}</h3>
              <div class="section-desc">{{ actionDescription }}</div>
            </div>
          </div>

          <div v-if="!isMultiOpm && !isSmartOtdr" class="action-grid">
            <button class="action-btn primary" type="button" @click="setVflMode(vflSettings.status === 'off' ? 'on' : 'off')">
              {{ vflSettings.status === 'off' ? $t('device.vfl.modeOn') : $t('device.vfl.modeOff') }}
            </button>
            <button class="action-btn" type="button" @click="setVflMode('1hz')">1Hz</button>
            <button class="action-btn" type="button" @click="setVflMode('2hz')">2Hz</button>
          </div>

          <template v-else-if="isMultiOpm">
            <div class="action-grid">
              <button class="action-btn primary" type="button" @click="setVflMode(vflSettings.status === 'off' ? 'on' : 'off')">
                {{ vflSettings.status === 'off' ? t('deviceDetail.steady') : $t('device.vfl.modeOff') }}
              </button>
              <button class="action-btn" type="button" @click="setLightColor(vflSettings.color === 'red' ? 'green' : 'red')">
                {{ vflSettings.color === 'red' ? t('deviceDetail.greenLight') : t('deviceDetail.redLight') }}
              </button>
              <button class="action-btn" type="button" @click="setVflMode('1hz')">{{ t('deviceDetail.slowFlash') }}</button>
              <button class="action-btn" type="button" @click="setVflMode('2hz')">{{ t('deviceDetail.fastFlash') }}</button>
            </div>
          </template>

          <div v-else class="action-grid">
            <button class="action-btn primary" type="button" @click="setVflMode(vflSettings.status === 'on' ? 'off' : 'on')">
              {{ vflSettings.status === 'on' ? $t('device.vfl.modeOff') : t('deviceDetail.steady') }}
            </button>
            <button class="action-btn" type="button" @click="setVflMode('2hz')">2Hz</button>
            <button class="action-btn" type="button" @click="setVflMode('off')">{{ $t('device.vfl.modeOff') }}</button>
          </div>
        </section>

        <section class="panel-card history-card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">{{ $t('device.vfl.history') }}</h3>
              <div class="section-desc">{{ $t('device.fusionRecords.totalRecords', { count: usageRecords.length }) }}</div>
            </div>
          </div>

          <div v-if="usageRecords.length === 0" class="empty-records">
            <div class="empty-icon">
              <span class="iconify" data-icon="mdi:history"></span>
            </div>
            <div class="empty-text">{{ $t('device.fusionRecords.empty') }}</div>
          </div>

          <div v-else class="records-list">
            <div
              v-for="(record, index) in paginatedRecords"
              :key="record.id"
              class="record-card-item"
            >
              <div class="record-info">
                <div class="record-main-row">
                  <span class="record-index">#{{ (currentPage - 1) * pageSize + index + 1 }}</span>
                  <span class="record-mode">{{ getRecordModeLabel(record.mode) }}</span>
                </div>
                <div class="record-sub-row">
                  <span class="record-tag">{{ $t('device.vfl.duration') }}: {{ record.duration }}</span>
                  <span class="record-time">{{ record.startTime }}</span>
                </div>
              </div>
              <button type="button" class="delete-icon-btn" @click="deleteRecord(record.id)">
                <span class="iconify" data-icon="fluent:delete-24-regular"></span>
              </button>
            </div>
          </div>

          <div v-if="usageRecords.length > 0" class="records-footer">
            <div class="pagination">
              <button type="button" class="page-btn" :disabled="currentPage === 1" @click="prevPage">
                {{ $t('device.fusionRecords.prevPage') || '上一页' }}
              </button>
              <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
              <button type="button" class="page-btn" :disabled="currentPage === totalPages" @click="nextPage">
                {{ $t('device.fusionRecords.nextPage') || '下一页' }}
              </button>
            </div>

            <button type="button" class="clear-btn" :disabled="usageRecords.length === 0" @click="clearAllRecords">
              {{ $t('device.fusionRecords.clear') }}
            </button>
          </div>
        </section>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="handleCancel">
      <div class="modal-content confirm-modal" @click.stop>
        <div class="modal-body">
          <div class="modal-title">{{ modalOptions.title }}</div>
          <div class="confirm-message">{{ modalOptions.message }}</div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="handleCancel">
            {{ modalOptions.cancelText || t('common.cancel') }}
          </button>
          <div class="footer-divider"></div>
          <button
            type="button"
            class="btn-confirm"
            :style="{ backgroundColor: modalOptions.confirmColor }"
            @click="handleConfirm"
          >
            {{ modalOptions.confirmText || t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth, type Device } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { useModal } from '@/composables/useModal'
import vflActiveImg from '@/assets/img/vfl-active-v2.png'
import vflDisabledImg from '@/assets/img/vfl-disabled-v2.png'
import SmartOtdrVfl from './SmartOtdrVfl.vue'
import PortableOtdrVfl from '../portable-otdr/PortableOtdrVfl.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { user } = useAuth()
const { showModal, modalOptions, confirm, handleConfirm, handleCancel } = useModal()

// 响应式数据
const vflSettings = reactive({
  status: 'off', // 'off', 'on', '1hz', '2hz'
  frequency: 0,
  color: 'red' as 'red' | 'green'
})

const currentDevice = computed<Device | null>(() => {
  const deviceId = route.params.id as string
  if (!deviceId) return null
  return user.value?.devices?.find(d => d.id === deviceId) || null
})

const isMultiOpm = computed(() => currentDevice.value?.deviceType === 'multi_opm_meter')
const isPortableOtdr = computed(() => currentDevice.value?.deviceType === 'portable_otdr')
const isSmartOtdr = computed(() => currentDevice.value?.deviceType === 'smart_otdr')

const currentColorText = computed(() => {
  if (!isMultiOpm.value) return ''
  return vflSettings.color === 'green' ? t('deviceDetail.greenLight') : t('deviceDetail.redLight')
})

const pageDescription = computed(() => {
  if (isMultiOpm.value) {
    return `${currentColorText.value}模式下支持开启、切换颜色与频率模式。`
  }

  if (isSmartOtdr.value) {
    return '默认关闭，开启后输出当前红光源。'
  }

  return '支持关闭、常亮、1Hz 和 2Hz 模式切换。'
})

const actionDescription = computed(() => {
  if (isMultiOpm.value) return '支持独立开启、切换颜色和频率模式。'
  if (isSmartOtdr.value) return '支持常亮、2Hz 和关闭模式切换。'
  return '支持独立开启和频率切换。'
})

// 使用记录
const usageRecords = ref([
  {
    id: 1,
    mode: 'continuous',
    duration: '00:05:23',
    startTime: '2024-12-25 10:30:15'
  },
  {
    id: 2,
    mode: '1hz',
    duration: '00:03:45',
    startTime: '2024-12-25 10:25:30'
  },
  {
    id: 3,
    mode: '2hz',
    duration: '00:02:18',
    startTime: '2024-12-25 10:20:45'
  }
])

// 分页相关
const currentPage = ref(1)
const pageSize = 5

// 当前使用会话
const currentSession = ref<{
  startTime: Date
  mode: string
} | null>(null)

// 定时器
let sessionTimer: ReturnType<typeof setInterval> | null = null

const totalPages = computed(() => Math.ceil(usageRecords.value.length / pageSize))

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return usageRecords.value.slice(start, end)
})

/**
 * 返回上一页
 */
const goBack = () => {
  router.back()
}

/**
 * 获取模式文本
 */
const getModeText = () => {
  if (isMultiOpm.value) {
    if (vflSettings.status === 'off') return t('device.vfl.modeOff')
    const colorText = vflSettings.color === 'green' ? t('deviceDetail.greenLight') : t('deviceDetail.redLight')
    const modeText = vflSettings.status === 'on'
      ? t('deviceDetail.steady')
      : (vflSettings.status === '1hz' ? t('deviceDetail.slowFlash') : t('deviceDetail.fastFlash'))
    return `${colorText} · ${modeText}`
  }
  switch (vflSettings.status) {
    case 'off':
      return t('device.vfl.modeOff')
    case 'on':
      return t('device.vfl.continuous')
    case '1hz':
      return t('device.vfl.flash1hz')
    case '2hz':
      return t('device.vfl.flash2hz')
    case 'cw':
      return 'CW'
    default:
      return t('home.unknownStatus')
  }
}

/**
 * 获取记录模式的显示文本
 */
const getRecordModeLabel = (mode: string) => {
  switch (mode) {
    case 'continuous':
      return t('device.vfl.continuous')
    case '1hz':
      return t('device.vfl.flash1hz')
    case '2hz':
      return t('device.vfl.flash2hz')
    case 'cw':
      return 'CW'
    default:
      return mode
  }
}

/**
 * 设置VFL模式
 */
const setVflMode = (mode: string) => {
  // 结束当前会话
  endCurrentSession()
  
  // 设置新模式
  vflSettings.status = mode
  
  switch (mode) {
    case 'off':
      vflSettings.frequency = 0
      break
    case 'on':
      vflSettings.frequency = 0
      startNewSession('continuous')
      break
    case '1hz':
      vflSettings.frequency = 1
      startNewSession('1hz')
      break
    case '2hz':
      vflSettings.frequency = 2
      startNewSession('2hz')
      break
    case 'cw':
      vflSettings.frequency = 270
      startNewSession('cw')
      break
  }
}

const setLightColor = (color: 'red' | 'green') => {
  vflSettings.color = color
}

/**
 * 开始新的使用会话
 */
const startNewSession = (mode: string) => {
  currentSession.value = {
    startTime: new Date(),
    mode: mode
  }
  
  // 启动定时器（每秒更新一次，用于记录使用时长）
  sessionTimer = setInterval(() => {
    // 这里可以添加实时更新逻辑
  }, 1000)
}

/**
 * 结束当前会话
 */
const endCurrentSession = () => {
  if (currentSession.value && sessionTimer) {
    const endTime = new Date()
    const duration = endTime.getTime() - currentSession.value.startTime.getTime()
    const durationStr = formatDuration(duration)
    
    // 添加使用记录
    const newRecord = {
      id: Date.now(),
      mode: currentSession.value.mode,
      duration: durationStr,
      startTime: currentSession.value.startTime.toLocaleString()
    }
    
    usageRecords.value.unshift(newRecord)
    
    // 清理
    clearInterval(sessionTimer)
    sessionTimer = null
    currentSession.value = null
  }
}

/**
 * 格式化持续时间
 */
const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * 删除记录
 */
const deleteRecord = async (recordId: number) => {
  const confirmed = await confirm(t('device.fusionRecords.confirmDelete'), t('device.fusionRecords.delete'))
  if (confirmed) {
    const index = usageRecords.value.findIndex(r => r.id === recordId)
    if (index !== -1) {
      usageRecords.value.splice(index, 1)
      
      // 检查当前页是否还有数据，如果没有则跳转到前一页
      if (paginatedRecords.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    }
  }
}

/**
 * 清空所有记录
 */
const clearAllRecords = async () => {
  const confirmed = await confirm(t('device.fusionRecords.confirmClear'), t('device.fusionRecords.clear'))
  if (confirmed) {
    usageRecords.value = []
    currentPage.value = 1
  }
}

/**
 * 上一页
 */
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

/**
 * 下一页
 */
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

onMounted(() => {
  // 初始化时设置为关闭状态
  vflSettings.status = 'off'
  vflSettings.frequency = 0
})

onUnmounted(() => {
  // 组件卸载时结束当前会话
  endCurrentSession()
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(10px);
}

.back-btn {
  position: absolute;
  left: 16px;
  border: none;
  background: none;
  color: #2563eb;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.content-flex {
  flex: 1;
  overflow-y: auto;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.page-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.44);
  backdrop-filter: blur(2px);
  box-sizing: border-box;
}

.modal-content {
  width: 100%;
  max-width: 300px;
  overflow: hidden;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
}

.confirm-modal .modal-body {
  padding: 20px 20px 18px;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
}

.confirm-message {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
  text-align: center;
}

.modal-footer {
  display: flex;
  align-items: stretch;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 48px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  color: #64748b;
}

.btn-confirm {
  color: #ffffff;
}

.footer-divider {
  width: 1px;
  background: rgba(148, 163, 184, 0.18);
}

.panel-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(37, 99, 235, 0.08);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.card-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-title-group {
  min-width: 0;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.section-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}

.status-badge {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.status-badge.on {
  background: #dcfce7;
  color: #047857;
}

.light-screen {
  margin-top: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #07162f 0%, #0b2144 100%);
  color: #dbe7ff;
  padding: 16px;
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.12);
}

.light-screen.active {
  box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.2);
}

.screen-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: rgba(219, 231, 255, 0.78);
}

.screen-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 24px 0 20px;
}

.laser-graphic {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 110px;
}

.laser-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  opacity: 0.7;
}

.laser-line {
  flex: 1;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(248, 113, 113, 0.9) 0%, rgba(248, 113, 113, 0.25) 100%);
}

.laser-graphic.active .laser-icon {
  opacity: 1;
}

.laser-graphic.active .laser-line {
  background: linear-gradient(90deg, rgba(248, 113, 113, 1) 0%, rgba(248, 113, 113, 0.45) 100%);
}

.screen-reading {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 6px;
}

.reading-wave {
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
  color: #f8fbff;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

.reading-unit {
  font-size: 16px;
  font-weight: 700;
  color: #7dd3fc;
}

.screen-warning {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.2);
  color: #fde68a;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.action-head {
  margin-bottom: 14px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.action-btn,
.page-btn,
.clear-btn,
.delete-icon-btn {
  border: none;
  cursor: pointer;
}

.action-btn {
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid #dbeafe;
  background: #f8fbff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
}

.action-btn.primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.empty-records {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.record-card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fbff;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-main-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.record-index {
  flex-shrink: 0;
  min-width: 32px;
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
}

.record-mode {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.record-sub-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.record-tag {
  padding: 3px 8px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.14);
  font-size: 12px;
  color: #475569;
}

.record-time {
  font-size: 12px;
  color: #94a3b8;
}

.delete-icon-btn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #fff1f2;
  color: #e11d48;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.records-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.page-btn {
  min-height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  background: #f8fbff;
  border: 1px solid #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #64748b;
}

.clear-btn {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  background: #2563eb;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .card-title-row,
  .screen-body,
  .records-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .laser-graphic,
  .screen-reading {
    width: 100%;
  }

  .screen-reading {
    justify-content: flex-start;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
