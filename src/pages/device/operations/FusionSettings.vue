<template>
  <div class="app-container legacy-operation-page">
    <!-- 顶部标题栏 -->
    <header class="header">
      <button @click="goBack" class="back-btn">
        ← {{ t('common.back') }}
      </button>
      <div class="page-title">{{ t('device.fusionSettings.title') }}</div>
    </header>
    
    <!-- 主内容区域 -->
    <div class="content-flex hide-scrollbar">
      <div class="p-4">
        <!-- 熔接参数 -->
        <div class="settings-card mb-4">
          <h3 class="section-title">{{ t('device.fusionSettings.params') }}</h3>
          
          <!-- 光纤类型 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.fiberType') }}</div>
            <div class="setting-control">
              <select v-model="fusionParams.fiberType" class="setting-select">
                <option value="SM">SM</option>
              </select>
            </div>
          </div>
          
          <!-- 程序编号 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.programNo') }}</div>
            <div class="setting-control">
              <select v-model="fusionParams.programNumber" class="setting-select">
                <option value="1">1</option>
              </select>
            </div>
          </div>
          
          <!-- 预熔电流 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.preFusionCurrent') }}</div>
            <div class="setting-control">
              <button @click="adjustPreFusionCurrent(-100)" class="adjust-btn" :disabled="fusionParams.preFusionCurrent <= 1600">-</button>
              <span class="setting-value">{{ fusionParams.preFusionCurrent }}</span>
              <button @click="adjustPreFusionCurrent(100)" class="adjust-btn" :disabled="fusionParams.preFusionCurrent >= 3300">+</button>
            </div>
          </div>
          
          <!-- 预熔时间 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.preFusionTime') }}</div>
            <div class="setting-control">
              <button @click="adjustPreFusionTime(-100)" class="adjust-btn" :disabled="fusionParams.preFusionTime <= 0">-</button>
              <span class="setting-value">{{ fusionParams.preFusionTime }}</span>
              <button @click="adjustPreFusionTime(100)" class="adjust-btn">+</button>
            </div>
          </div>
          
          <!-- 熔接电流 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.fusionCurrent') }}</div>
            <div class="setting-control">
              <button @click="adjustFusionCurrent(-100)" class="adjust-btn" :disabled="fusionParams.fusionCurrent <= 1600">-</button>
              <span class="setting-value">{{ fusionParams.fusionCurrent }}</span>
              <button @click="adjustFusionCurrent(100)" class="adjust-btn" :disabled="fusionParams.fusionCurrent >= 3300">+</button>
            </div>
          </div>
          
          <!-- 熔接时间 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.fusionTime') }}</div>
            <div class="setting-control">
              <button @click="adjustFusionTime(-100)" class="adjust-btn" :disabled="fusionParams.fusionTime <= 0">-</button>
              <span class="setting-value">{{ fusionParams.fusionTime }}</span>
              <button @click="adjustFusionTime(100)" class="adjust-btn">+</button>
            </div>
          </div>
          
          <!-- 清洁电流 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.cleanCurrent') }}</div>
            <div class="setting-control">
              <button @click="adjustCleanCurrent(-100)" class="adjust-btn" :disabled="fusionParams.cleanCurrent <= 1600">-</button>
              <span class="setting-value">{{ fusionParams.cleanCurrent }}</span>
              <button @click="adjustCleanCurrent(100)" class="adjust-btn" :disabled="fusionParams.cleanCurrent >= 3300">+</button>
            </div>
          </div>
          
          <!-- 清洁时间 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.cleanTime') }}</div>
            <div class="setting-control">
              <button @click="adjustCleanTime(-100)" class="adjust-btn" :disabled="fusionParams.cleanTime <= 300">-</button>
              <span class="setting-value">{{ fusionParams.cleanTime }}</span>
              <button @click="adjustCleanTime(100)" class="adjust-btn" :disabled="fusionParams.cleanTime >= 1000">+</button>
            </div>
          </div>
        </div>

        <!-- 熔接设置 -->
        <div class="settings-card mb-4">
          <h3 class="section-title">{{ t('device.fusionSettings.settings') }}</h3>
          
          <!-- 熔接模式 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.fusionMode') }}</div>
            <div class="setting-control">
              <div class="mode-buttons">
                <button 
                  @click="setFusionMode('auto')" 
                  class="mode-btn"
                  :class="{ active: fusionSettings.fusionMode === 'auto' }"
                >
                  {{ t('device.fusionSettings.auto') }}
                </button>
                <button 
                  @click="setFusionMode('manual')" 
                  class="mode-btn"
                  :class="{ active: fusionSettings.fusionMode === 'manual' }"
                >
                  {{ t('device.fusionSettings.manual') }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- 闭盖自动热缩 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.autoHeatShrink') }}</div>
            <div class="setting-control">
              <button @click="toggleAutoHeatShrink" class="toggle-btn" :class="{ active: fusionSettings.autoHeatShrink }">
                {{ fusionSettings.autoHeatShrink ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.focusSwitch') }}</div>
            <div class="setting-control">
              <button @click="toggleFocusSwitch" class="toggle-btn" :class="{ active: fusionSettings.focusSwitch }">
                {{ fusionSettings.focusSwitch ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>
          
          <!-- Z轴间距 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.zAxisDist') }}</div>
            <div class="setting-control">
              <button @click="adjustZAxisDistance(-1)" class="adjust-btn" :disabled="fusionSettings.zAxisDistance <= 0">-</button>
              <span class="setting-value">{{ fusionSettings.zAxisDistance }}</span>
              <button @click="adjustZAxisDistance(1)" class="adjust-btn" :disabled="fusionSettings.zAxisDistance >= 10">+</button>
            </div>
          </div>
          
          <!-- 馈入距离 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.feedDist') }}</div>
            <div class="setting-control">
              <button @click="adjustFeedDistance(-1)" class="adjust-btn" :disabled="fusionSettings.feedDistance <= 0">-</button>
              <span class="setting-value">{{ fusionSettings.feedDistance }}</span>
              <button @click="adjustFeedDistance(1)" class="adjust-btn" :disabled="fusionSettings.feedDistance >= 10">+</button>
            </div>
          </div>
          
          <!-- 切割角度显示暂停 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.anglePause') }}</div>
            <div class="setting-control">
              <button @click="toggleAngleDisplayPause" class="toggle-btn" :class="{ active: fusionSettings.angleDisplayPause }">
                {{ fusionSettings.angleDisplayPause ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>
          
          <!-- 切割角度阈值设定 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.angleThreshold') }}</div>
            <div class="setting-control">
              <select v-model="fusionSettings.angleThreshold" class="setting-select">
                <option value="8">8°</option>
                <option value="20">20°</option>
                <option value="35">35°</option>
              </select>
            </div>
          </div>
          
          <!-- 拉力测试 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.tensileTest') }}</div>
            <div class="setting-control">
              <button @click="toggleTensileTest" class="toggle-btn" :class="{ active: fusionSettings.tensileTest }">
                {{ fusionSettings.tensileTest ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>
          
          <!-- 显示方式 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.displayMode') }}</div>
            <div class="setting-control">
              <span class="readonly-text">{{ t('device.fusionSettings.landscape') }}</span>
            </div>
          </div>
        </div>

        <!-- 加热设置 -->
        <div class="settings-card mb-4">
          <h3 class="section-title">{{ t('device.fusionSettings.heatSettings') }}</h3>
          
          <!-- 热缩管设置 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.heatTube') }}</div>
            <div class="setting-control">
              <select v-model="heatSettings.heatShrinkTube" class="setting-select">
                <option value="40">40mm</option>
                <option value="45">45mm</option>
                <option value="60">60mm</option>
                <option value="80">80mm</option>
              </select>
            </div>
          </div>
          
          <!-- 加热温度 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.heatTemp') }}</div>
            <div class="setting-control">
              <button @click="adjustHeatTemperature(-20)" class="adjust-btn" :disabled="heatSettings.heatTemperature <= 100">-</button>
              <span class="setting-value">{{ heatSettings.heatTemperature }}</span>
              <button @click="adjustHeatTemperature(20)" class="adjust-btn" :disabled="heatSettings.heatTemperature >= 300">+</button>
            </div>
          </div>
          
          <!-- 加热时间 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.heatTime') }}</div>
            <div class="setting-control">
              <button @click="adjustHeatTime(-1)" class="adjust-btn" :disabled="heatSettings.heatTime <= 0">-</button>
              <span class="setting-value">{{ heatSettings.heatTime }}</span>
              <button @click="adjustHeatTime(1)" class="adjust-btn" :disabled="heatSettings.heatTime >= 60">+</button>
            </div>
          </div>
          
          <!-- 闭盖自动热缩 -->
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionSettings.autoHeatShrink') }}</div>
            <div class="setting-control">
              <button @click="toggleHeatAutoShrink" class="toggle-btn" :class="{ active: heatSettings.autoHeatShrink }">
                {{ heatSettings.autoHeatShrink ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>
        </div>

        <div class="settings-card mb-4">
          <h3 class="section-title">{{ t('device.fusionOperation.title') }}</h3>
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionOperation.startFusion') }}</div>
            <div class="setting-control">
              <button class="fusion-op-btn primary" @click="startFusion">
                {{ t('common.execute') }}
              </button>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionOperation.continueFusion') }}</div>
            <div class="setting-control">
              <button class="fusion-op-btn primary" @click="continueFusion">
                {{ t('common.execute') }}
              </button>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionOperation.secondaryDischarge') }}</div>
            <div class="setting-control">
              <button class="fusion-op-btn warn" @click="secondaryDischarge">
                {{ t('common.execute') }}
              </button>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionOperation.switchXLarge') }}</div>
            <div class="setting-control">
              <button class="fusion-op-btn" @click="switchXLarge">
                {{ t('common.execute') }}
              </button>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-label">{{ t('device.fusionOperation.switchYLarge') }}</div>
            <div class="setting-control">
              <button class="fusion-op-btn" @click="switchYLarge">
                {{ t('common.execute') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useModal } from '@/composables/useModal'

const router = useRouter()
const { t } = useI18n()
const { alert } = useModal()

const STORAGE_KEY = 'device_fusion_settings_v1'
let autoSaveTimer: number | undefined

// 熔接参数
const fusionParams = reactive({
  fiberType: 'SM',
  programNumber: '1',
  preFusionCurrent: 1600,
  preFusionTime: 0,
  fusionCurrent: 1600,
  fusionTime: 0,
  cleanCurrent: 1600,
  cleanTime: 300
})

// 熔接设置
const fusionSettings = reactive({
  fusionMode: 'auto',
  autoHeatShrink: false,
  focusSwitch: false,
  zAxisDistance: 0,
  feedDistance: 4,
  angleDisplayPause: false,
  angleThreshold: '8',
  tensileTest: false
})

// 加热设置
const heatSettings = reactive({
  heatShrinkTube: '60',
  heatTemperature: 100,
  heatTime: 5,
  autoHeatShrink: false
})

const persistSettings = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        fusionParams: { ...fusionParams },
        fusionSettings: { ...fusionSettings },
        heatSettings: { ...heatSettings }
      })
    )
  } catch {
    // ignore
  }
}

const queueAutoSave = () => {
  if (autoSaveTimer !== undefined) {
    window.clearTimeout(autoSaveTimer)
  }
  autoSaveTimer = window.setTimeout(() => {
    persistSettings()
    autoSaveTimer = undefined
  }, 300)
}

const loadSavedSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as {
      fusionParams?: Partial<typeof fusionParams>
      fusionSettings?: Partial<typeof fusionSettings>
      heatSettings?: Partial<typeof heatSettings>
    }
    if (parsed.fusionParams) Object.assign(fusionParams, parsed.fusionParams)
    if (parsed.fusionSettings) Object.assign(fusionSettings, parsed.fusionSettings)
    if (parsed.heatSettings) Object.assign(heatSettings, parsed.heatSettings)
  } catch {
    // ignore
  }
}

loadSavedSettings()

watch([fusionParams, fusionSettings, heatSettings], () => queueAutoSave(), { deep: true })

onBeforeUnmount(() => {
  if (autoSaveTimer !== undefined) {
    window.clearTimeout(autoSaveTimer)
  }
})

/**
 * 返回上一页
 */
const goBack = () => {
  router.back()
}

const startFusion = async () => {
  await alert(t('device.fusionOperation.startFusion'))
}

const continueFusion = async () => {
  await alert(t('device.fusionOperation.continueFusion'))
}

const secondaryDischarge = async () => {
  await alert(t('device.fusionOperation.secondaryDischarge'))
}

const switchXLarge = async () => {
  await alert(t('device.fusionOperation.switchXLarge'))
}

const switchYLarge = async () => {
  await alert(t('device.fusionOperation.switchYLarge'))
}

/**
 * 调整预熔电流
 */
const adjustPreFusionCurrent = (delta: number) => {
  const newValue = fusionParams.preFusionCurrent + delta
  if (newValue >= 1600 && newValue <= 3300) {
    fusionParams.preFusionCurrent = newValue
  }
}

/**
 * 调整预熔时间
 */
const adjustPreFusionTime = (delta: number) => {
  const newValue = fusionParams.preFusionTime + delta
  if (newValue >= 0) {
    fusionParams.preFusionTime = newValue
  }
}

/**
 * 调整熔接电流
 */
const adjustFusionCurrent = (delta: number) => {
  const newValue = fusionParams.fusionCurrent + delta
  if (newValue >= 1600 && newValue <= 3300) {
    fusionParams.fusionCurrent = newValue
  }
}

/**
 * 调整熔接时间
 */
const adjustFusionTime = (delta: number) => {
  const newValue = fusionParams.fusionTime + delta
  if (newValue >= 0) {
    fusionParams.fusionTime = newValue
  }
}

/**
 * 调整Z轴间距
 */
const adjustZAxisDistance = (delta: number) => {
  const newValue = fusionSettings.zAxisDistance + delta
  if (newValue >= 0 && newValue <= 10) {
    fusionSettings.zAxisDistance = newValue
  }
}

/**
 * 调整馈入距离
 */
const adjustFeedDistance = (delta: number) => {
  const newValue = fusionSettings.feedDistance + delta
  if (newValue >= 0 && newValue <= 10) {
    fusionSettings.feedDistance = newValue
  }
}

/**
 * 设置熔接模式
 */
const setFusionMode = (mode: string) => {
  fusionSettings.fusionMode = mode
}

/**
 * 切换闭盖自动热缩
 */
const toggleAutoHeatShrink = () => {
  fusionSettings.autoHeatShrink = !fusionSettings.autoHeatShrink
}

const toggleFocusSwitch = () => {
  fusionSettings.focusSwitch = !fusionSettings.focusSwitch
}

/**
 * 调整清洁电流
 */
const adjustCleanCurrent = (delta: number) => {
  const newValue = fusionParams.cleanCurrent + delta
  if (newValue >= 1600 && newValue <= 3300) {
    fusionParams.cleanCurrent = newValue
  }
}

/**
 * 调整清洁时间
 */
const adjustCleanTime = (delta: number) => {
  const newValue = fusionParams.cleanTime + delta
  if (newValue >= 300 && newValue <= 1000) {
    fusionParams.cleanTime = newValue
  }
}

/**
 * 切换切割角度显示暂停
 */
const toggleAngleDisplayPause = () => {
  fusionSettings.angleDisplayPause = !fusionSettings.angleDisplayPause
}

/**
 * 切换拉力测试
 */
const toggleTensileTest = () => {
  fusionSettings.tensileTest = !fusionSettings.tensileTest
}

/**
 * 调整加热温度
 */
const adjustHeatTemperature = (delta: number) => {
  const newValue = heatSettings.heatTemperature + delta
  if (newValue >= 100 && newValue <= 300) {
    heatSettings.heatTemperature = newValue
  }
}

/**
 * 调整加热时间
 */
const adjustHeatTime = (delta: number) => {
  const newValue = heatSettings.heatTime + delta
  if (newValue >= 0 && newValue <= 60) {
    heatSettings.heatTime = newValue
  }
}

/**
 * 切换加热自动热缩
 */
const toggleHeatAutoShrink = () => {
  heatSettings.autoHeatShrink = !heatSettings.autoHeatShrink
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
  color: #2563EB; /* 主色 #2563EB */
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

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

/* 设置卡片 */
.settings-card {
  background: white;
  border-radius: 4px; /* 4px 圆角 */
  padding: 16px; /* 内边距 16px */
  border: 1px solid #E5E7EB; /* 1px 浅灰边框 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04); /* 柔和阴影 */
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #F3F4F6;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 14px;
  color: #6B7280; /* 标签文字颜色 #6B7280 */
  font-weight: 500;
  flex: 1;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.adjust-btn {
  width: 32px;
  height: 32px;
  background: #F9FAFB; /* 背景色 #F9FAFB */
  border: 1px solid #E5E7EB; /* 边框 1px #E5E7EB */
  border-radius: 4px; /* 4px 圆角 */
  color: #6B7280;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.adjust-btn:active:not(:disabled) {
  background: #E5E7EB; /* 点击时背景色变为 #E5E7EB */
}

.adjust-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #F3F4F6;
}

.setting-value {
  min-width: 60px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  background: #F9FAFB; /* 数值背景色 #F9FAFB */
  border-radius: 4px; /* 4px 圆角 */
  padding: 6px 8px;
}

.setting-select {
  background: #F9FAFB; /* 下拉框背景色 #F9FAFB */
  border: 1px solid #E5E7EB;
  border-radius: 4px; /* 4px 圆角 */
  color: #1F2937;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  min-width: 80px;
}

.toggle-btn {
  background: #E5E7EB; /* 关闭状态背景色 #E5E7EB */
  border: none;
  border-radius: 6px; /* 统一 6px 圆角 */
  color: #9CA3AF; /* 关闭状态文字 #9CA3AF */
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 12px;
  transition: all 0.3s ease;
  min-width: 50px;
}

.toggle-btn.active {
  background: #2563EB; /* 开启状态背景色 #2563EB */
  color: white; /* 开启状态文字白色 */
}

.mode-buttons {
  display: flex;
  gap: 8px;
}

.mode-btn {
  background: #F9FAFB; /* 未选中态背景色 #F9FAFB */
  border: 1px solid transparent;
  border-radius: 4px; /* 统一 4px 圆角 */
  color: #6B7280; /* 未选中态文字 #6B7280 */
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 12px;
  transition: all 0.3s ease;
}

.mode-btn.active {
  background: #2563EB; /* 选中态背景色 #2563EB */
  color: white; /* 选中态文字白色 */
}

.readonly-text {
  font-size: 14px;
  color: #6B7280;
  font-style: italic;
}

.fusion-op-btn {
  border: none;
  border-radius: 8px;
  height: 44px;
  min-width: 88px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: #F3F4F6;
  color: #374151;
  transition: all 0.2s ease;
}

.fusion-op-btn:active {
  transform: scale(0.98);
}

.fusion-op-btn.primary {
  background: #2563EB;
  color: #FFFFFF;
}

.fusion-op-btn.primary:active {
  background: #1D4ED8;
}

.fusion-op-btn.warn {
  background: #F59E0B;
  color: #FFFFFF;
}

.fusion-op-btn.warn:active {
  background: #D97706;
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
</style>
