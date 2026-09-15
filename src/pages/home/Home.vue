<template>
  <div class="app-container legacy-app-page legacy-home-page workspace-page workspace-dialogs">
    <!-- 顶部标题栏 -->
    <header class="workspace-header">
      <h1>{{ t('common.home') }}</h1>
      <button class="workspace-icon-button" :title="t('home.addDevice')" :aria-label="t('home.addDevice')" @click="showAddDevice = true">
        <img class="add-device-icon" :src="plusIcon" alt="" />
      </button>
    </header>
    
    <!-- 主内容区域 -->
    <div class="workspace-scroll hide-scrollbar">
      <div class="home-workspace">
        <!-- 用户信息卡片 -->
        <section class="home-overview">
          <div class="home-account">
            <div class="account-avatar" aria-hidden="true">{{ user?.name?.slice(0, 1) || 'L' }}</div>
            <div class="account-copy">
              <strong>{{ user?.name }}</strong>
              <small v-if="user?.phone">{{ user.phone }}</small>
              <small v-if="user?.email">{{ user.email }}</small>
            </div>
          </div>
          <div class="device-overview">
            <div class="device-overview-total">
              <span class="iconify" data-icon="mdi:devices" aria-hidden="true"></span>
              {{ t('home.addedDevices', { count: user?.devices?.length || 0 }) }}
            </div>
            <div class="connection-summary"><span class="connection-dot"></span>{{ t('home.connected') }} <strong>{{ connectedDevices.length }}</strong></div>
          </div>
        </section>

        <!-- 设备列表 -->
        <div class="devices-section">
          <div v-if="!user?.devices?.length" class="empty-state">
            <div class="empty-text">{{ t('home.noDevices') }}</div>
            <div class="empty-desc">{{ t('home.addFirstDevice') }}</div>
          </div>
          
          <div v-else class="devices-container">
            <!-- 已连接设备 -->
            <div v-if="connectedDevices.length" class="device-category mb-2">
              <div class="category-header">
                <h3 class="section-title">{{ t('home.connected') }} ({{ connectedDevices.length }})</h3>
                <button 
                  @click="toggleConnectedDevices" 
                  class="toggle-btn"
                  :class="{ 'collapsed': !showConnectedDevices }"
                  :title="showConnectedDevices ? t('home.collapse') : t('home.expand')"
                  :aria-label="showConnectedDevices ? t('home.collapse') : t('home.expand')"
                  :aria-expanded="showConnectedDevices"
                >
                  <span class="iconify" :data-icon="showConnectedDevices ? 'mdi:chevron-up' : 'mdi:chevron-down'"></span>
                </button>
              </div>
              
              <div v-show="showConnectedDevices" class="devices-list">
                <div
                  v-for="device in connectedDevices"
                  :key="device.id"
                  class="device-card activated"
                  role="button"
                  tabindex="0"
                  @click="handleDeviceClick(device)"
                  @keydown.enter="handleDeviceClick(device)"
                  @keydown.space.prevent="handleDeviceClick(device)"
                >
                  <div class="device-visual"><img :src="getDeviceImage(device.model)" alt="" /></div>
                  <div class="device-info">
                    <div class="device-name">{{ device.name }}</div>
                    <div class="device-model">{{ device.model }} · {{ device.serialNumber }}</div>
                    <div class="device-status">
                      <span class="status-text" :class="getStatusClass(device.status)">
                        {{ getStatusText(device.status) }}
                      </span>
                      <span v-if="device.lastConnected" class="last-connected">
                        {{ t('home.lastConnected') }}：{{ device.lastConnected }}
                      </span>
                    </div>
                  </div>
                  <span class="iconify row-chevron" data-icon="mdi:chevron-right" aria-hidden="true"></span>
                </div>
              </div>
            </div>

            <!-- 未连接设备 -->
            <div v-if="disconnectedDevices.length" class="device-category">
              <div class="category-header">
                <h3 class="section-title">{{ t('home.disconnected') }} ({{ disconnectedDevices.length }})</h3>
                <button 
                  @click="toggleDisconnectedDevices" 
                  class="toggle-btn"
                  :class="{ 'collapsed': !showDisconnectedDevices }"
                  :title="showDisconnectedDevices ? t('home.collapse') : t('home.expand')"
                  :aria-label="showDisconnectedDevices ? t('home.collapse') : t('home.expand')"
                  :aria-expanded="showDisconnectedDevices"
                >
                  <span class="iconify" :data-icon="showDisconnectedDevices ? 'mdi:chevron-up' : 'mdi:chevron-down'"></span>
                </button>
              </div>
              
              <div v-show="showDisconnectedDevices" class="devices-list">
                <div
                  v-for="device in disconnectedDevices"
                  :key="device.id"
                  class="device-card unactivated"
                  role="button"
                  tabindex="0"
                  @click="handleDeviceClick(device)"
                  @keydown.enter="handleDeviceClick(device)"
                  @keydown.space.prevent="handleDeviceClick(device)"
                >
                  <div class="device-visual"><img :src="getDeviceImage(device.model)" alt="" /></div>
                  <div class="device-info">
                    <div class="device-name">{{ device.name }}</div>
                    <div class="device-model">{{ device.model }} · {{ device.serialNumber }}</div>
                    <div class="device-status">
                      <span class="status-text" :class="getStatusClass(device.status)">
                        {{ getStatusText(device.status) }}
                      </span>
                      <span v-if="device.lastConnected" class="last-connected">
                        {{ t('home.lastConnected') }}：{{ device.lastConnected }}
                      </span>
                    </div>
                  </div>
                  <span class="iconify row-chevron" data-icon="mdi:chevron-right" aria-hidden="true"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部导航栏 -->
    <BottomNavigation />

    <!-- 添加设备弹窗 -->
    <div v-if="showAddDevice" class="modal-overlay" @click="showAddDevice = false">
      <div class="modal-content add-device-modal" @click.stop>
        <div class="modal-header">
          <div class="page-title">{{ t('home.addDevice') }}</div>
          <button @click="showAddDevice = false" class="close-btn">
            ×
          </button>
        </div>
        
        <div class="modal-body">
          <div class="add-method">
            <div class="method-title">{{ t('home.bluetoothConnection') }}</div>
            <div class="method-desc">{{ t('home.bluetoothScanDesc') }}</div>
            <button @click="startBluetoothScan" class="method-btn" :disabled="isScanning">
              {{ isScanning ? t('home.scanning') : t('home.startScan') }}
            </button>
          </div>
          
          <div v-if="foundDevices.length" class="found-devices">
            <div class="found-title">{{ t('home.foundDevices') }}</div>
            <div
              v-for="device in foundDevices"
              :key="device.id"
              class="found-device"
              @click="connectDevice(device)"
            >
              <div class="found-info">
                <div class="found-name-row">
                  <div class="found-name">{{ device.name }}</div>
                  <span
                    v-if="getFoundDeviceTag(device)"
                    class="device-tag"
                    :class="{
                      smart: isSmartOtdrModel(device.model),
                      pon: isPonPowerMeterModel(device.model)
                    }"
                  >
                    {{ getFoundDeviceTag(device) }}
                  </span>
                </div>
                <div class="found-signal">{{ device.model }}</div>
                <div class="found-signal">{{ t('home.signalStrength') }}：{{ device.signal }}</div>
              </div>
              <button class="connect-btn">{{ t('home.connect') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义确认弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click="handleCancel">
      <div class="modal-content confirm-modal" @click.stop>
        <div class="modal-body">
          <div class="modal-title">{{ modalOptions.title }}</div>
          <div class="confirm-message">
            {{ modalOptions.message }}
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            @click="handleCancel" 
            class="btn-cancel"
          >
            {{ modalOptions.cancelText || t('common.cancel') }}
          </button>
          <div class="footer-divider"></div>
          <button 
            @click="handleConfirm" 
            class="btn-confirm"
            :style="{ backgroundColor: modalOptions.confirmColor }"
          >
            {{ modalOptions.confirmText || t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth, type Device, type DeviceType } from '@/composables/useAuth'
import { useModal } from '@/composables/useModal'
import BottomNavigation from '@/components/BottomNavigation.vue'
import '@/styles/workspace.css'
import '@/styles/subpages.css'
import plusIcon from '@/assets/icons/mdi-plus.svg'
import fusionImage from '@/assets/app/products/fusion-splicer.png'
import portableImage from '@/assets/app/products/portable-otdr.png'
import smartImage from '@/assets/app/products/smart-otdr.png'
import multiImage from '@/assets/app/products/multi-opm.png'
import ponImage from '@/assets/app/products/pon-power-meter.png'
import dualImage from '@/assets/app/products/dual-pon.png'
import auditImage from '@/assets/app/products/port-audit.png'
import sourceImage from '@/assets/app/products/stable-light-source.png'

const getDeviceImage = (model: string) => {
  const upper = model.toUpperCase()
  if (upper.startsWith('DPON')) return dualImage
  if (upper.startsWith('PCA')) return auditImage
  if (upper.startsWith('SLS')) return sourceImage
  if (upper.startsWith('PON-OPM')) return ponImage
  if (upper.startsWith('SOTDR')) return smartImage
  if (upper.includes('OPM')) return multiImage
  if (upper.startsWith('FWV') || upper.includes('OTDR')) return portableImage
  return fusionImage
}

const router = useRouter()
const { t } = useI18n()
const { user, addDevice } = useAuth()
const { showModal, modalOptions, alert, handleConfirm, handleCancel } = useModal()

const showAddDevice = ref(false)
const isScanning = ref(false)
const foundDevices = ref<any[]>([])

// 设备分类显示控制
const showConnectedDevices = ref(true)
const showDisconnectedDevices = ref(true)

const isSmartOtdrModel = (model?: string) => {
  return (model || '').toUpperCase().startsWith('SOTDR')
}

const isPonPowerMeterModel = (model?: string) => {
  return (model || '').toUpperCase().startsWith('PON-OPM')
}

const getFoundDeviceTag = (device: { model?: string; name?: string }) => {
  const upper = `${device.model || ''} ${device.name || ''}`.toUpperCase()
  if (upper.includes('DPON-')) return t('dualPon.deviceTag')
  if (upper.includes('PCA-')) return t('portAudit.deviceTag')
  if (upper.includes('SLS-')) return t('stableSource.deviceTag')
  if (upper.includes('PON-OPM')) return t('pon.deviceTag')
  if (upper.includes('SOTDR')) return '智能OTDR'
  if (upper.includes('MOPM') || upper.includes('OPM')) return '多功能光功率计'
  if (upper.includes('FWV') || upper.includes('OTDR')) return '便携式OTDR'
  return '熔接机'
}

const connectedDevices = computed(() => user.value?.devices?.filter(device => device.status === 'connected') || [])
const disconnectedDevices = computed(() => user.value?.devices?.filter(device => device.status !== 'connected') || [])

const toggleConnectedDevices = () => {
  showConnectedDevices.value = !showConnectedDevices.value
}

const toggleDisconnectedDevices = () => {
  showDisconnectedDevices.value = !showDisconnectedDevices.value
}

/**
 * 获取设备状态文本
 */
const getStatusText = (status: string) => {
  switch (status) {
    case 'connected':
      return t('home.connected')
    case 'disconnected':
      return t('home.disconnected')
    default:
      return t('home.unknownStatus')
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'connected':
      return 'status-connected'
    case 'disconnected':
      return 'status-disconnected'
    case 'inactive':
      return 'status-inactive'
    default:
      return 'status-unknown'
  }
}

const startBluetoothScan = async () => {
  isScanning.value = true
  foundDevices.value = []
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    foundDevices.value = [
      {
        id: `device_${Date.now()}_1`,
        name: 'WM-6000-A001',
        signal: '强',
        model: 'WM-6000',
        serialNumber: `WM${Date.now().toString().slice(-6)}`
      },
      {
        id: `device_${Date.now()}_2`,
        name: 'WM-6000-B002',
        signal: '中',
        model: 'WM-6000',
        serialNumber: `WM${(Date.now() + 1000).toString().slice(-6)}`
      },
      {
        id: `device_${Date.now()}_3`,
        name: 'FWV-100-V10-001',
        signal: '强',
        model: 'FWV-100-V10',
        serialNumber: `FWV${(Date.now() + 2000).toString().slice(-6)}`
      },
      {
        id: `device_${Date.now()}_4`,
        name: 'MOPM-4G-001',
        signal: '中',
        model: 'MOPM-4G',
        serialNumber: `MOPM${(Date.now() + 3000).toString().slice(-6)}`
      },
      {
        id: `device_${Date.now()}_5`,
        name: 'SOTDR-200-001',
        signal: '强',
        model: 'SOTDR-200',
        serialNumber: `SOTDR${(Date.now() + 4000).toString().slice(-6)}`
      },
      {
        id: `device_${Date.now()}_6`,
        name: 'PON-OPM-A001',
        signal: '强',
        model: 'PON-OPM',
        serialNumber: 'PONOPM0001'
      },
      {
        id: `device_${Date.now()}_7`,
        name: 'SLS-1315-A001',
        signal: '强',
        model: 'SLS-1315',
        serialNumber: 'SLS13150001'
      },
      {
        id: `device_${Date.now()}_8`,
        name: 'PCA-100-A001',
        signal: '强',
        model: 'PCA-100',
        serialNumber: 'PCA1000001'
      },
      {
        id: `device_${Date.now()}_9`,
        name: 'DPON-300-A001',
        signal: '强',
        model: 'DPON-300',
        serialNumber: 'DPON3000001',
        powerRange: 'standard'
      },
      {
        id: `device_${Date.now()}_10`,
        name: 'DPON-326-H001',
        signal: '中',
        model: 'DPON-326',
        serialNumber: 'DPON3260001',
        powerRange: 'high'
      }
    ]
  } catch (error) {
    console.error('蓝牙扫描失败:', error)
  } finally {
    isScanning.value = false
  }
}

const resolveDeviceTypeFromBluetoothName = (name: string): DeviceType => {
  const upper = (name || '').toUpperCase()
  if (upper.startsWith('DPON-')) return 'dual_port_pon_meter'
  if (upper.startsWith('PCA-')) return 'port_audit_instrument'
  if (upper.startsWith('SLS-')) return 'stable_light_source'
  if (upper.startsWith('PON-OPM-')) return 'pon_power_meter'
  if (upper.startsWith('SOTDR-')) return 'smart_otdr'
  if (upper.startsWith('FWV-') || upper.startsWith('OTDR-')) return 'portable_otdr'
  if (upper.startsWith('MOPM-') || upper.startsWith('OPM-')) return 'multi_opm_meter'
  return 'fusion_splicer'
}

/**
 * 连接设备
 */
const connectDevice = async (device: any) => {
  try {
    // 模拟连接
    await new Promise(resolve => setTimeout(resolve, 1500))
    const deviceType = resolveDeviceTypeFromBluetoothName(device.name)
    const newDeviceId = Date.now().toString()

    // 添加到已激活列表 (模拟)
    const added = addDevice({
      id: newDeviceId,
      name: device.name,
      model: device.model,
      serialNumber: device.serialNumber,
      deviceType,
      status: 'connected',
      activationStatus: 'activated',
      lastConnected: new Date().toISOString().split('T')[0],
      authorizationExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ...(deviceType === 'pon_power_meter'
        ? {
            ponPowerRange: 'standard' as const,
            ponOpmAccuracyDb: 0.2,
            ponOpmAccuracyPercent: 5,
            supportedVflColors: ['red'] as Array<'red' | 'green'>,
            productBatch: 'PON-202607-A01',
            batteryPercent: 86,
            batteryCharging: false
          }
        : {}),
      ...(deviceType === 'stable_light_source'
        ? {
            stableSourceWavelengths: [1310, 1550] as Array<1310 | 1550>,
            stableSourcePowerRange: { min: -4, max: 10, step: 0.1 },
            stableSourceFrequencies: ['cw', '270hz', '1khz', '2khz'] as Array<'cw' | '270hz' | '1khz' | '2khz'>,
            stableSourceCalibrationRange: { min: -3, max: 3, step: 0.1 },
            stableSourceGainRange: { min: 80, max: 120, step: 1 },
            stableSourceAutoShutdownOptions: [0, 1, 5, 10, 30, 60],
            stableSourceLanguages: ['zh-CN', 'en'] as Array<'zh-CN' | 'en'>,
            supportedVflColors: ['red', 'green'] as Array<'red' | 'green'>,
            productBatch: 'SLS-202607-A01',
            batteryPercent: 88,
            batteryCharging: false
          }
        : {}),
      ...(deviceType === 'port_audit_instrument'
        ? {
            portAuditPowerRange: { min: -70, max: 10, resolution: 0.01 },
            portAuditWavelengths: [850, 980, 1270, 1300, 1310, 1490, 1550, 1577, 1625, 1650],
            portAuditPonWavelengths: [1490, 1577] as Array<1490 | 1577>,
            portAuditRfidFrequencyMhz: 13.65,
            portAuditHas4g: true,
            supportedVflColors: ['red', 'green'] as Array<'red' | 'green'>,
            productBatch: 'PCA-202607-A01',
            batteryPercent: 91,
            batteryCapacityMah: 1000
          }
        : {}),
      ...(deviceType === 'dual_port_pon_meter'
        ? {
            dualPonWavelengths: [1310, 1490, 1550] as Array<1310 | 1490 | 1550>,
            dualPonOpmWavelengths: [850, 980, 1270, 1300, 1310, 1490, 1550, 1577, 1625, 1650],
            dualPonPowerRange: device.powerRange === 'high' ? 'high' as const : 'standard' as const,
            dualPonCablePorts: 8,
            dualPonSupportsOta: true,
            supportedVflColors: ['red'] as Array<'red' | 'green'>,
            productBatch: 'DPON-202607-A01',
            batteryPercent: 89
          }
        : {})
    })

    if (!added) {
      await alert(
        deviceType === 'dual_port_pon_meter'
          ? t('dualPon.deviceAlreadyAdded')
          : deviceType === 'port_audit_instrument'
          ? t('portAudit.deviceAlreadyAdded')
          : deviceType === 'stable_light_source'
            ? t('stableSource.deviceAlreadyAdded')
            : t('pon.deviceAlreadyAdded'),
        t('common.notice')
      )
      return
    }

    showAddDevice.value = false
    foundDevices.value = []
    await alert(t('home.deviceConnected'), t('common.success'))

    router.push(`/device/${newDeviceId}`)
  } catch (error) {
    await alert(t('home.connectFailed'), t('common.error'))
  }
}

const handleDeviceClick = (device: Device) => {
  router.push(`/device/${device.id}`)
}
</script>

<style scoped>
.add-device-icon { width: 24px; height: 24px; object-fit: contain; filter: brightness(0) invert(1); }
.home-workspace { padding: 0 16px 20px; }
.home-overview { margin: 0 -16px 18px; padding: 18px 20px 0; background: #fff; border-bottom: 1px solid #e9ebef; }
.home-account { display: flex; align-items: center; gap: 12px; }
.device-overview { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: 18px; padding: 14px 0; border-top: 1px solid #eff0f3; font-size: 12px; }
.device-overview-total, .connection-summary { display: flex; align-items: center; gap: 6px; }
.device-overview-total { color: #565e69; }
.device-overview-total .iconify { font-size: 17px; }
.connection-summary { color: #18755c; }
.connection-dot { width: 6px; height: 6px; border-radius: 50%; background: #259777; }
.home-workspace .device-category { margin-bottom: 10px; }
.home-workspace .category-header { padding: 0 0 10px; min-height: 38px; }
.home-workspace .section-title { font-size: 14px; color: #59616d; font-weight: 600; }
.home-workspace .toggle-btn { width: 34px; height: 34px; display: grid; place-items: center; padding: 0; margin: 0; background: transparent; font-size: 22px; }
.home-workspace .devices-list { gap: 10px; }
.home-workspace .device-card { border: 1px solid #e8ebef; border-radius: 8px; padding: 14px 10px; box-shadow: none; gap: 10px; align-items: center; }
.home-workspace .device-card:hover { border-color: #bccde9; }
.home-workspace .device-card:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.device-visual { width: 56px; height: 70px; flex: 0 0 56px; display: grid; place-items: center; }
.device-visual img { width: 100%; height: 100%; object-fit: contain; }
.home-workspace .device-name { font-size: 14px; line-height: 1.5; font-weight: 650; overflow-wrap: anywhere; }
.home-workspace .device-model { font-size: 11px; line-height: 1.6; color: #7b828d; overflow-wrap: anywhere; }
.home-workspace .device-status { gap: 5px; flex-wrap: wrap; overflow: visible; margin: 5px 0 0; }
.home-workspace .status-text { padding: 2px 6px; border-radius: 4px; font-size: 11px; }
.home-workspace .status-text.status-connected { background: #edf7f2; color: #217256; }
.home-workspace .status-text.status-disconnected { background: #f0f1f4; color: #727984; }
.home-workspace .last-connected { flex: 1 0 100%; font-size: 11px; white-space: normal; overflow-wrap: anywhere; color: #828994; }
.home-workspace .empty-state { background: transparent; border: 0; box-shadow: none; }
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
  width: 100%;
  max-width: 100%;
  padding: 10px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #E5E7EB;
  color: #1F2937;
  position: sticky;
  top: 0;
  z-index: 100;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

.logout-btn {
  background: #DBEAFE;
  border: 1px solid #93C5FD;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  color: #2563EB;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #BFDBFE;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.user-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.user-name {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 12px;
}

.user-accounts {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.user-account {
  font-size: 14px;
  color: #6B7280;
  display: flex;
  align-items: center;
}

.icon-label {
  font-weight: 600;
  color: #9CA3AF;
  margin-right: 6px;
  font-size: 13px;
}

.user-devices {
  font-size: 14px;
  color: #2563EB;
  font-weight: 600;
  padding: 8px 12px;
  background: #EFF6FF;
  border-radius: 8px;
  display: inline-block;
}

.add-device-section {
  text-align: center;
}

.add-device-btn {
  background: #2563EB;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  height: 52px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
}

.add-device-btn:hover {
  background: #1D4ED8;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.devices-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.empty-text {
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 13px;
  color: #9CA3AF;
}

.device-category {
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
  margin-bottom: 20px;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px 0;
  background: transparent;
  border-bottom: none;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #374151;
  margin: 0;
}

.toggle-btn {
  background: #F3F4F6;
  border: none;
  border-radius: 4px;
  color: #6B7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 14px;
  transition: all 0.2s ease;
  margin-left: 16px;
}

.toggle-btn:hover {
  background: #E5E7EB;
}

.devices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-card {
  background: #FFFFFF;
  padding: 16px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  align-items: flex-start;
  margin-bottom: 0;
}

.device-card:active {
  transform: scale(0.98);
  background: #F9FAFB;
}

.device-card.activated {
  border-left: none;
  background: #FFFFFF;
}

.device-card.unactivated {
  border-left: none;
  background: #FFFFFF;
}

.device-info {
  flex: 1;
  min-width: 0;
  flex-shrink: 1;
}

.device-name {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 4px;
}

.device-model {
  font-size: 15px;
  color: #6B7280;
  margin-bottom: 4px;
}

.device-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 4px;
  flex-wrap: nowrap;
  overflow: hidden;
  min-width: 0;
  width: 100%;
}

.status-text {
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 13px;
  flex-shrink: 0;
}

.last-connected {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  font-size: 13px;
  color: #6B7280;
}

.status-text.status-connected {
  color: #1D4ED8;
  background: #EFF6FF;
}

.status-text.status-disconnected {
  color: #991B1B;
  background: #FEE2E2;
}

.status-text.status-inactive {
  color: #D97706;
  background: #FEF3C7;
}

.status-text.status-unknown {
  color: #9CA3AF;
  background: #F3F4F6;
}



.authorization-info {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.auth-label {
  color: #6B7280;
}

.auth-date {
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.auth-date.normal {
  color: #065F46;
  background: #ECFDF5;
}

.auth-date.notice {
  color: #D97706;
  background: #FEF3C7;
}

.auth-date.warning {
  color: #991B1B;
  background: #FEF2F2;
}

.auth-date.expired {
  color: #991B1B;
  background: #FEF2F2;
}

.activation-hint {
  font-size: 14px;
  color: #6B7280;
}

.hint-text {
  color: #6B7280;
}

.device-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.activation-badge {
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.activation-badge.activated {
  background: #ECFDF5;
  color: #065F46;
}

.activation-badge.not_activated {
  background: #FEF3C7;
  color: #D97706;
}

.activation-badge.expired {
  background: #FEF2F2;
  color: #991B1B;
}

.quick-activate-btn {
  background: #2563EB;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  transition: all 0.3s ease;
}

.quick-activate-btn:hover {
  background: #1D4ED8;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(4px);
  box-sizing: border-box;
}

.modal-content {
  background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
  border: 1px solid rgba(30, 58, 95, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 343px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(30, 58, 95, 0.1);
  background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #1E3A5F;
  margin: 0;
}

.modal-close {
  background: rgba(30, 58, 95, 0.1);
  border: 1px solid rgba(30, 58, 95, 0.2);
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  color: #6B7280;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: rgba(30, 58, 95, 0.2);
  transform: scale(1.05);
}

.modal-body {
  padding: 20px;
}

.add-method {
  text-align: center;
  margin-bottom: 20px;
}

.method-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.method-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.method-btn {
  background: linear-gradient(135deg, #2D5A87 0%, #1E3A5F 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 12px 24px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(45, 90, 135, 0.3);
}

.method-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(45, 90, 135, 0.4);
}

.method-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.found-devices {
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
}

.found-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.found-device {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
  border: 1px solid rgba(30, 58, 95, 0.1);
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.found-device:hover {
  background: linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%);
  border-color: #2D5A87;
  transform: scale(1.02);
}

.found-name {
  font-size: 14px;
  font-weight: 600;
  color: #1E3A5F;
  margin-bottom: 2px;
}

.found-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.device-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background: #E2E8F0;
}

.device-tag.smart {
  color: #1D4ED8;
  background: rgba(37, 99, 235, 0.12);
}

.device-tag.pon {
  color: #0E7490;
  background: rgba(6, 182, 212, 0.12);
}

.found-signal {
  font-size: 12px;
  color: #6B7280;
}

.connect-btn {
  background: linear-gradient(135deg, #2D5A87 0%, #1E3A5F 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.connect-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(45, 90, 135, 0.3);
}

/* 底部导航栏样式已移至 BottomNavigation 组件 */

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

/* Add device modal mobile style */
.add-device-modal {
  max-width: 300px;
  width: 100%;
  max-height: min(78vh, 620px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
}

.add-device-modal .modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #FFFFFF;
  border-bottom: 1px solid #F3F4F6;
}

.add-device-modal .page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

.add-device-modal .close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6B7280;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.add-device-modal .close-btn:hover {
  background: #F3F4F6;
}

.add-device-modal .modal-body {
  padding: 20px;
  background: #FFFFFF;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.add-device-modal .add-method {
  text-align: center;
  margin-bottom: 20px;
}

.add-device-modal .method-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 8px;
}

.add-device-modal .method-desc {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 16px;
  line-height: 1.4;
}

.add-device-modal .method-btn {
  background: #2563EB;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 14px 24px;
  width: 100%;
  transition: all 0.2s ease;
}

.add-device-modal .method-btn:hover:not(:disabled) {
  background: #1D4ED8;
}

.add-device-modal .method-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.add-device-modal .found-devices {
  border-top: 1px solid #F3F4F6;
  padding-top: 16px;
  padding-bottom: 4px;
}

.add-device-modal .found-title {
  font-size: 14px;
  font-weight: 500;
  color: #1F2937;
  margin-bottom: 12px;
}

.add-device-modal .found-device {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-device-modal .found-device:hover {
  background: #F3F4F6;
}

.add-device-modal .found-name {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.add-device-modal .found-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.add-device-modal .found-signal {
  font-size: 12px;
  color: #6B7280;
}

.add-device-modal .connect-btn {
  background: #2563EB;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  transition: all 0.2s ease;
}

.add-device-modal .connect-btn:hover {
  background: #1D4ED8;
}

</style>
