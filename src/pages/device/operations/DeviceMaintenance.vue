<template>
  <div class="app-container legacy-operation-page">
    <!-- 顶部标题栏 -->
    <WorkspaceHeader :title="t('device.maintenance.title')" @back="goBack" />
    
    <!-- 主内容区域 -->
    <div class="content-flex hide-scrollbar">
      <div class="p-4">
        <!-- 维护功能菜单 -->
        <div class="maintenance-menu">
          <!-- 放电校正 -->
          <div class="maintenance-item" role="button" tabindex="0" @keydown.enter="showDischargeCalibration = true" @keydown.space.prevent="showDischargeCalibration = true" @click="showDischargeCalibration = true">
            <div class="item-icon discharge">
              <DeviceIcon class="iconify" name="mdi:lightning-bolt" />
            </div>
            <div class="item-info">
              <div class="item-title">{{ t('device.maintenance.dischargeCalibration') }}</div>
              <div class="item-desc">{{ t('device.maintenance.dischargeDesc') }}</div>
            </div>
            <DeviceIcon class="iconify arrow-icon" name="mdi:chevron-right" />
          </div>
          
          <!-- 马达测试 -->
          <div class="maintenance-item" role="button" tabindex="0" @keydown.enter="showMotorTest = true" @keydown.space.prevent="showMotorTest = true" @click="showMotorTest = true">
            <div class="item-icon motor">
              <DeviceIcon class="iconify" name="mdi:cog" />
            </div>
            <div class="item-info">
              <div class="item-title">{{ t('device.maintenance.motorTest') }}</div>
              <div class="item-desc">{{ t('device.maintenance.motorDesc') }}</div>
            </div>
            <DeviceIcon class="iconify arrow-icon" name="mdi:chevron-right" />
          </div>
          
          <!-- 硬件自测 -->
          <div class="maintenance-item" role="button" tabindex="0" @keydown.enter="showHardwareTest = true" @keydown.space.prevent="showHardwareTest = true" @click="showHardwareTest = true">
            <div class="item-icon hardware">
              <DeviceIcon class="iconify" name="mdi:chip" />
            </div>
            <div class="item-info">
              <div class="item-title">{{ t('device.maintenance.hardwareTest') }}</div>
              <div class="item-desc">{{ t('device.maintenance.hardwareDesc') }}</div>
            </div>
            <DeviceIcon class="iconify arrow-icon" name="mdi:chevron-right" />
          </div>
          
          <div class="maintenance-item" role="button" tabindex="0" @keydown.enter="showHeatingModal = true" @keydown.space.prevent="showHeatingModal = true" @click="showHeatingModal = true">
            <div class="item-icon heating">
              <DeviceIcon class="iconify" name="mdi:fire" />
            </div>
            <div class="item-info">
              <div class="item-title">{{ t('device.maintenance.heatingFunction') }}</div>
              <div class="item-desc">{{ t('device.maintenance.heatingDesc') }}</div>
            </div>
            <DeviceIcon class="iconify arrow-icon" name="mdi:chevron-right" />
          </div>
          
          <!-- 更换电极 -->
          <div class="maintenance-item" role="button" tabindex="0" @keydown.enter="showElectrodeReplacement = true" @keydown.space.prevent="showElectrodeReplacement = true" @click="showElectrodeReplacement = true">
            <div class="item-icon electrode">
              <DeviceIcon class="iconify" name="mdi:flash" />
            </div>
            <div class="item-info">
              <div class="item-title">{{ t('device.maintenance.electrodeReplace') }}</div>
              <div class="item-desc">{{ t('device.maintenance.electrodeDesc') }}</div>
            </div>
            <DeviceIcon class="iconify arrow-icon" name="mdi:chevron-right" />
          </div>
        </div>
      </div>
    </div>

    <!-- 放电校正弹窗 -->
    <div v-if="showDischargeCalibration" class="modal-overlay" @click="showDischargeCalibration = false">
      <div class="modal-content" @click.stop>
        <div class="modal-body-container">
          <div class="modal-title">{{ t('device.maintenance.dischargeCalibration') }}</div>
          <button @click="showDischargeCalibration = false" class="modal-close-text">{{ t('common.close') }}</button>
          
          <div class="calibration-content">
            <div class="info-text">
              <p>放电校正将通过图像显示校正情况，建议通过硬件显示屏查看校正状态。</p>
              <p>系统将显示实际切割角度和预设角度的差值。</p>
            </div>
            
            <div v-if="!isCalibrating && !calibrationCompleted" class="calibration-start">
              <button @click="startDischargeCalibration" class="start-calibration-btn">
                {{ t('device.maintenance.startCalibration') }}
              </button>
            </div>
            
            <div v-if="isCalibrating" class="calibration-progress">
              <div class="progress-info">
                <DeviceIcon class="iconify loading-icon" name="mdi:loading" />
                <span>{{ t('device.maintenance.calibrating') }}</span>
              </div>
              <div class="angle-display">
                <div class="angle-item">
                  <span class="angle-label">{{ t('device.maintenance.actualAngle') }}:</span>
                  <span class="angle-value">{{ calibrationData.actualAngle }}°</span>
                </div>
                <div class="angle-item">
                  <span class="angle-label">{{ t('device.maintenance.presetAngle') }}:</span>
                  <span class="angle-value">{{ calibrationData.presetAngle }}°</span>
                </div>
                <div class="angle-item">
                  <span class="angle-label">{{ t('device.maintenance.angleDiff') }}:</span>
                  <span class="angle-value" :class="{ warning: Math.abs(calibrationData.angleDiff) > 2 }">
                    {{ calibrationData.angleDiff > 0 ? '+' : '' }}{{ calibrationData.angleDiff }}°
                  </span>
                </div>
                <div class="angle-item">
                  <span class="angle-label">{{ t('device.maintenance.beforeDischarge') }}:</span>
                  <span class="angle-value">{{ calibrationData.beforeDischarge }}</span>
                </div>
                <div class="angle-item">
                  <span class="angle-label">{{ t('device.maintenance.afterDischarge') }}:</span>
                  <span class="angle-value">{{ isCalibrating || calibrationCompleted ? calibrationData.afterDischarge : '-' }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="calibrationCompleted" class="calibration-result">
              <div class="result-message">
                <DeviceIcon class="iconify success-icon" name="mdi:check-circle" />
                <span>{{ t('device.maintenance.calibrationComplete') }}</span>
              </div>
              <div class="result-actions">
                <button @click="acceptCalibration" class="accept-btn">{{ t('device.maintenance.accept') }}</button>
                <button @click="rejectCalibration" class="reject-btn">{{ t('device.maintenance.reject') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 马达测试弹窗 -->
    <div v-if="showMotorTest" class="modal-overlay" @click="showMotorTest = false">
      <div class="modal-content" @click.stop>
        <div class="modal-body-container">
          <div class="modal-title">{{ t('device.maintenance.motorTest') }}</div>
          <button @click="showMotorTest = false" class="modal-close-text">{{ t('common.close') }}</button>
          
          <div class="motor-test-content">
            <div class="test-info">
              <p>请先通过按钮调整马达位置，然后点击开始测试。</p>
            </div>
            
            <!-- 马达控制按钮 -->
            <div class="motor-controls">
              <div class="control-grid">
                <button @click="moveMotor('x', 1)" class="motor-btn">{{ t('device.maintenance.xUp') }}</button>
                <button @click="moveMotor('y', 1)" class="motor-btn">{{ t('device.maintenance.yUp') }}</button>
                <button @click="moveMotor('x', -1)" class="motor-btn">{{ t('device.maintenance.xDown') }}</button>
                <button @click="moveMotor('y', -1)" class="motor-btn">{{ t('device.maintenance.yDown') }}</button>
              </div>
            </div>
            
            <!-- 当前位置显示 -->
            <div class="position-display">
              <div class="position-item">
                <span class="position-label">{{ t('device.maintenance.xPos') }}:</span>
                <span class="position-value">{{ motorPosition.x }}</span>
              </div>
              <div class="position-item">
                <span class="position-label">{{ t('device.maintenance.yPos') }}:</span>
                <span class="position-value">{{ motorPosition.y }}</span>
              </div>
            </div>
            
            <!-- 测试按钮 -->
            <div class="test-actions">
              <button @click="startMotorTest" class="start-test-btn" :disabled="isMotorTesting">
                {{ isMotorTesting ? t('device.maintenance.testing') : t('device.maintenance.startTest') }}
              </button>
            </div>
            
            <!-- 测试结果 -->
            <div v-if="motorTestResult" class="test-result">
              <h4 class="result-title">{{ t('device.maintenance.testResult') }}</h4>
              <div class="result-grid">
                <div class="result-item">
                  <span class="result-label">{{ t('device.maintenance.xAccuracy') }}:</span>
                  <span class="result-value" :class="motorTestResult.xAccuracy >= 95 ? 'good' : 'warning'">
                    {{ motorTestResult.xAccuracy }}%
                  </span>
                </div>
                <div class="result-item">
                  <span class="result-label">{{ t('device.maintenance.yAccuracy') }}:</span>
                  <span class="result-value" :class="motorTestResult.yAccuracy >= 95 ? 'good' : 'warning'">
                    {{ motorTestResult.yAccuracy }}%
                  </span>
                </div>
                <div class="result-item">
                  <span class="result-label">{{ t('device.maintenance.response') }}:</span>
                  <span class="result-value">{{ motorTestResult.responseTime }}ms</span>
                </div>
                <div class="result-item">
                  <span class="result-label">{{ t('device.maintenance.status') }}:</span>
                  <span class="result-value" :class="motorTestResult.overall === 'normal' ? 'good' : 'warning'">
                    {{ t('device.maintenance.' + motorTestResult.overall) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 硬件自测弹窗 -->
    <div v-if="showHardwareTest" class="modal-overlay" @click="showHardwareTest = false">
      <div class="modal-content" @click.stop>
        <div class="modal-body-container">
          <div class="modal-title">{{ t('device.maintenance.hardwareTest') }}</div>
          <button @click="showHardwareTest = false" class="modal-close-text">{{ t('common.close') }}</button>
          
          <div class="hardware-test-content">
            <div v-if="!isHardwareTesting && !hardwareTestCompleted" class="test-start">
              <div class="test-info">
                <p>{{ t('device.maintenance.hardwareList') }}</p>
                <ul class="hardware-list">
                  <li>SDRAM 内存</li>
                  <li>FLASH 存储</li>
                  <li>FPGA 处理器</li>
                  <li>电池状态</li>
                  <li>蓝牙模块</li>
                </ul>
              </div>
              <button @click="startHardwareTest" class="start-test-btn">{{ t('device.maintenance.startSelfTest') }}</button>
            </div>
            
            <div v-if="isHardwareTesting" class="test-progress">
              <div class="progress-header">
                <DeviceIcon class="iconify loading-icon" name="mdi:loading" />
                <span>{{ t('device.maintenance.selfTesting') }}</span>
              </div>
              <div class="test-items">
                <div 
                  v-for="item in hardwareTestItems" 
                  :key="item.name"
                  class="test-item"
                  :class="{ 
                    testing: item.status === 'testing',
                    completed: item.status === 'completed',
                    failed: item.status === 'failed'
                  }"
                >
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-status">
                    <DeviceIcon v-if="item.status === 'waiting'" class="iconify" name="mdi:clock-outline" />
                    <DeviceIcon v-else-if="item.status === 'testing'" class="iconify loading-icon" name="mdi:loading" />
                    <DeviceIcon v-else-if="item.status === 'completed'" class="iconify success-icon" name="mdi:check-circle" />
                    <DeviceIcon v-else-if="item.status === 'failed'" class="iconify error-icon" name="mdi:alert-circle" />
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="hardwareTestCompleted" class="test-results">
              <h4 class="results-title">{{ t('device.maintenance.testResult') }}</h4>
              <div class="results-grid">
                <div 
                  v-for="item in hardwareTestItems" 
                  :key="item.name"
                  class="result-item"
                >
                  <span class="result-name">{{ item.name }}</span>
                  <span class="result-status" :class="item.status">
                    {{ item.status === 'completed' ? t('device.maintenance.normal') : t('device.maintenance.abnormal') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showHeatingModal" class="modal-overlay" @click="showHeatingModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-body-container">
          <div class="modal-title">{{ t('device.maintenance.heatingFunction') }}</div>
          <button @click="showHeatingModal = false" class="modal-close-text">{{ t('common.close') }}</button>
          
          <div class="heating-content">
            <div class="warning-section">
              <div class="warning-icon">
                <DeviceIcon class="iconify" name="mdi:alert" />
              </div>
              <div class="warning-text">
                <p><strong>{{ t('device.maintenance.heatingWarning') }}</strong></p>
                <p>{{ t('device.maintenance.heatingNote') }}</p>
              </div>
            </div>
            
            <div class="current-info">
              <div class="info-item">
                <span class="info-label">{{ t('device.maintenance.heatingStatus') }}:</span>
                <span class="info-value heat-status" :class="{ on: isHeating }">
                  {{ isHeating ? t('device.maintenance.heatingOn') : t('device.maintenance.heatingOff') }}
                </span>
              </div>
            </div>
            
            <div class="heat-actions">
              <button @click="toggleHeating" class="heat-btn" :class="{ stop: isHeating }" :disabled="isTogglingHeat">
                {{
                  isTogglingHeat
                    ? (isHeating ? t('device.maintenance.heatingStopping') : t('device.maintenance.heatingStarting'))
                    : (isHeating ? t('device.maintenance.stopHeating') : t('device.maintenance.startHeating'))
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 更换电极弹窗 -->
    <div v-if="showElectrodeReplacement" class="modal-overlay" @click="showElectrodeReplacement = false">
      <div class="modal-content" @click.stop>
        <div class="modal-body-container">
          <div class="modal-title">{{ t('device.maintenance.electrodeReplace') }}</div>
          <button @click="showElectrodeReplacement = false" class="modal-close-text">{{ t('common.close') }}</button>
          
          <div class="electrode-replacement-content">
            <div class="warning-section">
              <div class="warning-icon">
                <DeviceIcon class="iconify" name="mdi:alert" />
              </div>
              <div class="warning-text">
                <p><strong>{{ t('device.maintenance.electrodeWarning') }}</strong></p>
                <p>{{ t('device.maintenance.electrodeNote') }}</p>
              </div>
            </div>
            
            <div class="replacement-steps">
              <h4 class="steps-title">{{ t('device.maintenance.operationSteps') }}</h4>
              <ol class="steps-list">
                <li>{{ t('device.maintenance.step1') }}</li>
                <li>{{ t('device.maintenance.step2') }}</li>
                <li>{{ t('device.maintenance.step3') }}</li>
                <li>{{ t('device.maintenance.step4') }}</li>
              </ol>
            </div>
            
            <div class="current-info">
              <div class="info-item">
                <span class="info-label">{{ t('device.maintenance.currentDischarge') }}:</span>
                <span class="info-value">{{ currentDischargeCount }}次</span>
              </div>
            </div>
            
            <div class="replacement-actions">
              <button @click="confirmElectrodeReplacement" class="confirm-btn" :disabled="isReplacingElectrode">
                {{ isReplacingElectrode ? t('device.maintenance.replacing') : t('device.maintenance.confirmReplace') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 通用提示弹窗 (Alert/Confirm) -->
    <div v-if="modalState.visible" class="modal-overlay" style="z-index: 2000;" @click="handleModalMaskClick">
      <div class="modal-content dialog-style" @click.stop>
        <div class="dialog-content">
          <div class="dialog-title">{{ modalState.title }}</div>
          <div class="dialog-message">{{ modalState.message }}</div>
        </div>
        <div class="dialog-footer">
          <button 
            v-if="modalState.type === 'confirm'" 
            @click="handleModalCancel" 
            class="dialog-btn cancel"
          >
            {{ t('common.cancel') }}
          </button>
          <button 
            @click="handleModalConfirm" 
            class="dialog-btn confirm"
            :class="{ 'full-width': modalState.type === 'alert' }"
          >
            {{ modalState.type === 'confirm' ? t('common.confirm') : t('common.confirm') }}
          </button>
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()

// 通用弹窗状态
const modalState = reactive({
  visible: false,
  title: '',
  message: '',
  type: 'alert' as 'alert' | 'confirm',
  resolve: null as ((value: boolean) => void) | null
})

const showAlert = (message: string, title: string = t('common.warning')) => {
  return new Promise<boolean>((resolve) => {
    modalState.title = title
    modalState.message = message
    modalState.type = 'alert'
    modalState.visible = true
    modalState.resolve = resolve
  })
}

const showConfirm = (message: string, title: string = t('common.confirm')) => {
  return new Promise<boolean>((resolve) => {
    modalState.title = title
    modalState.message = message
    modalState.type = 'confirm'
    modalState.visible = true
    modalState.resolve = resolve
  })
}

const handleModalConfirm = () => {
  modalState.visible = false
  if (modalState.resolve) {
    modalState.resolve(true)
    modalState.resolve = null
  }
}

const handleModalCancel = () => {
  modalState.visible = false
  if (modalState.resolve) {
    modalState.resolve(false)
    modalState.resolve = null
  }
}

const handleModalMaskClick = () => {
  // 点击遮罩层默认为取消/关闭
  handleModalCancel()
}

// 弹窗状态
const showDischargeCalibration = ref(false)
const showMotorTest = ref(false)
const showHardwareTest = ref(false)
const showHeatingModal = ref(false)
const showElectrodeReplacement = ref(false)

// 放电校正相关
const isCalibrating = ref(false)
const calibrationCompleted = ref(false)
const calibrationData = reactive({
  actualAngle: 0,
  presetAngle: 8,
  angleDiff: 0,
  beforeDischarge: 0,
  afterDischarge: 0
})

// 马达测试相关
const isMotorTesting = ref(false)
const motorPosition = reactive({
  x: 0,
  y: 0
})
const motorTestResult = ref<{
  xAccuracy: number
  yAccuracy: number
  responseTime: number
  overall: string
} | null>(null)

// 硬件自测相关
const isHardwareTesting = ref(false)
const hardwareTestCompleted = ref(false)
const hardwareTestItems = ref([
  { name: 'SDRAM', status: 'waiting' },
  { name: 'FLASH', status: 'waiting' },
  { name: 'FPGA', status: 'waiting' },
  { name: '电池', status: 'waiting' },
  { name: '蓝牙', status: 'waiting' }
])

// 更换电极相关
const isReplacingElectrode = ref(false)
const currentDischargeCount = ref(1247)

const isHeating = ref(false)
const isTogglingHeat = ref(false)

/**
 * 返回上一页
 */
const goBack = () => {
  router.back()
}

/**
 * 开始放电校正
 */
const startDischargeCalibration = async () => {
  isCalibrating.value = true
  calibrationCompleted.value = false
  
  // 记录校正前放电数
  calibrationData.beforeDischarge = currentDischargeCount.value
  calibrationData.afterDischarge = currentDischargeCount.value

  try {
    // 模拟校正过程
    const calibrationInterval = setInterval(() => {
      calibrationData.actualAngle = parseFloat((Math.random() * 16 - 8).toFixed(1))
      calibrationData.angleDiff = parseFloat((calibrationData.actualAngle - calibrationData.presetAngle).toFixed(1))
      // 模拟校正过程中放电次数增加
      calibrationData.afterDischarge = calibrationData.beforeDischarge + Math.floor(Math.random() * 5) + 1
    }, 500)
    
    // 模拟校正时间
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    clearInterval(calibrationInterval)
    
    // 校正完成，更新最终放电数（假设消耗了10次放电）
    const dischargeCost = 10
    calibrationData.afterDischarge = calibrationData.beforeDischarge + dischargeCost
    // 更新全局放电计数
    currentDischargeCount.value = calibrationData.afterDischarge
    
    isCalibrating.value = false
    calibrationCompleted.value = true
  } catch (error) {
    isCalibrating.value = false
    showAlert('校正失败，请重试')
  }
}

/**
 * 接受校正
 */
const acceptCalibration = () => {
  calibrationCompleted.value = false
  showDischargeCalibration.value = false
  showAlert('校正参数已保存')
}

/**
 * 拒绝校正
 */
const rejectCalibration = () => {
  calibrationCompleted.value = false
  // 重新开始校正
  startDischargeCalibration()
}

/**
 * 移动马达
 */
const moveMotor = (axis: 'x' | 'y', direction: number) => {
  motorPosition[axis] += direction
}

/**
 * 开始马达测试
 */
const startMotorTest = async () => {
  isMotorTesting.value = true
  motorTestResult.value = null
  
  try {
    // 模拟测试过程
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 生成测试结果
    motorTestResult.value = {
      xAccuracy: Math.floor(Math.random() * 10) + 90,
      yAccuracy: Math.floor(Math.random() * 10) + 90,
      responseTime: Math.floor(Math.random() * 50) + 10,
      overall: Math.random() > 0.2 ? 'normal' : 'abnormal'
    }
  } catch (error) {
    showAlert('测试失败，请重试')
  } finally {
    isMotorTesting.value = false
  }
}

/**
 * 开始硬件自测
 */
const startHardwareTest = async () => {
  isHardwareTesting.value = true
  hardwareTestCompleted.value = false
  
  // 重置测试状态
  hardwareTestItems.value.forEach(item => {
    item.status = 'waiting'
  })
  
  try {
    // 逐个测试硬件组件
    for (let i = 0; i < hardwareTestItems.value.length; i++) {
      const item = hardwareTestItems.value[i]
      item.status = 'testing'
      
      // 模拟测试时间
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 随机生成测试结果（90%成功率）
      item.status = Math.random() > 0.1 ? 'completed' : 'failed'
    }
    
    isHardwareTesting.value = false
    hardwareTestCompleted.value = true
  } catch (error) {
    isHardwareTesting.value = false
    showAlert('自检失败，请重试')
  }
}

/**
 * 确认更换电极
 */
const confirmElectrodeReplacement = async () => {
  const confirmed = await showConfirm(t('device.maintenance.confirmReplaceMsg'), t('device.maintenance.confirmReplaceTitle'))
  if (!confirmed) return
  
  isReplacingElectrode.value = true
  
  try {
    // 模拟处理过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 清零放电次数
    currentDischargeCount.value = 0
    
    showElectrodeReplacement.value = false
    showAlert(t('device.maintenance.resetSuccess'))
  } catch (error) {
    showAlert('操作失败，请重试')
  } finally {
    isReplacingElectrode.value = false
  }
}

const toggleHeating = async () => {
  const confirmed = await showConfirm(
    isHeating.value ? t('device.maintenance.confirmStopHeatingMsg') : t('device.maintenance.confirmStartHeatingMsg'),
    isHeating.value ? t('device.maintenance.confirmStopHeatingTitle') : t('device.maintenance.confirmStartHeatingTitle')
  )
  if (!confirmed) return

  isTogglingHeat.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    isHeating.value = !isHeating.value
    showHeatingModal.value = false
    showAlert(isHeating.value ? t('device.maintenance.heatingStartSuccess') : t('device.maintenance.heatingStopSuccess'))
  } catch (error) {
    showAlert('操作失败，请重试')
  } finally {
    isTogglingHeat.value = false
  }
}
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

.modal-content {
  background: white;
  width: 90% !important; /* 统一宽度为 90% */
  max-width: 340px !important; /* 最大宽度 340px，不超过主页面 */
  border-radius: 16px; /* 统一圆角 */
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-body-container {
  padding: 20px;
  position: relative;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  text-align: center; /* 标题居中 */
  margin-bottom: 20px;
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
  padding: 4px 12px;
}

/* Dialog Style (Alert/Confirm) */
.dialog-style {
  background: white;
  padding: 0; /* 清除默认 padding */
}

.dialog-content {
  padding: 32px 24px;
  text-align: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 12px;
}

.dialog-message {
  font-size: 15px;
  color: #4B5563;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  height: 50px;
  border-top: 1px solid #E5E7EB;
}

.dialog-btn {
  flex: 1;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  background: white;
  transition: background 0.2s;
}

.dialog-btn:active {
  background: #F9FAFB;
}

.dialog-btn.cancel {
  color: #6B7280;
  border-right: 1px solid #E5E7EB;
  border-bottom-left-radius: 16px;
}

.dialog-btn.confirm {
  background: #2563EB;
  color: white;
  border-bottom-right-radius: 16px;
}

.dialog-btn.confirm:active {
  background: #1D4ED8;
}

.dialog-btn.full-width {
  width: 100%;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}

.p-4 {
  padding: 16px;
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
  color: #2563EB; /* 文字颜色 #2563EB */
  font-size: 16px;
  cursor: pointer;
  padding: 8px 0;
  font-weight: 500;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937; /* 深灰 #1F2937 */
  margin: 0;
}

/* 维护菜单 */
.maintenance-menu {
  display: flex;
  flex-direction: column;
  gap: 8px; /* 间距调整为 8px */
}

.maintenance-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #F9FAFB; /* 背景色 #F9FAFB */
  border: 1px solid #E5E7EB; /* 1px 浅灰边框 */
  border-radius: 4px; /* 4px 圆角 */
  padding: 16px; /* 内边距 16px */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04); /* 柔和阴影 */
  cursor: pointer;
  transition: all 0.3s ease;
}

.maintenance-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px; /* 8px 圆角 */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
}

.item-icon.discharge {
  background: linear-gradient(135deg, #F59E0B, #F97316);
}

.item-icon.motor {
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
}

.item-icon.hardware {
  background: linear-gradient(135deg, #10B981, #059669);
}

.item-icon.electrode {
  background: linear-gradient(135deg, #EF4444, #DC2626);
}

.item-icon.heating {
  background: linear-gradient(135deg, #F97316, #EA580C);
}

.item-info {
  flex: 1;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937; /* 标题颜色 #1F2937 */
  margin-bottom: 4px;
}

.item-desc {
  font-size: 14px;
  color: #6B7280; /* 说明颜色 #6B7280 */
}

.arrow-icon {
  font-size: 20px;
  color: #9CA3AF; /* 箭头颜色 #9CA3AF */
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

/* 放电校正样式 */
.calibration-info .info-text {
  margin-bottom: 20px;
}

.info-text p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.calibration-start {
  text-align: center;
}

.start-calibration-btn {
  background: #2563EB; /* 全局主色 #2563EB */
  border: none;
  border-radius: 8px; /* 圆角 8px */
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 12px 24px;
}

.calibration-progress {
  text-align: center;
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.angle-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #F8FAFD;
  border-radius: 8px;
  padding: 16px;
}

.angle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.angle-label {
  font-size: 14px;
  color: #666;
}

.angle-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.angle-value.warning {
  color: #EF4444;
}

.calibration-result {
  text-align: center;
}

.result-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #10B981;
}

.success-icon {
  font-size: 20px;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.accept-btn {
  flex: 1;
  background: linear-gradient(135deg, #10B981, #059669);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 10px 16px;
}

.reject-btn {
  flex: 1;
  background: #F3F4F6;
  border: none;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 10px 16px;
}

/* 马达测试样式 */
.motor-test-content .test-info {
  margin-bottom: 20px;
}

.test-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.motor-controls {
  margin-bottom: 20px;
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.motor-btn {
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

.motor-btn:hover {
  background: #E5E7EB;
}

.position-display {
  display: flex;
  justify-content: space-around;
  background: #F8FAFD;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.position-item {
  text-align: center;
}

.position-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.position-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.test-actions {
  text-align: center;
  margin-bottom: 20px;
}

.start-test-btn {
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 12px 24px;
}

.start-test-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.test-result {
  border-top: 1px solid #E5E7EB;
  padding-top: 20px;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
  margin: 0 0 16px 0;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F8FAFD;
  border-radius: 6px;
  padding: 8px 12px;
}

.result-label {
  font-size: 12px;
  color: #64748B;
}

.result-value {
  font-size: 14px;
  font-weight: 600;
}

.result-value.good {
  color: #10B981;
}

.result-value.warning {
  color: #F59E0B;
}

/* 硬件自测样式 */
.hardware-test-content .test-info {
  margin-bottom: 20px;
}

.test-info ul {
  margin: 8px 0 0 16px;
  padding: 0;
}

.test-info li {
  font-size: 14px;
  color: #64748B;
  margin-bottom: 4px;
}

.test-progress .progress-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.test-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F8FAFD;
  border-radius: 6px;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

.test-item.testing {
  background: #FEF3C7;
  border-left: 4px solid #F59E0B;
}

.test-item.completed {
  background: #ECFDF5;
  border-left: 4px solid #10B981;
}

.test-item.failed {
  background: #FEF2F2;
  border-left: 4px solid #EF4444;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #1E293B;
}

.item-status {
  font-size: 16px;
}

.success-icon {
  color: #10B981;
}

.error-icon {
  color: #EF4444;
}

.test-results .results-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
  margin: 0 0 16px 0;
}

.results-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-name {
  font-size: 14px;
  color: #1E293B;
}

.result-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.result-status.completed {
  background: #D1FAE5;
  color: #065F46;
}

.result-status.failed {
  background: #FEE2E2;
  color: #991B1B;
}

/* 更换电极样式 */
.electrode-replacement-content .warning-section {
  display: flex;
  gap: 12px;
  background: #FEF3C7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.heating-content .warning-section {
  display: flex;
  gap: 12px;
  background: #FEF3C7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.heat-actions {
  text-align: center;
}

.heat-btn {
  background: linear-gradient(135deg, #F59E0B, #F97316);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 12px 24px;
  min-width: 160px;
}

.heat-btn.stop {
  background: linear-gradient(135deg, #EF4444, #DC2626);
}

.heat-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.heat-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #E5E7EB;
  color: #374151;
}

.heat-status.on {
  background: #D1FAE5;
  color: #065F46;
}

.warning-icon {
  color: #F59E0B;
  font-size: 24px;
  flex-shrink: 0;
}

.warning-text p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #92400E;
}

.replacement-steps {
  margin-bottom: 20px;
}

.steps-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.steps-list {
  margin: 0;
  padding-left: 20px;
}

.steps-list li {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.current-info {
  background: #F8FAFD;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #64748B;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.replacement-actions {
  text-align: center;
}

.confirm-btn {
  background: linear-gradient(135deg, #EF4444, #DC2626);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 12px 24px;
}

.confirm-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
/* 主内容区域 */
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

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F8FAFD;
  border-radius: 6px;
  padding: 8px 12px;
}

.result-label {
  font-size: 12px;
  color: #666;
}

.result-value {
  font-size: 14px;
  font-weight: 600;
}

.result-value.good {
  color: #10B981;
}

.result-value.warning {
  color: #F59E0B;
}

/* 硬件自测样式 */
.hardware-test-content .test-info {
  margin-bottom: 20px;
}

.test-info ul {
  margin: 8px 0 0 16px;
  padding: 0;
}

.test-info li {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.test-progress .progress-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.test-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F8FAFD;
  border-radius: 6px;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

.test-item.testing {
  background: #FEF3C7;
  border-left: 4px solid #F59E0B;
}

.test-item.completed {
  background: #ECFDF5;
  border-left: 4px solid #10B981;
}

.test-item.failed {
  background: #FEF2F2;
  border-left: 4px solid #EF4444;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.item-status {
  font-size: 16px;
}

.success-icon {
  color: #10B981;
}

.error-icon {
  color: #EF4444;
}

.test-results .results-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.results-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-name {
  font-size: 14px;
  color: #333;
}

.result-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.result-status.completed {
  background: #D1FAE5;
  color: #065F46;
}

.result-status.failed {
  background: #FEE2E2;
  color: #991B1B;
}

/* 更换电极样式 */
.electrode-replacement-content .warning-section {
  display: flex;
  gap: 12px;
  background: #FEF3C7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.warning-icon {
  color: #F59E0B;
  font-size: 24px;
  flex-shrink: 0;
}

.warning-text p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #92400E;
}

.replacement-steps {
  margin-bottom: 20px;
}

.steps-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.steps-list {
  margin: 0;
  padding-left: 20px;
}

.steps-list li {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.current-info {
  background: #F8FAFD;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #64748B;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.replacement-actions {
  text-align: center;
}

.confirm-btn {
  background: linear-gradient(135deg, #EF4444, #DC2626);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 12px 24px;
}

.confirm-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
