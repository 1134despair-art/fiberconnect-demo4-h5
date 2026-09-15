<template>
  <div class="app-container legacy-operation-page">
    <header class="header">
      <button @click="goBack" class="back-btn">
        ← {{ t('common.back') }}
      </button>
      <div class="page-title">{{ t('device.fusionOperation.title') }}</div>
    </header>

    <div class="content-flex hide-scrollbar">
      <div class="actions-wrap">
        <div class="actions-panel">
          <div class="actions-grid">
            <button class="action-btn primary" @click="startFusion">
              {{ t('device.fusionOperation.startFusion') }}
            </button>
            <button class="action-btn primary" @click="continueFusion">
              {{ t('device.fusionOperation.continueFusion') }}
            </button>
            <button class="action-btn warn full" @click="secondaryDischarge">
              {{ t('device.fusionOperation.secondaryDischarge') }}
            </button>
            <button class="action-btn" @click="switchXLarge">
              {{ t('device.fusionOperation.switchXLarge') }}
            </button>
            <button class="action-btn" @click="switchYLarge">
              {{ t('device.fusionOperation.switchYLarge') }}
            </button>
            <button class="action-btn" @click="switchXYLarge">
              切换 X/Y 视图
            </button>
          </div>
          <div class="operation-feedback" role="status">{{ operationFeedback }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
const operationFeedback = ref('等待设备操作')

const goBack = () => {
  router.back()
}

const startFusion = () => {
  operationFeedback.value = '已发送开始熔接指令（演示）'
}

const continueFusion = () => {
  operationFeedback.value = '已发送继续熔接指令（演示）'
}

const secondaryDischarge = () => {
  operationFeedback.value = '已发送二次放电指令（演示）'
}

const switchXLarge = () => {
  operationFeedback.value = '已切换到 X 轴大图'
}

const switchYLarge = () => {
  operationFeedback.value = '已切换到 Y 轴大图'
}

const switchXYLarge = () => {
  operationFeedback.value = '已切换到 X/Y 熔接视图'
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%);
  overflow: hidden;
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
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  position: absolute;
  left: 16px;
  background: none;
  border: none;
  color: #2563EB;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 0;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
}

.content-flex {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.actions-wrap {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.actions-panel {
  width: 100%;
  max-width: 960px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #E5E7EB;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.operation-feedback {
  min-height: 20px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #E5E7EB;
  color: #6B7280;
  font-size: 12px;
  text-align: center;
}

.action-btn {
  border: none;
  border-radius: 8px;
  height: 44px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: #F3F4F6;
  color: #374151;
  transition: all 0.2s ease;
}

.action-btn:active {
  transform: scale(0.98);
}

.action-btn.primary {
  background: #2563EB;
  color: #FFFFFF;
}

.action-btn.primary:active {
  background: #1D4ED8;
}

.action-btn.warn {
  background: #F59E0B;
  color: #FFFFFF;
}

.action-btn.warn:active {
  background: #D97706;
}

.action-btn.full {
  grid-column: 1 / -1;
}

</style>
