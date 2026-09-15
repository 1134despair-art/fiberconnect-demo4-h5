<template>
  <PortableOtdrMeasure v-if="isPortableOtdr && currentDevice" :device="currentDevice" />
  <div v-else class="app-container legacy-operation-page">
    <!-- 顶部标题栏 -->
    <header class="header">
      <button @click="goBack" class="back-btn">
        ← {{ $t('common.back') }}
      </button>
      <div class="page-title">{{ $t('device.otdr.title') }}</div>
    </header>
    
    <!-- 主内容区域 -->
    <div class="content-flex hide-scrollbar">
      <div class="p-4">
        <div v-if="isPortableOtdr && usePortableHardwareUi" class="otdr-card">
          <div class="otdr-page">
            <div class="waveform-shell">
              <div class="waveform-topbar">
                <div class="topbar-left">
                  <span class="topbar-text">{{ otdrSettings.range }}</span>
                  <span class="topbar-text">{{ otdrSettings.pulseWidth }}</span>
                  <span class="topbar-text">{{ otdrSettings.wavelength }}</span>
                </div>
                <div class="topbar-right">
                  <span class="battery">{{ batteryPercent }}%</span>
                </div>
              </div>

              <div class="distance-tag">{{ cursorDistanceText }}</div>

              <canvas ref="waveformCanvas" class="waveform-canvas"></canvas>
              <div v-if="isMeasuring && waveformData.length === 0" class="waveform-loading">
                <span class="iconify spin-icon" data-icon="mdi:loading"></span>
                <div v-if="otdrSettings.mode === 'avg' && avgRemaining > 0" class="loading-text">
                  {{ avgRemaining }}s
                </div>
              </div>

              <div class="waveform-bottombar">
                <template v-if="isMeasuring && waveformData.length === 0">
                  <div class="bar-item">{{ $t('device.otdr.measuring') }}</div>
                </template>
                <template v-else>
                  <div class="bar-item">Y: {{ yScaleText }}</div>
                  <div class="bar-item">X: {{ xScaleText }}</div>
                </template>
              </div>
            </div>

            <div class="measure-actions portable-measure-actions">
              <button @click="startMeasurement" class="action-btn primary" :disabled="isMeasuring">
                {{ measureButtonText }}
              </button>
              <button v-if="isMeasuring && otdrSettings.mode === 'realtime'" @click="stopMeasurement" class="action-btn secondary portable-stop">
                {{ $t('device.otdr.stopMeasure') }}
              </button>
              <button @click="scrollToPortableControls" class="action-btn">
                {{ $t('device.otdr.measureSettings') }}
              </button>
            </div>

            <div ref="portableControlRef" class="portable-control-card">
              <div class="portable-control-title">{{ $t('device.otdr.measureOp') }}</div>
              <div class="portable-control-row">
                <div class="portable-control-label">{{ $t('device.otdr.range') }}</div>
                <div class="portable-stepper">
                  <button class="step-btn" @click="prevRange" :disabled="isMeasuring">‹</button>
                  <div class="step-value">{{ otdrSettings.range }}</div>
                  <button class="step-btn" @click="nextRange" :disabled="isMeasuring">›</button>
                </div>
              </div>
              <div class="portable-control-row">
                <div class="portable-control-label">{{ $t('device.otdr.pulseWidth') }}</div>
                <div class="portable-stepper">
                  <button class="step-btn" @click="prevPulse" :disabled="isMeasuring">‹</button>
                  <div class="step-value">{{ otdrSettings.pulseWidth }}</div>
                  <button class="step-btn" @click="nextPulse" :disabled="isMeasuring">›</button>
                </div>
              </div>
              <div class="portable-control-row">
                <div class="portable-control-label">{{ $t('device.otdr.measureMode') }}</div>
                <div class="portable-seg">
                  <button class="seg-btn" :class="{ active: otdrSettings.mode === 'realtime' }" @click="setMode('realtime')" :disabled="isMeasuring">
                    {{ $t('device.otdr.realtimeMode') }}
                  </button>
                  <button class="seg-btn" :class="{ active: otdrSettings.mode === 'avg' }" @click="setMode('avg')" :disabled="isMeasuring">
                    {{ $t('device.otdr.avgMode') }}
                  </button>
                </div>
              </div>
            </div>

            <div class="cursor-actions">
              <button
                class="nav-btn"
                @touchstart.prevent="startLongPress(-1)"
                @touchend.prevent="stopLongPress"
                @mousedown.prevent="startLongPress(-1)"
                @mouseup.prevent="stopLongPress"
                @mouseleave.prevent="stopLongPress"
              >
                ←
              </button>
              <button
                class="nav-btn"
                @touchstart.prevent="startLongPress(1)"
                @touchend.prevent="stopLongPress"
                @mousedown.prevent="startLongPress(1)"
                @mouseup.prevent="stopLongPress"
                @mouseleave.prevent="stopLongPress"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div v-else class="legacy-wrap">
          <div class="legacy-card mb-4">
            <h3 class="legacy-title">{{ $t('device.otdr.measureOp') }}</h3>
            <button @click="startMeasurement" class="legacy-start-btn" :disabled="isMeasuring">
              {{ measureButtonText }}
            </button>
            <button
              v-if="isMeasuring && otdrSettings.mode === 'realtime'"
              @click="stopMeasurement"
              class="legacy-stop-btn"
            >
              {{ $t('device.otdr.stopMeasure') }}
            </button>

            <div class="legacy-result">
              <div class="legacy-result-header">
                <div class="legacy-result-title">{{ $t('device.otdr.measureResult') }}</div>
                <div class="legacy-result-meta">
                  <span>{{ $t('device.otdr.pulseWidth') }}: {{ otdrSettings.pulseWidth }}</span>
                  <span>{{ $t('device.otdr.range') }}: {{ otdrSettings.range }}</span>
                </div>
              </div>

              <div class="legacy-wave-wrap">
                <canvas ref="waveformCanvas" class="legacy-wave-canvas"></canvas>
                <div v-if="isMeasuring && waveformData.length === 0" class="legacy-wave-loading">
                  <span class="iconify spin-icon" data-icon="mdi:loading"></span>
                  <div v-if="otdrSettings.mode === 'avg' && avgRemaining > 0" class="loading-text">
                    {{ avgRemaining }}s
                  </div>
                </div>
              </div>

              <div class="legacy-result-footer">
                <div class="legacy-footer-text">
                  {{ $t('device.otdr.distance') }}: {{ cursorDistance }}km
                </div>
                <div class="legacy-footer-text">
                  X: {{ getXScale() }} km/div
                </div>
                <div class="legacy-footer-text">
                  Y: {{ yScale }} dB/div
                </div>
              </div>

              <div class="legacy-nav">
                <button
                  class="legacy-nav-btn"
                  @touchstart.prevent="startLongPress(-1)"
                  @touchend.prevent="stopLongPress"
                  @mousedown.prevent="startLongPress(-1)"
                  @mouseup.prevent="stopLongPress"
                  @mouseleave.prevent="stopLongPress"
                >
                  左
                </button>
                <button
                  class="legacy-nav-btn"
                  @touchstart.prevent="startLongPress(1)"
                  @touchend.prevent="stopLongPress"
                  @mousedown.prevent="startLongPress(1)"
                  @mouseup.prevent="stopLongPress"
                  @mouseleave.prevent="stopLongPress"
                >
                  右
                </button>
              </div>
            </div>
          </div>

          <div class="legacy-card">
            <h3 class="legacy-title">{{ $t('device.otdr.measureSettings') }}</h3>

            <div class="legacy-group">
              <div class="legacy-group-title">{{ $t('device.otdr.range') }}</div>
              <div class="legacy-grid legacy-grid--range">
                <button
                  v-for="opt in rangeOptions"
                  :key="opt"
                  class="legacy-chip"
                  :class="{ active: otdrSettings.range === opt }"
                  @click="setRange(opt)"
                >
                  {{ opt }}
                </button>
              </div>
            </div>

            <div class="legacy-group">
              <div class="legacy-group-title">{{ $t('device.otdr.pulseWidth') }}</div>
              <div class="legacy-grid legacy-grid--pulse">
                <button
                  v-for="opt in pulseOptions"
                  :key="opt"
                  class="legacy-chip"
                  :class="{ active: otdrSettings.pulseWidth === opt }"
                  @click="setPulse(opt)"
                >
                  {{ opt }}
                </button>
              </div>
            </div>

            <div class="legacy-group">
              <div class="legacy-group-title">{{ $t('device.otdr.measureMode') }}</div>
              <div class="legacy-modes">
                <button class="legacy-mode" :class="{ active: otdrSettings.mode === 'avg' }" @click="setMode('avg')">
                  <div class="legacy-mode-title">{{ $t('device.otdr.avgMode') }}</div>
                  <div class="legacy-mode-desc">{{ $t('device.otdr.avgDesc') }}</div>
                </button>
                <button class="legacy-mode" :class="{ active: otdrSettings.mode === 'realtime' }" @click="setMode('realtime')">
                  <div class="legacy-mode-title">{{ $t('device.otdr.realtimeMode') }}</div>
                  <div class="legacy-mode-desc">{{ $t('device.otdr.realtimeDesc') }}</div>
                </button>
              </div>
            </div>
          </div>

          <div class="legacy-card">
            <div class="legacy-history-header">
              <div class="legacy-title m-0">{{ $t('device.otdr.history') }}</div>
              <div class="legacy-history-right">
                <div class="legacy-history-count">{{ $t('device.fusionRecords.totalRecords', { count: historyRecords.length }) }}</div>
                <button class="legacy-export-btn" @click="exportSelected">
                  {{ $t('device.otdr.export') }}
                </button>
              </div>
            </div>

            <div v-if="pagedHistory.length === 0" class="legacy-empty">
              {{ $t('common.noData') }}
            </div>

            <div v-else class="legacy-history-list">
              <div v-for="item in pagedHistory" :key="item.id" class="legacy-history-item">
                <label class="legacy-check">
                  <input type="checkbox" :checked="selectedRecordIds.has(item.id)" @change="toggleSelect(item.id)" />
                </label>
                <div class="legacy-history-body">
                  <div class="legacy-history-name">{{ item.name }}</div>
                  <div class="legacy-history-time">{{ item.time }}</div>
                  <div class="legacy-history-actions">
                    <button class="legacy-icon-btn danger" @click="deleteRecord(item.id)">
                      <span class="iconify" data-icon="mdi:trash-can-outline"></span>
                    </button>
                    <button class="legacy-icon-btn" @click="openRecord(item)">
                      <span class="iconify" data-icon="mdi:folder-open-outline"></span>
                    </button>
                    <button class="legacy-icon-btn" @click="viewRecord(item)">
                      <span class="iconify" data-icon="mdi:image-outline"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="legacy-history-footer">
              <div class="legacy-page">
                <button class="legacy-page-btn" :disabled="historyPage <= 1" @click="historyPage--">
                  {{ $t('device.fusionRecords.prevPage') }}
                </button>
                <div class="legacy-page-info">{{ historyPage }}/{{ historyTotalPages }}</div>
                <button class="legacy-page-btn" :disabled="historyPage >= historyTotalPages" @click="historyPage++">
                  {{ $t('device.fusionRecords.nextPage') }}
                </button>
              </div>
              <button class="legacy-clear-btn" @click="clearHistory">
                {{ $t('device.fusionRecords.clear') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义确认弹窗 -->
    <div v-if="modalState.visible" class="modal-overlay" @click="handleModalCancel">
      <div class="modal-content confirm-modal" @click.stop>
        <div class="modal-body">
          <div class="modal-title">{{ modalState.title }}</div>
          <div class="confirm-message">
            {{ modalState.message }}
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            v-if="modalState.showCancel" 
            @click="handleModalCancel" 
            class="btn-cancel"
          >
            {{ modalState.cancelText }}
          </button>
          <div v-if="modalState.showCancel" class="footer-divider"></div>
          <button 
            @click="handleModalConfirm" 
            class="btn-confirm"
            :style="{ backgroundColor: modalState.confirmColor }"
          >
            {{ modalState.confirmText }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth, type Device } from '@/composables/useAuth'
import PortableOtdrMeasure from '../portable-otdr/PortableOtdrMeasure.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { user } = useAuth()

const DEVICE_CMD_KEY_PREFIX = 'device_cmd_last:'

const recordOtdrCommandAt = () => {
  const deviceId = route.params.id as string
  if (!deviceId) return
  const now = Date.now()
  try {
    localStorage.setItem(`${DEVICE_CMD_KEY_PREFIX}${deviceId}:any`, String(now))
    localStorage.setItem(`${DEVICE_CMD_KEY_PREFIX}${deviceId}:otdr`, String(now))
  } catch {
    return
  }
}

const isMeasuring = ref(false)
const waveformCanvas = ref<HTMLCanvasElement | null>(null)
const waveformData = ref<number[]>([])
const cursorIndex = ref(0)
const batteryPercent = ref(82)
const avgRemaining = ref(0)
const portableControlRef = ref<HTMLElement | null>(null)

let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressInterval: ReturnType<typeof setInterval> | null = null
let realtimeInterval: ReturnType<typeof setInterval> | null = null
let avgInterval: ReturnType<typeof setInterval> | null = null
let resizeObserver: ResizeObserver | null = null

const otdrSettings = reactive({
  range: '1km',
  pulseWidth: '100ns',
  mode: 'realtime' as 'avg' | 'realtime',
  wavelength: '1550nm'
})

const rangeOptions = ['0.1km', '0.5km', '1km', '2.5km', '5km', '10km', '20km']
const pulseOptions = ['25ns', '50ns', '100ns', '250ns', '500ns', '1000ns']

const currentDevice = computed<Device | null>(() => {
  const deviceId = route.params.id as string
  if (!deviceId) return null
  return user.value?.devices?.find(d => d.id === deviceId) || null
})

const isPortableOtdr = computed(() => {
  return currentDevice.value?.deviceType === 'portable_otdr'
})

const usePortableHardwareUi = computed(() => {
  return isPortableOtdr.value
})

const historyRecords = ref<{ id: string; name: string; time: string }[]>([
  { id: 'otdr_rec_1', name: '测试测试.sor', time: '2024-12-25 10:30:15' },
  { id: 'otdr_rec_2', name: '测试测试.sor', time: '2024-12-25 10:30:15' },
  { id: 'otdr_rec_3', name: '测试测试.sor', time: '2024-12-25 10:30:15' }
])

const selectedRecordIds = ref(new Set<string>())
const historyPage = ref(1)
const historyPageSize = 5

const historyTotalPages = computed(() => {
  return Math.max(1, Math.ceil(historyRecords.value.length / historyPageSize))
})

const pagedHistory = computed(() => {
  const page = Math.min(historyPage.value, historyTotalPages.value)
  const start = (page - 1) * historyPageSize
  return historyRecords.value.slice(start, start + historyPageSize)
})

const cursorDistance = computed(() => {
  if (waveformData.value.length === 0) return '0.00'
  const rangeKm = parseFloat(otdrSettings.range)
  const distanceKm = (cursorIndex.value / waveformData.value.length) * rangeKm
  return distanceKm.toFixed(4)
})

const cursorDistanceText = computed(() => {
  if (waveformData.value.length === 0) return '0.0m'
  const rangeKm = parseFloat(otdrSettings.range)
  const distanceKm = (cursorIndex.value / waveformData.value.length) * rangeKm
  const meters = distanceKm * 1000
  return `${meters.toFixed(1)}m`
})

const yScale = computed(() => {
  if (otdrSettings.range === '20km' || otdrSettings.range === '10km') return '10'
  if (otdrSettings.range === '5km') return '8'
  if (otdrSettings.range === '2.5km') return '6'
  return '5'
})

const yScaleText = computed(() => {
  if (waveformData.value.length === 0) return '--db/div'
  return `${Number.parseFloat(yScale.value).toFixed(1)}db/div`
})

const xScaleText = computed(() => {
  if (waveformData.value.length === 0) return '--km/div'
  const rangeKm = parseFloat(otdrSettings.range)
  const perDivKm = rangeKm / 5
  if (perDivKm < 1) return `${(perDivKm * 1000).toFixed(1)}m/div`
  return `${perDivKm.toFixed(1)}km/div`
})

const measureButtonText = computed(() => {
  if (!isMeasuring.value) return t('device.otdr.startMeasure')
  if (otdrSettings.mode === 'avg' && avgRemaining.value > 0) return `${t('device.otdr.measuring')} ${avgRemaining.value}s`
  return t('device.otdr.measuring')
})

const modalState = reactive({
  visible: false,
  title: '',
  message: '',
  showCancel: true,
  confirmText: '确定',
  cancelText: '取消',
  confirmColor: '#2563EB',
  onConfirm: () => {}
})

const showConfirm = (title: string, message: string, onConfirmAction: () => void, confirmColor = '#2563EB') => {
  modalState.title = title
  modalState.message = message
  modalState.showCancel = true
  modalState.confirmText = t('common.confirm')
  modalState.cancelText = t('common.cancel')
  modalState.confirmColor = confirmColor
  modalState.onConfirm = onConfirmAction
  modalState.visible = true
}

const showAlert = (title: string, message: string) => {
  modalState.title = title
  modalState.message = message
  modalState.showCancel = false
  modalState.confirmText = t('common.confirm')
  modalState.confirmColor = '#2563EB'
  modalState.onConfirm = () => { modalState.visible = false }
  modalState.visible = true
}

const handleModalConfirm = () => {
  if (modalState.onConfirm) {
    modalState.onConfirm()
  }
  modalState.visible = false
}

const handleModalCancel = () => {
  modalState.visible = false
}

const getXScale = () => {
  const rangeVal = parseFloat(otdrSettings.range)
  return (rangeVal / 5).toFixed(1)
}

const goBack = () => {
  router.back()
}

const scrollToPortableControls = () => {
  portableControlRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const generateWaveform = () => {
  const points = 300
  const data: number[] = []
  let currentValue = 80
  const slope = 0.1

  for (let i = 0; i < points; i++) {
    const noise = (Math.random() - 0.5) * 2
    if (i === 100) currentValue += 15
    else if (i === 105) currentValue -= 18
    else if (i === 200) currentValue -= 5
    else if (i === 280) currentValue += 20
    else if (i === 285) currentValue -= 80

    currentValue -= slope
    let val = currentValue + noise
    if (val < 0) val = 0
    if (val > 100) val = 100
    data.push(val)
  }

  waveformData.value = data
}

const drawWaveform = () => {
  const canvas = waveformCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const cssWidth = Math.max(1, Math.round(rect.width))
  const cssHeight = Math.max(1, Math.round(rect.height))
  const dpr = window.devicePixelRatio || 1

  const nextWidth = Math.round(cssWidth * dpr)
  const nextHeight = Math.round(cssHeight * dpr)
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth
    canvas.height = nextHeight
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const width = cssWidth
  const height = cssHeight
  const data = waveformData.value

  ctx.fillStyle = '#0B0F14'
  ctx.fillRect(0, 0, width, height)

  if (data.length === 0) return

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 1; i < 5; i++) {
    const x = (width / 5) * i
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  }
  for (let i = 1; i < 4; i++) {
    const y = (height / 4) * i
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }
  ctx.stroke()

  ctx.strokeStyle = '#F97316'
  ctx.lineWidth = 2
  ctx.beginPath()

  const xStep = width / (data.length - 1)
  const yScaleVal = height / 100

  data.forEach((val, index) => {
    const x = index * xStep
    const y = height - (val * yScaleVal)
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  if (cursorIndex.value >= 0 && cursorIndex.value < data.length) {
    const cursorX = cursorIndex.value * xStep
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cursorX, 0)
    ctx.lineTo(cursorX, height)
    ctx.stroke()
  }
}

const startMeasurement = async () => {
  if (isMeasuring.value) return
  recordOtdrCommandAt()
  stopMeasurement()
  isMeasuring.value = true

  try {
    if (otdrSettings.mode === 'avg') {
      waveformData.value = []
      avgRemaining.value = 15
      drawWaveform()

      if (avgInterval) clearInterval(avgInterval)
      avgInterval = setInterval(() => {
        if (!isMeasuring.value) {
          if (avgInterval) clearInterval(avgInterval)
          avgInterval = null
          return
        }
        avgRemaining.value = Math.max(0, avgRemaining.value - 1)
        if (avgRemaining.value <= 0) {
          if (avgInterval) clearInterval(avgInterval)
          avgInterval = null
          generateWaveform()
          drawWaveform()
          isMeasuring.value = false
        }
      }, 1000)
      return
    }

    generateWaveform()
    drawWaveform()

    if (realtimeInterval) clearInterval(realtimeInterval)
    realtimeInterval = setInterval(() => {
      if (!isMeasuring.value) return
      generateWaveform()
      drawWaveform()
    }, 500)
  } catch (error) {
    showAlert(t('common.error'), t('device.otdr.measuring') + t('common.error'))
    isMeasuring.value = false
  }
}

const stopMeasurement = () => {
  isMeasuring.value = false
  avgRemaining.value = 0
  if (realtimeInterval) {
    clearInterval(realtimeInterval)
    realtimeInterval = null
  }
  if (avgInterval) {
    clearInterval(avgInterval)
    avgInterval = null
  }
}

const moveCursor = (step: number) => {
  if (waveformData.value.length === 0) return
  let newIndex = cursorIndex.value + step
  if (newIndex < 0) newIndex = 0
  if (newIndex >= waveformData.value.length) newIndex = waveformData.value.length - 1
  cursorIndex.value = newIndex
  requestAnimationFrame(drawWaveform)
}

const startLongPress = (step: number) => {
  moveCursor(step)
  longPressTimer = setTimeout(() => {
    longPressInterval = setInterval(() => {
      moveCursor(step)
    }, 50)
  }, 300)
}

const stopLongPress = () => {
  if (longPressTimer) clearTimeout(longPressTimer)
  if (longPressInterval) clearInterval(longPressInterval)
  longPressTimer = null
  longPressInterval = null
}

const setRange = (value: string) => {
  stopMeasurement()
  otdrSettings.range = value
}

const setPulse = (value: string) => {
  stopMeasurement()
  otdrSettings.pulseWidth = value
}

const setMode = (value: 'avg' | 'realtime') => {
  stopMeasurement()
  otdrSettings.mode = value
}

const cycleOption = (options: string[], current: string, step: number) => {
  const idx = Math.max(0, options.indexOf(current))
  const next = (idx + step + options.length) % options.length
  return options[next]
}

const prevRange = () => {
  setRange(cycleOption(rangeOptions, otdrSettings.range, -1))
}

const nextRange = () => {
  setRange(cycleOption(rangeOptions, otdrSettings.range, 1))
}

const prevPulse = () => {
  setPulse(cycleOption(pulseOptions, otdrSettings.pulseWidth, -1))
}

const nextPulse = () => {
  setPulse(cycleOption(pulseOptions, otdrSettings.pulseWidth, 1))
}

const toggleSelect = (id: string) => {
  const next = new Set(selectedRecordIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedRecordIds.value = next
}

const exportSelected = async () => {
  const count = selectedRecordIds.value.size
  if (count === 0) {
    showAlert(t('common.warning'), t('common.noData'))
    return
  }
  showAlert(t('common.success'), `${t('device.otdr.export')} ${count}`)
}

const deleteRecord = async (id: string) => {
  const record = historyRecords.value.find(r => r.id === id)
  showConfirm(
    t('common.confirm'),
    `${t('device.fusionRecords.delete')}：${record?.name || ''}`,
    () => {
      historyRecords.value = historyRecords.value.filter(r => r.id !== id)
      const next = new Set(selectedRecordIds.value)
      next.delete(id)
      selectedRecordIds.value = next
      historyPage.value = Math.min(historyPage.value, historyTotalPages.value)
    },
    '#EF4444'
  )
}

const clearHistory = async () => {
  if (historyRecords.value.length === 0) return
  showConfirm(
    t('common.confirm'),
    t('device.fusionRecords.clear'),
    () => {
      historyRecords.value = []
      selectedRecordIds.value = new Set()
      historyPage.value = 1
    },
    '#EF4444'
  )
}

const openRecord = async (item: { id: string; name: string }) => {
  showConfirm(
    t('common.confirm'),
    `${t('device.otdr.open')}：${item.name}`,
    () => {
      showAlert(t('common.success'), t('device.otdr.open'))
    }
  )
}

const viewRecord = async (item: { id: string; name: string }) => {
  showAlert(t('device.otdr.view'), item.name)
}

onMounted(() => {
  nextTick(() => {
    generateWaveform()
    drawWaveform()

    const canvas = waveformCanvas.value
    if (canvas && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        drawWaveform()
      })
      resizeObserver.observe(canvas)
    }
  })
})

onUnmounted(() => {
  stopLongPress()
  stopMeasurement()
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
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
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #E5E7EB;
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
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.waveform-canvas {
  width: 100%;
  height: clamp(220px, 45vw, 320px);
  display: block;
}

.waveform-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  gap: 10px;
}

.spin-icon {
  font-size: 32px;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Mobile app style confirmation modal */
.confirm-modal {
  max-width: 280px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.confirm-modal .modal-body {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #FFFFFF;
  flex: 1;
}

.confirm-modal .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 16px;
  text-align: center;
}

.confirm-modal .confirm-message {
  font-size: 14px;
  line-height: 1.4;
  color: #4B5563;
  text-align: center;
  padding: 0;
}

.confirm-modal .modal-footer {
  display: flex;
  background: #FFFFFF;
  border-top: 1px solid #F3F4F6;
  height: 48px;
}

.confirm-modal .btn-cancel,
.confirm-modal .btn-confirm {
  flex: 1;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  height: 100%;
}

.confirm-modal .btn-cancel {
  background: #FFFFFF;
  color: #6B7280;
}

.confirm-modal .btn-cancel:hover {
  background: #F9FAFB;
}

.confirm-modal .footer-divider {
  width: 1px;
  background: #F3F4F6;
}

.confirm-modal .btn-confirm {
  background: #2563EB;
  color: #FFFFFF;
  font-weight: 600;
}

.confirm-modal .btn-confirm:hover {
  background: #1D4ED8;
}

/* Mobile-optimized modal overlay */
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
  backdrop-filter: blur(2px);
  box-sizing: border-box;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 343px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

.modal-body {
  padding: 20px;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.otdr-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.otdr-page {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.waveform-shell {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #0B0F14;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.waveform-topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: rgba(0, 0, 0, 0.35);
  z-index: 2;
}

.topbar-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.topbar-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
}

.battery {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 800;
}

.distance-tag {
  position: absolute;
  top: 44px;
  left: 12px;
  background: rgba(37, 99, 235, 0.92);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 6px;
  z-index: 2;
}

.waveform-bottombar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #F59E0B;
  padding: 10px 12px;
}

.bar-item {
  font-size: 12px;
  font-weight: 900;
  color: #111827;
}

.measure-actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  flex-wrap: wrap;
}

.portable-measure-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.portable-measure-actions .action-btn {
  min-width: 0;
}

.portable-stop {
  grid-column: 1 / -1;
}

.portable-control-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 14px;
  margin-top: 10px;
}

.portable-control-title {
  font-size: 14px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 10px;
}

.portable-control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #F3F4F6;
}

.portable-control-row:first-of-type {
  border-top: none;
  padding-top: 0;
}

.portable-control-label {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.portable-stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-btn {
  width: 44px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
  color: #374151;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
}

.step-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-value {
  min-width: 72px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  font-size: 13px;
  font-weight: 800;
  color: #111827;
  font-variant-numeric: tabular-nums;
}

.portable-seg {
  display: flex;
  gap: 8px;
}

.portable-seg .seg-btn {
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
  color: #6B7280;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.portable-seg .seg-btn.active {
  background: #2563EB;
  border-color: #2563EB;
  color: #FFFFFF;
}

.portable-seg .seg-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn {
  height: 44px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  padding: 0 14px;
  flex: 1;
  min-width: 110px;
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.action-btn.primary {
  background: #2563EB;
  border-color: #2563EB;
  color: #FFFFFF;
}

.action-btn.secondary {
  background: #111827;
  border-color: #111827;
  color: #FFFFFF;
}

.cursor-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 12px;
}

.legacy-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.legacy-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  padding: 18px;
  border: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.legacy-title {
  margin: 0 0 14px 0;
  font-size: 18px;
  font-weight: 800;
  color: #111827;
}

.m-0 {
  margin: 0;
}

.legacy-start-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: #2563EB;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
}

.legacy-start-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.legacy-stop-btn {
  width: 100%;
  height: 44px;
  margin-top: 12px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  background: #FFFFFF;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.legacy-result {
  margin-top: 16px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  overflow: hidden;
}

.legacy-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
}

.legacy-result-title {
  font-size: 14px;
  font-weight: 900;
  color: #111827;
}

.legacy-result-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #6B7280;
  white-space: nowrap;
}

.legacy-wave-wrap {
  position: relative;
  background: #111827;
}

.legacy-wave-canvas {
  width: 100%;
  height: 200px;
  display: block;
}

.legacy-wave-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.legacy-result-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-top: 1px solid #E5E7EB;
  font-size: 12px;
  font-weight: 800;
  color: #374151;
}

.legacy-footer-text {
  white-space: nowrap;
}

.legacy-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px;
  border-top: 1px solid #E5E7EB;
}

.legacy-nav-btn {
  height: 44px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: #2563EB;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 900;
}

.legacy-group {
  padding-top: 16px;
}

.legacy-group-title {
  font-size: 16px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 12px;
}

.legacy-grid {
  display: grid;
  gap: 12px;
}

.legacy-grid--range {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.legacy-grid--pulse {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.legacy-chip {
  height: 44px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
  color: #6B7280;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.legacy-chip.active {
  background: #2563EB;
  border-color: #2563EB;
  color: #FFFFFF;
}

.legacy-modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.legacy-mode {
  border: 2px solid #E5E7EB;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 14px;
  text-align: left;
  cursor: pointer;
}

.legacy-mode.active {
  border-color: #2563EB;
  background: rgba(37, 99, 235, 0.08);
}

.legacy-mode-title {
  font-size: 16px;
  font-weight: 900;
  color: #111827;
  margin-bottom: 6px;
}

.legacy-mode-desc {
  font-size: 12px;
  font-weight: 700;
  color: #6B7280;
  line-height: 1.3;
}

.legacy-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.legacy-history-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legacy-history-count {
  font-size: 12px;
  font-weight: 800;
  color: #6B7280;
}

.legacy-export-btn {
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: 10px;
  background: #2563EB;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.legacy-empty {
  padding: 20px 0;
  text-align: center;
  color: #6B7280;
  font-weight: 700;
}

.legacy-history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
}

.legacy-history-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 12px;
}

.legacy-check input {
  width: 16px;
  height: 16px;
}

.legacy-history-body {
  flex: 1;
  min-width: 0;
}

.legacy-history-name {
  font-size: 14px;
  font-weight: 900;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legacy-history-time {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #6B7280;
}

.legacy-history-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

.legacy-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563EB;
}

.legacy-icon-btn.danger {
  color: #EF4444;
}

.legacy-history-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid #E5E7EB;
  margin-top: 14px;
}

.legacy-page {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legacy-page-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
  color: #6B7280;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.legacy-page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.legacy-page-info {
  font-size: 12px;
  font-weight: 900;
  color: #111827;
}

.legacy-clear-btn {
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: 10px;
  background: #2563EB;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

@media (max-width: 420px) {
  .legacy-grid--range {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.nav-btn {
  height: 44px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: #111827;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 900;
}

.nav-btn:active {
  transform: scale(0.98);
}

.settings-card {
  background: transparent;
  padding: 0;
  border: none;
  box-shadow: none;
  margin-bottom: 0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #E5E7EB;
  cursor: pointer;
  gap: 12px;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 14px;
  color: #374151;
  font-weight: 600;
  margin-bottom: 0;
  flex: 1;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-text {
  font-size: 13px;
  color: #6B7280;
  font-weight: 700;
}

.arrow-icon {
  font-size: 18px;
  color: #9CA3AF;
}

.toggle-btn {
  border: none;
  border-radius: 8px;
  height: 32px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  background: #E5E7EB;
  color: #6B7280;
}

.toggle-btn.active {
  background: #2563EB;
  color: #FFFFFF;
}

.setting-item.danger .setting-label {
  color: #EF4444;
}

.page-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: none;
  background: #D1D5DB;
  cursor: pointer;
}

.dot.active {
  background: #2563EB;
}

.select-modal {
  width: min(420px, calc(100vw - 32px));
  max-width: 420px;
}

.select-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
}

.select-item {
  height: 44px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.select-item.active {
  background: #2563EB;
  border-color: #2563EB;
  color: #FFFFFF;
}
</style>
