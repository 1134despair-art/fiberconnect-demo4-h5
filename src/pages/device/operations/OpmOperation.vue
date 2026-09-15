<template>
  <div class="app-container legacy-operation-page">
    <header class="header">
      <button @click="goBack" class="back-btn">
        ← {{ t('common.back') }}
      </button>
      <div class="page-title">{{ t('device.opm.title') }}</div>
    </header>

    <div class="content-flex hide-scrollbar">
      <div class="p-4">
        <div class="status-card mb-4">
          <div class="status-header">
            <h3 class="section-title">{{ t('device.opm.status') }}</h3>
            <div class="power-switch" :class="{ active: opmSettings.isEnabled }">
              <button @click="toggleOpm" class="switch-btn">
                {{ opmSettings.isEnabled ? t('common.close') : t('common.open') }}
              </button>
            </div>
          </div>

          <div v-if="opmSettings.isEnabled" class="current-reading">
            <div class="reading-value">{{ currentReading.value }}</div>
            <div class="reading-unit">{{ currentReading.unit }}</div>
            <div class="reading-wavelength">{{ t('device.vfl.wavelength') }}: {{ opmSettings.wavelength }}nm</div>
          </div>

          <div v-else class="disabled-state">
            <div class="disabled-text">{{ t('device.opm.disabled') }}</div>
          </div>
        </div>

        <div class="wavelength-card mb-4">
          <h3 class="section-title">{{ t('device.opm.wavelength') }}</h3>
          <div class="wavelength-grid">
            <button
              v-for="wavelength in wavelengths"
              :key="wavelength"
              class="wavelength-btn"
              :class="{ active: opmSettings.wavelength === wavelength }"
              @click="setWavelength(wavelength)"
            >
              {{ wavelength }}nm
            </button>
          </div>
        </div>

        <div class="control-card mb-4">
          <h3 class="section-title">{{ t('device.opm.control') }}</h3>
          <div class="control-buttons">
            <button @click="setReferenceMode" class="control-btn ref" :disabled="!opmSettings.isEnabled || isSettingRef">
              {{ isSettingRef ? t('device.opm.settingRefMode') : t('device.opm.setRefMode') }}
            </button>

            <button @click="saveMeasurementData" class="control-btn save-data" :disabled="!opmSettings.isEnabled || isSavingData">
              {{ isSavingData ? t('common.saving') : t('device.opm.saveMeasureData') }}
            </button>

            <button @click="resetCalibrationValue" class="control-btn reset-cal" :disabled="!opmSettings.isEnabled || isResettingCal">
              {{ isResettingCal ? t('device.opm.resettingCal') : t('device.opm.resetCalValue') }}
            </button>

            <button @click="calibrateMinus" class="control-btn cal-minus" :disabled="!opmSettings.isEnabled">
              {{ t('device.opm.calMinus') }}
            </button>

            <button @click="calibratePlus" class="control-btn cal-plus" :disabled="!opmSettings.isEnabled">
              {{ t('device.opm.calPlus') }}
            </button>

            <button @click="saveCalibrationValue" class="control-btn save-cal" :disabled="!opmSettings.isEnabled || isSavingCal">
              {{ isSavingCal ? t('common.saving') : t('device.opm.saveCalValue') }}
            </button>

            <button @click="exitCalibration" class="control-btn exit-cal" :disabled="!opmSettings.isEnabled">
              {{ t('device.opm.exitCal') }}
            </button>
          </div>
        </div>

        <div ref="historySectionRef" class="history-card">
          <div class="history-header">
            <h3 class="section-title">{{ t('device.opm.history') }}</h3>
            <div class="record-count">{{ t('device.fusionRecords.totalRecords', { count: historyRecords.length }) }}</div>
          </div>

          <div v-if="historyRecords.length === 0" class="empty-records">
            <div class="empty-text">{{ t('device.fusionRecords.empty') }}</div>
          </div>

          <div v-else class="records-list">
            <div v-for="(record, index) in paginatedRecords" :key="record.id" class="record-card-item">
              <div class="record-info">
                <div class="record-main-row">
                  <span class="record-index">#{{ (currentPage - 1) * pageSize + index + 1 }}</span>
                  <span class="record-result">{{ record.result }} <span class="unit">{{ record.unit }}</span></span>
                </div>
                <div class="record-sub-row">
                  <span class="record-tag">{{ t('device.vfl.wavelength') }}: {{ record.wavelength }}nm</span>
                  <span class="record-tag">{{ t('device.vfl.frequency') }}: {{ record.frequency }}Hz</span>
                </div>
              </div>
              <button @click="deleteRecord(record.id)" class="delete-icon-btn">
                <span class="iconify" data-icon="fluent:delete-24-regular"></span>
              </button>
            </div>
          </div>

          <div v-if="historyRecords.length > 0" class="records-footer">
            <div class="pagination">
              <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">{{ t('device.fusionRecords.prevPage') }}</button>
              <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
              <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">{{ t('device.fusionRecords.nextPage') }}</button>
            </div>
            <div class="bulk-actions">
              <button @click="clearAllRecords" class="clear-btn" :disabled="historyRecords.length === 0">
                {{ t('device.fusionRecords.clear') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useModal } from '@/composables/useModal'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { alert, confirm } = useModal()
const { t } = useI18n()

const opmSettings = reactive({
  isEnabled: false,
  wavelength: 1310
})

const currentReading = reactive({
  value: '-45.2',
  unit: 'dBm'
})

const isSettingRef = ref(false)
const isSavingData = ref(false)
const isResettingCal = ref(false)
const isSavingCal = ref(false)
const calibrationOffset = ref(0)

const wavelengths = [850, 980, 1270, 1300, 1310, 1490, 1550, 1577, 1625, 1650]

const historyRecords = ref([
  { id: 1, wavelength: 1310, frequency: 50, result: -42.5, unit: 'dBm', timestamp: '2024-12-25 10:30:15' },
  { id: 2, wavelength: 1550, frequency: 60, result: -38.2, unit: 'dBm', timestamp: '2024-12-25 10:25:30' },
  { id: 3, wavelength: 1310, frequency: 50, result: -45.8, unit: 'dBm', timestamp: '2024-12-25 10:20:45' }
])

const currentPage = ref(1)
const pageSize = 5

const totalPages = computed(() => Math.ceil(historyRecords.value.length / pageSize))

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return historyRecords.value.slice(start, end)
})

const goBack = () => {
  router.back()
}

const toggleOpm = () => {
  opmSettings.isEnabled = !opmSettings.isEnabled
  if (opmSettings.isEnabled) startMeasurement()
}

const setWavelength = (wavelength: number) => {
  opmSettings.wavelength = wavelength
  if (opmSettings.isEnabled) startMeasurement()
}

const startMeasurement = () => {
  const baseValue = -40 + Math.random() * 10
  currentReading.value = (baseValue + calibrationOffset.value).toFixed(2)
}

const setReferenceMode = async () => {
  isSettingRef.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert(t('device.opm.setRefMode') + t('common.success'))
  } catch {
    alert(t('device.opm.setRefMode') + t('common.error'))
  } finally {
    isSettingRef.value = false
  }
}

const saveMeasurementData = async () => {
  isSavingData.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const newRecord = {
      id: Date.now(),
      wavelength: opmSettings.wavelength,
      frequency: 50 + Math.floor(Math.random() * 20),
      result: parseFloat(currentReading.value),
      unit: currentReading.unit,
      timestamp: new Date().toLocaleString()
    }
    historyRecords.value.unshift(newRecord)
    alert(t('device.opm.saveMeasureData') + t('common.success'))
  } catch {
    alert(t('device.opm.saveMeasureData') + t('common.error'))
  } finally {
    isSavingData.value = false
  }
}

const resetCalibrationValue = async () => {
  const confirmed = await confirm(t('device.opm.resetCalConfirm'), t('device.opm.resetCalValue'))
  if (!confirmed) return
  isResettingCal.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    calibrationOffset.value = 0
    startMeasurement()
    alert(t('device.opm.resetCalValue') + t('common.success'))
  } catch {
    alert(t('device.opm.resetCalValue') + t('common.error'))
  } finally {
    isResettingCal.value = false
  }
}

const applyCalibrationDelta = (delta: number) => {
  calibrationOffset.value = Number((calibrationOffset.value + delta).toFixed(2))
  const current = Number.parseFloat(currentReading.value)
  if (!Number.isFinite(current)) {
    startMeasurement()
    return
  }
  currentReading.value = (current + delta).toFixed(2)
}

const calibrateMinus = () => applyCalibrationDelta(-0.05)
const calibratePlus = () => applyCalibrationDelta(0.05)

const saveCalibrationValue = async () => {
  isSavingCal.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    alert(t('device.opm.saveCalValue') + t('common.success'))
  } catch {
    alert(t('device.opm.saveCalValue') + t('common.error'))
  } finally {
    isSavingCal.value = false
  }
}

const exitCalibration = async () => {
  alert(t('device.opm.exitCal') + t('common.success'))
}

const deleteRecord = async (recordId: number) => {
  const confirmed = await confirm(t('device.fusionRecords.confirmDelete'), t('device.fusionRecords.delete'))
  if (!confirmed) return
  const index = historyRecords.value.findIndex(r => r.id === recordId)
  if (index !== -1) {
    historyRecords.value.splice(index, 1)
    if (paginatedRecords.value.length === 0 && currentPage.value > 1) currentPage.value--
  }
}

const clearAllRecords = async () => {
  const confirmed = await confirm(t('device.fusionRecords.confirmClear'), t('device.fusionRecords.clear'))
  if (!confirmed) return
  historyRecords.value = []
  currentPage.value = 1
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const historySectionRef = ref<HTMLElement | null>(null)

onMounted(() => {
  opmSettings.isEnabled = true
  startMeasurement()
  if (route.query.focus === 'history') {
    nextTick(() => {
      historySectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
})
</script>

<style scoped>
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

.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  height: 56px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #E5E7EB;
  z-index: 10;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 16px;
  background: none;
  border: none;
  font-size: 16px;
  color: #2563EB;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.back-btn:active {
  background: rgba(37, 99, 235, 0.1);
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
}

.status-card,
.wavelength-card,
.control-card,
.history-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.power-switch {
  display: flex;
  align-items: center;
}

.switch-btn {
  background: #2563EB;
  border: none;
  border-radius: 6px;
  color: #FFFFFF;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.power-switch.active .switch-btn {
  background: #EF4444;
}

.current-reading {
  text-align: center;
  padding: 16px 0;
}

.reading-value {
  font-size: 36px;
  font-weight: 800;
  color: #1F2937;
  line-height: 1;
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.reading-unit {
  font-size: 18px;
  font-weight: 600;
  color: #6B7280;
  margin-bottom: 8px;
}

.reading-wavelength {
  font-size: 14px;
  color: #6B7280;
  font-weight: 500;
}

.disabled-state {
  text-align: center;
  padding: 20px 0;
}

.disabled-text {
  color: #9CA3AF;
  font-size: 14px;
  font-weight: 500;
}

.wavelength-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.wavelength-btn {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 10px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wavelength-btn.active {
  background: #2563EB;
  color: #FFFFFF;
  border-color: #2563EB;
}

.control-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 12px;
}

.control-btn {
  border: none;
  border-radius: 8px;
  height: 44px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0 10px;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.ref {
  background: #2563EB;
  color: #FFFFFF;
}

.control-btn.save-data {
  background: #10B981;
  color: #FFFFFF;
}

.control-btn.reset-cal {
  background: #F97316;
  color: #FFFFFF;
}

.control-btn.cal-minus,
.control-btn.cal-plus,
.control-btn.save-cal,
.control-btn.exit-cal {
  background: #F3F4F6;
  color: #374151;
  border: 1px solid #E5E7EB;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.record-count {
  font-size: 12px;
  color: #6B7280;
  font-weight: 600;
}

.empty-records {
  padding: 20px 0;
  text-align: center;
}

.empty-text {
  color: #9CA3AF;
  font-size: 14px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #F9FAFB;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
}

.record-main-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
}

.record-index {
  font-size: 12px;
  color: #6B7280;
  font-weight: 700;
}

.record-result {
  font-size: 16px;
  font-weight: 800;
  color: #111827;
  font-variant-numeric: tabular-nums;
}

.record-result .unit {
  font-size: 12px;
  font-weight: 700;
  color: #6B7280;
}

.record-sub-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.record-tag {
  font-size: 11px;
  color: #6B7280;
  font-weight: 600;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  padding: 4px 8px;
  border-radius: 999px;
}

.delete-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #FEE2E2;
  color: #EF4444;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

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
  border: none;
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
  color: #64748B;
  font-weight: 700;
}

.clear-btn {
  background: #EF4444;
  border: none;
  border-radius: 6px;
  color: #FFFFFF;
  font-size: 12px;
  cursor: pointer;
  padding: 6px 12px;
  font-weight: 700;
}

@media (max-width: 360px) {
  .wavelength-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
