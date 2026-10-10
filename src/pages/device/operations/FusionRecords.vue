<template>
  <div class="app-container legacy-operation-page">
    <!-- 顶部标题栏 -->
    <WorkspaceHeader :title="t('device.fusionRecords.title')" @back="goBack" />

    <!-- 主内容区域 -->
    <div class="content-flex hide-scrollbar">
      <div class="p-4">
        <!-- 记录统计 -->
        <div class="stats-card mb-4">
          <div class="stats-header">
            <h3 class="section-title">{{ t('device.fusionRecords.stats') }}</h3>
            <div class="record-count">{{ t('device.fusionRecords.totalRecords', { count: fusionRecords.length }) }}</div>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">{{ t('device.fusionRecords.todayFusion') }}</div>
              <div class="stat-value">{{ todayCount }}次</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">{{ t('device.fusionRecords.avgLoss') }}</div>
              <div class="stat-value">{{ averageLoss }}dB</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">{{ t('device.fusionRecords.successRate') }}</div>
              <div class="stat-value">{{ successRate }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">{{ t('device.fusionRecords.totalTime') }}</div>
              <div class="stat-value">{{ totalTime }}</div>
            </div>
          </div>
        </div>

        <!-- 记录列表 -->
        <div class="records-card">
          <div class="records-header">
            <h3 class="section-title">{{ t('device.fusionRecords.title') }}</h3>
            <div class="header-actions">
              <button @click="showExportModal = true" class="export-btn" :disabled="fusionRecords.length === 0">
                {{ t('device.fusionRecords.export') }}
              </button>
            </div>
          </div>

          <div v-if="fusionRecords.length === 0" class="empty-records">
            <div class="empty-icon">
              <DeviceIcon class="iconify" name="mdi:history" />
            </div>
            <div class="empty-text">{{ t('device.fusionRecords.empty') }}</div>
          </div>

          <div v-else class="records-list-container">
            <!-- 批量操作栏 -->
            <div class="batch-operations">
              <div class="select-all">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                    class="checkbox-input"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">{{ t('device.fusionRecords.selectAll') }}</span>
                </label>
              </div>
              <div class="batch-actions">
                <button
                  @click="batchDelete"
                  class="batch-delete-btn"
                  :disabled="selectedRecords.length === 0"
                >
                  {{ t('device.fusionRecords.batchDelete', { count: selectedRecords.length }) }}
                </button>
              </div>
            </div>

            <!-- 列表卡片 -->
            <div class="records-list">
              <div
                v-for="(record, index) in paginatedRecords"
                :key="record.id"
                class="record-item-card"
                :class="{ selected: selectedRecords.includes(record.id) }"
              >
                <!-- 顶部：选择框 + 序号 + 程序名 + 时间 -->
                <div class="card-top-row">
                  <div class="checkbox-wrapper">
                    <label class="checkbox-label">
                      <input
                        type="checkbox"
                        :checked="selectedRecords.includes(record.id)"
                        @change="toggleSelectRecord(record.id)"
                        class="checkbox-input"
                      />
                      <span class="checkbox-custom"></span>
                    </label>
                  </div>
                  <div class="seq-num">#{{ (currentPage - 1) * pageSize + index + 1 }}</div>
                  <div class="program-name">{{ record.program }}</div>
                  <div class="record-time">{{ formatTime(record.time) }}</div>
                </div>

                <!-- 中部：损耗 + 状态 -->
                <div class="card-mid-row">
                  <div class="loss-info">
                    <span class="label">{{ t('device.fusionRecords.loss') }}:</span>
                    <span class="value">{{ record.loss }}dB</span>
                  </div>
                  <div class="mode-info">
                    <span class="label">{{ t('device.fusionRecords.mode') }}:</span>
                    <span class="value">{{ record.fusionMode }}</span>
                  </div>
                </div>

                <!-- 底部：操作按钮 -->
                <div class="card-actions">
                  <button @click="viewRecordDetail(record)" class="detail-btn">{{ t('device.fusionRecords.detail') }}</button>
                  <button @click="deleteRecord(record.id)" class="delete-btn">{{ t('device.fusionRecords.delete') }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页和操作 -->
          <div v-if="fusionRecords.length > 0" class="records-footer">
            <div class="pagination">
              <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">上一页</button>
              <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
              <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">下一页</button>
            </div>

            <div class="bulk-actions">
              <button @click="clearAllRecords" class="clear-btn">{{ t('device.fusionRecords.clear') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 记录详情弹窗 -->
    <div v-if="showRecordDetail" class="modal-overlay" @click="showRecordDetail = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('device.fusionRecords.detail') }}</h3>
          <button @click="showRecordDetail = false" class="modal-close-text">{{ t('common.close') }}</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedRecord" class="record-detail">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">{{ t('device.fusionRecords.fiberType') }}</span>
                <span class="detail-value">{{ selectedRecord.fiberType }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('device.fusionRecords.programNo') }}</span>
                <span class="detail-value">{{ selectedRecord.program }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('device.fusionRecords.fusionMode') }}</span>
                <span class="detail-value">{{ selectedRecord.fusionMode }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('device.fusionRecords.leftAngle') }}</span>
                <span class="detail-value">{{ selectedRecord.leftAngle }}°</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('device.fusionRecords.rightAngle') }}</span>
                <span class="detail-value">{{ selectedRecord.rightAngle }}°</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('device.fusionRecords.loss') }}</span>
                <span class="detail-value">{{ selectedRecord.loss }}dB</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('device.fusionRecords.fusionTime') }}</span>
                <span class="detail-value">{{ selectedRecord.time }}</span>
              </div>
            </div>

            <!-- 查看图像按钮 -->
            <div class="image-section">
              <button @click="viewFusionImage" class="view-image-btn" :disabled="isLoadingImage">
                {{ isLoadingImage ? t('common.loading') : t('device.fusionRecords.viewImage') }}
              </button>
              <div class="image-note">
                <DeviceIcon class="iconify" name="mdi:information" />
                <span>{{ t('device.fusionRecords.imageLoading') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="exportFeedback" class="export-feedback" role="status">{{ exportFeedback }}</p>
    <!-- 导出弹窗 -->
    <div v-if="showExportModal" class="modal-overlay" @click="showExportModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('device.fusionRecords.export') }}</h3>
          <button @click="showExportModal = false" class="modal-close-text">{{ t('common.close') }}</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-info"><p>本次导出 {{ exportRecords.length }} 条{{ selectedRecords.length ? '已选' : '全部' }}记录</p>


            </div>

            <div class="export-format">
              <h4 class="format-title">{{ t('device.fusionRecords.exportFormat') }}</h4>
              <div class="format-options">
                <label class="radio-label">
                  <input type="radio" v-model="exportFormat" value="csv" class="radio-input" />
                  <span class="radio-custom"></span>
                  <span class="radio-text">CSV格式</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="exportFormat" value="excel" class="radio-input" />
                  <span class="radio-custom"></span>
                  <span class="radio-text">Excel（XML）</span>
                </label>
              </div>
            </div>

            <div class="export-actions">
              <button @click="performExport" class="export-confirm-btn" :disabled="isExporting || !exportRecords.length">
                {{ isExporting ? t('device.fusionRecords.exporting') : t('device.fusionRecords.startExport') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图像查看弹窗 -->
    <div v-if="showImageModal" class="modal-overlay" @click="showImageModal = false">
      <div class="modal-content image-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">熔接图像</h3>
          <button @click="showImageModal = false" class="modal-close-text">{{ t('common.close') }}</button>
        </div>
        <div class="modal-body">
          <div class="image-container">
            <img v-if="imageUrl" :src="imageUrl" alt="熔接图像" class="fusion-image" @error="imageUrl = ''" /><div v-else class="image-placeholder">
              <DeviceIcon class="iconify image-icon" name="mdi:image" />
              <div class="image-text">设备尚未提供此记录的图像</div>
              <div class="image-info">

                <div>拍摄时间: {{ selectedRecord?.time }}</div>
              </div>
            </div>

            <div class="download-section">
              <button @click="downloadImage" class="download-btn" :disabled="!imageUrl || isLoadingImage">
                <DeviceIcon class="iconify" name="mdi:download" />
                {{ t('device.fusionRecords.downloadImage') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <FusionFunctionNav />
  </div>
</template>

<script setup lang="ts">
import FusionFunctionNav from '../components/FusionFunctionNav.vue'
import WorkspaceHeader from '@/components/WorkspaceHeader.vue'
import DeviceIcon from '@/components/DeviceIcon.vue'
import { ref, computed, watch } from 'vue'
import { downloadBlob, recordsCsv, recordsExcelXml } from '@/services/downloads'
import { scopedKey, readStored } from '@/services/scopedStorage'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const exportFeedback = ref('')
const imageUrl = ref('')
const recordsKey = scopedKey('fusion-records', String(route.params.id))

// 响应式数据
const showRecordDetail = ref(false)
const showExportModal = ref(false)
const showImageModal = ref(false)
const isLoadingImage = ref(false)
const isExporting = ref(false)
const exportFormat = ref('csv')

// 选中的记录
const selectedRecords = ref<number[]>([])
const selectedRecord = ref<any>(null)

// 熔接记录数据
const initialRecords = [
  {
    id: 1,
    program: 'SM-01',
    loss: 0.02,
    time: '2024-12-25 10:30:15',
    fiberType: 'SM',
    fusionMode: '自动',
    leftAngle: 0.5,
    rightAngle: 0.8,
    duration: '00:02:15'
  },
  {
    id: 2,
    program: 'SM-01',
    loss: 0.05,
    time: '2024-12-25 10:25:30',
    fiberType: 'SM',
    fusionMode: '自动',
    leftAngle: 1.2,
    rightAngle: 0.9,
    duration: '00:02:08'
  },
  {
    id: 3,
    program: 'SM-01',
    loss: 0.03,
    time: '2024-12-25 10:20:45',
    fiberType: 'SM',
    fusionMode: '手动',
    leftAngle: 0.7,
    rightAngle: 1.1,
    duration: '00:03:22'
  },
  {
    id: 4,
    program: 'SM-01',
    loss: 0.04,
    time: '2024-12-25 09:15:20',
    fiberType: 'SM',
    fusionMode: '自动',
    leftAngle: 0.9,
    rightAngle: 0.6,
    duration: '00:02:45'
  },
  {
    id: 5,
    program: 'SM-01',
    loss: 0.06,
    time: '2024-12-24 16:45:10',
    fiberType: 'SM',
    fusionMode: '自动',
    leftAngle: 1.5,
    rightAngle: 1.3,
    duration: '00:02:30'
  }
]
const fusionRecords = ref(readStored<typeof initialRecords>(recordsKey, initialRecords))
watch(fusionRecords, value => { try { localStorage.setItem(recordsKey, JSON.stringify(value)) } catch { exportFeedback.value = '记录未保存，存储空间不足' } }, { deep: true })
const exportRecords = computed(() => selectedRecords.value.length ? fusionRecords.value.filter(r => selectedRecords.value.includes(r.id)) : fusionRecords.value)

// 分页相关
const currentPage = ref(1)
const pageSize = 5

// 计算属性
const totalPages = computed(() => Math.ceil(fusionRecords.value.length / pageSize))

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return fusionRecords.value.slice(start, end)
})

const isAllSelected = computed(() => {
  return paginatedRecords.value.length > 0 &&
         paginatedRecords.value.every(record => selectedRecords.value.includes(record.id))
})

const todayCount = computed(() => {
  const today = new Date().toDateString()
  return fusionRecords.value.filter(record =>
    new Date(record.time).toDateString() === today
  ).length
})

const averageLoss = computed(() => {
  if (fusionRecords.value.length === 0) return '0.00'
  const total = fusionRecords.value.reduce((sum, record) => sum + record.loss, 0)
  return (total / fusionRecords.value.length).toFixed(2)
})

const successRate = computed(() => {
  if (fusionRecords.value.length === 0) return '0'
  const successCount = fusionRecords.value.filter(record => record.loss <= 0.05).length
  return Math.round((successCount / fusionRecords.value.length) * 100)
})

const totalTime = computed(() => {
  // 简化计算，假设每次熔接平均2.5分钟
  const totalMinutes = fusionRecords.value.length * 2.5
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.floor(totalMinutes % 60)
  return `${hours}h${minutes}m`
})


/**
 * 格式化时间显示
 */
const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

/**
 * 返回上一页
 */
const goBack = () => {
  router.back()
}

/**
 * 切换全选
 */
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消选中当前页所有记录
    paginatedRecords.value.forEach(record => {
      const index = selectedRecords.value.indexOf(record.id)
      if (index > -1) {
        selectedRecords.value.splice(index, 1)
      }
    })
  } else {
    // 选中当前页所有记录
    paginatedRecords.value.forEach(record => {
      if (!selectedRecords.value.includes(record.id)) {
        selectedRecords.value.push(record.id)
      }
    })
  }
}

/**
 * 切换单个记录选择
 */
const toggleSelectRecord = (recordId: number) => {
  const index = selectedRecords.value.indexOf(recordId)
  if (index > -1) {
    selectedRecords.value.splice(index, 1)
  } else {
    selectedRecords.value.push(recordId)
  }
}

/**
 * 批量删除
 */
const batchDelete = () => {
  if (selectedRecords.value.length === 0) return

  if (confirm(t('device.fusionRecords.confirmBatchDelete', { count: selectedRecords.value.length }))) {
    // 删除选中的记录
    selectedRecords.value.forEach(recordId => {
      const index = fusionRecords.value.findIndex(r => r.id === recordId)
      if (index > -1) {
        fusionRecords.value.splice(index, 1)
      }
    })

    // 清空选择
    selectedRecords.value = []

    // 检查当前页是否还有数据，如果没有则跳转到前一页
    if (paginatedRecords.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  }
}

/**
 * 查看记录详情
 */
const viewRecordDetail = (record: any) => {
  selectedRecord.value = record
  showRecordDetail.value = true
}

/**
 * 查看熔接图像
 */
const viewFusionImage = async () => {
  imageUrl.value = selectedRecord.value?.imageUrl || ''
  showImageModal.value = true
}
const downloadImage = async () => {
 if (!imageUrl.value || isLoadingImage.value) return
 isLoadingImage.value = true
 try {
  const response = await fetch(imageUrl.value)
  if (!response.ok) throw new Error('download failed')
  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) throw new Error('invalid image')
  downloadBlob(blob, `熔接图像_${selectedRecord.value?.id}.${blob.type === 'image/png' ? 'png' : 'jpg'}`)
 } catch { exportFeedback.value = '图像下载失败，请重试' }
 finally { isLoadingImage.value = false }
}
const performExport = async () => {
 if (isExporting.value) return
 if (!exportRecords.value.length) { exportFeedback.value = '暂无可导出的记录'; return }
 isExporting.value = true
 try {
  const rows: unknown[][] = [['记录编号','程序','光纤类型','熔接模式','损耗(dB)','左角度(°)','右角度(°)','时长','时间'], ...exportRecords.value.map(r => [r.id,r.program,r.fiberType,r.fusionMode,r.loss,r.leftAngle,r.rightAngle,r.duration,r.time])]
  const excel = exportFormat.value === 'excel'
  const content = excel ? recordsExcelXml(rows) : recordsCsv(rows)
  downloadBlob(new Blob([content], {type: excel ? 'application/xml;charset=utf-8' : 'text/csv;charset=utf-8'}), `熔接记录_${Date.now()}.${excel ? 'xml' : 'csv'}`)
  exportFeedback.value = `已发起下载，共 ${exportRecords.value.length} 条记录`
  showExportModal.value = false
 } catch { exportFeedback.value = '导出失败，请重试' }
 finally { isExporting.value = false }
}

/**
 * 删除单条记录
 */
const deleteRecord = (recordId: number) => {
  if (confirm(t('device.fusionRecords.confirmDelete'))) {
    const index = fusionRecords.value.findIndex(r => r.id === recordId)
    if (index !== -1) {
      fusionRecords.value.splice(index, 1)

      // 从选中列表中移除
      const selectedIndex = selectedRecords.value.indexOf(recordId)
      if (selectedIndex > -1) {
        selectedRecords.value.splice(selectedIndex, 1)
      }

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
const clearAllRecords = () => {
  if (confirm(t('device.fusionRecords.confirmClear'))) {
    fusionRecords.value = []
    selectedRecords.value = []
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
</script>
<style scoped>
.export-feedback {position:absolute;bottom:92px;left:16px;right:16px;padding:12px;background:#eff6ff;color:#1d4ed8;border-radius:10px;font-size:14px;z-index:60;pointer-events:none}.fusion-image{width:100%;height:auto}.download-btn:disabled{opacity:.45;}
.app-container {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%);
  overflow: hidden;
}

.content-flex {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.p-4 {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

/* 顶部标题栏 */
.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  height: 56px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: none;
  border-bottom: 1px solid #E5E7EB;
  z-index: 10;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 16px;
  background: none;
  border: none;
  color: #2563EB; /* 主色 */
  font-size: 16px;
  cursor: pointer;
  padding: 8px 0;
  font-weight: 500;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937; /* 深灰 */
  margin: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

/* 统计卡片 */
.stats-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.record-count {
  font-size: 12px;
  color: #6B7280;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #F9FAFB;
  border-radius: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #1F2937;
}

/* 记录卡片 */
.records-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.records-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.export-btn {
  background: #2563EB; /* 全局主色 */
  border: none;
  border-radius: 8px; /* 8px 圆角 */
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 16px;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-records {
  text-align: center;
  padding: 40px;
  color: #6B7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
}

/* 批量操作 */
.batch-operations {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #E5E7EB;
  margin-bottom: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
  background: white;
}

.checkbox-input:checked + .checkbox-custom {
  background: #2563EB;
  border-color: #2563EB;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: -1px;
  left: 3px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-text {
  font-size: 14px;
  color: #374151;
}

.batch-delete-btn {
  background: #FEE2E2;
  border: none;
  border-radius: 4px;
  color: #991B1B;
  font-size: 12px;
  cursor: pointer;
  padding: 6px 12px;
}

.batch-delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 记录列表 (卡片式) */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-item-card {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.record-item-card.selected {
  background: #EFF6FF;
  border-color: #BFDBFE;
}

.card-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.seq-num {
  font-weight: 600;
  color: #9CA3AF;
  width: 24px;
}

.program-name {
  font-weight: 600;
  color: #1F2937;
  flex: 1;
}

.record-time {
  font-size: 12px;
  color: #6B7280;
}

.card-mid-row {
  display: flex;
  justify-content: space-between;
  padding: 0 36px; /* Align with content, skipping checkbox/seq */
  font-size: 13px;
}

.loss-info, .mode-info {
  display: flex;
  gap: 4px;
}

.loss-info .value {
  color: #1F2937;
  font-weight: 600;
}

.mode-info .value {
  color: #4B5563;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid #E5E7EB;
}

.detail-btn {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  color: #2563EB;
  font-size: 12px;
  cursor: pointer;
  padding: 6px 16px;
}

.delete-btn {
  background: #FEE2E2;
  border: none;
  border-radius: 4px;
  color: #991B1B;
  font-size: 12px;
  cursor: pointer;
  padding: 6px 16px;
}

/* 分页和操作 */
.records-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E5E7EB;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-btn {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  color: #6B7280;
  font-size: 12px;
  cursor: pointer;
  padding: 6px 12px;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #6B7280;
}

.clear-btn {
  background: white;
  border: 1px solid #FECACA;
  border-radius: 4px;
  color: #DC2626;
  font-size: 12px;
  cursor: pointer;
  padding: 6px 12px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px; /* 8px 圆角 */
  width: 90%;
  max-width: 340px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); /* 阴影 */
}

.image-modal {
  max-width: 340px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center; /* 标题居中 */
  position: relative;
  padding: 20px;
  border-bottom: none;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

.modal-close-text {
  position: absolute;
  right: 20px;
  top: 20px;
  background: #F9FAFB;
  border: none;
  color: #6B7280;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  padding: 4px 8px;
}

.modal-close-text:hover {
  background: #F9FAFB;
}

.modal-body {
  padding: 0 20px 20px 20px;
}

/* 记录详情 */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #F9FAFB;
  border-radius: 4px;
}

.detail-label {
  font-size: 12px;
  color: #6B7280;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.image-section {
  text-align: center;
  border-top: 1px solid #E5E7EB;
  padding-top: 20px;
}

.view-image-btn {
  background: #2563EB;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 10px 20px;
  margin-bottom: 8px;
  width: 100%;
}

.view-image-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.image-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #6B7280;
}

/* 导出选项 */
.export-info {
  margin-bottom: 20px;
}

.export-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #6B7280;
}

.format-title {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 12px 0;
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-input {
  display: none;
}

.radio-custom {
  width: 18px;
  height: 18px;
  border: 1px solid #D1D5DB;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
}

.radio-input:checked + .radio-custom {
  border-color: #2563EB;
}

.radio-input:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 10px;
  height: 10px;
  background: #2563EB;
  border-radius: 50%;
}

.radio-text {
  font-size: 14px;
  color: #374151;
}

.export-actions {
  text-align: center;
}

.export-confirm-btn {
  background: #2563EB;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 10px 20px;
  width: 100%;
}

.export-confirm-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 图像容器 */
.image-container {
  text-align: center;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 240px;
  background: #F9FAFB;
  border-radius: 8px;
  border: 1px dashed #D1D5DB;
}

.image-icon {
  font-size: 48px;
  color: #9CA3AF;
  margin-bottom: 12px;
}

.image-text {
  font-size: 16px;
  font-weight: 500;
  color: #6B7280;
  margin-bottom: 8px;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #9CA3AF;
}

.download-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E5E7EB;
}

.download-btn {
  width: 100%;
  background: #2563EB;
  color: white;
  border: none;
  border-radius: 8px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.download-btn:active {
  background: #1D4ED8;
}

.content-flex {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 20px;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
/* Shared mobile instrument rhythm, retaining each hardware operation. */
.app-container.legacy-operation-page {background:#f7f9fc;}
.legacy-operation-page :is(.settings-card,.stats-card,.records-card,.actions-panel,.status-card,.wavelength-card,.control-card,.maintenance-item) {border:1px solid #d8e2ef;border-radius:12px;background:#fff;box-shadow:none;}
.legacy-operation-page :is(.p-4,.actions-wrap) {padding:14px;}
.legacy-operation-page button {min-height:44px;min-width:44px;border-radius:8px;font-family:inherit;}
.legacy-operation-page :is(.setting-label,.item-desc,.record-count) {font-size:13px;line-height:1.5;}
.legacy-operation-page .setting-item {gap:12px;flex-wrap:wrap;}
.legacy-operation-page .setting-control {min-width:0;max-width:100%;}
.legacy-operation-page .section-title {font-size:15px;}
.legacy-operation-page button:focus-visible {outline:2px solid #2563eb;outline-offset:2px;}
</style>
