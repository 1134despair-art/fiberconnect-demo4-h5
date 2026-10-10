<template>
  <div class="app-container legacy-app-page legacy-home-page workspace-page workspace-dialogs">
    <!-- 顶部标题栏 -->
    <header class="workspace-header">
      <h1>{{ t('home.title') }}</h1>
      <button class="workspace-icon-button" :title="t('home.addDevice')" :aria-label="t('home.addDevice')" @click="showAddDevice = true">
        <img class="add-device-icon" :src="plusIcon" alt="" />
      </button>
    </header>
    
    <!-- 主内容区域 -->
    <div class="workspace-scroll hide-scrollbar">
      <div class="home-workspace">
        <!-- 用户与设备概览 -->
        <section class="home-overview" :aria-label="t('home.deviceOverview')">
          <div class="overview-header">
            <div class="home-account">
              <UserAvatar class="account-avatar" :src="user?.avatar" :name="user?.name" />
              <div class="account-copy">
                <strong>{{ user?.name }}</strong>
                <span>{{ t('home.addedDevices', { count: user?.devices?.length || 0 }) }}</span>
              </div>
            </div>
          </div>
          <div class="device-overview" role="list">
            <div class="overview-metric" role="listitem">
              <span class="metric-copy"><strong>{{ user?.devices?.length || 0 }}</strong><small>{{ t('home.totalDevices') }}</small></span>
            </div>
            <div class="overview-metric online" role="listitem">
              <span class="metric-copy"><strong>{{ connectedDevices.length }}</strong><small>{{ t('home.onlineDevices') }}</small></span>
            </div>
            <div class="overview-metric offline" role="listitem">
              <span class="metric-copy"><strong>{{ disconnectedDevices.length }}</strong><small>{{ t('home.offlineDevices') }}</small></span>
            </div>
          </div>
        </section>

        <section v-if="user?.devices?.length" class="device-toolbar" :aria-label="t('home.deviceTools')">
          <label class="device-search">
            <img class="ui-icon" :src="searchIcon" alt="" />
            <input v-model="searchQuery" type="search" :placeholder="t('home.searchDevices')" />
            <button v-if="searchQuery" type="button" :aria-label="t('home.clearSearch')" @click="searchQuery = ''">
              <img class="ui-icon" :src="closeCircleIcon" alt="" />
            </button>
          </label>
          <div class="device-filter" role="tablist" :aria-label="t('home.deviceFilter')">
            <button type="button" role="tab" :class="{ active: activeFilter === 'all' }" :aria-selected="activeFilter === 'all'" @click="activeFilter = 'all'">
              <span>{{ t('home.filterAll') }}</span>
            </button>
            <button type="button" role="tab" :class="{ active: activeFilter === 'online' }" :aria-selected="activeFilter === 'online'" @click="activeFilter = 'online'">
              <span>{{ t('home.filterOnline') }}</span>
            </button>
            <button type="button" role="tab" :class="{ active: activeFilter === 'offline' }" :aria-selected="activeFilter === 'offline'" @click="activeFilter = 'offline'">
              <span>{{ t('home.filterOffline') }}</span>
            </button>
          </div>
        </section>

        <!-- 设备列表 -->
        <div class="devices-section">
          <div v-if="!user?.devices?.length" class="empty-state">
            <img class="empty-state-icon" :src="devicesOffIcon" alt="" />
            <div class="empty-text">{{ t('home.noDevices') }}</div>
            <div class="empty-desc">{{ t('home.addFirstDevice') }}</div>
            <button class="empty-action" type="button" @click="showAddDevice = true">{{ t('home.addDevice') }}</button>
          </div>
          
          <div v-else-if="!hasVisibleDevices" class="search-empty" role="status">
            <img class="ui-icon" :src="searchIcon" alt="" />
            <strong>{{ t('home.noMatchingDevices') }}</strong>
            <small>{{ t('home.adjustSearch') }}</small>
          </div>

          <div v-else class="devices-container">
            <!-- 已连接设备 -->
            <div v-if="filteredConnectedDevices.length" class="device-category mb-2">
              <div class="category-header">
                <h3 class="section-title"><span class="category-status-dot is-connected" aria-hidden="true"></span><span>{{ t('home.connected') }}</span><span class="category-count">{{ filteredConnectedDevices.length }}</span></h3>
                <button 
                  @click="toggleConnectedDevices" 
                  class="toggle-btn"
                  :class="{ 'collapsed': !showConnectedDevices }"
                  :title="showConnectedDevices ? t('home.collapse') : t('home.expand')"
                  :aria-label="showConnectedDevices ? t('home.collapse') : t('home.expand')"
                  :aria-expanded="showConnectedDevices"
                >
                  <img class="ui-icon" :src="showConnectedDevices ? chevronUpIcon : chevronDownIcon" alt="" />
                </button>
              </div>
              
              <div v-show="showConnectedDevices" class="devices-list">
                <button
                  v-for="device in filteredConnectedDevices"
                  :key="device.id"
                  class="device-card activated"
                  type="button"
                  :aria-label="`${device.name}，${getStatusText(device.status)}`"
                  @click="handleDeviceClick(device)"
                >
                  <div class="device-visual">
                    <img :src="getDeviceImage(device.model)" alt="" />
                    <span class="device-state-marker" :class="getStatusClass(device.status)" aria-hidden="true"></span>
                  </div>
                  <div class="device-info">
                    <div class="device-title-row">
                      <div class="device-name">{{ device.name }}</div>
                    </div>
                    <div class="device-model">{{ device.model }} · {{ device.serialNumber }}</div>
                    <div v-if="device.lastConnected" class="last-connected"><img class="ui-icon" :src="clockIcon" alt="" />{{ t('home.lastConnected') }}：{{ device.lastConnected }}</div>
                  </div>
                  <span class="row-chevron" aria-hidden="true"><img class="ui-icon" :src="chevronRightIcon" alt="" /></span>
                </button>
              </div>
            </div>

            <!-- 未连接设备 -->
            <div v-if="filteredDisconnectedDevices.length" class="device-category">
              <div class="category-header">
                <h3 class="section-title"><span class="category-status-dot is-disconnected" aria-hidden="true"></span><span>{{ t('home.disconnected') }}</span><span class="category-count">{{ filteredDisconnectedDevices.length }}</span></h3>
                <button 
                  @click="toggleDisconnectedDevices" 
                  class="toggle-btn"
                  :class="{ 'collapsed': !showDisconnectedDevices }"
                  :title="showDisconnectedDevices ? t('home.collapse') : t('home.expand')"
                  :aria-label="showDisconnectedDevices ? t('home.collapse') : t('home.expand')"
                  :aria-expanded="showDisconnectedDevices"
                >
                  <img class="ui-icon" :src="showDisconnectedDevices ? chevronUpIcon : chevronDownIcon" alt="" />
                </button>
              </div>
              
              <div v-show="showDisconnectedDevices" class="devices-list">
                <button
                  v-for="device in filteredDisconnectedDevices"
                  :key="device.id"
                  class="device-card unactivated"
                  type="button"
                  :aria-label="`${device.name}，${getStatusText(device.status)}`"
                  @click="handleDeviceClick(device)"
                >
                  <div class="device-visual">
                    <img :src="getDeviceImage(device.model)" alt="" />
                    <span class="device-state-marker" :class="getStatusClass(device.status)" aria-hidden="true"></span>
                  </div>
                  <div class="device-info">
                    <div class="device-title-row">
                      <div class="device-name">{{ device.name }}</div>
                    </div>
                    <div class="device-model">{{ device.model }} · {{ device.serialNumber }}</div>
                    <div v-if="device.lastConnected" class="last-connected"><img class="ui-icon" :src="clockIcon" alt="" />{{ t('home.lastConnected') }}：{{ device.lastConnected }}</div>
                  </div>
                  <span class="row-chevron" aria-hidden="true"><img class="ui-icon" :src="chevronRightIcon" alt="" /></span>
                </button>
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
      <div class="modal-content add-device-modal" role="dialog" aria-modal="true" aria-labelledby="add-device-title" @click.stop>
        <div class="modal-header">
          <h2 id="add-device-title" class="page-title">{{ t('home.addDevice') }}</h2>
          <button type="button" class="close-btn" :aria-label="t('common.cancel')" @click="showAddDevice = false">
            ×
          </button>
        </div>
        
        <div class="modal-body">
          <div class="add-method" :aria-busy="isScanning">
            <span class="add-method-icon"><img class="ui-icon" :src="bluetoothIcon" alt="" /></span>
            <div class="method-title">{{ t('home.bluetoothConnection') }}</div>
            <div class="method-desc">{{ t('home.bluetoothScanDesc') }}</div>
            <button type="button" class="method-btn" :disabled="isScanning" @click="startBluetoothScan">
              {{ isScanning ? t('home.scanning') : t('home.startScan') }}
            </button>
          </div>
          
          <div v-if="foundDevices.length" class="found-devices">
            <div class="found-title">{{ t('home.foundDevices') }}</div>
            <button
              v-for="device in foundDevices"
              :key="device.id"
              class="found-device"
              type="button"
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
              <span class="connect-btn">{{ t('home.connect') }}</span>
            </button>
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
import UserAvatar from '@/components/UserAvatar.vue'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth, type Device, type DeviceType } from '@/composables/useAuth'
import { useModal } from '@/composables/useModal'
import BottomNavigation from '@/components/BottomNavigation.vue'
import '@/styles/workspace.css'
import '@/styles/subpages.css'
import plusIcon from '@/assets/icons/iconfont/add.svg'
import searchIcon from '@/assets/icons/iconfont/search.svg'
import closeCircleIcon from '@/assets/icons/home/close-circle.svg'
import chevronUpIcon from '@/assets/icons/home/chevron-up.svg'
import chevronDownIcon from '@/assets/icons/home/chevron-down.svg'
import chevronRightIcon from '@/assets/icons/home/chevron-right.svg'
import clockIcon from '@/assets/icons/home/clock-outline.svg'
import bluetoothIcon from '@/assets/icons/home/bluetooth-connect.svg'
import devicesOffIcon from '@/assets/icons/home/devices-off.svg'
import fusionImage from '@/assets/app/products/fusion-splicer-realistic.jpg'
import portableImage from '@/assets/app/products/portable-otdr-realistic.jpg'
import smartImage from '@/assets/app/products/smart-otdr-realistic.jpg'
import multiImage from '@/assets/app/products/multi-opm-realistic.jpg'
import ponImage from '@/assets/app/products/pon-power-meter-realistic.jpg'
import dualImage from '@/assets/app/products/dual-pon-realistic.jpg'
import auditImage from '@/assets/app/products/port-audit-realistic.jpg'
import sourceImage from '@/assets/app/products/stable-light-source-realistic.png'

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

onMounted(() => document.body.classList.add('home-full-viewport'))
onBeforeUnmount(() => document.body.classList.remove('home-full-viewport'))

const showAddDevice = ref(false)
const isScanning = ref(false)
const foundDevices = ref<any[]>([])
const searchQuery = ref('')
const activeFilter = ref<'all' | 'online' | 'offline'>('all')

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

const matchesSearch = (device: Device) => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  if (!query) return true
  return [device.name, device.model, device.serialNumber].some(value => value.toLocaleLowerCase().includes(query))
}

const filteredConnectedDevices = computed(() => {
  if (activeFilter.value === 'offline') return []
  return connectedDevices.value.filter(matchesSearch)
})

const filteredDisconnectedDevices = computed(() => {
  if (activeFilter.value === 'online') return []
  return disconnectedDevices.value.filter(matchesSearch)
})

const hasVisibleDevices = computed(() => filteredConnectedDevices.value.length + filteredDisconnectedDevices.value.length > 0)

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

    // 智能 OTDR 连接后先确认授权，未激活设备需完成独立激活流程。
    const added = addDevice({
      id: newDeviceId,
      name: device.name,
      model: device.model,
      serialNumber: device.serialNumber,
      deviceType,
      status: 'connected',
      activationStatus: deviceType === 'smart_otdr' ? 'not_activated' : 'activated',
      lastConnected: new Date().toISOString().split('T')[0],
      authorizationExpiry: deviceType === 'smart_otdr' ? '' : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
            stableSourceCalibrationRange: { min: -3, max: 3, step: 0.05 },
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

    router.push(deviceType === 'smart_otdr' ? `/device/${newDeviceId}/activate` : `/device/${newDeviceId}`)
  } catch (error) {
    await alert(t('home.connectFailed'), t('common.error'))
  }
}

const handleDeviceClick = (device: Device) => {
  router.push(`/device/${device.id}`)
}
</script>

<style scoped>
.add-device-icon { width: 21px; height: 21px; object-fit: contain; filter: brightness(0) invert(1); }
.home-workspace { padding: 0 14px 28px; }
.home-overview { margin: 0 -14px 22px; padding: 18px 18px 0; border-bottom: 1px solid #dfe5ed; background: #fff; }
.overview-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.home-account { min-width: 0; display: flex; align-items: center; gap: 12px; }
.overview-live-status { min-height: 28px; display: inline-flex; align-items: center; gap: 7px; flex: 0 0 auto; padding: 0 10px; border-radius: 8px; background: #eaf7f2; color: #146c50; font-size: 11px; font-weight: 700; }
.overview-live-status.offline { background: #f0f2f5; color: #6f7782; }
.connection-dot { width: 7px; height: 7px; flex: 0 0 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 3px currentColor; opacity: .82; }
.device-overview { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 16px; border-top: 1px solid #edf0f4; }
.overview-metric { min-width: 0; min-height: 68px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 7px; border-right: 1px solid #edf0f4; box-sizing: border-box; }
.overview-metric:last-child { border-right: 0; }
.metric-icon { width: 30px; height: 30px; display: grid; place-items: center; flex: 0 0 30px; border-radius: 8px; background: #edf3ff; color: #285fc4; font-size: 17px; }
.overview-metric.online .metric-icon { background: #eaf7f2; color: #18755c; }
.overview-metric.offline .metric-icon { background: #f0f2f5; color: #707986; }
.metric-copy { min-width: 0; display: flex; flex-direction: column; }
.metric-copy strong { color: #202833; font-size: 18px; line-height: 1.1; font-weight: 750; font-variant-numeric: tabular-nums; }
.metric-copy small { margin-top: 4px; overflow: hidden; color: #727c89; font-size: 10px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.home-workspace .device-category { margin-bottom: 20px; }
.home-workspace .category-header { min-height: 40px; padding: 0 2px 9px; }
.home-workspace .section-title { display: flex; align-items: center; gap: 8px; color: #27313d; font-size: 15px; font-weight: 750; }
.category-status-dot { width: 8px; height: 8px; flex: 0 0 8px; border-radius: 50%; }
.category-status-dot.is-connected { background: #259777; box-shadow: 0 0 0 3px rgba(37,151,119,.12); }
.category-status-dot.is-disconnected { background: #a8afb9; box-shadow: 0 0 0 3px rgba(168,175,185,.14); }
.category-count { min-width: 24px; height: 22px; display: inline-grid; place-items: center; padding: 0 6px; box-sizing: border-box; border-radius: 6px; background: #e9edf3; color: #66717f; font-size: 11px; font-weight: 750; font-variant-numeric: tabular-nums; }
.home-workspace .toggle-btn { width: 36px; height: 36px; display: grid; place-items: center; padding: 0; margin: 0; border-radius: 8px; background: transparent; color: #637080; font-size: 21px; }
.home-workspace .toggle-btn:hover { background: #e9edf3; }
.home-workspace .devices-list { gap: 0; overflow: hidden; border: 1px solid #dfe5ed; border-radius: 12px; background: #fff; box-shadow: 0 5px 18px rgba(32,48,70,.055); }
.home-workspace .device-card { position: relative; width: 100%; min-height: 94px; display: flex; gap: 12px; align-items: center; padding: 13px 12px; border: 0; border-bottom: 1px solid #edf0f4; border-radius: 0; background: #fff; color: inherit; font: inherit; text-align: left; box-shadow: none; }
.home-workspace .device-card:last-child { border-bottom: 0; }
.home-workspace .device-card:hover { background: #f7f9fc; }
.home-workspace .device-card:active { transform: none; background: #edf3fb; }
.home-workspace .device-card:focus-visible { position: relative; z-index: 1; outline: 2px solid #2563eb; outline-offset: -2px; }
.home-workspace .device-card.activated { box-shadow: inset 3px 0 #259777; }
.device-visual { width: 62px; height: 66px; flex: 0 0 62px; display: grid; place-items: center; padding: 6px; box-sizing: border-box; border: 1px solid #e4e9f0; border-radius: 9px; background: #f5f7fa; }
.device-visual img { width: 100%; height: 100%; object-fit: contain; }
.home-workspace .activated .device-visual { border-color: #dae6f8; background: #eef4fc; }
.home-workspace .unactivated .device-visual img { opacity: .62; filter: grayscale(.32); }
.device-title-row { min-width: 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.home-workspace .device-name { min-width: 0; color: #1e2732; font-size: 14px; line-height: 1.4; font-weight: 750; overflow-wrap: anywhere; }
.home-workspace .device-model { margin-top: 4px; overflow: hidden; color: #6d7886; font-size: 11px; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
.home-workspace .status-text { min-height: 22px; display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto; padding: 0 7px; border-radius: 6px; font-size: 10px; font-weight: 750; }
.home-workspace .status-text::before { content: ''; width: 6px; height: 6px; flex: 0 0 6px; border-radius: 50%; background: currentColor; }
.home-workspace .status-text.status-connected { background: #eaf7f2; color: #18755c; }
.home-workspace .status-text.status-disconnected { background: #f0f2f5; color: #707986; }
.home-workspace .last-connected { min-width: 0; display: flex; align-items: center; gap: 4px; margin-top: 6px; overflow: hidden; color: #838d99; font-size: 10px; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
.home-workspace .last-connected .iconify { flex: 0 0 auto; font-size: 12px; }
.home-workspace .row-chevron { width: 28px; height: 28px; display: grid; place-items: center; flex: 0 0 28px; border-radius: 8px; background: #f2f4f7; color: #8c96a3; font-size: 17px; }
.home-workspace .empty-state { padding: 44px 20px; border: 1px solid #dfe5ed; border-radius: 12px; background: #fff; box-shadow: 0 5px 18px rgba(32,48,70,.055); }
.empty-state-icon { display: block; margin: 0 auto 14px; color: #8fa0b4; font-size: 38px; }
.empty-action { min-height: 44px; margin-top: 20px; padding: 0 20px; border: 0; border-radius: 8px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 750; }
.empty-action:hover { background: #1d4ed8; }
.app-container {
  display: flex;
  flex-direction: column;
  background: #f4f6f8;
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

.legacy-home-page > .workspace-header { min-height: 68px; padding: calc(14px + env(safe-area-inset-top)) 18px 14px; border-bottom-color: #dfe5ed; }
.legacy-home-page > .workspace-header h1 { color: #17212d; font-size: 21px; font-weight: 750; }
.legacy-home-page > .workspace-header .workspace-icon-button { width: 40px; height: 40px; flex-basis: 40px; border-radius: 9px; box-shadow: 0 6px 16px rgba(37,99,235,.2); }
.home-overview .account-avatar { width: 48px; height: 48px; flex-basis: 48px; border-radius: 14px; background: #eaf1ff; color: #2457b8; font-size: 18px; }
.home-overview .account-copy strong { display: block; color: #1e2732; font-size: 24px; line-height: 1.25; font-weight: 750; }
.home-overview .account-copy > span { display: block; margin-top: 3px; color: #5f6b79; font-size: 11px; font-weight: 650; }
.home-overview .account-copy small { margin-top: 3px; color: #7a8592; font-size: 10px; }
/* Center the connection introduction; keep discovered devices easy to scan. */
.workspace-page.workspace-dialogs .add-device-modal {
  max-width: 344px;
  max-height: min(680px, 100%);
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 20px 56px rgba(20, 40, 75, .18);
}
.workspace-page.workspace-dialogs .add-device-modal .modal-header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  min-height: 64px;
  padding: 8px 12px;
  gap: 0;
  border-bottom: 0;
}
.workspace-page.workspace-dialogs .add-device-modal .page-title {
  grid-column: 2;
  text-align: center;
  color: #1e293b;
  font-size: 16px;
  font-weight: 650;
}
.workspace-page.workspace-dialogs .add-device-modal .close-btn {
  grid-column: 3;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: transparent;
}
.workspace-page.workspace-dialogs .add-device-modal .close-btn:hover { background: #f1f5f9; }
.workspace-page.workspace-dialogs .add-device-modal .modal-body { padding: 12px 24px 24px; }
.workspace-page.workspace-dialogs .add-device-modal .add-method {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: 0;
}
.workspace-page.workspace-dialogs .add-device-modal .add-method-icon {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  margin: 0 auto 20px;
  border-radius: 20px;
  background: #edf4ff;
}
.workspace-page.workspace-dialogs .add-device-modal .add-method-icon .ui-icon { width: 30px; height: 30px; }
.workspace-page.workspace-dialogs .add-device-modal .method-title {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
  line-height: 1.5;
  font-weight: 650;
}
.workspace-page.workspace-dialogs .add-device-modal .method-desc {
  max-width: 240px;
  margin: 8px 0 24px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.workspace-page.workspace-dialogs .add-device-modal .method-btn {
  width: 100%;
  min-height: 48px;
  margin: 0;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
}
.workspace-page.workspace-dialogs .add-device-modal .found-devices { margin-top: 24px; padding-top: 20px; }
.workspace-page.workspace-dialogs .add-device-modal .found-device {
  width: 100%; gap: 12px; padding: 12px;
  border: 1px solid #e3e8ef; border-radius: 12px;
  background: #f8fafc; color: inherit; font: inherit; text-align: left;
}
.workspace-page.workspace-dialogs .add-device-modal .found-info { min-width: 0; overflow-wrap: anywhere; }
.workspace-page.workspace-dialogs .add-device-modal .found-name-row { flex-wrap: wrap; gap: 4px; }
.workspace-page.workspace-dialogs .add-device-modal .connect-btn {
  min-height: 36px; display: inline-grid; place-items: center;
  flex: 0 0 auto; padding: 0 12px; border-radius: 8px;
}
.workspace-page.workspace-dialogs .add-device-modal button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.workspace-page.workspace-dialogs .add-device-modal .method-btn:hover:not(:disabled),
.workspace-page.workspace-dialogs .add-device-modal .found-device:hover,
.workspace-page.workspace-dialogs .add-device-modal .connect-btn:hover { transform: none; }
.workspace-page.workspace-dialogs .add-device-modal .found-device:hover { border-color: #cbd6e5; background: #f3f6fa; }


@media (max-width: 340px) {
  .home-workspace { padding-inline: 10px; }
  .home-overview { margin-inline: -10px; padding-inline: 14px; }
  .overview-header { gap: 8px; }
  .overview-live-status { padding-inline: 8px; }
  .overview-metric { gap: 5px; padding-inline: 4px; }
  .metric-icon { width: 26px; height: 26px; flex-basis: 26px; font-size: 15px; }
  .metric-copy strong { font-size: 16px; }
  .metric-copy small { font-size: 9px; }
  .home-workspace .device-card { gap: 9px; padding: 10px; }
  .device-visual { width: 54px; height: 60px; flex-basis: 54px; }
  .home-workspace .device-name { font-size: 13px; }
  .home-workspace .row-chevron { display: none; }
}

/* Production mobile pass: compact status-first hierarchy inspired by mature IoT apps. */
.legacy-home-page {
  --home-primary: #1f5fc9;
  --home-primary-strong: #174ca8;
  --home-canvas: #f2f4f7;
  --home-border: #dce2ea;
  --home-text: #17212f;
  --home-muted: #667284;
  --home-success: #16866a;
}

.legacy-home-page > .workspace-header {
  min-height: 64px;
  padding: calc(11px + env(safe-area-inset-top)) 16px 11px;
  border-bottom: 1px solid #e1e6ed;
  background: #fff;
}
.legacy-home-page > .workspace-header h1 { margin: 0; color: var(--home-text); font-size: 20px; line-height: 1.25; font-weight: 750; }
.legacy-home-page > .workspace-header .workspace-icon-button {
  width: 40px;
  height: 40px;
  flex-basis: 40px;
  border-radius: 10px;
  background: var(--home-primary);
  box-shadow: 0 5px 14px rgba(31, 95, 201, .2);
}
.legacy-home-page > .workspace-header .workspace-icon-button:active { transform: scale(.96); background: var(--home-primary-strong); }

.legacy-home-page .workspace-scroll { background: var(--home-canvas); }
.home-workspace { padding: 12px 12px 26px; }
.home-overview {
  overflow: hidden;
  margin: 0 0 12px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: var(--home-primary);
  color: #fff;
  box-shadow: 0 6px 18px rgba(28, 68, 132, .14);
}
.home-overview .overview-header { min-height: 100px; align-items: center; justify-content: flex-start; padding: 18px 16px; box-sizing: border-box; }
.home-overview .home-account { gap: 14px; }
.home-overview .account-avatar {
  width: 64px;
  height: 64px;
  flex-basis: 64px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, .35);
  border-radius: 14px;
  background: rgba(255, 255, 255, .16);
  color: #fff;
  font-size: 24px;
}
.home-overview .account-copy strong { color: #fff; font-size: 17px; line-height: 1.35; font-weight: 750; }
.home-overview .account-copy > span { margin-top: 6px; color: rgba(255, 255, 255, .76); font-size: 12px; font-weight: 500; }
.home-overview .device-overview { margin: 0; border-top: 1px solid rgba(255, 255, 255, .16); }
.home-overview .overview-metric {
  min-height: 58px;
  padding: 10px 5px;
  border-right-color: rgba(255, 255, 255, .16);
}
.home-overview .metric-copy { align-items: center; text-align: center; }
.home-overview .metric-copy strong { color: #fff; font-size: 19px; line-height: 1; font-weight: 760; }
.home-overview .metric-copy small { margin-top: 5px; color: rgba(255, 255, 255, .76); font-size: 11px; }

.device-toolbar {
  overflow: hidden;
  margin-bottom: 14px;
  padding: 9px 10px 0;
  border: 1px solid var(--home-border);
  border-radius: 10px;
  background: #fff;
}
.device-search {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #f1f3f6;
  box-sizing: border-box;
}
.ui-icon { width: 1em; height: 1em; display: block; object-fit: contain; }
.device-search > .ui-icon { width: 18px; height: 18px; flex: 0 0 18px; opacity: .55; }
.device-search input {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--home-text);
  font: inherit;
  font-size: 13px;
}
.device-search input::placeholder { color: #7d8897; opacity: 1; }
.device-search:focus-within { border-color: #7aa4ec; box-shadow: 0 0 0 3px rgba(31, 95, 201, .1); }
.device-search button { width: 44px; height: 44px; display: grid; place-items: center; flex: 0 0 44px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: #8a95a3; font-size: 17px; }
.device-search button .ui-icon { width: 17px; height: 17px; opacity: .5; }
.device-filter {
  height: 43px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin: 7px -10px 0;
  padding: 0;
  border-top: 1px solid #edf0f4;
  border-radius: 0;
  background: #fff;
  box-sizing: border-box;
}
.device-filter button {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 7px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #6b7685;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
}
.device-filter button { position: relative; }
.device-filter button.active { color: var(--home-primary-strong); }
.device-filter button.active::after { content: ''; position: absolute; left: 30%; right: 30%; bottom: 0; height: 3px; border-radius: 3px 3px 0 0; background: var(--home-primary); }
.device-filter button:focus-visible { outline: 2px solid var(--home-primary); outline-offset: -2px; }

.home-workspace .device-category { margin-bottom: 14px; }
.home-workspace .category-header { min-height: 36px; padding: 0 2px 7px; }
.home-workspace .section-title { gap: 7px; color: #344051; font-size: 14px; font-weight: 720; }
.category-count { min-width: 21px; height: 20px; padding: 0 5px; border-radius: 6px; font-size: 10px; }
.home-workspace .toggle-btn { width: 44px; height: 44px; border-radius: 8px; font-size: 18px; }
.home-workspace .toggle-btn .ui-icon { width: 18px; height: 18px; opacity: .58; }
.home-workspace .devices-list { border-color: var(--home-border); border-radius: 8px; box-shadow: none; }
.home-workspace .device-card {
  min-height: 88px;
  gap: 10px;
  padding: 11px 10px;
  border-bottom-color: #e8ecf1;
}
.home-workspace .device-card.activated { box-shadow: none; }
.device-visual { position: relative; width: 56px; height: 60px; flex-basis: 56px; padding: 4px; overflow: hidden; border-color: #e3e7ec; border-radius: 8px; background: #fff; }
.home-workspace .activated .device-visual { border-color: #d9e0e8; background: #fff; }
.device-visual img { border-radius: 5px; background: #fff; }
.device-state-marker { position: absolute; right: 4px; bottom: 4px; width: 8px; height: 8px; border: 2px solid #fff; border-radius: 50%; background: #98a2af; box-sizing: content-box; }
.device-state-marker.status-connected { background: var(--home-success); }
.device-state-marker.status-inactive { background: #e89a21; }
.device-title-row { align-items: center; gap: 6px; }
.home-workspace .device-name { font-size: 14px; line-height: 1.35; font-weight: 720; }
.home-workspace .device-model { margin-top: 4px; color: #5f6c7c; font-size: 11px; }
.home-workspace .status-text { min-height: 20px; padding: 0 6px; border-radius: 6px; font-size: 9px; }
.home-workspace .status-text::before { width: 5px; height: 5px; flex-basis: 5px; }
.home-workspace .last-connected { margin-top: 5px; color: #748092; font-size: 11px; }
.home-workspace .last-connected .ui-icon { width: 12px; height: 12px; flex: 0 0 12px; opacity: .62; }
.home-workspace .row-chevron { width: 28px; height: 28px; flex-basis: 28px; border-radius: 7px; font-size: 16px; }
.home-workspace .row-chevron .ui-icon { width: 17px; height: 17px; opacity: .48; }
.search-empty {
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px solid var(--home-border);
  border-radius: 10px;
  background: #fff;
  text-align: center;
  box-sizing: border-box;
}
.search-empty > .ui-icon { width: 30px; height: 30px; margin-bottom: 10px; opacity: .38; }
.search-empty strong { color: #344051; font-size: 13px; }
.search-empty small { margin-top: 5px; color: #8490a0; font-size: 10px; }
.empty-state-icon { width: 38px; height: 38px; opacity: .42; }
.add-method-icon .ui-icon { width: 22px; height: 22px; filter: invert(32%) sepia(75%) saturate(1900%) hue-rotate(205deg) brightness(91%); }

@media (max-width: 340px) {
  .home-workspace { padding: 10px 10px 22px; }
  .home-overview { margin-inline: 0; }
  .home-overview .overview-header { padding-inline: 10px; }
  .home-overview .overview-live-status { padding-inline: 7px; }
  .device-filter button { gap: 4px; padding-inline: 4px; }
  .home-workspace .device-card { gap: 9px; padding: 9px; }
  .device-visual { width: 50px; height: 56px; flex-basis: 50px; }
}

@media (max-width: 600px) {
  :global(body.home-full-viewport) { min-height: 100dvh; padding: 0; align-items: stretch; background: #fff; }
  :global(body.home-full-viewport > #app) { width: 100%; height: 100dvh; flex: 0 0 100%; }
  .legacy-home-page.app-container {
    width: 100%;
    max-width: none;
    height: 100dvh;
    max-height: none;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
  .legacy-home-page :deep(.bottom-navigation) { border-radius: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .legacy-home-page *, .legacy-home-page *::before, .legacy-home-page *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; }
}

</style>
