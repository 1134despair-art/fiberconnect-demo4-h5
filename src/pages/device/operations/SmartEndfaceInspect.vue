<template>
  <div class="app-container endface-app-page">
    <SmartOtdrPageShell title="端面检测" :show-quick-panel="true" @back="goBack">
      <template #actions>
        <span class="connection-pill" :class="connectionState">
          <i aria-hidden="true"></i>{{ connectionLabel }}
        </span>
      </template>

      <main class="endface-main">
        <section v-if="connectionState !== 'connected'" class="connection-state" aria-live="polite">
          <div class="connection-state__icon">
            <img :src="endfaceIcon" alt="" />
          </div>
          <h2>{{ connectionState === 'connecting' ? '正在识别端面镜头' : '连接端面镜头' }}</h2>
          <p>
            {{ connectionState === 'connecting'
              ? '正在申请 Type-C 摄像头访问权限，请保持设备连接。'
              : '请将端面检测镜头接入手机 Type-C 接口。' }}
          </p>

          <div class="connection-steps" aria-label="连接步骤">
            <div><span>1</span><strong>接入镜头</strong></div>
            <div><span>2</span><strong>允许访问</strong></div>
            <div><span>3</span><strong>开始预览</strong></div>
          </div>

          <button class="primary-button" type="button" :disabled="connectionState === 'connecting'" @click="connectCamera">
            {{ connectionState === 'connecting' ? '识别中...' : '启动演示预览' }}
          </button>
          <p class="compatibility-note">目标设备为标准 UVC 端面镜头；当前版本仅演示交互状态，尚未接入手机 USB 适配层。</p>
        </section>

        <template v-else>
          <section class="preview-panel">
            <header class="preview-panel__header">
              <div>
                <strong>端面预览画面</strong>
                <span>静态演示 · UVC 待接入</span>
              </div>
              <span class="live-state" :class="{ frozen: previewFrozen }">
                <i aria-hidden="true"></i>{{ previewFrozen ? '画面已冻结' : '演示预览' }}
              </span>
            </header>

            <div class="preview-stage" :class="[`zoom-${zoomLevel}`, { frozen: previewFrozen }]">
              <div class="fiber-view" aria-label="端面摄像头静态预览示意">
                <div class="fiber-cladding"></div>
                <div class="fiber-core"></div>
                <i class="particle particle-a"></i>
                <i class="particle particle-b"></i>
                <i class="particle particle-c"></i>
              </div>
              <div class="focus-reticle" aria-hidden="true"></div>
              <span class="preview-stage__badge">{{ zoomLevel }}×</span>
              <span class="preview-stage__hint">{{ previewFrozen ? '可放大检查细节' : '请保持镜头稳定' }}</span>
            </div>

            <div class="preview-tools" aria-label="预览工具">
              <button type="button" @click="refreshPreview">
                <img :src="refreshIcon" alt="" /><span>重新采集</span>
              </button>
              <button type="button" :class="{ active: previewFrozen }" @click="toggleFreeze">
                <span class="pause-icon" aria-hidden="true"><i></i><i></i></span>
                <span>{{ previewFrozen ? '继续预览' : '冻结画面' }}</span>
              </button>
              <button type="button" @click="cycleZoom">
                <span class="zoom-icon" aria-hidden="true">{{ zoomLevel }}×</span><span>画面放大</span>
              </button>
            </div>
          </section>

          <p class="demo-disclaimer" role="status">当前画面为前端静态演示，未读取手机 Type-C 摄像头数据。</p>

          <section class="capture-meta" aria-label="采集参数">
            <div><span>目标连接</span><strong>Type-C / UVC</strong></div>
            <div><span>画面规格</span><strong>待协议确认</strong></div>
            <div><span>检测方式</span><strong>人工确认</strong></div>
          </section>

          <div class="capture-actions">
            <button class="secondary-button" type="button" @click="disconnectCamera">断开镜头</button>
            <button class="primary-button" type="button" @click="saveCapture">
              <img :src="saveIcon" alt="" />保存截图
            </button>
          </div>

          <section class="record-band">
            <div class="record-band__icon"><img :src="cameraIcon" alt="" /></div>
            <div class="record-band__content">
              <strong>{{ lastCapture ? '最近截图' : '暂无截图' }}</strong>
              <span>{{ lastCapture || '冻结画面后可保存当前端面图像' }}</span>
            </div>
            <span v-if="lastCapture" class="record-band__status">已保存</span>
          </section>

          <p class="inspection-note">当前版本仅提供图像预览与保存，不生成自动洁净度判定。</p>
        </template>
      </main>

      <div v-if="feedback" class="endface-toast" role="status">{{ feedback }}</div>
    </SmartOtdrPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import cameraIcon from '@/assets/app/icons/profile/camera.png'
import endfaceIcon from '@/assets/app/icons/device/endface.png'
import refreshIcon from '@/assets/app/icons/common/refresh.png'
import saveIcon from '@/assets/app/icons/common/save.png'
import SmartOtdrPageShell from '../components/SmartOtdrPageShell.vue'

type ConnectionState = 'disconnected' | 'connecting' | 'connected'

const route = useRoute()
const router = useRouter()
const connectionState = ref<ConnectionState>('disconnected')
const previewFrozen = ref(false)
const zoomLevel = ref(1)
const lastCapture = ref('')
const feedback = ref('')
let feedbackTimer: number | undefined
let connectionTimer: number | undefined

const connectionLabel = computed(() => {
  if (connectionState.value === 'connected') return '演示预览'
  if (connectionState.value === 'connecting') return '识别中'
  return '未连接'
})

const showFeedback = (message: string) => {
  feedback.value = message
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => { feedback.value = '' }, 1800)
}

const goBack = () => {
  router.push(`/device/${String(route.params.id || '')}`)
}

const connectCamera = () => {
  if (connectionState.value === 'connecting') return
  connectionState.value = 'connecting'
  if (connectionTimer) window.clearTimeout(connectionTimer)
  connectionTimer = window.setTimeout(() => {
    connectionState.value = 'connected'
    previewFrozen.value = false
    showFeedback('已进入静态演示预览')
  }, 650)
}

const disconnectCamera = () => {
  connectionState.value = 'disconnected'
  previewFrozen.value = false
  zoomLevel.value = 1
}

const refreshPreview = () => {
  previewFrozen.value = false
  zoomLevel.value = 1
  showFeedback('实时画面已刷新')
}

const toggleFreeze = () => {
  previewFrozen.value = !previewFrozen.value
  showFeedback(previewFrozen.value ? '画面已冻结' : '已恢复实时预览')
}

const cycleZoom = () => {
  zoomLevel.value = zoomLevel.value === 3 ? 1 : zoomLevel.value + 1
}

const saveCapture = () => {
  const now = new Date()
  lastCapture.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  previewFrozen.value = true
  showFeedback('演示截图记录已保存')
}

onBeforeUnmount(() => {
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  if (connectionTimer) window.clearTimeout(connectionTimer)
})
</script>

<style scoped lang="scss">
@use '../components/smartOtdrUi.scss' as ui;

.endface-app-page {
  width: min(375px, calc(100vw - 24px));
  max-width: 375px;
  min-height: 812px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid #d8e2ef;
  border-radius: 22px;
  background: #f4f7fb;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
}

.endface-app-page :deep(.smart-otdr-shell) {
  width: 100%;
  height: 100%;
  min-height: 812px;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.endface-app-page :deep(.smart-otdr-shell__body) {
  overflow-y: auto;
  padding: 14px 14px 88px;
}

.connection-pill,
.live-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  color: #166534;
  font-size: 11px;
  font-weight: 700;
}

.connection-pill i,
.live-state i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #16a34a;
}

.connection-pill.disconnected { color: #64748b; }
.connection-pill.disconnected i { background: #94a3b8; }
.connection-pill.connecting { color: #b45309; }
.connection-pill.connecting i { background: #d97706; }

.endface-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.connection-state {
  min-height: 590px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  text-align: center;
}

.connection-state__icon {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #eff6ff;
}

.connection-state__icon img { width: 42px; height: 42px; object-fit: contain; }
.connection-state h2 { margin: 20px 0 8px; color: #0f172a; font-size: 18px; }
.connection-state > p { max-width: 270px; margin: 0; color: #64748b; font-size: 13px; line-height: 1.7; }

.connection-steps {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 28px 0;
}

.connection-steps div {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 8px;
  color: #475569;
  font-size: 11px;
}

.connection-steps div:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 13px;
  left: 66%;
  width: 68%;
  height: 1px;
  background: #cbd5e1;
}

.connection-steps span {
  z-index: 1;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-weight: 800;
}

.connection-state .primary-button { width: 100%; }
.connection-state .compatibility-note { margin-top: 14px; font-size: 11px; }

.preview-panel {
  overflow: hidden;
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  background: #fff;
}

.preview-panel__header {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.preview-panel__header > div { min-width: 0; display: grid; gap: 2px; }
.preview-panel__header strong { color: #0f172a; font-size: 14px; }
.preview-panel__header span:not(.live-state) { color: #64748b; font-size: 11px; }
.live-state.frozen { color: #1d4ed8; }
.live-state.frozen i { background: #2563eb; }

.preview-stage {
  position: relative;
  height: 318px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #0b1423;
}

.fiber-view {
  position: relative;
  width: 254px;
  height: 254px;
  border-radius: 50%;
  background: radial-gradient(circle, #dceafe 0 14%, #a8c7ef 15% 29%, #668ab9 30% 48%, #263d5c 49% 62%, #101d30 63% 100%);
  box-shadow: 0 0 0 8px rgba(148, 163, 184, 0.08), 0 0 50px rgba(37, 99, 235, 0.24);
  transition: transform 180ms ease;
}

.zoom-2 .fiber-view { transform: scale(1.34); }
.zoom-3 .fiber-view { transform: scale(1.72); }
.preview-stage.frozen .fiber-view { filter: contrast(1.08) saturate(0.88); }
.fiber-cladding, .fiber-core { position: absolute; top: 50%; left: 50%; border-radius: 50%; transform: translate(-50%, -50%); }
.fiber-cladding { width: 122px; height: 122px; border: 1px solid rgba(255, 255, 255, 0.46); }
.fiber-core { width: 64px; height: 64px; border: 2px solid rgba(255, 255, 255, 0.7); box-shadow: inset 0 0 24px rgba(255,255,255,.35); }
.particle { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: #1e293b; box-shadow: 0 0 0 2px rgba(255,255,255,.18); }
.particle-a { top: 104px; left: 145px; }
.particle-b { top: 134px; left: 104px; width: 3px; height: 3px; }
.particle-c { top: 82px; left: 117px; width: 4px; height: 4px; }

.focus-reticle {
  position: absolute;
  width: 154px;
  height: 154px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}

.focus-reticle::before,
.focus-reticle::after { content: ''; position: absolute; background: rgba(255,255,255,.42); }
.focus-reticle::before { width: 190px; height: 1px; top: 76px; left: -18px; }
.focus-reticle::after { width: 1px; height: 190px; top: -18px; left: 76px; }

.preview-stage__badge,
.preview-stage__hint {
  position: absolute;
  bottom: 12px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.76);
  color: #fff;
  font-size: 11px;
}

.preview-stage__badge { left: 12px; padding: 5px 8px; font-weight: 800; }
.preview-stage__hint { right: 12px; padding: 5px 9px; }

.preview-tools {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid #26364c;
  background: #132238;
}

.preview-tools button {
  min-height: 58px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 5px;
  border: 0;
  border-right: 1px solid #26364c;
  background: transparent;
  color: #dbeafe;
  font-size: 11px;
}

.preview-tools button:last-child { border-right: 0; }
.preview-tools button:active,
.preview-tools button.active { background: #1e3a5f; color: #fff; }
.preview-tools img { width: 20px; height: 20px; filter: brightness(0) invert(1); opacity: .86; }
.pause-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; gap: 4px; }
.pause-icon i { width: 3px; height: 14px; border-radius: 2px; background: currentColor; }
.zoom-icon { min-width: 24px; color: #93c5fd; font-size: 14px; font-weight: 800; }

.capture-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
  background: #fff;
}

.demo-disclaimer {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
  color: #92400e;
  font-size: 11px;
  line-height: 1.5;
}

.capture-meta div { min-height: 58px; display: grid; place-items: center; align-content: center; gap: 5px; border-right: 1px solid #d8e2ef; text-align: center; }
.capture-meta div:last-child { border-right: 0; }
.capture-meta span { color: #64748b; font-size: 10px; }
.capture-meta strong { color: #0f172a; font-size: 11px; font-variant-numeric: tabular-nums; }

.capture-actions { display: grid; grid-template-columns: 1fr 1.6fr; gap: 10px; }
.primary-button,
.secondary-button { min-height: 46px; border-radius: 8px; font-size: 14px; font-weight: 700; }
.primary-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; background: #2563eb; color: #fff; box-shadow: 0 8px 18px rgba(37, 99, 235, .18); }
.primary-button:active { background: #1d4ed8; }
.primary-button:disabled { background: #94a3b8; box-shadow: none; }
.primary-button img { width: 18px; height: 18px; filter: brightness(0) invert(1); }
.secondary-button { border: 1px solid #d8e2ef; background: #fff; color: #334155; }
.secondary-button:active { background: #f1f5f9; }

.record-band {
  min-height: 66px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
  background: #fff;
}

.record-band__icon { flex: 0 0 38px; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 8px; background: #eff6ff; }
.record-band__icon img { width: 22px; height: 22px; object-fit: contain; }
.record-band__content { min-width: 0; flex: 1; display: grid; gap: 4px; }
.record-band__content strong { color: #0f172a; font-size: 13px; }
.record-band__content span { overflow: hidden; color: #64748b; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.record-band__status { color: #166534; font-size: 11px; font-weight: 700; }
.inspection-note { margin: 0; color: #64748b; font-size: 10px; line-height: 1.6; text-align: center; }

.endface-toast {
  position: absolute;
  left: 50%;
  bottom: 28px;
  z-index: 30;
  max-width: calc(100% - 48px);
  padding: 9px 14px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  font-size: 12px;
  transform: translateX(-50%);
}

@media (max-width: 430px) {
  .endface-app-page { width: min(375px, 100vw); min-height: 100dvh; border-radius: 0; }
  .endface-app-page :deep(.smart-otdr-shell) { min-height: 100dvh; }
}

@media (prefers-reduced-motion: reduce) {
  .fiber-view { transition: none; }
}
</style>
