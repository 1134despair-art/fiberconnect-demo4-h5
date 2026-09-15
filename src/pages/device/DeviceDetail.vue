<template>
  <div
    class="app-container"
    :class="{
      'pon-device-app': isPonPowerMeter,
      'dual-pon-device-app': isDualPortPonMeter,
      'stable-source-device-app': isStableLightSource,
      'port-audit-device-app': isPortAuditInstrument,
      'smart-otdr-device-app': isSmartOtdr,
      'portable-otdr-device-app': isPortableOtdr,
      'multi-opm-device-app': isMultiOpm,
      'legacy-device-app': isLegacyDevice
    }"
  >
    <template v-if="isDualPortPonMeter && device">
      <DualPonHome :device="device" />
    </template>

    <template v-else-if="isPortAuditInstrument && device">
      <PortAuditHome :device="device" />
    </template>

    <template v-else-if="isStableLightSource && device">
      <StableSourceHome :device="device" />
    </template>

    <template v-else-if="isPonPowerMeter && device">
      <PonDeviceHome :device="device" />
    </template>

    <template v-else-if="isPortableOtdr && device">
      <PortableOtdrHome :device="device" />
    </template>

    <template v-else-if="isMultiOpm && device">
      <MultiOpmHome :device="device" />
    </template>

    <template v-else-if="isSmartOtdr">
      <div class="content-flex hide-scrollbar smart-device-content">
        <SmartOtdrPageShell
          title="智能OTDR"
          :subtitle="device?.name || ''"
          :battery-level="device?.batteryPercent ?? 86"
          @back="goToAppHome"
        >
          <template #actions>
            <button
              class="smart-header-tool"
              :class="{ active: flashlightOn }"
              type="button"
              aria-label="照明"
              :aria-pressed="flashlightOn"
              @click="toggleSmartFlashlight"
            >
              <img :src="smartFlashlightIcon" alt="" />
            </button>
          </template>

          <template #footer>
            <SmartOtdrFunctionNav v-if="device" :device-id="device.id" active="home" />
          </template>

          <main class="smart-device-page">
            <section v-if="device?.status !== 'connected'" class="smart-offline-band" role="status">
              <div><strong>设备未连接</strong><span>连接后可使用测量与控制功能</span></div>
              <button type="button" :disabled="isConnecting" @click="connectDevice">
                {{ isConnecting ? '连接中' : '重新连接' }}
              </button>
            </section>

            <section class="smart-home-meter" aria-label="OTDR设备状态">
              <header>
                <strong>OTDR链路测试</strong>
                <span class="smart-ready-state" :class="{ online: canShowOperations }">
                  <i></i>{{ canShowOperations ? '已就绪' : activationBadgeText }}
                </span>
              </header>

              <button class="smart-wave-display" type="button" :disabled="!canShowOperations" @click="navigateToOperation('smart-otdr')">
                <span>双波长</span>
                <div><strong>1310</strong><i>/</i><strong>1550</strong><small>nm</small></div>
                <p>{{ canShowOperations ? '点击开始OTDR测量' : '连接并激活后可测试' }}</p>
              </button>

              <footer>
                <span>测量状态</span>
                <strong>{{ canShowOperations ? '待测' : '不可用' }}</strong>
              </footer>
            </section>

            <section class="smart-parameter-grid" aria-label="OTDR关键参数">
              <div><span>测量波长</span><strong>1310/1550nm</strong></div>
              <div><span>测量范围</span><strong>100m-200km</strong></div>
              <div><span>脉宽范围</span><strong>5ns-10μs</strong></div>
            </section>

            <section class="smart-spec-strip" aria-label="设备能力">
              <div><span>连接</span><strong>蓝牙 / 4G</strong></div>
              <div><span>存储</span><strong>本机 / SD / U盘</strong></div>
              <div><span>授权</span><strong>{{ activationBadgeText }}</strong></div>
            </section>

            <section class="smart-home-tools">
              <button type="button" :class="{ active: flashlightOn }" @click="toggleSmartFlashlight">
                <span class="smart-tool-icon"><img :src="smartFlashlightIcon" alt="" /></span>
                <span><strong>照明</strong><small>{{ flashlightOn ? '已开启' : '已关闭' }}</small></span>
                <i class="smart-mini-switch" :class="{ active: flashlightOn }"><b></b></i>
              </button>
              <button type="button" :disabled="!canShowOperations" @click="navigateToOperation('files')">
                <span class="smart-tool-icon"><img :src="fileManagerIcon" alt="" /></span>
                <span><strong>文件管理</strong><small>测试文件与记录</small></span>
                <i class="smart-tool-chevron">›</i>
              </button>
              <button class="smart-screenshot-tool" type="button" :disabled="!canShowOperations" @click="captureSmartScreenshot">
                <span class="smart-tool-icon"><img :src="screenshotIcon" alt="" /></span>
                <span><strong>屏幕截取</strong><small>{{ smartScreenshots.length ? `${smartScreenshots.length}张本地截图` : '保存当前设备画面' }}</small></span>
                <i class="smart-tool-chevron">›</i>
              </button>
            </section>

            <section v-if="canShowOperations" class="smart-capability-section">
              <div class="smart-capability-head">
                <h2>专业工具</h2>
                <span>选择功能</span>
              </div>
              <div class="smart-capability-grid">
                <button
                  v-for="item in smartOtdrToolOperations"
                  :key="item.key"
                  type="button"
                  @click="navigateToOperation(item.key)"
                >
                  <span><img :src="item.image" alt="" /></span>
                  <span class="smart-capability-copy">
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.description }}</small>
                  </span>
                  <i>›</i>
                </button>
              </div>
            </section>

            <SmartOtdrActivationCard
              v-if="device?.status === 'connected' && !canShowOperations"
              class="smart-home-activation-block"
              :bluetooth-connected="device?.status === 'connected'"
              :activation-status="device?.activationStatus"
              :authorization-expiry="device?.authorizationExpiry || ''"
              :initial-state="smartOtdrActivationViewState"
              @activated="handleSmartOtdrActivated"
            />

            <div v-if="smartUtilityFeedback" class="smart-utility-feedback" role="status">
              {{ smartUtilityFeedback }}
            </div>

          </main>

          <div v-if="showSmartScreenshotModal" class="smart-shot-layer" role="presentation">
            <button class="smart-shot-mask" type="button" aria-label="关闭截图记录" @click="showSmartScreenshotModal = false"></button>
            <section role="dialog" aria-modal="true" aria-label="屏幕截图">
              <header><h2>屏幕截图</h2><button type="button" @click="showSmartScreenshotModal = false">关闭</button></header>
              <div class="smart-shot-preview">
                <span>OTDR链路测试</span>
                <strong>1310 / 1550 <small>nm</small></strong>
                <p>{{ latestSmartScreenshot?.time }}</p>
              </div>
              <div class="smart-shot-summary">
                <span>保存位置</span><strong>本机 / Screenshots</strong>
                <span>记录数量</span><strong>{{ smartScreenshots.length }} 张</strong>
              </div>
              <button class="smart-shot-primary" type="button" @click="showSmartScreenshotModal = false">完成</button>
            </section>
          </div>
        </SmartOtdrPageShell>
      </div>
    </template>

    <template v-else>
      <!-- 顶部标题栏 -->
      <header class="header">
        <button @click="goBack" class="back-btn">
          ← {{ $t('common.back') }}
        </button>
        <div class="page-title">{{ device?.name || $t('deviceDetail.title') }}</div>
        <div class="header-placeholder"></div>
      </header>
      
      <!-- 主内容区域 -->
      <div class="content-flex hide-scrollbar">
        <div class="p-4">
        <!-- 设备状态卡片 -->
        <div class="device-status-card mb-4">
          <div class="status-header">
            <div class="device-icon legacy-device-icon">
              <img :src="legacyDeviceImage" alt="" />
            </div>
            <div class="device-info">
              <div class="device-header-row">
                <div class="device-name">{{ device?.name }}</div>
                <div class="activation-badge" :class="activationBadgeClass">
                  {{ activationBadgeText }}
                </div>
                <div class="connection-status-badge" :class="device?.status">
                  {{ getStatusText(device?.status) }}
                </div>
              </div>
              <div class="device-model">{{ device?.model }} · {{ device?.serialNumber }}</div>
            </div>
          </div>
          
          <!-- 连接控制 -->
          <div v-if="device?.status !== 'connected'" class="connection-control">
            <div class="warning-text">{{ $t('deviceDetail.connectBluetoothTip') }}</div>
            <button @click="connectDevice" class="connect-btn" :disabled="isConnecting">
              {{ isConnecting ? $t('deviceDetail.connecting') : $t('deviceDetail.connectDevice') }}
            </button>
          </div>
        </div>

        <!-- 基础信息显示 -->
        <div v-if="device?.status === 'connected'" class="basic-info-card mb-4">
          <h3 class="section-title">{{ $t('deviceDetail.basicInfo') }}</h3>
          <div class="info-grid">
            <div v-if="!isMultiOpm" class="info-item">
              <div class="info-label">{{ $t('deviceDetail.temperature') }}</div>
              <div class="info-value">{{ deviceInfo.temperature }}°C</div>
            </div>
            <template v-if="isPortableOtdr">
              <div class="info-item">
                <div class="info-label">{{ $t('deviceDetail.range') }}</div>
                <div class="info-value">{{ otdrInfo.rangeKm }}km</div>
              </div>
              <div class="info-item">
                <div class="info-label">{{ $t('deviceDetail.wavelength') }}</div>
                <div class="info-value">{{ otdrInfo.wavelength }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">{{ $t('deviceDetail.battery') }}</div>
                <div class="info-value">{{ otdrInfo.batteryMah }}mAh</div>
              </div>
            </template>
            <template v-else-if="isSmartOtdr">
              <div
                v-for="item in smartOtdrSummaryItems"
                :key="item.key"
                class="info-item"
              >
                <div class="info-label">{{ item.label }}</div>
                <div class="info-value">{{ item.value }}</div>
              </div>
            </template>
            <template v-else-if="isMultiOpm">
              <div class="info-item">
                <div class="info-label">{{ $t('deviceDetail.powerRange') }}</div>
                <div class="info-value">{{ multiOpmInfo.powerRange }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">{{ $t('deviceDetail.resolution') }}</div>
                <div class="info-value">{{ multiOpmInfo.resolution }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">{{ $t('deviceDetail.accuracy') }}</div>
                <div class="info-value">{{ multiOpmInfo.accuracy }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">{{ $t('deviceDetail.frequencyId') }}</div>
                <div class="info-value">{{ multiOpmInfo.frequencyId }}</div>
              </div>
            </template>
            <template v-else>
              <div class="info-item">
                <div class="info-label">{{ $t('deviceDetail.altitude') }}</div>
                <div class="info-value">{{ deviceInfo.altitude }}m</div>
              </div>
              <div class="info-item">
                <div class="info-label">{{ $t('deviceDetail.pressure') }}</div>
                <div class="info-value">{{ deviceInfo.pressure }}kPa</div>
              </div>
              <div class="info-item">
                <div class="info-label">{{ $t('deviceDetail.fusionCount') }}</div>
                <div class="info-value">{{ deviceInfo.fusionCount }}</div>
              </div>
            </template>
          </div>
        </div>

        <SmartOtdrActivationCard
          v-if="device?.status === 'connected' && isSmartOtdr"
          class="mb-4"
          :bluetooth-connected="device?.status === 'connected'"
          :activation-status="device?.activationStatus"
          :authorization-expiry="device?.authorizationExpiry || ''"
          :initial-state="smartOtdrActivationViewState"
          @activated="handleSmartOtdrActivated"
        />

        <!-- 设备激活 -->
        <div v-if="device?.activationStatus === 'not_activated' && !isSmartOtdr" class="activation-card mb-4">
          <h3 class="section-title">{{ $t('deviceDetail.activation') }}</h3>
          <div class="activation-methods">
            <div class="method-item" @click="showActivationModal = true">
              <div class="method-icon">
                <span class="iconify" data-icon="mdi:key"></span>
              </div>
              <div class="method-info">
                <div class="method-title">{{ $t('deviceDetail.codeActivation') }}</div>
                <div class="method-desc">{{ $t('deviceDetail.codeActivationDesc') }}</div>
              </div>
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>
        </div>

        <!-- 开机密码设置 -->
        <div v-if="device?.status === 'connected' && isFusionSplicer" class="password-card mb-4">
          <h3 class="section-title">{{ $t('deviceDetail.bootPassword') }}</h3>
          <div class="password-actions">
            <button @click="showPasswordModal = true" class="action-btn secondary edit-password-btn">
              <span>{{ device?.hasPassword ? $t('deviceDetail.changeBootPassword') : $t('deviceDetail.setBootPassword') }}</span>
              <span class="iconify" data-icon="mdi:pencil" style="font-size: 16px; color: #9CA3AF;"></span>
            </button>
            <button v-if="device?.hasPassword" @click="sendPasswordToDevice" class="action-btn primary">
              {{ $t('deviceDetail.sendPassword') }}
            </button>
          </div>
        </div>

        <!-- 设备操作菜单 -->
        <div v-if="canShowOperations" class="operations-card">
          <h3 class="section-title">{{ $t('deviceDetail.operations') }}</h3>
          <div v-if="isFusionSplicer" class="operations-grid">
            <div class="operation-item" @click="navigateToOperation('fusion-operation')">
              <div class="operation-icon fusion">
                <img src="@/assets/img/fusion.png" alt="Fusion operation" class="icon-img" />
              </div>
              <div class="operation-title">熔接操作</div>
            </div>
            <div class="operation-item" @click="navigateToOperation('omp')">
              <div class="operation-icon omp">
                <img src="@/assets/img/OPM.png" alt="OPM" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('device.opm.title') }}</div>
            </div>
            
            <div class="operation-item" @click="navigateToOperation('vfl')">
              <div class="operation-icon vfl">
                <img src="@/assets/img/VFL.png" alt="VFL" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('device.vfl.title') }}</div>
            </div>
            
            <div class="operation-item" @click="navigateToOperation('otdr')">
              <div class="operation-icon otdr">
                <img src="@/assets/img/OTDR.png" alt="OTDR" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('device.otdr.title') }}</div>
            </div>
            
            <div class="operation-item" @click="navigateToOperation('fusion')">
              <div class="operation-icon fusion">
                <img src="@/assets/img/fusion.png" alt="Fusion" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('device.fusionSettings.settings') }}</div>
            </div>
            
            <div class="operation-item" @click="navigateToOperation('maintenance')">
              <div class="operation-icon maintenance">
                <img src="@/assets/img/maintenance.png" alt="Maintenance" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('device.maintenance.title') }}</div>
            </div>
            
            <div class="operation-item" @click="navigateToOperation('records')">
              <div class="operation-icon records">
                <img src="@/assets/img/records.png" alt="Records" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('device.fusionRecords.title') }}</div>
            </div>
            <div class="operation-item" @click="toggleHeater">
              <div class="operation-icon heater" :class="{ 'is-on': heaterOn }">
                <img src="@/assets/icons/pon-meter/temperature.svg" alt="Heater" class="icon-img" />
              </div>
              <div class="operation-title">{{ heaterOn ? '停止加热' : '加热器' }}</div>
            </div>
            <div class="operation-item" @click="navigateToOperation('legacy-settings')">
              <div class="operation-icon system">
                <img src="@/assets/img/settings.png" alt="Settings" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('settings.systemSettings') }}</div>
            </div>
          </div>

          <div v-else-if="isPortableOtdr" class="operations-grid otdr-grid">
            <div class="operation-item" @click="navigateToOperation('otdr')">
              <div class="operation-icon otdr">
                <img src="@/assets/img/OTDR.png" alt="OTDR" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('device.otdr.title') }}</div>
            </div>
            <div class="operation-item" @click="toggleFlashlight">
              <div class="operation-icon flashlight" :class="{ 'is-on': flashlightOn }">
                <span class="iconify" data-icon="mdi:flashlight" style="font-size: 30px;"></span>
              </div>
              <div class="operation-title">{{ $t('deviceDetail.flashlight') }}</div>
            </div>
            <div class="operation-item" @click="navigateToOperation('legacy-settings')">
              <div class="operation-icon system">
                <img src="@/assets/img/settings.png" alt="Settings" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('settings.systemSettings') }}</div>
            </div>
            <div class="operation-item" @click="toggleRedLight">
              <div class="operation-icon red-light" :class="{ 'is-on': redLightOn }">
                <img src="@/assets/img/VFL.png" alt="VFL" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('deviceDetail.redLight') }}</div>
            </div>
          </div>

          <div v-else-if="isSmartOtdr" class="operations-grid">
            <div
              v-for="item in smartOtdrOperations"
              :key="item.key"
              class="operation-item operation-item-card"
              @click="navigateToOperation(item.key)"
            >
              <div class="operation-icon" :class="item.iconClass">
                <img :src="item.image" :alt="item.title" class="icon-img" />
              </div>
              <div class="operation-title">{{ item.title }}</div>
            </div>
          </div>

          <div v-else-if="isMultiOpm" class="operations-grid opm-grid">
            <div class="operation-item" @click="navigateToOperation('mopm')">
              <div class="operation-icon power-meter">
                <span class="iconify" data-icon="mdi:chart-line" style="font-size: 30px;"></span>
              </div>
              <div class="operation-title">{{ $t('deviceDetail.powerMeter') }}</div>
            </div>
            <div class="operation-item" @click="navigateToOpmHistory">
              <div class="operation-icon power-records">
                <span class="iconify" data-icon="mdi:clipboard-text-outline" style="font-size: 30px;"></span>
              </div>
              <div class="operation-title">{{ $t('deviceDetail.powerRecords') }}</div>
            </div>
            <div class="operation-item" @click="navigateToOperation('wiremap')">
              <div class="operation-icon cable-test">
                <span class="iconify" data-icon="mdi:lan-connect" style="font-size: 30px;"></span>
              </div>
              <div class="operation-title">{{ $t('deviceDetail.cableWiremap') }}</div>
            </div>
            <div class="operation-item" @click="navigateToOperation('seek')">
              <div class="operation-icon cable-seek">
                <span class="iconify" data-icon="mdi:radar" style="font-size: 30px;"></span>
              </div>
              <div class="operation-title">{{ $t('deviceDetail.cableSeek') }}</div>
            </div>
            <div class="operation-item" @click="toggleFlashlight">
              <div class="operation-icon flashlight" :class="{ 'is-on': flashlightOn }">
                <img src="@/assets/app/icons/device/flashlight.png" alt="Flashlight" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('deviceDetail.flashlight') }}</div>
            </div>
            <div class="operation-item" @click="navigateToOperation('mopm-vfl')">
              <div class="operation-icon red-light" :class="{ 'is-on': redLightOn }">
                <img src="@/assets/img/VFL.png" alt="VFL" class="icon-img" />
              </div>
              <div class="operation-title">红/绿光源</div>
            </div>
            <div class="operation-item" @click="navigateToOperation('legacy-settings')">
              <div class="operation-icon system">
                <img src="@/assets/img/settings.png" alt="Settings" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('settings.systemSettings') }}</div>
            </div>
          </div>

          <div v-else class="operations-grid opm-grid">
            <div class="operation-item" @click="navigateToOperation('system')">
              <div class="operation-icon system">
                <img src="@/assets/img/settings.png" alt="Settings" class="icon-img" />
              </div>
              <div class="operation-title">{{ $t('settings.systemSettings') }}</div>
            </div>
          </div>
        </div>

      </div>
      </div>
    </template>

    <!-- 激活码弹窗 -->
    <div v-if="showActivationModal" class="modal-overlay" @click="showActivationModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ $t('deviceDetail.activation') }}</h3>
          <button @click="showActivationModal = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close" style="font-size: 20px;"></span>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="activation-form">
            <div class="form-group">
              <label class="form-label">{{ $t('settings.activationCode') }}</label>
              <input
                v-model="activationCode"
                type="text"
                :placeholder="$t('deviceDetail.inputActivationCode')"
                class="form-input"
              />
            </div>
            
            <div class="form-actions">
              <button @click="activateDevice" class="action-btn primary" :disabled="!activationCode || isActivating">
                {{ isActivating ? $t('settings.activating') : $t('settings.activateDevice') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 开机密码弹窗 -->
    <div v-if="showPasswordModal" class="modal-overlay" @click="showPasswordModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ device?.hasPassword ? $t('deviceDetail.changeBootPassword') : $t('deviceDetail.setBootPassword') }}</h3>
          <button @click="showPasswordModal = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close" style="font-size: 20px;"></span>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="password-form">
            <div v-if="device?.hasPassword" class="form-group">
              <label class="form-label">{{ $t('settings.currentPassword') }}</label>
              <input
                v-model="passwordForm.oldPassword"
                type="password"
                :placeholder="$t('settings.inputCurrentPassword')"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ $t('settings.newPassword') }}</label>
              <input
                v-model="passwordForm.newPassword"
                type="password"
                :placeholder="$t('settings.inputNewPassword')"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ $t('settings.confirmPassword') }}</label>
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                :placeholder="$t('settings.inputConfirmPassword')"
                class="form-input"
              />
            </div>
            
            <div class="form-actions">
              <button @click="setPassword" class="action-btn primary" :disabled="!isPasswordFormValid || isSettingPassword">
                {{ isSettingPassword ? $t('deviceDetail.setting') : $t('common.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="handleCancel">
      <section class="modal-content device-alert-modal" role="dialog" aria-modal="true" :aria-label="modalOptions.title">
        <div class="device-alert-body">
          <strong>{{ modalOptions.title }}</strong>
          <p>{{ modalOptions.message }}</p>
        </div>
        <div class="device-alert-actions">
          <button v-if="modalOptions.cancelText" class="secondary" @click="handleCancel">
            {{ modalOptions.cancelText }}
          </button>
          <button @click="handleConfirm">{{ modalOptions.confirmText }}</button>
        </div>
      </section>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth, type Device } from '@/composables/useAuth'
import { useModal } from '@/composables/useModal'
import SmartOtdrActivationCard from './components/SmartOtdrActivationCard.vue'
import SmartOtdrFunctionNav from './components/SmartOtdrFunctionNav.vue'
import SmartOtdrPageShell from './components/SmartOtdrPageShell.vue'
import PonDeviceHome from './pon/PonDeviceHome.vue'
import PortableOtdrHome from './portable-otdr/PortableOtdrHome.vue'
import MultiOpmHome from './multi-opm/MultiOpmHome.vue'
import StableSourceHome from './stable-source/StableSourceHome.vue'
import PortAuditHome from './port-audit/PortAuditHome.vue'
import DualPonHome from './dual-pon/DualPonHome.vue'
import smartOtdrMeasureIcon from '@/assets/app/icons/device/measurement.png'
import eventMapIcon from '@/assets/app/icons/device/event-map.png'
import powerMeterIcon from '@/assets/app/icons/device/power-meter.png'
import lossTestIcon from '@/assets/app/icons/device/loss-test.png'
import endfaceIcon from '@/assets/app/icons/device/endface.png'
import fileManagerIcon from '@/assets/app/icons/device/file-manager.png'
import lightSourceIcon from '@/assets/app/icons/device/light-source.png'
import cableTestIcon from '@/assets/app/icons/device/cable-test.png'
import smartSettingsIcon from '@/assets/app/icons/common/settings.png'
import smartVflIcon from '@/assets/app/icons/device/vfl.png'
import smartFlashlightIcon from '@/assets/app/icons/device/flashlight.png'
import screenshotIcon from '@/assets/app/icons/device/screenshot.png'
import fusionSplicerImage from '@/assets/app/products/fusion-splicer.png'
import portableOtdrImage from '@/assets/app/products/portable-otdr.png'
import multiOpmImage from '@/assets/app/products/multi-opm.png'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { user, updateDevice } = useAuth()
const { showModal, modalOptions, alert, handleConfirm, handleCancel } = useModal()

// 响应式数据
const device = ref<Device | null>(null)
const isConnecting = ref(false)
const showActivationModal = ref(false)
const showPasswordModal = ref(false)
const activationCode = ref('')
const isActivating = ref(false)
const isSettingPassword = ref(false)
const flashlightOn = ref(false)
const redLightOn = ref(false)
const heaterOn = ref(false)
const smartUtilityFeedback = ref('')
const showSmartScreenshotModal = ref(false)
interface SmartScreenshotRecord { id: string; time: string }
const smartScreenshots = ref<SmartScreenshotRecord[]>([])
let smartUtilityFeedbackTimer: number | undefined

const DEVICE_CONNECTED_AT_KEY_PREFIX = 'device_connected_at:'
const DEVICE_CMD_KEY_PREFIX = 'device_cmd_last:'

const recordDeviceConnectedAt = (deviceId: string) => {
  if (!deviceId) return
  try {
    localStorage.setItem(`${DEVICE_CONNECTED_AT_KEY_PREFIX}${deviceId}`, String(Date.now()))
  } catch {
    return
  }
}

const recordDeviceCommandAt = (type: 'otdr' | 'flashlight' | 'redlight') => {
  const deviceId = device.value?.id
  if (!deviceId) return
  if (device.value?.status !== 'connected') return

  const now = Date.now()
  try {
    localStorage.setItem(`${DEVICE_CMD_KEY_PREFIX}${deviceId}:any`, String(now))
    localStorage.setItem(`${DEVICE_CMD_KEY_PREFIX}${deviceId}:${type}`, String(now))
  } catch {
    return
  }
}

// 设备基础信息
const deviceInfo = reactive({
  temperature: 25.6,
  altitude: 1250,
  pressure: 101.3,
  fusionCount: 1247
})

const otdrInfo = reactive({
  rangeKm: 20,
  wavelength: '1550±10nm',
  batteryMah: 900
})

const multiOpmInfo = reactive({
  powerRange: '-70~+10 / -50~+26 dBm',
  resolution: '0.01 dBm',
  accuracy: '±0.2 dB / 5%',
  frequencyId: '270 / 330 / 1k / 2kHz',
  has4g: true,
  hasBluetooth: true,
  batteryMah: 1500,
  workTempRange: '-10~60℃'
})

const smartOtdrInfo = reactive({
  wavelength: '1310 / 1550nm',
  rangeKm: '100m - 200km',
  pulseWidth: '5ns - 10us',
  powerRange: '+10 ~ -70 dBm',
  storage: '内部存储 / SD卡 / U盘',
  network: '蓝牙 / 4G'
})

const smartOtdrSummaryItems = computed(() => [
  { key: 'wavelength', label: t('deviceDetail.wavelengthCapability'), value: smartOtdrInfo.wavelength },
  { key: 'range', label: t('deviceDetail.smartRange'), value: smartOtdrInfo.rangeKm },
  { key: 'pulse', label: t('deviceDetail.pulseWidthRange'), value: smartOtdrInfo.pulseWidth },
  { key: 'network', label: t('deviceDetail.smartNetwork'), value: smartOtdrInfo.network },
  { key: 'storage', label: t('deviceDetail.smartStorage'), value: smartOtdrInfo.storage }
])

const smartOtdrOperations = computed(() => [
  { key: 'smart-otdr', title: t('deviceDetail.smartOtdrMeasure'), description: '曲线、事件与链路参数', iconClass: 'otdr', image: smartOtdrMeasureIcon },
  { key: 'event-map', title: t('deviceDetail.eventMap'), description: '链路事件图形化分析', iconClass: 'records', image: eventMapIcon },
  { key: 'smart-opm', title: t('deviceDetail.smartPowerMeter'), description: '波长、频率与功率读数', iconClass: 'power-meter', image: powerMeterIcon },
  { key: 'loss-test', title: t('deviceDetail.smartLossTest'), description: '参考值与相对损耗', iconClass: 'records', image: lossTestIcon },
  { key: 'endface', title: t('deviceDetail.smartEndfaceInspect'), description: 'Type-C端面镜头预览', iconClass: 'endface', image: endfaceIcon },
  { key: 'files', title: t('deviceDetail.smartFileManager'), description: '测试文件与记录', iconClass: 'maintenance', image: fileManagerIcon },
  { key: 'light-source', title: t('deviceDetail.lightSource'), description: '双波长稳定光输出', iconClass: 'light-source', image: lightSourceIcon },
  { key: 'vfl', title: t('deviceDetail.vflSource'), description: '红光故障定位', iconClass: 'light-source', image: smartVflIcon },
  { key: 'cable-test', title: t('deviceDetail.cableTest'), description: '线序、线长与寻线', iconClass: 'cable-test', image: cableTestIcon },
  { key: 'system', title: t('settings.systemSettings'), description: '设备参数与连接', iconClass: 'system', image: smartSettingsIcon }
])

const smartOtdrToolOperations = computed(() => smartOtdrOperations.value.filter((item) =>
  ['smart-opm', 'loss-test', 'endface', 'light-source', 'vfl', 'cable-test'].includes(item.key)
))

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const isPortableOtdr = computed(() => {
  return device.value?.deviceType === 'portable_otdr'
})

const isMultiOpm = computed(() => {
  return device.value?.deviceType === 'multi_opm_meter'
})

const isSmartOtdr = computed(() => {
  return device.value?.deviceType === 'smart_otdr'
})

const isPonPowerMeter = computed(() => {
  return device.value?.deviceType === 'pon_power_meter'
})

const isStableLightSource = computed(() => {
  return device.value?.deviceType === 'stable_light_source'
})

const isPortAuditInstrument = computed(() => {
  return device.value?.deviceType === 'port_audit_instrument'
})

const isDualPortPonMeter = computed(() => {
  return device.value?.deviceType === 'dual_port_pon_meter'
})

const isFusionSplicer = computed(() => {
  return device.value?.deviceType === 'fusion_splicer'
})

const isLegacyDevice = computed(() => isFusionSplicer.value)

const legacyDeviceImage = computed(() => {
  if (isPortableOtdr.value) return portableOtdrImage
  if (isMultiOpm.value) return multiOpmImage
  return fusionSplicerImage
})

const hasExpiredAuthorization = (authorizationExpiry?: string) => {
  if (!authorizationExpiry) return false
  return new Date(authorizationExpiry).getTime() < Date.now()
}

const smartOtdrActivationViewState = computed<'inactive' | 'pending_lock' | 'activated' | 'expired'>(() => {
  const override = String(route.query.activationState || '')
  if (['inactive', 'pending_lock', 'activated', 'expired'].includes(override)) {
    return override as 'inactive' | 'pending_lock' | 'activated' | 'expired'
  }

  if (!isSmartOtdr.value || !device.value) return 'inactive'

  if (device.value.activationStatus === 'activated') {
    return hasExpiredAuthorization(device.value.authorizationExpiry) ? 'expired' : 'activated'
  }

  return 'inactive'
})

const activationBadgeClass = computed(() => {
  if (isSmartOtdr.value && smartOtdrActivationViewState.value === 'expired') {
    return 'expired'
  }
  return device.value?.activationStatus || 'not_activated'
})

const activationBadgeText = computed(() => {
  if (!device.value) return t('settings.notActivated')

  if (isSmartOtdr.value) {
    switch (smartOtdrActivationViewState.value) {
      case 'activated':
        return t('settings.activated')
      case 'expired':
        return t('deviceDetail.smartActivationExpiredShort')
      case 'pending_lock':
        return t('deviceDetail.smartActivationPending')
      default:
        return t('settings.notActivated')
    }
  }

  return device.value.activationStatus === 'activated'
    ? t('settings.activated')
    : t('settings.notActivated')
})

const canShowOperations = computed(() => {
  if (!device.value || device.value.status !== 'connected') return false

  if (isSmartOtdr.value) {
    return smartOtdrActivationViewState.value === 'activated'
  }

  return device.value.activationStatus === 'activated'
})

// 计算属性
const isPasswordFormValid = computed(() => {
  if (device.value?.hasPassword) {
    return passwordForm.oldPassword && 
           passwordForm.newPassword && 
           passwordForm.confirmPassword &&
           passwordForm.newPassword === passwordForm.confirmPassword
  } else {
    return passwordForm.newPassword && 
           passwordForm.confirmPassword &&
           passwordForm.newPassword === passwordForm.confirmPassword
  }
})

/**
 * 获取设备状态文本
 */
const getStatusText = (status?: string) => {
  switch (status) {
    case 'connected':
      return '已连接'
    case 'disconnected':
      return '未连接'
    case 'inactive':
      return '未激活'
    default:
      return '未知状态'
  }
}

/**
 * 返回上一页
 */
const goBack = () => {
  router.back()
}

const goToAppHome = () => {
  router.replace('/')
}

/**
 * 连接设备
 */
const connectDevice = async () => {
  if (!device.value) return
  
  isConnecting.value = true
  try {
    // 模拟连接过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 更新设备状态
    updateDevice(device.value.id, {
      status: 'connected',
      lastConnected: new Date().toLocaleString('zh-CN')
    })
    
    device.value.status = 'connected'
    device.value.lastConnected = new Date().toLocaleString('zh-CN')

    recordDeviceConnectedAt(device.value.id)
    
    alert('设备连接成功！')
  } catch (error) {
    console.error('设备连接失败:', error)
    alert('设备连接失败，请重试')
  } finally {
    isConnecting.value = false
  }
}

/**
 * 激活设备
 */
const activateDevice = async () => {
  if (!activationCode.value || !device.value) return
  
  isActivating.value = true
  try {
    // 模拟激活过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 更新设备激活状态
    updateDevice(device.value.id, {
      activationStatus: 'activated',
      authorizationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')
    })
    
    device.value.activationStatus = 'activated'
    device.value.authorizationExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')
    
    showActivationModal.value = false
    activationCode.value = ''
    alert('设备激活成功！')
  } catch (error) {
    console.error('设备激活失败:', error)
    alert('设备激活失败，请重试')
  } finally {
    isActivating.value = false
  }
}

const handleSmartOtdrActivated = (payload: { authorizationExpiry: string; activatedAt: string }) => {
  if (!device.value) return

  updateDevice(device.value.id, {
    activationStatus: 'activated',
    authorizationExpiry: payload.authorizationExpiry
  })

  device.value.activationStatus = 'activated'
  device.value.authorizationExpiry = payload.authorizationExpiry
  alert(t('deviceDetail.smartActivationSuccess'))
}

/**
 * 设置开机密码
 */
const setPassword = async () => {
  if (!isPasswordFormValid.value || !device.value) return
  
  isSettingPassword.value = true
  try {
    // 1. 设置密码
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新设备密码状态
    updateDevice(device.value.id, {
      hasPassword: true
    })
    
    device.value.hasPassword = true
    
    // 2. 自动发送密码到设备
    await sendPasswordToDevice()
    
    showPasswordModal.value = false
    // 清空表单
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
    alert(t('deviceDetail.passwordSetSuccess') + '，' + t('deviceDetail.passwordSent'))
  } catch (error) {
    console.error('密码设置失败:', error)
    alert('密码设置失败，请重试')
  } finally {
    isSettingPassword.value = false
  }
}

/**
 * 发送密码到设备
 */
const sendPasswordToDevice = async () => {
  try {
    // 模拟发送密码到设备
    await new Promise(resolve => setTimeout(resolve, 1000))
    // 注意：如果是手动点击发送按钮，需要单独提示
    if (!isSettingPassword.value) {
      alert(t('deviceDetail.passwordSent'))
    }
  } catch (error) {
    console.error('发送密码失败:', error)
    if (isSettingPassword.value) {
      throw error // 如果是在设置密码流程中，抛出错误以便上层捕获
    } else {
      alert(t('deviceDetail.sendPasswordFail'))
    }
  }
}

/**
 * 导航到操作页面
 */
const navigateToOperation = (operation: string) => {
  if (operation === 'otdr') recordDeviceCommandAt('otdr')
  router.push(`/device/${device.value?.id}/${operation}`)
}

const navigateToOpmHistory = () => {
  if (isMultiOpm.value) {
    router.push(`/device/${device.value?.id}/mopm?focus=history`)
    return
  }
  router.push(`/device/${device.value?.id}/omp?focus=history`)
}

const toggleFlashlight = async () => {
  flashlightOn.value = !flashlightOn.value
  recordDeviceCommandAt('flashlight')
  await alert(flashlightOn.value ? t('deviceDetail.flashlightOn') : t('deviceDetail.flashlightOff'))
}

const toggleHeater = async () => {
  heaterOn.value = !heaterOn.value
  await alert(heaterOn.value ? '加热器已启动' : '加热器已停止')
}

const showSmartUtilityFeedback = (message: string) => {
  smartUtilityFeedback.value = message
  if (smartUtilityFeedbackTimer) window.clearTimeout(smartUtilityFeedbackTimer)
  smartUtilityFeedbackTimer = window.setTimeout(() => {
    smartUtilityFeedback.value = ''
  }, 1800)
}

const smartScreenshotStorageKey = computed(() => `smart-otdr:screenshots:${device.value?.id || 'unknown'}`)
const latestSmartScreenshot = computed(() => smartScreenshots.value[0])

const restoreSmartScreenshots = () => {
  try {
    const raw = localStorage.getItem(smartScreenshotStorageKey.value)
    smartScreenshots.value = raw ? JSON.parse(raw) as SmartScreenshotRecord[] : []
  } catch {
    smartScreenshots.value = []
  }
}

const captureSmartScreenshot = () => {
  if (device.value?.status !== 'connected') {
    showSmartUtilityFeedback('请先连接设备')
    return
  }
  const now = new Date()
  const record: SmartScreenshotRecord = {
    id: String(now.getTime()),
    time: new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(now)
  }
  smartScreenshots.value = [record, ...smartScreenshots.value].slice(0, 20)
  localStorage.setItem(smartScreenshotStorageKey.value, JSON.stringify(smartScreenshots.value))
  showSmartScreenshotModal.value = true
}

const toggleSmartFlashlight = () => {
  if (device.value?.status !== 'connected') {
    showSmartUtilityFeedback(t('deviceDetail.connectBluetoothTip'))
    return
  }
  flashlightOn.value = !flashlightOn.value
  recordDeviceCommandAt('flashlight')
  showSmartUtilityFeedback(flashlightOn.value ? t('deviceDetail.flashlightUtilityOn') : t('deviceDetail.flashlightUtilityOff'))
}

const toggleRedLight = async () => {
  redLightOn.value = !redLightOn.value
  recordDeviceCommandAt('redlight')
  await alert(redLightOn.value ? t('deviceDetail.redLightOn') : t('deviceDetail.redLightOff'))
}

/**
 * 初始化设备信息
 */
onMounted(() => {
  const deviceId = route.params.id as string
  if (user.value && deviceId) {
    device.value = user.value.devices.find(d => d.id === deviceId) || null
    if (!device.value) {
      alert(t('deviceDetail.deviceNotFound'))
      router.back()
      return
    }

    if (route.query.deviceError === 'unsupported_pon') {
      alert(t('pon.unsupportedDevice'))
    }

    if (route.query.deviceError === 'unsupported_stable_source') {
      alert(t('stableSource.unsupportedDevice'))
    }

    if (route.query.deviceError === 'unsupported_port_audit') {
      alert(t('portAudit.unsupportedDevice'))
    }

    if (route.query.deviceError === 'unsupported_dual_pon') {
      alert(t('dualPon.unsupportedDevice'))
    }

    if (device.value.deviceType === 'smart_otdr') restoreSmartScreenshots()
  } else {
    alert(t('deviceDetail.deviceInfoFail'))
    router.back()
  }
})

onUnmounted(() => {
  if (smartUtilityFeedbackTimer) window.clearTimeout(smartUtilityFeedbackTimer)
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  background: #f4f7fb;
  overflow: hidden;
}

.app-container.dual-pon-device-app {
  width: min(375px, calc(100vw - 24px));
  max-width: 375px;
  box-sizing: border-box;
  border-radius: 22px;
}

.app-container.pon-device-app,
.app-container.portable-otdr-device-app,
.app-container.multi-opm-device-app,
.app-container.stable-source-device-app,
.app-container.port-audit-device-app,
.app-container.smart-otdr-device-app {
  width: min(375px, calc(100vw - 24px));
  max-width: 375px;
  box-sizing: border-box;
  border-radius: 22px;
}

.content-flex {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: transparent !important;
}

.p-4 {
  padding: 20px;
}

.mb-4 {
  margin-bottom: 20px;
}

.smart-device-content {
  align-items: center;
  padding: 0;
  overflow: hidden;
}

.smart-device-page {
  position: relative;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  box-sizing: border-box;
  background: #f7f9fc;
  color: #0f172a;
}

.smart-header-tool {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.smart-header-tool img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  opacity: 0.72;
}

.smart-header-tool.active { background: #eff6ff; }
.smart-header-tool.active img { opacity: 1; }
.smart-header-tool:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.24); outline-offset: 2px; }

.smart-offline-band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #fed7aa;
  border-radius: 10px;
  background: #fff7ed;
}

.smart-offline-band strong,
.smart-offline-band span { display: block; }
.smart-offline-band strong { color: #9a3412; font-size: 12px; }
.smart-offline-band span { margin-top: 2px; color: #c2410c; font-size: 10px; }
.smart-offline-band button {
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  background: #ffffff;
  color: #9a3412;
  font-size: 11px;
  font-weight: 700;
}

.smart-home-meter {
  overflow: hidden;
  border: 1px solid #dbe7f5;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(37, 99, 235, 0.08);
}

.smart-home-meter > header {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid #e7eef8;
}

.smart-home-meter > header > strong { color: #1d4ed8; font-size: 13px; }
.smart-ready-state { display: inline-flex; align-items: center; gap: 5px; color: #64748b; font-size: 10px; }
.smart-ready-state i { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; }
.smart-ready-state.online { color: #15803d; }
.smart-ready-state.online i { background: #16a34a; }

.smart-wave-display {
  width: 100%;
  min-height: 128px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 14px;
  border: 0;
  background: #ffffff;
  color: #0f172a;
  cursor: pointer;
}

.smart-wave-display > span { color: #2563eb; font-size: 12px; }
.smart-wave-display > div { min-height: 48px; display: flex; align-items: baseline; justify-content: center; gap: 8px; color: #1d4ed8; font-variant-numeric: tabular-nums; }
.smart-wave-display > div strong { font-size: 37px; line-height: 1; letter-spacing: 0; }
.smart-wave-display > div i { color: #94a3b8; font-size: 24px; font-style: normal; }
.smart-wave-display > div small { color: #2563eb; font-size: 13px; font-weight: 700; }
.smart-wave-display p { margin: 0; color: #64748b; font-size: 11px; }
.smart-wave-display:active:not(:disabled) { background: #f8fbff; }
.smart-wave-display:disabled { cursor: not-allowed; opacity: 0.62; }

.smart-home-meter > footer {
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-top: 1px solid #e7eef8;
  color: #2563eb;
}

.smart-home-meter > footer span { font-size: 12px; }
.smart-home-meter > footer strong { font-size: 13px; }

.smart-parameter-grid,
.smart-spec-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.smart-parameter-grid { gap: 8px; }
.smart-parameter-grid > div {
  min-width: 0;
  min-height: 66px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  box-sizing: border-box;
  border: 1px solid #e3ebf6;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.07);
  text-align: center;
}

.smart-parameter-grid span { color: #2563eb; font-size: 10px; }
.smart-parameter-grid strong { margin-top: 5px; font-size: 11px; font-variant-numeric: tabular-nums; }

.smart-spec-strip {
  overflow: hidden;
  border: 1px solid #d8e2ef;
  border-radius: 10px;
  background: #ffffff;
}

.smart-spec-strip > div { min-width: 0; padding: 9px 5px; border-right: 1px solid #d8e2ef; text-align: center; }
.smart-spec-strip > div:last-child { border-right: 0; }
.smart-spec-strip span,
.smart-spec-strip strong { display: block; }
.smart-spec-strip span { color: #64748b; font-size: 9px; }
.smart-spec-strip strong { margin-top: 4px; overflow: hidden; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }

.smart-home-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.smart-home-tools button {
  position: relative;
  min-width: 0;
  min-height: 64px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  padding: 8px 40px 8px 10px;
  border: 1px solid #d8e2ef;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.smart-home-tools button.active { border-color: #93c5fd; background: #eff6ff; }
.smart-home-tools button:disabled { cursor: not-allowed; opacity: 0.5; }
.smart-home-tools .smart-screenshot-tool { grid-column: 1 / -1; }
.smart-tool-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; background: #eff6ff; }
.smart-tool-icon img { width: 20px; height: 20px; object-fit: contain; }
.smart-home-tools strong,
.smart-home-tools small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.smart-home-tools strong { font-size: 11px; }
.smart-home-tools small { margin-top: 3px; color: #64748b; font-size: 9px; }
.smart-mini-switch { position: absolute; right: 9px; width: 30px; height: 18px; padding: 2px; box-sizing: border-box; border-radius: 9px; background: #cbd5e1; }
.smart-mini-switch b { display: block; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; transition: transform 0.18s ease; }
.smart-mini-switch.active { background: #2563eb; }
.smart-mini-switch.active b { transform: translateX(12px); }
.smart-tool-chevron { position: absolute; right: 12px; color: #64748b; font-size: 20px; font-style: normal; }

.smart-shot-layer { position: absolute; inset: 0; z-index: 90; display: grid; place-items: center; padding: 20px; }
.smart-shot-mask { position: absolute; inset: 0; border: 0; background: rgba(15, 23, 42, 0.56); }
.smart-shot-layer section { position: relative; width: min(100%, 320px); padding: 16px; box-sizing: border-box; border: 1px solid #d8e2ef; border-radius: 12px; background: #fff; box-shadow: 0 20px 48px rgba(15,23,42,.24); }
.smart-shot-layer header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.smart-shot-layer h2 { margin: 0; font-size: 16px; }
.smart-shot-layer header button { min-width: 44px; min-height: 44px; border: 0; border-radius: 8px; background: transparent; color: #2563eb; font-weight: 700; }
.smart-shot-preview { min-height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 10px; background: #0b1423; color: #fff; }
.smart-shot-preview span { color: #67e8f9; font-size: 11px; font-weight: 700; }
.smart-shot-preview strong { margin-top: 16px; font-size: 30px; font-variant-numeric: tabular-nums; }
.smart-shot-preview small { font-size: 12px; }
.smart-shot-preview p { margin: 12px 0 0; color: #94a3b8; font-size: 10px; }
.smart-shot-summary { display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 14px 2px; font-size: 11px; }
.smart-shot-summary span { color: #64748b; }
.smart-shot-summary strong { color: #0f172a; }
.smart-shot-primary { width: 100%; min-height: 46px; border: 0; border-radius: 8px; background: #2563eb; color: #fff; font-weight: 700; }

.smart-capability-section { padding-top: 2px; }
.smart-capability-head { min-height: 28px; display: flex; align-items: center; justify-content: space-between; }
.smart-capability-head h2 { margin: 0; color: #0f172a; font-size: 14px; }
.smart-capability-head span { color: #64748b; font-size: 10px; }
.smart-capability-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
.smart-capability-grid button {
  position: relative;
  min-width: 0;
  min-height: 64px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 14px;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border: 1px solid #d8e2ef;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.smart-capability-grid button > span:first-child { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; background: #eff6ff; }
.smart-capability-grid button img { width: 20px; height: 20px; object-fit: contain; }
.smart-capability-copy { min-width: 0; display: block; }
.smart-capability-grid button strong,
.smart-capability-grid button small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.smart-capability-grid button strong { font-size: 12px; }
.smart-capability-grid button small { margin-top: 4px; color: #64748b; font-size: 10px; }
.smart-capability-grid button > i { color: #64748b; font-size: 17px; font-style: normal; }
.smart-capability-grid button:active { border-color: #93c5fd; background: #eff6ff; }

@media (max-width: 340px) {
  .smart-wave-display > div strong { font-size: 32px; }
  .smart-home-tools,
  .smart-capability-grid { grid-template-columns: 1fr; }
}

.smart-home-utility-section {
  padding: 0 16px;
}

.smart-utility-feedback {
  position: fixed;
  left: 50%;
  bottom: 28px;
  z-index: 90;
  max-width: calc(100vw - 48px);
  transform: translateX(-50%);
  padding: 9px 13px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.94);
  color: #ffffff;
  font-size: 11px;
  text-align: center;
  white-space: nowrap;
}

.smart-home-hero-card,
.smart-home-summary-section,
.smart-home-entry-group,
.smart-home-footer-note {
  border-radius: 12px;
  border: 1px solid #d8e2ef;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.smart-home-hero-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.smart-home-hero-card__top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.smart-home-hero-card__icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #0b1423;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.smart-home-hero-card__icon img {
  width: 54px;
  height: 54px;
  object-fit: contain;
}

.smart-home-hero-card__main {
  flex: 1;
  min-width: 0;
}

.smart-home-hero-card__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.smart-home-hero-card__title {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  color: #0f172a;
}

.smart-home-hero-card__meta {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: #64748b;
  word-break: break-all;
}

.smart-home-hero-card__status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(239, 246, 255, 0.9);
  border: 1px solid rgba(191, 219, 254, 0.9);
}

.smart-device-status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  flex-shrink: 0;
}

.smart-device-status-pill.connected {
  background: #DCFCE7;
  color: #15803D;
}

.smart-device-status-pill.disconnected,
.smart-device-status-pill.inactive {
  background: #FEF3C7;
  color: #B45309;
}

.smart-home-hero-card__status-text {
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
}

.smart-home-hero-card__meta-grid,
.smart-home-summary-grid,
.smart-home-entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.smart-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.smart-section-head .section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.smart-home-meta-item,
.smart-home-summary-item,
.smart-home-entry-item {
  border-radius: 8px;
  border: 1px solid #d8e2ef;
  background: #ffffff;
}

.smart-home-meta-item {
  padding: 12px 14px;
}

.smart-home-meta-item__label,
.smart-home-summary-item__label,
.smart-home-footer-note__label {
  font-size: 12px;
  line-height: 1.4;
  color: #64748b;
}

.smart-home-meta-item__value,
.smart-home-summary-item__value,
.smart-home-footer-note__value {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: #0f172a;
  word-break: break-word;
}

.smart-home-hero-card__actions {
  display: flex;
}

.smart-home-primary-btn {
  width: 100%;
  min-height: 46px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.20);
}

.smart-home-primary-btn:disabled {
  opacity: 0.6;
  box-shadow: none;
}

.smart-home-summary-section,
.smart-home-entry-group,
.smart-home-footer-note {
  padding: 16px;
}

.smart-home-summary-item {
  min-width: 0;
  padding: 14px;
}

.smart-home-activation-block {
  margin: 0 !important;
}

.smart-home-entry-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.smart-home-entry-item {
  min-height: 112px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.smart-home-entry-item:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.28);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.smart-home-entry-item .operation-icon {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #eff6ff !important;
  box-shadow: none;
}

.smart-home-entry-item .icon-img {
  width: 24px;
  height: 24px;
}

.smart-home-entry-item__title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: #0f172a;
}

.smart-home-footer-note {
  padding-bottom: 18px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
  background: #ffffff;
  margin-bottom: 20px;
  border-bottom: 1px solid #E5E7EB;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  color: #2563EB;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 0;
  font-weight: 500;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
}

.header-placeholder {
  width: 60px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 16px 0;
}

/* 设备状态卡片 */
.device-status-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.device-icon {
  width: 56px;
  height: 56px;
  background: #2563EB;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12); /* 添加阴影 */
}

.device-info {
  flex: 1;
}

.device-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.device-name {
  font-size: 20px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 0;
  width: 100%; /* 强制独占一行 */
  margin-bottom: 8px; /* 增加与下方标签的间距 */
}

.device-model {
  font-size: 15px;
  color: #6B7280;
}

.connection-status-badge {
  font-size: 13px;
  padding: 4px 6px; /* 内边距调整为 6px */
  border-radius: 12px;
  font-weight: 500;
}

.connection-status-badge.connected {
  background: #F0F9FF;
  color: #2563EB;
}

.connection-status-badge.disconnected {
  background: #FEE2E2;
  color: #991B1B;
}

.connection-status-badge.inactive {
  background: #F3F4F6;
  color: #6B7280;
}

.activation-badge {
  font-size: 13px;
  padding: 4px 6px; /* 内边距调整为 6px */
  border-radius: 12px;
  font-weight: 500;
}

.activation-badge.activated {
  background: #F0F9FF;
  color: #2563EB;
}

.activation-badge.not_activated {
  background: #FFFBEB;
  color: #D97706;
}

.activation-badge.expired {
  background: #FEE2E2;
  color: #B91C1C;
}

.connection-control {
  text-align: center;
  padding: 20px;
  background: #FFFBEB;
  border: 1px solid #FEF3C7;
  border-radius: 12px;
}

.warning-text {
  font-size: 15px;
  color: #92400E;
  margin-bottom: 16px;
}

.connect-btn {
  background: #2563EB;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 24px;
  height: 48px;
  line-height: 48px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.24);
  transition: all 0.2s ease;
}

.connect-btn:active {
  transform: scale(0.98);
  background: #1D4ED8;
}

.connect-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 基础信息卡片 */
.basic-info-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  text-align: center;
  padding: 12px;
  background: #FFFFFF; /* 子项背景改为纯白 */
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  min-width: 0;
  height: 72px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.info-label {
  font-size: 13px; /* 字体调整为 13px */
  color: #6B7280;
  margin-bottom: 4px;
}

.info-value {
  font-size: 16px; /* 字体调整为 16px */
  font-weight: 700;
  color: #1F2937;
}

/* 激活卡片 */
.activation-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.method-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #FFFFFF;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #E5E7EB;
}

.method-item:active {
  transform: scale(0.98);
  background: #F9FAFB;
}

.method-icon {
  width: 48px;
  height: 48px;
  background: #2563EB;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
}

.method-info {
  flex: 1;
}

.method-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.method-desc {
  font-size: 14px;
  color: #6B7280;
}

.arrow-icon {
  font-size: 20px;
  color: #9CA3AF;
}

/* 密码卡片 */
.password-card {
  background: transparent;
  border-radius: 12px;
  padding: 20px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.password-actions {
  display: flex;
  gap: 16px;
  align-items: center; /* 确保按钮垂直居中对齐 */
}

.action-btn {
  flex: 1;
  border: none;
  border-radius: 6px; /* 圆角调整为 6px */
  font-size: 15px; /* 字体调整为 15px */
  font-weight: 500;
  cursor: pointer;
  padding: 0 16px;
  height: 44px; /* 高度调整为 44px */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: #2563EB;
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.16);
}

.action-btn.secondary {
  background: #F9FAFB;
  color: #1F2937;
  border: 1px solid #E5E7EB;
  gap: 8px;
}

.action-btn:active {
  transform: scale(0.98);
  filter: brightness(0.95);
}

.action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 操作卡片 */
.operations-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.operations-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px; /* 间距调整为 12px */
  row-gap: 16px;
}

.operation-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 118px;
  padding: 12px 10px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.operation-item:active {
  transform: scale(0.98);
}

.operation-item:active .operation-icon {
  transform: none; /* 移除图标单独的缩放，避免重复 */
}

.operation-icon {
  width: 60px; /* 尺寸调整为 60px */
  height: 60px; /* 尺寸调整为 60px */
  border-radius: 8px; /* 圆角调整为 8px */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px; /* 图标字体大小微调 */
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
}

.operation-item-card .operation-title {
  line-height: 1.4;
}

.operation-icon.omp {
  background: #F59E0B;
}

.operation-icon.vfl {
  background: #EF4444;
}

.operation-icon.otdr {
  background: #10B981;
}

.operation-icon.fusion {
  background: #8B5CF6;
}

.operation-icon.maintenance {
  background: #6B7280;
}

.operation-icon.records {
  background: #06B6D4;
}

.operation-icon.system {
  background: #84CC16;
}

.operation-icon.flashlight {
  background: #9CA3AF;
}

.operation-icon.flashlight.is-on {
  background: #F97316;
}

.operation-icon.red-light {
  background: #9CA3AF;
}

.operation-icon.red-light.is-on {
  background: #EF4444;
}

.operation-icon.power-meter {
  background: #2563EB;
}

.operation-icon.power-records {
  background: #8B5CF6;
}

.operation-icon.light-source {
  background: #10B981;
}

.operation-icon.cable-test {
  background: #0EA5E9;
}

.operation-icon.cable-seek {
  background: #F59E0B;
}

.operation-title {
  font-size: 13px;
  font-weight: 500;
  color: #1F2937;
  text-align: center;
}

.result-value {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  text-align: center;
}

.result-box {
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 8px;
  padding: 12px 12px;
}

.result-line {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

/* 弹窗样式 */
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
  padding: 20px;
  box-sizing: border-box;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 320px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
  border: none;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: none;
  background: #FFFFFF;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #9CA3AF;
  font-size: 14px;
  font-weight: 400;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #F3F4F6;
  border-radius: 4px;
  color: #6B7280;
}

.modal-body {
  padding: 20px;
  padding-top: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #E5E7EB; /* 确保边框颜色 */
  border-radius: 8px; /* 确保圆角 */
  font-size: 16px;
  background: #F9FAFB;
  transition: all 0.2s ease;
  box-sizing: border-box;
  color: #1F2937;
}

.form-input:focus {
  outline: none;
  border-color: #2563EB;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-actions {
  margin-top: 24px;
}

.device-alert-modal {
  max-width: 320px;
  padding: 0;
  overflow: hidden;
  border-radius: 12px;
}

.device-alert-body {
  padding: 22px 18px;
  text-align: center;
}

.device-alert-body strong { color: #0F172A; font-size: 17px; }
.device-alert-body p { margin: 10px 0 0; color: #475569; font-size: 13px; line-height: 1.6; }
.device-alert-actions { display: flex; border-top: 1px solid #E5E7EB; }
.device-alert-actions button { flex: 1; min-height: 48px; border: 0; background: #2563EB; color: #FFFFFF; font-weight: 700; }
.device-alert-actions .secondary { border-right: 1px solid #E5E7EB; background: #FFFFFF; color: #475569; }

/* 旧版三类设备沿用 5174 的信息密度与卡片层级。 */
.legacy-device-app {
  background: #F5F7FA;
}

.legacy-device-app .header {
  min-height: 44px;
  height: 44px;
  padding: 0 12px;
  flex-shrink: 0;
}

.legacy-device-app .back-btn {
  min-width: 72px;
  padding: 8px 0;
  text-align: left;
}

.legacy-device-app .header-placeholder {
  width: 72px;
}

.legacy-device-app .content-flex {
  background: #F5F7FA;
}

.legacy-device-app .p-4 {
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
}

.legacy-device-app .device-status-card,
.legacy-device-app .basic-info-card,
.legacy-device-app .password-card,
.legacy-device-app .activation-card,
.legacy-device-app .operations-card {
  width: 100%;
  padding: 16px;
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 16px;
  background: #FFFFFF;
  box-shadow: 0 4px 8px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
}

.legacy-device-app .status-header {
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.legacy-device-app .legacy-device-icon {
  width: 56px;
  height: 56px;
  padding: 5px;
  border-radius: 12px;
  background: #2563EB;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.14);
  box-sizing: border-box;
  overflow: hidden;
}

.legacy-device-app .legacy-device-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  background: #FFFFFF;
}

.legacy-device-app .device-header-row {
  min-height: 26px;
}

.legacy-device-app .device-name {
  text-align: center;
  font-size: 18px;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}

.legacy-device-app .device-model {
  font-size: 12px;
}

.legacy-device-app .connection-control {
  padding: 12px;
  border: 1px dashed #E2E8F0;
  border-radius: 12px;
  background: #F8FAFC;
}

.legacy-device-app .warning-text {
  margin-bottom: 12px;
  color: #4B5563;
  font-size: 13px;
  text-align: center;
}

.legacy-device-app .connect-btn {
  width: 100%;
  height: 44px;
  padding: 0 24px;
  border-radius: 10px;
  font-size: 15px;
}

.legacy-device-app .info-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.legacy-device-app .info-item {
  min-height: 72px;
  border: 0;
  border-radius: 12px;
  background: #F9FAFB;
}

.legacy-device-app .operations-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 12px;
}

.legacy-device-app .operation-item {
  min-height: 84px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.legacy-device-app .operation-icon {
  width: 50px;
  height: 50px;
  border-radius: 16px;
  margin-bottom: 8px;
}

.legacy-device-app .operation-title {
  font-size: 12px;
  color: #4B5563;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .operations-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .password-actions {
    flex-direction: row;
  }

  .smart-home-hero-card__title-row,
  .smart-home-hero-card__status-row {
    align-items: flex-start;
  }
}
</style>
