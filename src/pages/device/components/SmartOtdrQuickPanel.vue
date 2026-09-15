<template>
  <div ref="panelRootRef" class="smart-otdr-quick-panel">
    <button
      ref="triggerRef"
      class="smart-otdr-quick-panel__trigger"
      :class="{ 'is-dragging': dragging }"
      :style="triggerStyle"
      type="button"
      aria-label="快捷菜单"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerCancel"
      @lostpointercapture="handleLostPointerCapture"
      @click="handleTriggerClick"
    >
      <img :src="quickMenuIcon" alt="" />
    </button>

    <div v-if="panelVisible" class="smart-otdr-quick-panel__mask" @click.self="closePanel">
      <section class="smart-otdr-quick-panel__dialog" role="dialog" aria-modal="true">
        <header class="smart-otdr-quick-panel__header">
          <div class="smart-otdr-quick-panel__title">快捷菜单</div>
          <button class="smart-otdr-quick-panel__close" type="button" @click="closePanel">关闭</button>
        </header>

        <div class="smart-otdr-quick-panel__content">
          <div class="smart-otdr-quick-panel__grid">
            <button
              v-for="item in quickActions"
              :key="item.key"
              type="button"
              class="smart-otdr-quick-panel__item"
              :class="{
                'is-active': activeStates[item.key],
                'is-inactive': item.state === 'off'
              }"
              @click="handleQuickAction(item)"
            >
              <div
                class="smart-otdr-quick-panel__item-icon"
                :class="{
                  'is-active': item.state === 'on',
                  'is-inactive': item.state === 'off'
                }"
              >
                <img :src="item.icon" alt="" />
              </div>
              <div class="smart-otdr-quick-panel__item-label">{{ item.label }}</div>
              <div
                v-if="item.statusText"
                class="smart-otdr-quick-panel__item-status"
                :class="{
                  'is-active': item.state === 'on',
                  'is-inactive': item.state === 'off'
                }"
              >
                {{ item.statusText }}
              </div>
            </button>
          </div>

          <div v-if="feedbackText" class="smart-otdr-quick-panel__feedback">{{ feedbackText }}</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSmartOtdrConnectionState } from '@/composables/useSmartOtdrConnectionState'
import quickMenuIcon from '@/assets/app/icons/device/quick-menu.png'
import testModeIcon from '@/assets/app/icons/device/test-mode.png'
import homeIcon from '@/assets/app/icons/navigation/home-active.png'
import filesIcon from '@/assets/app/icons/device/file-manager.png'
import flashlightIcon from '@/assets/app/icons/device/flashlight.png'
import screenshotIcon from '@/assets/app/icons/device/screenshot.png'
import cellularIcon from '@/assets/app/icons/device/cellular.png'
import bluetoothIcon from '@/assets/app/icons/connection/bluetooth.png'
import bluetoothOffIcon from '@/assets/app/icons/connection/bluetooth-off.png'
import shutdownIcon from '@/assets/app/icons/device/power-off.png'

type SmartOtdrQuickActionKey =
  | 'test-mode'
  | 'home'
  | 'files'
  | 'flashlight'
  | 'screenshot'
  | 'network-4g'
  | 'bluetooth'
  | 'shutdown'

interface SmartOtdrQuickActionItem {
  key: SmartOtdrQuickActionKey
  label: string
  icon: string
  statusText?: string
  state?: 'on' | 'off' | 'default'
}

const router = useRouter()
const route = useRoute()
const { connectionState, toggleBluetooth, toggleNetwork4g } = useSmartOtdrConnectionState()

const STORAGE_KEY = 'smart-otdr-quick-panel-position'
const TRIGGER_SIZE = 54
const PANEL_RIGHT_OFFSET = 12
const PANEL_BOTTOM_OFFSET = 26
const VIEWPORT_PADDING = 16
const DRAG_THRESHOLD = 6

const panelVisible = ref(false)
const feedbackText = ref('')
const dragging = ref(false)
const movedDuringPointer = ref(false)
const triggerPosition = ref({ x: 0, y: 0 })
const panelRootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)

const mockState = reactive({
  testModeAuto: true,
  flashlightOn: false,
  shutdownArmed: false
})

const dragState = reactive({
  activePointerId: -1,
  pointerOffsetX: 0,
  pointerOffsetY: 0,
  startClientX: 0,
  startClientY: 0,
  pointerActive: false
})

const scrollLockState = reactive({
  active: false,
  bodyOverflow: '',
  bodyTouchAction: '',
  htmlOverflow: '',
  htmlTouchAction: '',
  containerOverflow: '',
  containerTouchAction: '',
  containerOverscrollBehavior: ''
})

const activeStates = computed<Record<SmartOtdrQuickActionKey, boolean>>(() => ({
  'test-mode': mockState.testModeAuto,
  home: false,
  files: false,
  flashlight: mockState.flashlightOn,
  screenshot: false,
  'network-4g': connectionState.network4gEnabled,
  bluetooth: connectionState.bluetoothEnabled,
  shutdown: mockState.shutdownArmed
}))

const quickActions = computed<SmartOtdrQuickActionItem[]>(() => [
  { key: 'home', label: '主页', icon: homeIcon },
  { key: 'files', label: '文件管理', icon: filesIcon },
  {
    key: 'network-4g',
    label: '4G',
    icon: cellularIcon,
    statusText: connectionState.network4gEnabled ? '已开启' : '已关闭',
    state: connectionState.network4gEnabled ? 'on' : 'off'
  },
  {
    key: 'bluetooth',
    label: '蓝牙',
    icon: connectionState.bluetoothEnabled ? bluetoothIcon : bluetoothOffIcon,
    statusText: connectionState.bluetoothEnabled ? '已开启' : '已关闭',
    state: connectionState.bluetoothEnabled ? 'on' : 'off'
  },
  {
    key: 'test-mode',
    label: '测试模式',
    icon: testModeIcon,
    statusText: mockState.testModeAuto ? '自动' : '手动',
    state: mockState.testModeAuto ? 'on' : 'default'
  },
  {
    key: 'flashlight',
    label: '照明',
    icon: flashlightIcon,
    statusText: mockState.flashlightOn ? '已开启' : '已关闭',
    state: mockState.flashlightOn ? 'on' : 'off'
  },
  { key: 'screenshot', label: '截屏', icon: screenshotIcon },
  { key: 'shutdown', label: '关机', icon: shutdownIcon }
])

const triggerStyle = computed(() => ({
  left: `${triggerPosition.value.x}px`,
  top: `${triggerPosition.value.y}px`
}))

function getDeviceId() {
  return String(route.params.id ?? '')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getShellElement() {
  return panelRootRef.value?.closest('.smart-otdr-shell') as HTMLElement | null
}

function getHorizontalBoundaryElement() {
  const shellElement = getShellElement()
  if (shellElement) return shellElement

  const appContainer = panelRootRef.value?.closest('.app-container') as HTMLElement | null
  if (appContainer) return appContainer

  const scrollViewport = panelRootRef.value?.closest('.content-flex, .smart-device-content') as HTMLElement | null
  if (scrollViewport) return scrollViewport

  return null
}

function getVerticalBoundaryElement() {
  const smartDeviceContent = panelRootRef.value?.closest('.smart-device-content') as HTMLElement | null
  if (smartDeviceContent) return smartDeviceContent

  const shellElement = getShellElement()
  if (shellElement) {
    const shellScrollViewport = shellElement.parentElement
    if (shellScrollViewport?.classList.contains('smart-device-content')) {
      return shellScrollViewport as HTMLElement
    }
  }

  const scrollViewport = panelRootRef.value?.closest('.content-flex, .smart-device-content') as HTMLElement | null
  if (scrollViewport) return scrollViewport

  const appContainer = panelRootRef.value?.closest('.app-container') as HTMLElement | null
  if (appContainer) return appContainer

  return null
}

function getScrollLockElement() {
  const nearestScrollable = panelRootRef.value?.closest('.smart-device-content, .content-flex') as HTMLElement | null
  if (nearestScrollable) return nearestScrollable

  const appContainer = panelRootRef.value?.closest('.app-container') as HTMLElement | null
  return appContainer?.querySelector('.smart-device-content, .content-flex') as HTMLElement | null
}

function getViewportBounds() {
  return {
    minX: VIEWPORT_PADDING,
    maxX: Math.max(VIEWPORT_PADDING, window.innerWidth - TRIGGER_SIZE - VIEWPORT_PADDING),
    minY: VIEWPORT_PADDING,
    maxY: Math.max(VIEWPORT_PADDING, window.innerHeight - TRIGGER_SIZE - VIEWPORT_PADDING)
  }
}

function createBounds(minX: number, maxX: number, minY: number, maxY: number) {
  const safeMaxX = maxX >= minX ? maxX : minX
  const safeMaxY = maxY >= minY ? maxY : minY
  return {
    minX,
    maxX: safeMaxX,
    minY,
    maxY: safeMaxY
  }
}

function getBounds() {
  const horizontalBoundaryElement = getHorizontalBoundaryElement()
  const verticalBoundaryElement = getVerticalBoundaryElement()
  if (!horizontalBoundaryElement && !verticalBoundaryElement) return getViewportBounds()

  const horizontalRect = horizontalBoundaryElement?.getBoundingClientRect()
  const verticalRect = verticalBoundaryElement?.getBoundingClientRect()
  return createBounds(
    (horizontalRect?.left ?? VIEWPORT_PADDING) + VIEWPORT_PADDING,
    (horizontalRect?.right ?? window.innerWidth) - TRIGGER_SIZE - VIEWPORT_PADDING,
    (verticalRect?.top ?? VIEWPORT_PADDING) + VIEWPORT_PADDING,
    (verticalRect?.bottom ?? window.innerHeight) - TRIGGER_SIZE - VIEWPORT_PADDING
  )
}

function getDefaultPosition() {
  const bounds = getBounds()
  return normalizePosition(bounds.maxX - PANEL_RIGHT_OFFSET, bounds.maxY - PANEL_BOTTOM_OFFSET)
}

function normalizePosition(x: number, y: number) {
  const { minX, maxX, minY, maxY } = getBounds()
  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY)
  }
}

function persistPosition() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(triggerPosition.value))
}

function lockPageScroll() {
  if (scrollLockState.active) return

  const scrollLockElement = getScrollLockElement()

  scrollLockState.bodyOverflow = document.body.style.overflow
  scrollLockState.bodyTouchAction = document.body.style.touchAction
  scrollLockState.htmlOverflow = document.documentElement.style.overflow
  scrollLockState.htmlTouchAction = document.documentElement.style.touchAction
  scrollLockState.containerOverflow = scrollLockElement?.style.overflow ?? ''
  scrollLockState.containerTouchAction = scrollLockElement?.style.touchAction ?? ''
  scrollLockState.containerOverscrollBehavior = scrollLockElement?.style.overscrollBehavior ?? ''

  document.body.style.overflow = 'hidden'
  document.body.style.touchAction = 'none'
  document.documentElement.style.overflow = 'hidden'
  document.documentElement.style.touchAction = 'none'
  if (scrollLockElement) {
    scrollLockElement.style.overflow = 'hidden'
    scrollLockElement.style.touchAction = 'none'
    scrollLockElement.style.overscrollBehavior = 'none'
  }
  scrollLockState.active = true
}

function unlockPageScroll() {
  if (!scrollLockState.active) return

  const scrollLockElement = getScrollLockElement()

  document.body.style.overflow = scrollLockState.bodyOverflow
  document.body.style.touchAction = scrollLockState.bodyTouchAction
  document.documentElement.style.overflow = scrollLockState.htmlOverflow
  document.documentElement.style.touchAction = scrollLockState.htmlTouchAction
  if (scrollLockElement) {
    scrollLockElement.style.overflow = scrollLockState.containerOverflow
    scrollLockElement.style.touchAction = scrollLockState.containerTouchAction
    scrollLockElement.style.overscrollBehavior = scrollLockState.containerOverscrollBehavior
  }
  scrollLockState.active = false
}

function restorePosition() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    triggerPosition.value = getDefaultPosition()
    return
  }

  try {
    const parsed = JSON.parse(raw) as { x?: number; y?: number }
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      triggerPosition.value = normalizePosition(parsed.x, parsed.y)
      return
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }

  triggerPosition.value = getDefaultPosition()
}

function beginDrag(clientX: number, clientY: number) {
  movedDuringPointer.value = false
  dragState.startClientX = clientX
  dragState.startClientY = clientY
  dragState.pointerOffsetX = clientX - triggerPosition.value.x
  dragState.pointerOffsetY = clientY - triggerPosition.value.y
  dragState.pointerActive = true
}

function updateDrag(clientX: number, clientY: number) {
  if (!dragState.pointerActive) return

  const deltaX = clientX - dragState.startClientX
  const deltaY = clientY - dragState.startClientY
  if (!dragging.value && Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD) {
    dragging.value = true
    movedDuringPointer.value = true
    lockPageScroll()
  }

  if (!dragging.value) return

  triggerPosition.value = normalizePosition(clientX - dragState.pointerOffsetX, clientY - dragState.pointerOffsetY)
}

function resetPointerState() {
  dragState.activePointerId = -1
  dragState.pointerActive = false
}

function finishPointerInteraction() {
  const didDrag = dragging.value
  dragging.value = false
  unlockPageScroll()
  if (didDrag) {
    triggerPosition.value = normalizePosition(triggerPosition.value.x, triggerPosition.value.y)
    persistPosition()
  }
  resetPointerState()
}

function isActivePointer(event: PointerEvent) {
  return dragState.pointerActive && event.pointerId === dragState.activePointerId
}

function handlePointerDown(event: PointerEvent) {
  if (dragState.pointerActive) return
  dragState.activePointerId = event.pointerId
  beginDrag(event.clientX, event.clientY)
  triggerRef.value?.setPointerCapture(event.pointerId)
}

function handlePointerMove(event: PointerEvent) {
  if (!isActivePointer(event)) return
  updateDrag(event.clientX, event.clientY)
}

function handlePointerUp(event: PointerEvent) {
  if (!isActivePointer(event)) return
  finishPointerInteraction()
}

function handlePointerCancel(event: PointerEvent) {
  if (!isActivePointer(event)) return
  finishPointerInteraction()
}

function handleLostPointerCapture(event: PointerEvent) {
  if (!isActivePointer(event)) return
  finishPointerInteraction()
}

function handleTriggerClick() {
  if (movedDuringPointer.value) {
    movedDuringPointer.value = false
    return
  }
  panelVisible.value = true
}

function closePanel() {
  panelVisible.value = false
}

function navigateTo(path: string) {
  router.push(path)
  closePanel()
}

function handleQuickAction(item: SmartOtdrQuickActionItem) {
  const deviceId = getDeviceId()
  if (!deviceId) return

  switch (item.key) {
    case 'home':
      navigateTo(`/device/${deviceId}`)
      return
    case 'files':
      navigateTo(`/device/${deviceId}/files`)
      return
    case 'flashlight':
      mockState.flashlightOn = !mockState.flashlightOn
      feedbackText.value = mockState.flashlightOn ? '照明已开启' : '照明已关闭'
      return
    case 'test-mode':
      mockState.testModeAuto = !mockState.testModeAuto
      feedbackText.value = mockState.testModeAuto ? '已切换为自动测试' : '已切换为手动测试'
      return
    case 'screenshot':
      {
        const now = new Date()
        const storageKey = `smart-otdr:screenshots:${deviceId}`
        let records: Array<{ id: string; time: string }> = []
        try {
          records = JSON.parse(localStorage.getItem(storageKey) || '[]') as Array<{ id: string; time: string }>
        } catch {
          records = []
        }
        const time = new Intl.DateTimeFormat('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).format(now)
        localStorage.setItem(storageKey, JSON.stringify([{ id: String(now.getTime()), time }, ...records].slice(0, 20)))
        feedbackText.value = '截图已保存到本机'
      }
      return
    case 'network-4g':
      toggleNetwork4g()
      feedbackText.value = connectionState.network4gEnabled ? '4G 已开启' : '4G 已关闭'
      return
    case 'bluetooth':
      toggleBluetooth()
      feedbackText.value = connectionState.bluetoothEnabled ? '蓝牙已开启' : '蓝牙已关闭'
      return
    case 'shutdown':
      mockState.shutdownArmed = !mockState.shutdownArmed
      feedbackText.value = mockState.shutdownArmed ? '等待关机确认' : '已取消关机'
      return
  }
}

function handleResize() {
  const fallback = triggerPosition.value.x === 0 && triggerPosition.value.y === 0 ? getDefaultPosition() : triggerPosition.value
  triggerPosition.value = normalizePosition(fallback.x, fallback.y)
  persistPosition()
}

function handleScroll() {
  const fallback = triggerPosition.value.x === 0 && triggerPosition.value.y === 0 ? getDefaultPosition() : triggerPosition.value
  triggerPosition.value = normalizePosition(fallback.x, fallback.y)
}

onMounted(() => {
  restorePosition()
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll, true)
})

onBeforeUnmount(() => {
  unlockPageScroll()
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll, true)
})
</script>

<style lang="scss" scoped>
@use './smartOtdrUi.scss' as ui;

.smart-otdr-quick-panel__trigger {
  position: fixed;
  z-index: 85;
  width: 54px;
  height: 54px;
  border: none;
  border-radius: 12px;
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.24);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.smart-otdr-quick-panel__trigger.is-dragging {
  transform: scale(1.04);
  box-shadow: 0 18px 32px rgba(37, 99, 235, 0.28);
}

.smart-otdr-quick-panel__trigger img {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}

.smart-otdr-quick-panel__mask {
  position: fixed;
  inset: 0;
  z-index: 95;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.48);
}

.smart-otdr-quick-panel__dialog {
  width: min(100%, 324px);
  border-radius: 12px;
  border: 1px solid #d8e2ef;
  background: #ffffff;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.smart-otdr-quick-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.smart-otdr-quick-panel__title {
  color: ui.$smart-otdr-text-main;
  font-size: 18px;
  font-weight: 700;
}

.smart-otdr-quick-panel__close {
  @include ui.smart-otdr-secondary-button;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.smart-otdr-quick-panel__content {
  padding: 18px;
  background: #f8fafc;
}

.smart-otdr-quick-panel__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.smart-otdr-quick-panel__item {
  @include ui.smart-otdr-setting-card;
  min-height: 96px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.smart-otdr-quick-panel__item:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.28);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.smart-otdr-quick-panel__item.is-active {
  background: #eff6ff;
  border-color: rgba(59, 130, 246, 0.22);
}

.smart-otdr-quick-panel__item.is-inactive {
  background: #f8fafc;
  border-color: rgba(148, 163, 184, 0.18);
}

.smart-otdr-quick-panel__item-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #eef4ff;
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.smart-otdr-quick-panel__item-icon.is-active {
  background: #dbeafe;
  color: #1d4ed8;
}

.smart-otdr-quick-panel__item-icon.is-inactive {
  background: #f1f5f9;
  color: #94a3b8;
}

.smart-otdr-quick-panel__item-icon img {
  width: 22px;
  height: 22px;
}

.smart-otdr-quick-panel__item-icon.is-inactive img {
  opacity: 0.55;
}

.smart-otdr-quick-panel__item-label {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  color: #0f172a;
}

.smart-otdr-quick-panel__item-status {
  font-size: 11px;
  line-height: 1;
  font-weight: 600;
  color: #64748b;
}

.smart-otdr-quick-panel__item-status.is-active {
  color: #2563eb;
}

.smart-otdr-quick-panel__item-status.is-inactive {
  color: #94a3b8;
}

.smart-otdr-quick-panel__feedback {
  margin-top: 16px;
  min-height: 40px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(59, 130, 246, 0.08);
  background: rgba(248, 251, 255, 0.96);
  font-size: 12px;
  line-height: 1.6;
  color: #475569;
}

@media (max-width: 520px) {
  .smart-otdr-quick-panel__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
