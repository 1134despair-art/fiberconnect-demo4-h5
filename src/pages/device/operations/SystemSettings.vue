<template>
  <div :class="['app-container', { 'smart-system-app': isSmartOtdr }]">
    <template v-if="isSmartOtdr">
      <div class="content-flex hide-scrollbar smart-settings-content">
        <SmartOtdrPageShell :title="t('settings.systemSettings')" @back="goBack">
          <template #footer>
            <SmartOtdrFunctionNav
              v-if="currentDevice"
              :device-id="currentDevice.id"
              active="settings"
            />
          </template>
          <div class="smart-system-page">
            <DeviceSettingsList
              :sections="smartSettingSections"
              @select="openSmartUnifiedSetting"
            />
          </div>
        </SmartOtdrPageShell>
      </div>
    </template>

    <template v-else>
      <!-- 顶部标题栏 -->
      <header class="header">
        <button @click="goBack" class="back-btn">
          ← {{ t('common.back') }}
        </button>
        <div class="page-title">{{ t('settings.systemSettings') }}</div>
        <div class="header-placeholder"></div>
      </header>
      
      <!-- 主内容区域 -->
      <div class="content-flex hide-scrollbar">
        <div class="p-4">
        <!-- 基础设置 -->
        <div class="settings-card mb-4">
          <h3 class="section-title">{{ t('settings.basicSettings') }}</h3>


          <!-- 屏幕亮度 -->
          <div v-if="!isPortableOtdr && !isMultiOpm" class="setting-item">
            <div class="setting-label">{{ t('settings.screenBrightness') }}</div>
            <div class="setting-control">
              <button @click="adjustBrightness(-1)" class="adjust-btn" :disabled="basicSettings.brightness <= 1">-</button>
              <span class="setting-value">{{ basicSettings.brightness }}</span>
              <button @click="adjustBrightness(1)" class="adjust-btn" :disabled="basicSettings.brightness >= 10">+</button>
            </div>
          </div>
          
          <!-- 触屏提示音 -->
          <div v-if="!isPortableOtdr && !isMultiOpm" class="setting-item">
            <div class="setting-label">{{ t('settings.touchSound') }}</div>
            <div class="setting-control">
              <button @click="toggleTouchSound" class="toggle-btn" :class="{ active: basicSettings.touchSound }">
                {{ basicSettings.touchSound ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>
          
          <!-- 蓝牙 -->
          <div v-if="isMultiOpm" class="setting-item">
            <div class="setting-label">{{ t('settings.bluetooth') }}</div>
            <div class="setting-control">
              <button @click="toggleBluetooth" class="toggle-btn" :class="{ active: basicSettings.bluetooth }">
                {{ basicSettings.bluetooth ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>

          <div v-if="isMultiOpm" class="setting-item">
            <div class="setting-label">{{ t('settings.network') }}</div>
            <div class="setting-control">
              <button @click="toggleNetwork" class="toggle-btn" :class="{ active: basicSettings.network }">
                {{ basicSettings.network ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>

          <div v-if="isMultiOpm" class="setting-item clickable" @click="showNetworkInfoModal = true">
            <div class="setting-label">{{ t('settings.networkInfo') }}</div>
            <div class="setting-control">
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>

          <div v-if="isMultiOpm" class="setting-item clickable" @click="showLanguageModal = true">
            <div class="setting-label">{{ t('settings.language') }}</div>
            <div class="setting-control">
              <span class="version-text">{{ languageLabels[locale] }}</span>
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>

          <div v-if="isPortableOtdr" class="setting-item">
            <div class="setting-label">{{ t('settings.bluetooth') }}</div>
            <div class="setting-control">
              <button @click="toggleBtEnabled" class="toggle-btn" :class="{ active: btState.enabled }">
                {{ btState.enabled ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>

          <div v-if="isPortableOtdr" class="setting-item">
            <div class="setting-label">{{ t('device.otdr.bluetoothName') }}</div>
            <div class="setting-control">
              <span class="version-text">{{ btDeviceName }}</span>
            </div>
          </div>

          <div v-if="isPortableOtdr" class="setting-item">
            <div class="setting-label">{{ t('device.otdr.bluetoothStatus') }}</div>
            <div class="setting-control">
              <span class="version-text">{{ btState.connected ? t('home.connected') : t('home.disconnected') }}</span>
            </div>
          </div>

          <div v-if="isPortableOtdr && isConnected" class="setting-item">
            <div class="setting-label">{{ t('settings.idleDuration') }}</div>
            <div class="setting-control">
              <span class="version-text">{{ idleDaysText }}</span>
            </div>
          </div>

          <div
            v-if="isPortableOtdr"
            class="setting-item clickable"
            :class="{ disabled: !btState.enabled }"
            @click="requestPairOrDisconnect"
          >
            <div class="setting-label">{{ btState.connected ? '断开蓝牙' : '连接蓝牙' }}</div>
            <div class="setting-control">
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>

          <div
            v-if="isPortableOtdr"
            class="setting-item clickable"
            :class="{ disabled: !btState.enabled }"
            @click="requestDeleteBluetooth"
          >
            <div class="setting-label">{{ t('device.otdr.removeBluetooth') }}</div>
            <div class="setting-control">
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>

          <div v-if="!isPortableOtdr && !isMultiOpm" class="setting-item">
            <div class="setting-label">{{ t('settings.bluetooth') }}</div>
            <div class="setting-control">
              <button @click="toggleBluetooth" class="toggle-btn" :class="{ active: basicSettings.bluetooth }">
                {{ basicSettings.bluetooth ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>
          
          <!-- 休眠 -->
          <div v-if="!isPortableOtdr && !isMultiOpm" class="setting-item">
            <div class="setting-label">{{ t('settings.sleep') }}</div>
            <div class="setting-control">
              <button @click="toggleSleep" class="toggle-btn" :class="{ active: basicSettings.sleep }">
                {{ basicSettings.sleep ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>
          
          <!-- 休眠时间 -->
          <div v-if="!isPortableOtdr && !isMultiOpm && basicSettings.sleep" class="setting-item">
            <div class="setting-label">{{ t('settings.sleepTime') }}</div>
            <div class="setting-control">
              <button @click="adjustSleepTime(-1)" class="adjust-btn" :disabled="basicSettings.sleepTime <= 1">-</button>
              <span class="setting-value">{{ basicSettings.sleepTime }}</span>
              <button @click="adjustSleepTime(1)" class="adjust-btn">+</button>
            </div>
          </div>
          
          <!-- 自动关机 -->
          <div v-if="!isPortableOtdr && !isMultiOpm" class="setting-item">
            <div class="setting-label">{{ t('settings.autoShutdown') }}</div>
            <div class="setting-control">
              <button @click="toggleAutoShutdown" class="toggle-btn" :class="{ active: basicSettings.autoShutdown }">
                {{ basicSettings.autoShutdown ? t('common.open') : t('common.close') }}
              </button>
            </div>
          </div>
          
          <!-- 自动关机时间 -->
          <div v-if="!isPortableOtdr && !isMultiOpm && basicSettings.autoShutdown" class="setting-item">
            <div class="setting-label">{{ t('settings.shutdownTime') }}</div>
            <div class="setting-control">
              <button @click="adjustShutdownTime(-1)" class="adjust-btn" :disabled="basicSettings.shutdownTime <= 1">-</button>
              <span class="setting-value">{{ basicSettings.shutdownTime }}</span>
              <button @click="adjustShutdownTime(1)" class="adjust-btn">+</button>
            </div>
          </div>

          <!-- 语言设置 -->
          <div v-if="!isPortableOtdr && !isMultiOpm" class="setting-item clickable" @click="showLanguageModal = true">
            <div class="setting-label">{{ t('settings.language') }}</div>
            <div class="setting-control">
              <span class="version-text">{{ languageLabels[locale] }}</span>
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>

          <!-- 日期时间手动设置 -->
          <div v-if="!isPortableOtdr && !isMultiOpm" class="setting-item">
            <div class="setting-label">{{ t('settings.dateTimeSetting') }}</div>
            <div class="setting-control">
              <input type="date" v-model="basicSettings.dateTime" class="date-input" />
            </div>
          </div>
        </div>

        <!-- 系统设置 -->
        <div v-if="!isPortableOtdr && !isMultiOpm" class="settings-card mb-4">
          <h3 class="section-title">{{ t('settings.systemSettings') }}</h3>
          
          <!-- 系统信息 -->
          <div class="setting-item clickable" @click="showSystemInfo = true">
            <div class="setting-label">{{ t('settings.systemInfo') }}</div>
            <div class="setting-control">
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>
          
          <div class="setting-item clickable" @click="openFirmwareUpgrade">
            <div class="setting-label">{{ t('settings.firmwareUpgrade') }}</div>
            <div class="setting-control">
              <span v-if="hasFirmwareUpdate" class="update-badge">{{ t('settings.newVersion') }}</span>
              <span class="version-text">{{ hasFirmwareUpdate ? latestFirmwareVersion : systemInfo.firmwareVersion }}</span>
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>
          
          <!-- 注册信息 -->
          <div v-if="isFusionSplicer" class="setting-item clickable" @click="showRegistrationInfo = true">
            <div class="setting-label">{{ t('settings.registrationInfo') }}</div>
            <div class="setting-control">
              <span class="status-badge" :class="systemInfo.registrationStatus">
                {{ systemInfo.registrationStatus === 'activated' ? t('settings.activated') : t('settings.notActivated') }}
              </span>
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>
          
          <!-- 设备授权 -->
          <div v-if="isFusionSplicer" class="setting-item clickable" @click="showPasswordInput = true">
            <div class="setting-label">{{ t('settings.deviceAuth') }}</div>
            <div class="setting-control">
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>
          
          <!-- 恢复出厂 -->
          <div class="setting-item clickable" @click="showFactoryReset = true">
            <div class="setting-label">{{ t('settings.factoryReset') }}</div>
            <div class="setting-control">
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>
          
          <!-- 工厂模式 -->
          <div v-if="isFusionSplicer" class="setting-item clickable" @click="showFactoryMode = true">
            <div class="setting-label">{{ t('settings.factoryMode') }}</div>
            <div class="setting-control">
              <span class="iconify arrow-icon" data-icon="mdi:chevron-right"></span>
            </div>
          </div>
        </div>

          <!-- 保存按钮 -->
          <div v-if="showSaveSection" class="save-section">
            <button @click="saveSettings" class="save-btn" :disabled="isSaving">
              {{ isSaving ? t('settings.saving') : t('settings.saveSettings') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 语言设置弹窗 (Action Sheet) -->
    <div v-if="showSmartSystemSettingModal" class="modal-overlay smart-modal-overlay" @click="showSmartSystemSettingModal = false">
      <div class="modal-content smart-mobile-modal smart-setting-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ activeSmartSystemSetting.label }}</h3>
          <button @click="showSmartSystemSettingModal = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="activeSmartSystemSettingKey === 'language'" class="editor-group">
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.language" type="radio" value="zh-CN" />
              简体中文
            </label>
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.language" type="radio" value="en" />
              English
            </label>
          </div>

          <div v-else-if="activeSmartSystemSettingKey === 'backlight'" class="editor-group">
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.backlightMode" type="radio" value="normal" />
              常规
            </label>
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.backlightMode" type="radio" value="strong" />
              强光
            </label>
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.backlightMode" type="radio" value="power-save" />
              省电
            </label>
            <label class="radio-row inline-input">
              <span class="radio-inline-left">
                <input v-model="smartSystemSettingsDraft.backlightMode" type="radio" value="custom" />
                自定义
              </span>
              <span class="radio-inline-right">
                <input
                  v-model="smartSystemSettingsDraft.backlightCustomPercent"
                  class="editor-inline-input"
                  type="text"
                  maxlength="3"
                />
                <span>%</span>
              </span>
            </label>
          </div>

          <div v-else-if="activeSmartSystemSettingKey === 'autoShutdown'" class="editor-group">
            <label v-for="item in autoShutdownOptions" :key="item.value" class="radio-row">
              <input v-model="smartSystemSettingsDraft.autoShutdownMode" type="radio" :value="item.value" />
              {{ item.label }}
            </label>
          </div>

          <div v-else-if="activeSmartSystemSettingKey === 'beeper'" class="editor-group">
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.beeperMode" type="radio" value="on" />
              开启
            </label>
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.beeperMode" type="radio" value="off" />
              关闭
            </label>
          </div>

          <div v-else-if="activeSmartSystemSettingKey === 'usb'" class="editor-group">
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.usbMode" type="radio" value="pc" />
              连接电脑
            </label>
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.usbMode" type="radio" value="disk" />
              U盘
            </label>
          </div>

          <div v-else-if="activeSmartSystemSettingKey === 'date'" class="editor-group">
            <div class="picker-grid">
              <div class="picker-column">
                <button
                  v-for="year in smartDateYearOptions"
                  :key="year"
                  class="picker-option"
                  :class="{ active: smartSystemSettingsDraft.dateYear === year }"
                  type="button"
                  @click="smartSystemSettingsDraft.dateYear = year"
                >
                  {{ year }}
                </button>
              </div>
              <div class="picker-column">
                <button
                  v-for="month in smartDateMonthOptions"
                  :key="month"
                  class="picker-option"
                  :class="{ active: smartSystemSettingsDraft.dateMonth === month }"
                  type="button"
                  @click="smartSystemSettingsDraft.dateMonth = month"
                >
                  {{ month }}
                </button>
              </div>
              <div class="picker-column">
                <button
                  v-for="day in smartDateDayOptions"
                  :key="day"
                  class="picker-option"
                  :class="{ active: smartSystemSettingsDraft.dateDay === day }"
                  type="button"
                  @click="smartSystemSettingsDraft.dateDay = day"
                >
                  {{ day }}
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="activeSmartSystemSettingKey === 'time'" class="editor-group">
            <div class="picker-grid time-grid">
              <div class="picker-column">
                <button
                  v-for="hour in smartTimeHourOptions"
                  :key="hour"
                  class="picker-option"
                  :class="{ active: smartSystemSettingsDraft.timeHour === hour }"
                  type="button"
                  @click="smartSystemSettingsDraft.timeHour = hour"
                >
                  {{ hour }}
                </button>
              </div>
              <div class="picker-column">
                <button
                  v-for="minute in smartTimeMinuteOptions"
                  :key="minute"
                  class="picker-option"
                  :class="{ active: smartSystemSettingsDraft.timeMinute === minute }"
                  type="button"
                  @click="smartSystemSettingsDraft.timeMinute = minute"
                >
                  {{ minute }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div v-if="showSmartConnectionModal" class="modal-overlay smart-modal-overlay" @click="showSmartConnectionModal = false">
      <div class="modal-content smart-mobile-modal smart-setting-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">连接</h3>
          <button @click="showSmartConnectionModal = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="editor-group">
            <div class="subview-title">蓝牙</div>
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.bluetoothEnabled" :value="true" type="radio" />
              开启
            </label>
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.bluetoothEnabled" :value="false" type="radio" />
              关闭
            </label>
          </div>

          <div class="editor-group smart-connection-group">
            <div class="subview-title">4G</div>
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.network4gEnabled" :value="true" type="radio" />
              开启
            </label>
            <label class="radio-row">
              <input v-model="smartSystemSettingsDraft.network4gEnabled" :value="false" type="radio" />
              关闭
            </label>
            <button
              class="smart-remote-entry"
              type="button"
              :disabled="!smartSystemSettingsDraft.network4gEnabled"
              @click="openSmartRemoteCenter"
            >
              <span><strong>远程管理</strong><small>查看状态、参数和设备文件</small></span>
              <b>进入</b>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSmartRemoteCenter" class="modal-overlay smart-modal-overlay" @click="showSmartRemoteCenter = false">
      <div class="modal-content smart-mobile-modal smart-remote-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">4G远程管理</h3>
          <button class="modal-close" type="button" @click="showSmartRemoteCenter = false">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="smart-remote-status" :class="{ online: smartRemoteOnline }">
            <span><i></i><strong>{{ smartRemoteOnline ? '远程会话已连接' : '等待建立远程会话' }}</strong></span>
            <small>演示数据通过4G通道同步，不影响本机蓝牙连接</small>
          </div>

          <div class="smart-remote-tabs" role="tablist" aria-label="远程管理内容">
            <button v-for="tab in smartRemoteTabs" :key="tab.key" type="button" :class="{ active: activeSmartRemoteTab === tab.key }" @click="activeSmartRemoteTab = tab.key">{{ tab.label }}</button>
          </div>

          <div v-if="activeSmartRemoteTab === 'status'" class="smart-remote-list">
            <div><span>设备状态</span><strong>在线</strong></div>
            <div><span>当前任务</span><strong>待机</strong></div>
            <div><span>电量</span><strong>86%</strong></div>
            <div><span>内置SIM</span><strong>已识别</strong></div>
            <div><span>运营商</span><strong>物联网专网</strong></div>
            <div><span>ICCID</span><strong>89860••••1024</strong></div>
            <div><span>信号</span><strong>强 · 4G</strong></div>
            <div><span>最近同步</span><strong>刚刚</strong></div>
          </div>
          <div v-else-if="activeSmartRemoteTab === 'parameters'" class="smart-remote-parameter-form">
            <label><span>波长</span><select v-model="smartRemoteParameterDraft.wavelength"><option>1310nm</option><option>1550nm</option><option>1310+1550</option></select></label>
            <label><span>量程</span><select v-model="smartRemoteParameterDraft.range"><option>10km</option><option>20km</option><option>40km</option><option>100km</option><option>200km</option></select></label>
            <label><span>脉宽</span><select v-model="smartRemoteParameterDraft.pulse"><option>5ns</option><option>10ns</option><option>100ns</option><option>1us</option></select></label>
            <label><span>测量时间</span><select v-model="smartRemoteParameterDraft.time"><option>10s</option><option>15s</option><option>30s</option></select></label>
            <button type="button" @click="saveSmartRemoteParameters">下发参数（演示）</button>
          </div>
          <div v-else class="smart-remote-files">
            <button v-for="file in smartRemoteFiles" :key="file.name" type="button" @click="showSmartToast(`已选择 ${file.name}`)">
              <span><strong>{{ file.name }}</strong><small>{{ file.time }}</small></span><b>{{ file.size }}</b>
            </button>
          </div>

          <button class="smart-remote-primary" type="button" @click="toggleSmartRemoteSession">
            {{ smartRemoteOnline ? '结束远程会话' : '建立远程会话' }}
          </button>
          <p class="smart-remote-note">当前为前端交互演示，接入4G协议后由真实设备状态替换。</p>
        </div>
      </div>
    </div>

    <div v-if="showLanguageModal" class="action-sheet-overlay" @click="showLanguageModal = false">
      <div class="action-sheet-content" @click.stop>
        <div class="action-sheet-header">
          <div class="action-sheet-title">{{ t('settings.selectLanguage') }}</div>
          <button @click="showLanguageModal = false" class="action-sheet-close">
            <span class="iconify" data-icon="mdi:close" style="font-size: 20px;"></span>
          </button>
        </div>
        <div class="language-list">
          <div 
            v-for="(label, key) in languageLabels" 
            :key="key"
            class="language-item"
            :class="{ active: locale === key }"
            @click="selectLanguage(key)"
          >
            <span class="language-name">{{ label }}</span>
            <span v-if="locale === key" class="iconify check-icon" data-icon="mdi:check"></span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="btModal.visible" class="modal-overlay" @click="closeBtModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ btModal.title }}</h3>
          <button class="modal-close" @click="closeBtModal">
            <span class="iconify" data-icon="mdi:close" style="font-size: 20px;"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="modal-text">{{ btModal.message }}</div>
        </div>
        <div class="firmware-actions">
          <button class="fw-btn primary" @click="confirmBtModal">{{ btModal.primaryText }}</button>
          <button class="fw-btn secondary" @click="closeBtModal">{{ btModal.secondaryText }}</button>
        </div>
      </div>
    </div>

    <div v-if="showNetworkInfoModal" class="modal-overlay" @click="showNetworkInfoModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('settings.networkInfo') }}</h3>
          <button class="modal-close" @click="showNetworkInfoModal = false">
            <span class="iconify" data-icon="mdi:close" style="font-size: 20px;"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="network-info-list">
            <div class="network-info-row">
              <div class="network-info-label">{{ t('settings.ipAddress') }}</div>
              <div class="network-info-value">{{ networkInfo.ip }}</div>
            </div>
            <div class="network-info-row">
              <div class="network-info-label">{{ t('settings.port') }}</div>
              <div class="network-info-value">{{ networkInfo.port }}</div>
            </div>
          </div>
        </div>
        <div class="firmware-actions">
          <button class="fw-btn primary" @click="showNetworkInfoModal = false">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>

    <!-- 系统信息弹窗 -->
    <div v-if="showSystemInfo" class="modal-overlay" :class="{ 'smart-modal-overlay': isSmartOtdr }" @click="showSystemInfo = false">
      <div class="modal-content" :class="isSmartOtdr ? ['smart-mobile-modal', 'smart-large-modal'] : []" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('settings.systemInfo') }}</h3>
          <button @click="showSystemInfo = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <template v-if="isSmartOtdr">
            <div class="smart-modal-tabs">
              <button
                v-for="tab in smartSystemInfoTabs"
                :key="tab.key"
                class="smart-modal-tab"
                :class="{ active: activeSystemInfoTab === tab.key }"
                type="button"
                @click="activeSystemInfoTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="smart-modal-panel">
              <template v-if="activeSystemInfoTab === 'device'">
                <div class="info-row"><span class="info-label-text">设备名称</span><span class="info-value-text">{{ smartSystemInfoState.deviceName }}</span></div>
                <div class="info-row"><span class="info-label-text">设备编号</span><span class="info-value-text">{{ smartSystemInfoState.deviceSerial }}</span></div>
                <div class="info-row"><span class="info-label-text">型号</span><span class="info-value-text">{{ smartSystemInfoState.model }}</span></div>
                <div class="info-row"><span class="info-label-text">产地</span><span class="info-value-text">{{ smartSystemInfoState.origin }}</span></div>
                <div class="info-row"><span class="info-label-text">生产时间</span><span class="info-value-text">{{ smartSystemInfoState.productionDate }}</span></div>
                <div class="info-row"><span class="info-label-text">厂家信息</span><span class="info-value-text">{{ smartSystemInfoState.vendor }}</span></div>
              </template>

              <template v-else-if="activeSystemInfoTab === 'version'">
                <div class="info-row"><span class="info-label-text">软件版本</span><span class="info-value-text">{{ smartSystemInfoState.softwareVersion }}</span></div>
                <div class="info-row"><span class="info-label-text">硬件版本</span><span class="info-value-text">{{ smartSystemInfoState.hardwareVersion }}</span></div>
              </template>

              <template v-else>
                <div class="info-row"><span class="info-label-text">设备序列号</span><span class="info-value-text">{{ smartSystemInfoState.activationSerial }}</span></div>
                <div class="info-row"><span class="info-label-text">激活状态</span><span class="info-value-text">{{ smartSystemInfoState.activationStatus }}</span></div>
                <div class="info-row"><span class="info-label-text">激活时间</span><span class="info-value-text">{{ smartSystemInfoState.activationTime }}</span></div>
                <div class="info-row"><span class="info-label-text">授权时长</span><span class="info-value-text">{{ smartSystemInfoState.authorizedDuration }}</span></div>
                <div class="info-row"><span class="info-label-text">剩余授权时间</span><span class="info-value-text">{{ smartSystemInfoState.remainingDuration }}</span></div>
              </template>
            </div>
          </template>

          <div v-else class="info-list">
            <div v-if="isFusionSplicer" class="info-item">
              <span class="info-label">{{ t('settings.dischargeCount') }}</span>
              <span class="info-value">{{ systemInfo.dischargeCount }}次</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t('settings.deviceModel') }}</span>
              <span class="info-value">{{ systemInfo.deviceModel }}</span>
            </div>
            <div v-if="!isFusionSplicer" class="info-item">
              <span class="info-label">{{ t('settings.serialNumber') }}</span>
              <span class="info-value">{{ systemInfo.serialNumber }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t('settings.origin') }}</span>
              <span class="info-value">{{ systemInfo.origin }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t('settings.productionDate') }}</span>
              <span class="info-value">{{ systemInfo.productionDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t('settings.manufacturer') }}</span>
              <span class="info-value">{{ systemInfo.manufacturer }}</span>
            </div>
            <div v-if="!isFusionSplicer" class="info-item">
              <span class="info-label">{{ t('settings.firmwareVersion') }}</span>
              <span class="info-value">{{ systemInfo.firmwareVersion }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showFirmwareUpgrade" class="modal-overlay" :class="{ 'smart-modal-overlay': isSmartOtdr }" @click="handleFirmwareOverlayClick">
      <div class="modal-content" :class="isSmartOtdr ? ['smart-mobile-modal', 'smart-confirm-modal'] : []" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('settings.firmwareUpgrade') }}</h3>
          <button @click="closeFirmwareUpgrade" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div v-if="isSmartOtdr" class="modal-body smart-confirm-body">
          <template v-if="smartUpgradeStage === 'confirm'">
            <div class="smart-confirm-title">系统升级</div>
            <div class="smart-confirm-desc">选择传输方式。升级期间请保持电量充足，不要关闭蓝牙或4G。</div>
            <div class="smart-upgrade-methods">
              <label :class="{ active: smartUpgradeTransport === 'bluetooth' }"><input v-model="smartUpgradeTransport" value="bluetooth" type="radio" />蓝牙升级<small>近场传输</small></label>
              <label :class="{ active: smartUpgradeTransport === '4g' }"><input v-model="smartUpgradeTransport" value="4g" type="radio" />4G远程升级<small>需SIM在线</small></label>
            </div>
            <div class="smart-confirm-actions">
              <button class="fw-btn primary" @click="confirmSmartFirmwareUpgrade">开始升级</button>
              <button class="fw-btn secondary" @click="closeFirmwareUpgrade">取消</button>
            </div>
          </template>
          <template v-else>
            <div class="smart-confirm-title">{{ smartUpgradeStage === 'complete' ? '升级完成' : '正在传输升级包' }}</div>
            <div class="smart-confirm-desc">{{ smartUpgradeTransport === 'bluetooth' ? '蓝牙' : '4G远程' }}通道 · {{ transferProgress }}%</div>
            <div class="smart-upgrade-progress" role="progressbar" :aria-valuenow="transferProgress" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: `${transferProgress}%` }"></i></div>
            <div class="smart-confirm-actions">
              <button v-if="smartUpgradeStage === 'complete'" class="fw-btn primary" @click="closeFirmwareUpgrade">完成</button>
              <button v-else class="fw-btn secondary" @click="cancelSmartFirmwareUpgrade">中断升级</button>
            </div>
          </template>
        </div>
        <div v-else class="modal-body">
          <div class="firmware-panel">
            <div v-if="isCheckingFirmware" class="firmware-loading">
              <span class="iconify loading-icon" data-icon="mdi:loading"></span>
              <span class="loading-text">{{ t('settings.checkingUpdate') }}</span>
            </div>

            <div v-else class="firmware-info">
              <div class="version-row">
                <span class="version-label">{{ t('settings.currentVersion') }}</span>
                <span class="version-value">{{ systemInfo.firmwareVersion }}</span>
              </div>
              <div class="version-row">
                <span class="version-label">{{ t('settings.latestVersion') }}</span>
                <span class="version-value">{{ latestFirmwareVersion }}</span>
              </div>

              <div class="firmware-status" :class="{ available: hasFirmwareUpdate }">
                {{ hasFirmwareUpdate ? t('settings.updateAvailable') : t('settings.noUpdateAvailable') }}
              </div>

              <div v-if="hasFirmwareUpdate" class="firmware-steps">
                <div class="step-item" :class="getStepClass('start')">
                  <span class="step-index">1</span>
                  <span class="step-text">{{ t('settings.startFirmwareUpgrade') }}</span>
                </div>
                <div class="step-item" :class="getStepClass('transfer')">
                  <span class="step-index">2</span>
                  <span class="step-text">{{ t('settings.transferFirmwareData') }}</span>
                </div>
                <div class="step-item" :class="getStepClass('complete')">
                  <span class="step-index">3</span>
                  <span class="step-text">{{ t('settings.firmwareTransferComplete') }}</span>
                </div>

                <div v-if="firmwareStage === 'transferring'" class="transfer-progress">
                  <div class="progress-bar">
                    <div class="progress-inner" :style="{ width: `${transferProgress}%` }"></div>
                  </div>
                  <div class="progress-text">{{ transferProgress }}%</div>
                </div>
              </div>

              <div class="firmware-actions">
                <button
                  v-if="!hasFirmwareUpdate"
                  class="fw-btn secondary"
                  @click="closeFirmwareUpgrade"
                >
                  {{ t('common.close') }}
                </button>

                <button
                  v-else-if="firmwareStage === 'idle'"
                  class="fw-btn primary"
                  @click="startFirmwareUpgrade"
                >
                  {{ t('settings.startFirmwareUpgrade') }}
                </button>

                <button
                  v-else-if="firmwareStage === 'started'"
                  class="fw-btn primary"
                  @click="startFirmwareTransfer"
                >
                  {{ t('settings.transferFirmwareData') }}
                </button>

                <button
                  v-else-if="firmwareStage === 'transferring'"
                  class="fw-btn primary"
                  disabled
                >
                  {{ t('settings.transferring') }}
                </button>

                <button
                  v-else
                  class="fw-btn primary"
                  @click="finishFirmwareUpgrade"
                >
                  {{ t('settings.firmwareTransferComplete') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 注册信息弹窗 -->
    <div v-if="showRegistrationInfo" class="modal-overlay" @click="showRegistrationInfo = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('settings.registrationInfo') }}</h3>
          <button @click="showRegistrationInfo = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">{{ t('settings.serialNumber') }}</span>
              <span class="info-value">{{ systemInfo.serialNumber }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t('settings.registrationStatus') }}</span>
              <span class="info-value status" :class="systemInfo.registrationStatus">
                {{ systemInfo.registrationStatus === 'activated' ? t('settings.activated') : t('settings.notActivated') }}
              </span>
            </div>
            <div v-if="systemInfo.registrationTime" class="info-item">
              <span class="info-label">{{ t('settings.registrationTime') }}</span>
              <span class="info-value">{{ systemInfo.registrationTime }}</span>
            </div>
          </div>
          
          <div v-if="systemInfo.registrationStatus === 'not_activated'" class="registration-form">
            <h4 class="form-title">{{ t('settings.deviceActivation') }}</h4>
            <div class="form-group">
              <label class="form-label">{{ t('settings.adminPassword') }}</label>
              <input v-model="registrationForm.adminPassword" type="password" :placeholder="t('settings.inputBootPassword')" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('settings.activationCode') }}</label>
              <input v-model="registrationForm.activationCode" type="text" :placeholder="t('settings.activationCode')" class="form-input" />
            </div>
            <button @click="activateDevice" class="activate-btn" :disabled="!registrationForm.adminPassword || !registrationForm.activationCode || isActivating">
              {{ isActivating ? t('settings.activating') : t('settings.activateDevice') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 开机密码输入弹窗 -->
    <div v-if="showPasswordInput" class="modal-overlay" @click="showPasswordInput = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('settings.deviceAuth') }}</h3>
          <button @click="showPasswordInput = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="password-input-section">
            <div class="input-info">
              <p>{{ t('settings.enterBootPassword') }}</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ t('settings.bootPassword') }}</label>
              <input 
                v-model="authPasswordInput" 
                type="password" 
                :placeholder="t('settings.inputBootPassword')" 
                class="form-input"
                @keyup.enter="verifyAuthPassword"
              />
            </div>
            
            <div class="form-actions">
              <button @click="verifyAuthPassword" class="verify-btn" :disabled="!authPasswordInput || isVerifyingPassword">
                {{ isVerifyingPassword ? t('settings.verifying') : t('common.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设备授权设置弹窗 -->
    <div v-if="showDeviceAuth" class="modal-overlay" @click="showDeviceAuth = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('settings.deviceAuthSettings') }}</h3>
          <button @click="showDeviceAuth = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <!-- 开机密码管理 -->
          <div class="auth-section">
            <h4 class="section-subtitle">{{ t('settings.bootPasswordManagement') }}</h4>
            <div class="setting-item no-border">
              <div class="setting-label">{{ t('settings.bootPassword') }}</div>
              <div class="setting-control">
                <button @click="toggleBootPassword" class="toggle-btn" :class="{ active: authSettings.bootPasswordEnabled }">
                  {{ authSettings.bootPasswordEnabled ? t('common.open') : t('common.close') }}
                </button>
              </div>
            </div>
            
            <div v-if="authSettings.bootPasswordEnabled" class="password-change-section">
              <button @click="showPasswordChangeModal = true" class="change-password-link">
                {{ t('settings.changeBootPassword') }}
              </button>
            </div>
          </div>
          
          <!-- 授权时间设置 -->
          <div class="auth-section">
            <h4 class="section-subtitle">{{ t('settings.authTimeSettings') }}</h4>
            <div class="auth-time-container">
              <div class="time-control-group">
                <button @click="adjustAuthTime(-1)" class="adjust-btn" :disabled="authSettings.authTime <= 1">-</button>
                <span class="setting-value">{{ authSettings.authTime }}</span>
                <button @click="adjustAuthTime(1)" class="adjust-btn">+</button>
              </div>
              <select v-model="authSettings.authTimeUnit" class="time-unit-select">
                <option value="hours">{{ t('common.hours') }}</option>
                <option value="days">{{ t('common.days') }}</option>
              </select>
            </div>
          </div>
          
          <!-- 保存按钮 -->
          <div class="auth-actions">
            <button @click="saveAuthSettings" class="save-auth-btn" :disabled="isSavingAuth">
              {{ isSavingAuth ? t('settings.saving') : t('settings.saveAuthSettings') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 更改密码弹窗 -->
    <div v-if="showPasswordChangeModal" class="modal-overlay" @click="showPasswordChangeModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('settings.changeBootPassword') }}</h3>
          <button @click="showPasswordChangeModal = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="password-form">
            <div class="form-group">
              <label class="form-label">{{ t('settings.currentPassword') }}</label>
              <input v-model="passwordForm.currentPassword" type="password" :placeholder="t('settings.inputCurrentPassword')" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('settings.newPassword') }}</label>
              <input v-model="passwordForm.newPassword" type="password" :placeholder="t('settings.inputNewPassword')" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('settings.confirmPassword') }}</label>
              <input v-model="passwordForm.confirmPassword" type="password" :placeholder="t('settings.inputConfirmPassword')" class="form-input" />
            </div>
            <button @click="changeBootPassword" class="change-password-btn" :disabled="!isPasswordFormValid || isChangingPassword">
              {{ isChangingPassword ? t('settings.changing') : t('settings.changePassword') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 恢复出厂弹窗 -->
    <div v-if="showFactoryReset" class="modal-overlay" :class="{ 'smart-modal-overlay': isSmartOtdr }" @click="showFactoryReset = false">
      <div class="modal-content" :class="isSmartOtdr ? ['smart-mobile-modal', 'smart-confirm-modal'] : []" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('settings.factoryReset') }}</h3>
          <button @click="showFactoryReset = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div v-if="isSmartOtdr" class="modal-body smart-confirm-body">
          <div class="smart-confirm-title">确定要恢复出厂设置？</div>
          <div class="smart-confirm-desc">恢复后将重置当前系统设置，已保存的本地配置会回到默认值。</div>
          <div class="smart-confirm-actions">
            <button class="fw-btn danger" @click="confirmSmartFactoryReset">确认</button>
            <button class="fw-btn secondary" @click="showFactoryReset = false">取消</button>
          </div>
        </div>
        <div v-else class="modal-body">
          <div class="warning-section">
            <div class="warning-icon">
              <span class="iconify" data-icon="mdi:alert-circle"></span>
            </div>
            <div class="warning-text">
              <p>{{ t('settings.factoryResetWarning') }}</p>
              <ul>
                <li>{{ t('settings.resetWarning1') }}</li>
                <li>{{ t('settings.resetWarning2') }}</li>
                <li>{{ t('settings.resetWarning3') }}</li>
                <li>{{ t('settings.resetWarning4') }}</li>
              </ul>
              <p class="warning-note">{{ t('settings.irreversibleAction') }}</p>
            </div>
          </div>
          
          <div class="factory-reset-form">
            <div class="form-group">
              <label class="form-label">{{ t('settings.adminPassword') }}</label>
              <input v-model="factoryResetForm.adminPassword" type="password" :placeholder="t('settings.inputAdminPasswordConfirm')" class="form-input" />
            </div>
            <button @click="performFactoryReset" class="factory-reset-btn" :disabled="!factoryResetForm.adminPassword || isResetting">
              {{ isResetting ? t('settings.resetting') : t('settings.confirmFactoryReset') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 工厂模式弹窗 -->
    <div v-if="showSmartFactoryPasswordModal" class="modal-overlay smart-modal-overlay" @click="closeSmartFactoryPasswordModal">
      <div class="modal-content smart-mobile-modal smart-setting-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">工厂模式</h3>
          <button @click="closeSmartFactoryPasswordModal" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">管理员密码</label>
            <input
              v-model="smartFactoryPassword"
              type="password"
              inputmode="numeric"
              autocomplete="off"
              placeholder="请输入管理员密码"
              class="form-input"
              @keyup.enter="verifySmartFactoryPassword"
            />
          </div>
        </div>
        <div class="firmware-actions">
          <button class="fw-btn primary" :disabled="!smartFactoryPassword.trim() || isVerifyingSmartFactoryPassword" @click="verifySmartFactoryPassword">
            {{ isVerifyingSmartFactoryPassword ? '验证中' : '确认' }}
          </button>
          <button class="fw-btn secondary" @click="closeSmartFactoryPasswordModal">取消</button>
        </div>
      </div>
    </div>

    <div v-if="showFactoryMode" class="modal-overlay" :class="{ 'smart-modal-overlay': isSmartOtdr }" @click="showFactoryMode = false">
      <div class="modal-content factory-mode-modal" :class="isSmartOtdr ? ['smart-mobile-modal', 'smart-large-modal', 'smart-factory-modal'] : []" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('settings.factoryMode') }}</h3>
          <button @click="showFactoryMode = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div v-if="isSmartOtdr" class="modal-body">
          <div class="smart-factory-grid">
            <button class="smart-factory-card" type="button" @click="openSmartDeviceAuthModal">
              <div class="smart-factory-icon"></div>
              <div class="smart-factory-label">设备授权</div>
            </button>
            <button class="smart-factory-card" type="button" @click="openSmartUiUpdateModal">
              <div class="smart-factory-icon"></div>
              <div class="smart-factory-label">UI更新</div>
            </button>
          </div>
          <div class="smart-factory-actions">
            <button class="fw-btn secondary smart-factory-exit" @click="showFactoryMode = false">退出</button>
          </div>
        </div>
        <div v-else class="modal-body">
          <div v-if="!factoryModeUnlocked" class="factory-auth">
            <div class="form-group">
              <label class="form-label">{{ t('settings.adminPassword') }}</label>
              <input v-model="factoryModeForm.adminPassword" type="password" :placeholder="t('settings.inputBootPassword')" class="form-input" />
            </div>
            <button @click="unlockFactoryMode" class="unlock-btn" :disabled="!factoryModeForm.adminPassword || isUnlocking">
              {{ isUnlocking ? t('settings.unlocking') : t('settings.enterFactoryMode') }}
            </button>
          </div>
          
          <div v-else class="factory-operations">
            <div class="factory-tabs-container">
              <button 
                v-for="tab in factoryTabs" 
                :key="tab.key"
                @click="activeFactoryTab = tab.key"
                class="factory-tab-item"
                :class="{ active: activeFactoryTab === tab.key }"
              >
                {{ tab.label }}
              </button>
            </div>
            
            <!-- 中线校准 -->
            <div v-if="activeFactoryTab === 'centerline'" class="factory-content-area">
              <h4 class="content-subtitle">{{ t('settings.centerlineCalibration') }}</h4>
              <div class="calibration-container">
                <div class="axis-row">
                  <span class="axis-label">{{ t('settings.xAxis') }}</span>
                  <div class="axis-control-group">
                    <button @click="adjustAxis('x', -1)" class="control-btn minus">-</button>
                    <div class="value-display">{{ factorySettings.centerline.x }}</div>
                    <button @click="adjustAxis('x', 1)" class="control-btn plus">+</button>
                  </div>
                </div>
                <div class="axis-row">
                  <span class="axis-label">{{ t('settings.yAxis') }}</span>
                  <div class="axis-control-group">
                    <button @click="adjustAxis('y', -1)" class="control-btn minus">-</button>
                    <div class="value-display">{{ factorySettings.centerline.y }}</div>
                    <button @click="adjustAxis('y', 1)" class="control-btn plus">+</button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 区域捕捉 -->
            <div v-if="activeFactoryTab === 'region'" class="factory-content-area">
              <h4 class="content-subtitle">{{ t('settings.regionCapture') }}</h4>
              <div class="grid-controls">
                <div class="grid-row">
                  <button @click="adjustRegion('x', 1)" class="grid-btn">X↑</button>
                  <button @click="adjustRegion('x', -1)" class="grid-btn">X↓</button>
                  <button @click="adjustRegion('z', -1)" class="grid-btn">Z左</button>
                </div>
                <div class="grid-row">
                  <button @click="adjustRegion('z', 1)" class="grid-btn">Z右</button>
                  <button @click="adjustRegion('y', 1)" class="grid-btn">Y↑</button>
                  <button @click="adjustRegion('y', -1)" class="grid-btn">Y↓</button>
                </div>
              </div>
            </div>
            
            <!-- 背光校正 -->
            <div v-if="activeFactoryTab === 'backlight'" class="factory-content-area">
              <h4 class="content-subtitle">{{ t('settings.backlightCorrection') }}</h4>
              <div class="grid-controls">
                 <div class="grid-row">
                  <button @click="adjustBacklight('x', 1)" class="grid-btn">X↑</button>
                  <button @click="adjustBacklight('x', -1)" class="grid-btn">X↓</button>
                  <button @click="adjustBacklight('z', -1)" class="grid-btn">Z左</button>
                </div>
                <div class="grid-row">
                  <button @click="adjustBacklight('z', 1)" class="grid-btn">Z右</button>
                  <button @click="adjustBacklight('y', 1)" class="grid-btn">Y↑</button>
                  <button @click="adjustBacklight('y', -1)" class="grid-btn">Y↓</button>
                </div>
              </div>
            </div>

            <!-- 底部按钮组 -->
            <div class="factory-footer">
              <button @click="handleAutoAction" class="footer-btn">
                {{ activeFactoryTab === 'centerline' ? t('settings.autoCalibrate') : (activeFactoryTab === 'region' ? t('settings.autoCapture') : t('settings.autoCorrect')) }}
              </button>
              <button @click="handleSaveAction" class="footer-btn">{{ t('common.save') }}</button>
              <button @click="exitFactoryMode" class="footer-btn secondary">{{ t('common.exit') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="smartToastMessage" class="smart-toast">{{ smartToastMessage }}</div>

    <div v-if="showSmartDeviceAuthModal" class="modal-overlay smart-modal-overlay" @click="showSmartDeviceAuthModal = false">
      <div class="modal-content smart-mobile-modal smart-large-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">设备授权</h3>
          <button @click="showSmartDeviceAuthModal = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="smart-auth-duration">
            <div class="smart-auth-label">设备授权时长设置</div>
            <div class="smart-auth-inputs">
              <input v-model="smartDeviceAuthDraft.years" class="form-input smart-auth-input" type="text" />
              <span class="smart-auth-unit">年</span>
              <input v-model="smartDeviceAuthDraft.months" class="form-input smart-auth-input" type="text" />
              <span class="smart-auth-unit">月</span>
              <input v-model="smartDeviceAuthDraft.days" class="form-input smart-auth-input" type="text" />
              <span class="smart-auth-unit">日</span>
            </div>
          </div>

          <div class="smart-modal-panel">
            <div class="info-row"><span class="info-label-text">激活状态</span><span class="info-value-text">{{ smartSystemInfoState.activationStatus }}</span></div>
            <div class="info-row"><span class="info-label-text">激活时间</span><span class="info-value-text">{{ smartSystemInfoState.activationTime }}</span></div>
            <div class="info-row"><span class="info-label-text">授权时长</span><span class="info-value-text">{{ smartSystemInfoState.authorizedDuration }}</span></div>
            <div class="info-row"><span class="info-label-text">剩余授权时间</span><span class="info-value-text">{{ smartSystemInfoState.remainingDuration }}</span></div>
          </div>
        </div>
        <div class="firmware-actions">
          <button class="fw-btn primary" @click="saveSmartDeviceAuth">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showSmartUiUpdateModal" class="modal-overlay smart-modal-overlay" @click="showSmartUiUpdateModal = false">
      <div class="modal-content smart-mobile-modal smart-large-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">UI更新</h3>
          <button @click="showSmartUiUpdateModal = false" class="modal-close">
            <span class="iconify" data-icon="mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="smart-ui-update-title">请插入SD卡导入文件</div>
          <label class="smart-ui-file-picker">
            <input type="file" accept=".enc" @change="handleSmartUiFileSelect" />
            <span>{{ smartUiUpdateFileName || '选择加密资源包（.enc）' }}</span>
          </label>
          <label class="checkbox-row">
            <input v-model="smartUiUpdateDraft.uiIcons" type="checkbox" />
            UI图标
          </label>
          <label class="checkbox-row">
            <input v-model="smartUiUpdateDraft.startupScreen" type="checkbox" />
            开机界面
          </label>
        </div>
        <div class="firmware-actions">
          <button class="fw-btn primary" :disabled="!smartUiUpdateFileName" @click="importSmartUiAssets">校验并导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth, type Device } from '@/composables/useAuth'
import { useSmartOtdrConnectionState } from '@/composables/useSmartOtdrConnectionState'
import SmartOtdrPageShell from '../components/SmartOtdrPageShell.vue'
import SmartOtdrFunctionNav from '../components/SmartOtdrFunctionNav.vue'
import DeviceSettingsList, { type DeviceSettingSection } from '../components/DeviceSettingsList.vue'
import languageIcon from '@/assets/app/icons/profile/language.png'
import backlightIcon from '@/assets/app/icons/device/flashlight.png'
import timerIcon from '@/assets/app/icons/device/timer.png'
import settingsIcon from '@/assets/app/icons/common/settings.png'
import fileIcon from '@/assets/app/icons/device/file-manager.png'
import calendarIcon from '@/assets/app/icons/common/calendar.png'
import bluetoothIcon from '@/assets/app/icons/connection/bluetooth.png'
import infoIcon from '@/assets/app/icons/profile/info.png'
import uploadIcon from '@/assets/app/icons/device/upload.png'
import warningIcon from '@/assets/app/icons/status/warning.png'

const router = useRouter()
const route = useRoute()
const { user } = useAuth()
const { t, locale } = useI18n()
const {
  connectionState,
  setBluetoothEnabled,
  setNetwork4gEnabled,
  restoreSmartOtdrConnectionState
} = useSmartOtdrConnectionState()

const STORAGE_CURRENT_FW = 'device_current_firmware_version'
const STORAGE_LATEST_FW = 'device_latest_firmware_version'

const currentDevice = computed<Device | null>(() => {
  const deviceId = route.params.id as string
  if (!deviceId) return null
  return user.value?.devices?.find(d => d.id === deviceId) || null
})

const isPortableOtdr = computed(() => {
  return currentDevice.value?.deviceType === 'portable_otdr'
})

const isMultiOpm = computed(() => {
  return currentDevice.value?.deviceType === 'multi_opm_meter'
})

const isSmartOtdr = computed(() => {
  return currentDevice.value?.deviceType === 'smart_otdr'
})

const isFusionSplicer = computed(() => {
  return currentDevice.value?.deviceType === 'fusion_splicer'
})

const showSaveSection = computed(() => {
  return !isPortableOtdr.value && !isMultiOpm.value && !isSmartOtdr.value
})

type SmartSystemSettingKey =
  | 'language'
  | 'backlight'
  | 'autoShutdown'
  | 'beeper'
  | 'usb'
  | 'date'
  | 'time'
  | 'connection'

type SmartSystemEntranceKey = 'settings' | 'info' | 'upgrade' | 'reset' | 'factory'
type SmartSystemInfoTab = 'device' | 'version' | 'activation'
type BacklightMode = 'normal' | 'strong' | 'power-save' | 'custom'
type AutoShutdownMode = 'never' | '1m' | '5m' | '10m' | '30m' | '60m'
type BeeperMode = 'on' | 'off'
type UsbMode = 'pc' | 'disk'
type SmartRemoteTab = 'status' | 'parameters' | 'files'

interface SmartSystemSettingsState {
  language: 'zh-CN' | 'en'
  backlightMode: BacklightMode
  backlightCustomPercent: string
  autoShutdownMode: AutoShutdownMode
  beeperMode: BeeperMode
  usbMode: UsbMode
  dateYear: string
  dateMonth: string
  dateDay: string
  timeHour: string
  timeMinute: string
  bluetoothEnabled: boolean
  network4gEnabled: boolean
}

interface SmartSystemInfoState {
  deviceName: string
  deviceSerial: string
  model: string
  origin: string
  productionDate: string
  vendor: string
  softwareVersion: string
  hardwareVersion: string
  activationSerial: string
  activationStatus: string
  activationTime: string
  authorizedDuration: string
  remainingDuration: string
}

const DEVICE_CONNECTED_AT_KEY_PREFIX = 'device_connected_at:'
const DEVICE_CMD_KEY_PREFIX = 'device_cmd_last:'
const DAY_MS = 24 * 60 * 60 * 1000

const deviceId = computed(() => route.params.id as string)

const isConnected = computed(() => {
  return currentDevice.value?.status === 'connected'
})

const SMART_OTDR_SYSTEM_SETTINGS_KEY = 'smart-otdr-system-settings'
const backlightModeOptions: BacklightMode[] = ['normal', 'strong', 'power-save', 'custom']
const autoShutdownModeOptions: AutoShutdownMode[] = ['never', '1m', '5m', '10m', '30m', '60m']
const beeperModeOptions: BeeperMode[] = ['on', 'off']
const usbModeOptions: UsbMode[] = ['pc', 'disk']

const smartSystemMenu = [
  { key: 'language', label: '语言' },
  { key: 'backlight', label: '背光调节' },
  { key: 'autoShutdown', label: '自动关机' },
  { key: 'beeper', label: '蜂鸣器' },
  { key: 'usb', label: 'USB设置' },
  { key: 'date', label: '日期设置' },
  { key: 'time', label: '时间设置' },
  { key: 'connection', label: '连接' }
] as const satisfies ReadonlyArray<{ key: SmartSystemSettingKey; label: string }>

const smartSystemEntrances = [
  { key: 'settings', label: '系统设置' },
  { key: 'info', label: '系统信息' },
  { key: 'upgrade', label: '系统升级' },
  { key: 'reset', label: '恢复出厂设置' },
  { key: 'factory', label: '工厂模式' }
] as const satisfies ReadonlyArray<{ key: SmartSystemEntranceKey; label: string }>

const smartSettingIconMap: Record<SmartSystemSettingKey, string> = {
  language: languageIcon,
  backlight: backlightIcon,
  autoShutdown: timerIcon,
  beeper: settingsIcon,
  usb: fileIcon,
  date: calendarIcon,
  time: timerIcon,
  connection: bluetoothIcon
}

const smartEntranceIconMap: Record<Exclude<SmartSystemEntranceKey, 'settings'>, string> = {
  info: infoIcon,
  upgrade: uploadIcon,
  reset: warningIcon,
  factory: settingsIcon
}

const smartSystemInfoTabs = [
  { key: 'device', label: '设备信息' },
  { key: 'version', label: '版本信息' },
  { key: 'activation', label: '激活信息' }
] as const satisfies ReadonlyArray<{ key: SmartSystemInfoTab; label: string }>

const autoShutdownOptions = [
  { value: 'never', label: '从不' },
  { value: '1m', label: '1分' },
  { value: '5m', label: '5分' },
  { value: '10m', label: '10分' },
  { value: '30m', label: '30分' },
  { value: '60m', label: '60分' }
] as const satisfies ReadonlyArray<{ value: AutoShutdownMode; label: string }>

const now = new Date()
const padTwo = (value: number) => String(value).padStart(2, '0')
const smartDateYearOptions = Array.from({ length: 9 }, (_, index) => String(now.getFullYear() - 3 + index))
const smartDateMonthOptions = Array.from({ length: 12 }, (_, index) => padTwo(index + 1))
const smartTimeHourOptions = Array.from({ length: 24 }, (_, index) => padTwo(index))
const smartTimeMinuteOptions = Array.from({ length: 60 }, (_, index) => padTwo(index))
const getSmartDateDayOptions = (year: string, month: string) =>
  Array.from({ length: new Date(Number(year), Number(month), 0).getDate() }, (_, index) => padTwo(index + 1))

const createDefaultSmartSystemSettings = (): SmartSystemSettingsState => ({
  language: locale.value === 'en' ? 'en' : 'zh-CN',
  backlightMode: 'normal',
  backlightCustomPercent: 'xx',
  autoShutdownMode: 'never',
  beeperMode: 'on',
  usbMode: 'pc',
  dateYear: String(now.getFullYear()),
  dateMonth: padTwo(now.getMonth() + 1),
  dateDay: padTwo(now.getDate()),
  timeHour: padTwo(now.getHours()),
  timeMinute: padTwo(now.getMinutes()),
  bluetoothEnabled: true,
  network4gEnabled: true
})

const createDefaultSmartSystemInfo = (): SmartSystemInfoState => ({
  deviceName: 'xxx',
  deviceSerial: 'xxx',
  model: 'xxx',
  origin: 'xxx',
  productionDate: 'xxx',
  vendor: 'xxx',
  softwareVersion: 'xxx',
  hardwareVersion: 'xxx',
  activationSerial: 'xxxx',
  activationStatus: '未激活/已激活',
  activationTime: 'xxxx',
  authorizedDuration: 'xxxx',
  remainingDuration: 'xxxx'
})

const readTs = (key: string) => {
  try {
    const raw = localStorage.getItem(key)
    const ts = raw ? Number(raw) : NaN
    if (Number.isFinite(ts) && ts > 0) return ts
  } catch {
    return null
  }
  return null
}

const idleDays = computed(() => {
  const id = deviceId.value
  if (!id) return 0

  const lastCommandAt =
    readTs(`${DEVICE_CMD_KEY_PREFIX}${id}:any`) ??
    readTs(`${DEVICE_CONNECTED_AT_KEY_PREFIX}${id}`) ??
    Date.now()

  const ms = Math.max(0, Date.now() - lastCommandAt)
  return Math.floor(ms / DAY_MS)
})

const idleDaysText = computed(() => {
  return `${idleDays.value}${t('settings.dayUnit')}`
})

// 响应式数据
const isSaving = ref(false)
const isActivating = ref(false)
const isChangingPassword = ref(false)
const isVerifyingPassword = ref(false)
const isSavingAuth = ref(false)
const isResetting = ref(false)
const isUnlocking = ref(false)
const isVerifyingSmartFactoryPassword = ref(false)

// 弹窗状态
const showLanguageModal = ref(false)
const showSmartSystemSettingModal = ref(false)
const showSmartConnectionModal = ref(false)
const showSmartRemoteCenter = ref(false)
const smartRemoteOnline = ref(false)
const activeSmartRemoteTab = ref<SmartRemoteTab>('status')
const smartRemoteTabs = [
  { key: 'status' as const, label: '状态' },
  { key: 'parameters' as const, label: '参数' },
  { key: 'files' as const, label: '文件' }
]
const smartRemoteFiles = [
  { name: '20260825_1550.sor', time: '今天 14:36', size: '86KB' },
  { name: '20260825_event.json', time: '今天 14:32', size: '24KB' },
  { name: '20260824_loss.csv', time: '昨天 17:18', size: '12KB' }
]
const smartRemoteParameterDraft = reactive({
  wavelength: '1550nm',
  range: '10km',
  pulse: '10ns',
  time: '10s'
})
const showSmartDeviceAuthModal = ref(false)
const showSmartUiUpdateModal = ref(false)
const showSmartFactoryPasswordModal = ref(false)
const showSystemInfo = ref(false)
const showFirmwareUpgrade = ref(false)
const showRegistrationInfo = ref(false)
const showPasswordInput = ref(false)
const showDeviceAuth = ref(false)
const showPasswordChangeModal = ref(false)
const showFactoryReset = ref(false)
const showFactoryMode = ref(false)
const factoryModeUnlocked = ref(false)
const activeFactoryTab = ref('centerline')

// 语言选项
const languageLabels: Record<string, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁体中文',
  'en': 'English'
}

const sanitizeSmartSystemSettings = (
  input?: Partial<SmartSystemSettingsState> & { connectionMode?: 'connected' | 'disconnected' }
): SmartSystemSettingsState => {
  const defaults = createDefaultSmartSystemSettings()
  const payload = input ?? {}

  return {
    language: payload.language === 'en' ? 'en' : 'zh-CN',
    backlightMode: backlightModeOptions.includes(payload.backlightMode as BacklightMode)
      ? (payload.backlightMode as BacklightMode)
      : defaults.backlightMode,
    backlightCustomPercent: typeof payload.backlightCustomPercent === 'string' && payload.backlightCustomPercent.trim()
      ? payload.backlightCustomPercent
      : defaults.backlightCustomPercent,
    autoShutdownMode: autoShutdownModeOptions.includes(payload.autoShutdownMode as AutoShutdownMode)
      ? (payload.autoShutdownMode as AutoShutdownMode)
      : defaults.autoShutdownMode,
    beeperMode: beeperModeOptions.includes(payload.beeperMode as BeeperMode)
      ? (payload.beeperMode as BeeperMode)
      : defaults.beeperMode,
    usbMode: usbModeOptions.includes(payload.usbMode as UsbMode)
      ? (payload.usbMode as UsbMode)
      : defaults.usbMode,
    dateYear: smartDateYearOptions.includes(payload.dateYear || '') ? payload.dateYear || defaults.dateYear : defaults.dateYear,
    dateMonth: smartDateMonthOptions.includes(payload.dateMonth || '') ? payload.dateMonth || defaults.dateMonth : defaults.dateMonth,
    dateDay: getSmartDateDayOptions(payload.dateYear || defaults.dateYear, payload.dateMonth || defaults.dateMonth).includes(payload.dateDay || '')
      ? payload.dateDay || defaults.dateDay
      : defaults.dateDay,
    timeHour: smartTimeHourOptions.includes(payload.timeHour || '') ? payload.timeHour || defaults.timeHour : defaults.timeHour,
    timeMinute: smartTimeMinuteOptions.includes(payload.timeMinute || '') ? payload.timeMinute || defaults.timeMinute : defaults.timeMinute,
    bluetoothEnabled: typeof payload.bluetoothEnabled === 'boolean'
      ? payload.bluetoothEnabled
      : payload.connectionMode === 'disconnected'
        ? false
        : defaults.bluetoothEnabled,
    network4gEnabled: typeof payload.network4gEnabled === 'boolean'
      ? payload.network4gEnabled
      : payload.connectionMode === 'disconnected'
        ? false
        : defaults.network4gEnabled
  }
}

const activeSystemInfoTab = ref<SmartSystemInfoTab>('device')
const activeSmartSystemSettingKey = ref<SmartSystemSettingKey>('language')
const smartSystemSettingsDraft = reactive<SmartSystemSettingsState>(createDefaultSmartSystemSettings())
const smartDateDayOptions = computed(() => getSmartDateDayOptions(
  smartSystemSettingsDraft.dateYear,
  smartSystemSettingsDraft.dateMonth
))
const smartSystemInfoState = reactive<SmartSystemInfoState>(createDefaultSmartSystemInfo())
const smartFactoryPassword = ref('')
const smartToastMessage = ref('')
let smartToastTimer: number | undefined
const smartDeviceAuthDraft = reactive({
  years: 'xx',
  months: 'xx',
  days: 'xx'
})
const smartUiUpdateDraft = reactive({
  uiIcons: true,
  startupScreen: true
})
const smartUiUpdateFileName = ref('')

const activeSmartSystemSetting = computed(() => {
  return smartSystemMenu.find(item => item.key === activeSmartSystemSettingKey.value) ?? smartSystemMenu[0]
})

const restoreSmartSystemSettings = () => {
  try {
    const raw = localStorage.getItem(SMART_OTDR_SYSTEM_SETTINGS_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<SmartSystemSettingsState>) : undefined
    Object.assign(smartSystemSettingsDraft, sanitizeSmartSystemSettings(parsed))
  } catch {
    Object.assign(smartSystemSettingsDraft, createDefaultSmartSystemSettings())
  }
}

restoreSmartSystemSettings()

// 基础设置
const basicSettings = reactive({
  language: localStorage.getItem('locale_device') || 'zh-CN',
  brightness: 10,
  touchSound: true,
  bluetooth: true,
  network: true,
  sleep: false,
  sleepTime: 1,
  autoShutdown: false,
  shutdownTime: 1,
  dateTime: new Date().toLocaleString('sv-SE').replace(' ', 'T')
})

const btState = reactive({
  enabled: basicSettings.bluetooth,
  connected: false
})

const syncConnectionStateToSystemSettings = () => {
  smartSystemSettingsDraft.bluetoothEnabled = connectionState.bluetoothEnabled
  smartSystemSettingsDraft.network4gEnabled = connectionState.network4gEnabled
  basicSettings.bluetooth = connectionState.bluetoothEnabled
  basicSettings.network = connectionState.network4gEnabled
  btState.enabled = connectionState.bluetoothEnabled

  if (!btState.enabled) {
    btState.connected = false
  }
}

restoreSmartOtdrConnectionState()
syncConnectionStateToSystemSettings()

const btDeviceName = computed(() => {
  const device = currentDevice.value
  if (!device) return 'OTDR'
  const suffix = (device.name || '').split('-').pop() || ''
  if (device.model && suffix) return `${device.model}-${suffix}`
  return device.model || device.name || 'OTDR'
})

const btModal = reactive({
  visible: false,
  variant: 'pair' as 'pair' | 'delete',
  title: '',
  message: '',
  primaryText: '',
  secondaryText: ''
})

// 系统信息
const systemInfo = reactive({
  dischargeCount: 1247,
  deviceModel: 'FM-6000',
  origin: '中国',
  productionDate: '2024-01-15',
  manufacturer: '惠州市森柯林光电科技有限公司',
  firmwareVersion: 'v2.1.3',
  serialNumber: 'FM6000240115001',
  registrationStatus: 'activated',
  registrationTime: '2024-03-01 14:30:25'
})

const latestFirmwareVersion = ref(localStorage.getItem(STORAGE_LATEST_FW) || 'v2.1.4')
const isCheckingFirmware = ref(false)
const firmwareStage = ref<'idle' | 'started' | 'transferring' | 'transferred'>('idle')
const transferProgress = ref(0)
let transferTimer: number | undefined
const smartUpgradeTransport = ref<'bluetooth' | '4g'>('bluetooth')
const smartUpgradeStage = ref<'confirm' | 'transferring' | 'complete'>('confirm')

const hasFirmwareUpdate = computed(() => {
  return latestFirmwareVersion.value !== (isSmartOtdr.value ? smartSystemInfoState.softwareVersion : systemInfo.firmwareVersion)
})

const normalizeFirmwareVersion = (version: string) => {
  const raw = (version || '').trim()
  if (!raw) return 'v0.0.0'
  if (/^v/i.test(raw)) return `v${raw.slice(1)}`
  return `v${raw}`
}

const bumpFirmwareVersion = (version: string) => {
  const normalized = normalizeFirmwareVersion(version)
  const match = normalized.match(/^v(\d+)\.(\d+)\.(\d+)$/)
  if (!match) return `${normalized}-new`
  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = Number(match[3])
  return `v${major}.${minor}.${patch + 1}`
}

const ensureFirmwareUpdateAvailable = () => {
  systemInfo.firmwareVersion = normalizeFirmwareVersion(systemInfo.firmwareVersion)
  latestFirmwareVersion.value = normalizeFirmwareVersion(latestFirmwareVersion.value)

  if (latestFirmwareVersion.value === systemInfo.firmwareVersion) {
    latestFirmwareVersion.value = bumpFirmwareVersion(latestFirmwareVersion.value)
    localStorage.setItem(STORAGE_LATEST_FW, latestFirmwareVersion.value)
  }
}

const loadFirmwareVersion = () => {
  const savedCurrent = localStorage.getItem(STORAGE_CURRENT_FW)
  if (savedCurrent) {
    systemInfo.firmwareVersion = savedCurrent
    smartSystemInfoState.softwareVersion = savedCurrent
  }
}

loadFirmwareVersion()
ensureFirmwareUpdateAvailable()
smartSystemInfoState.softwareVersion = systemInfo.firmwareVersion

// 注册表单
const registrationForm = reactive({
  adminPassword: '',
  activationCode: ''
})

// 授权设置
const authSettings = reactive({
  bootPasswordEnabled: true,
  authTime: 1,
  authTimeUnit: 'hours'
})

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 授权密码输入
const authPasswordInput = ref('')

// 恢复出厂表单
const factoryResetForm = reactive({
  adminPassword: ''
})

// 工厂模式表单
const factoryModeForm = reactive({
  adminPassword: ''
})

// 工厂设置
const factorySettings = reactive({
  centerline: { x: 0, y: 0 },
  region: { x: 0, y: 0, z: 0 },
  backlight: { x: 0, y: 0, z: 0 }
})

// 工厂模式标签页
const factoryTabs = computed(() => [
  { key: 'centerline', label: t('settings.centerlineCalibration') },
  { key: 'region', label: t('settings.regionCapture') },
  { key: 'backlight', label: t('settings.backlightCorrection') }
])

// 计算属性
const isPasswordFormValid = computed(() => {
  return passwordForm.currentPassword && 
         passwordForm.newPassword && 
         passwordForm.confirmPassword &&
         passwordForm.newPassword === passwordForm.confirmPassword
})

/**
 * 切换语言
 */
const selectLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('locale_device', lang)
  if (basicSettings.language) {
    basicSettings.language = lang
  }
  showLanguageModal.value = false
}

watch(
  () => smartSystemSettingsDraft.language,
  value => {
    locale.value = value
    localStorage.setItem('locale_device', value)
    basicSettings.language = value
  }
)

watch(
  () => connectionState.bluetoothEnabled,
  value => {
    smartSystemSettingsDraft.bluetoothEnabled = value
    basicSettings.bluetooth = value
    btState.enabled = value
    if (!value) {
      btState.connected = false
    }
  },
  { immediate: true }
)

watch(
  () => connectionState.network4gEnabled,
  value => {
    smartSystemSettingsDraft.network4gEnabled = value
    basicSettings.network = value
  },
  { immediate: true }
)

watch(
  () => smartSystemSettingsDraft.bluetoothEnabled,
  value => {
    if (value !== connectionState.bluetoothEnabled) {
      setBluetoothEnabled(value)
    }
  }
)

watch(
  () => smartSystemSettingsDraft.network4gEnabled,
  value => {
    if (value !== connectionState.network4gEnabled) {
      setNetwork4gEnabled(value)
    }
  }
)

watch(
  smartSystemSettingsDraft,
  value => {
    localStorage.setItem(
      SMART_OTDR_SYSTEM_SETTINGS_KEY,
      JSON.stringify(sanitizeSmartSystemSettings({ ...value }))
    )
  },
  { deep: true }
)

watch(
  () => [smartSystemSettingsDraft.dateYear, smartSystemSettingsDraft.dateMonth],
  () => {
    if (!smartDateDayOptions.value.includes(smartSystemSettingsDraft.dateDay)) {
      smartSystemSettingsDraft.dateDay = smartDateDayOptions.value[smartDateDayOptions.value.length - 1] || '01'
    }
  }
)

const openSmartSystemSetting = (key: SmartSystemSettingKey) => {
  if (key === 'connection') {
    openSmartConnectionModal()
    return
  }

  activeSmartSystemSettingKey.value = key
  showSmartSystemSettingModal.value = true
}

const openSmartConnectionModal = () => {
  showSmartConnectionModal.value = true
}

const openSmartRemoteCenter = () => {
  if (!smartSystemSettingsDraft.network4gEnabled) return
  showSmartConnectionModal.value = false
  showSmartRemoteCenter.value = true
}

const toggleSmartRemoteSession = () => {
  smartRemoteOnline.value = !smartRemoteOnline.value
  showSmartToast(smartRemoteOnline.value ? '远程会话已建立' : '远程会话已结束')
}

const saveSmartRemoteParameters = () => {
  showSmartToast(`远程参数已暂存：${smartRemoteParameterDraft.wavelength} / ${smartRemoteParameterDraft.range}`)
}

const showSmartToast = (message: string) => {
  smartToastMessage.value = message
  if (smartToastTimer !== undefined) {
    window.clearTimeout(smartToastTimer)
  }
  smartToastTimer = window.setTimeout(() => {
    smartToastMessage.value = ''
    smartToastTimer = undefined
  }, 1800)
}

const smartConnectionSummary = computed(() => {
  const bluetooth = connectionState.bluetoothEnabled ? '蓝牙开' : '蓝牙关'
  const network4g = connectionState.network4gEnabled ? '4G开' : '4G关'
  return `${bluetooth} / ${network4g}`
})

const getSmartSystemSettingValue = (key: SmartSystemSettingKey) => {
  if (key === 'language') {
    return smartSystemSettingsDraft.language === 'en' ? 'English' : '简体中文'
  }
  if (key === 'backlight') {
    if (smartSystemSettingsDraft.backlightMode === 'strong') return '强光'
    if (smartSystemSettingsDraft.backlightMode === 'power-save') return '省电'
    if (smartSystemSettingsDraft.backlightMode === 'custom') {
      return `自定义 ${smartSystemSettingsDraft.backlightCustomPercent}%`
    }
    return '常规'
  }
  if (key === 'autoShutdown') {
    return autoShutdownOptions.find(item => item.value === smartSystemSettingsDraft.autoShutdownMode)?.label || '从不'
  }
  if (key === 'beeper') {
    return smartSystemSettingsDraft.beeperMode === 'on' ? '开启' : '关闭'
  }
  if (key === 'usb') {
    return smartSystemSettingsDraft.usbMode === 'pc' ? '连接电脑' : 'U盘'
  }
  if (key === 'date') {
    return `${smartSystemSettingsDraft.dateYear}-${smartSystemSettingsDraft.dateMonth}-${smartSystemSettingsDraft.dateDay}`
  }
  if (key === 'time') {
    return `${smartSystemSettingsDraft.timeHour}:${smartSystemSettingsDraft.timeMinute}`
  }
  return smartConnectionSummary.value
}

const smartSettingSections = computed<DeviceSettingSection[]>(() => {
  const entranceLabel = (key: Exclude<SmartSystemEntranceKey, 'settings'>) =>
    smartSystemEntrances.find(item => item.key === key)?.label ?? key

  return [
    {
      key: 'device',
      title: t('settings.basicSettings'),
      items: smartSystemMenu.map(item => ({
        key: item.key,
        label: item.label,
        value: getSmartSystemSettingValue(item.key),
        icon: smartSettingIconMap[item.key]
      }))
    },
    {
      key: 'system',
      title: t('settings.systemSettings'),
      items: [
        {
          key: 'info',
          label: entranceLabel('info'),
          value: smartSystemInfoState.softwareVersion,
          icon: smartEntranceIconMap.info
        },
        {
          key: 'upgrade',
          label: entranceLabel('upgrade'),
          value: hasFirmwareUpdate.value ? latestFirmwareVersion.value : smartSystemInfoState.softwareVersion,
          icon: smartEntranceIconMap.upgrade,
          badge: hasFirmwareUpdate.value ? t('settings.newVersion') : undefined,
          badgeTone: hasFirmwareUpdate.value ? 'warning' as const : undefined
        },
        {
          key: 'reset',
          label: entranceLabel('reset'),
          icon: smartEntranceIconMap.reset,
          tone: 'danger' as const
        },
        {
          key: 'factory',
          label: entranceLabel('factory'),
          icon: smartEntranceIconMap.factory
        }
      ]
    }
  ]
})

const openSmartUnifiedSetting = (key: string) => {
  if (smartSystemMenu.some(item => item.key === key)) {
    openSmartSystemSetting(key as SmartSystemSettingKey)
    return
  }
  handleSmartSystemEntrance(key as SmartSystemEntranceKey)
}

const handleSmartSystemEntrance = (key: SmartSystemEntranceKey) => {
  if (key === 'settings') {
    return
  }
  if (key === 'info') {
    activeSystemInfoTab.value = 'device'
    showSystemInfo.value = true
    return
  }
  if (key === 'upgrade') {
    void openFirmwareUpgrade()
    return
  }
  if (key === 'reset') {
    showFactoryReset.value = true
    return
  }
  showSmartFactoryPasswordModal.value = true
}

/**
 * 返回上一页
 */
const goBack = () => {
  if (isSmartOtdr.value && currentDevice.value) {
    router.push(`/device/${currentDevice.value.id}`)
    return
  }
  router.back()
}

/**
 * 调整屏幕亮度
 */
const adjustBrightness = (delta: number) => {
  const newValue = basicSettings.brightness + delta
  if (newValue >= 1 && newValue <= 10) {
    basicSettings.brightness = newValue
  }
}

/**
 * 切换触屏提示音
 */
const toggleTouchSound = () => {
  basicSettings.touchSound = !basicSettings.touchSound
}

/**
 * 切换蓝牙
 */
const toggleBluetooth = () => {
  setBluetoothEnabled(!connectionState.bluetoothEnabled)
}

const toggleNetwork = () => {
  setNetwork4gEnabled(!connectionState.network4gEnabled)
}

const showNetworkInfoModal = ref(false)

const networkInfo = reactive({
  ip: '192.168.0.1',
  port: '8080'
})

const toggleBtEnabled = () => {
  const nextValue = !connectionState.bluetoothEnabled
  setBluetoothEnabled(nextValue)
  btState.enabled = nextValue
  basicSettings.bluetooth = nextValue
  if (!nextValue) btState.connected = false
}

const closeBtModal = () => {
  btModal.visible = false
}

const requestPairOrDisconnect = () => {
  if (!btState.enabled) return
  if (btState.connected) {
    btState.connected = false
    return
  }

  btModal.variant = 'pair'
  btModal.title = '配对请求'
  btModal.message = `蓝牙设备名称\n${btDeviceName.value}`
  btModal.primaryText = '连接'
  btModal.secondaryText = '拒绝'
  btModal.visible = true
}

const requestDeleteBluetooth = () => {
  if (!btState.enabled) return
  btModal.variant = 'delete'
  btModal.title = '确认删除蓝牙设备'
  btModal.message = `${btDeviceName.value}？`
  btModal.primaryText = '删除'
  btModal.secondaryText = t('common.cancel')
  btModal.visible = true
}

const confirmBtModal = () => {
  if (btModal.variant === 'pair') {
    setBluetoothEnabled(true)
    btState.enabled = true
    basicSettings.bluetooth = true
    btState.connected = true
    btModal.visible = false
    return
  }

  btState.connected = false
  btState.enabled = false
  setBluetoothEnabled(false)
  basicSettings.bluetooth = false
  btModal.visible = false
}

/**
 * 切换休眠
 */
const toggleSleep = () => {
  basicSettings.sleep = !basicSettings.sleep
}

/**
 * 调整休眠时间
 */
const adjustSleepTime = (delta: number) => {
  const newValue = basicSettings.sleepTime + delta
  if (newValue >= 1) {
    basicSettings.sleepTime = newValue
  }
}

/**
 * 切换自动关机
 */
const toggleAutoShutdown = () => {
  basicSettings.autoShutdown = !basicSettings.autoShutdown
}

/**
 * 调整自动关机时间
 */
const adjustShutdownTime = (delta: number) => {
  const newValue = basicSettings.shutdownTime + delta
  if (newValue >= 1) {
    basicSettings.shutdownTime = newValue
  }
}

const closeFirmwareUpgrade = () => {
  showFirmwareUpgrade.value = false
  if (transferTimer !== undefined) {
    window.clearInterval(transferTimer)
    transferTimer = undefined
  }
  transferProgress.value = 0
  if (isSmartOtdr.value) {
    smartUpgradeStage.value = 'confirm'
    return
  }
  isCheckingFirmware.value = false
  firmwareStage.value = 'idle'
}

const handleFirmwareOverlayClick = () => {
  if (isSmartOtdr.value) {
    if (smartUpgradeStage.value === 'transferring') return
    closeFirmwareUpgrade()
    return
  }
  if (firmwareStage.value === 'transferring') return
  closeFirmwareUpgrade()
}

const openFirmwareUpgrade = async () => {
  if (isSmartOtdr.value) {
    smartUpgradeStage.value = 'confirm'
    smartUpgradeTransport.value = connectionState.bluetoothEnabled ? 'bluetooth' : '4g'
    transferProgress.value = 0
    showFirmwareUpgrade.value = true
    return
  }

  showFirmwareUpgrade.value = true
  isCheckingFirmware.value = true
  firmwareStage.value = 'idle'
  transferProgress.value = 0

  try {
    await new Promise(resolve => setTimeout(resolve, 600))
    latestFirmwareVersion.value = localStorage.getItem(STORAGE_LATEST_FW) || latestFirmwareVersion.value
    ensureFirmwareUpdateAvailable()
  } finally {
    isCheckingFirmware.value = false
  }
}

const confirmSmartFirmwareUpgrade = () => {
  if (smartUpgradeStage.value !== 'confirm') return
  if (smartUpgradeTransport.value === 'bluetooth' && !connectionState.bluetoothEnabled) {
    showSmartToast('请先开启蓝牙连接')
    return
  }
  if (smartUpgradeTransport.value === '4g' && !smartSystemSettingsDraft.network4gEnabled) {
    showSmartToast('请先开启4G并确认SIM在线')
    return
  }

  smartUpgradeStage.value = 'transferring'
  transferProgress.value = 0
  transferTimer = window.setInterval(() => {
    transferProgress.value = Math.min(100, transferProgress.value + 8)
    if (transferProgress.value < 100) return
    if (transferTimer !== undefined) window.clearInterval(transferTimer)
    transferTimer = undefined
    smartUpgradeStage.value = 'complete'
    if (hasFirmwareUpdate.value) {
      smartSystemInfoState.softwareVersion = latestFirmwareVersion.value
      systemInfo.firmwareVersion = latestFirmwareVersion.value
      localStorage.setItem(STORAGE_CURRENT_FW, latestFirmwareVersion.value)
    }
    showSmartToast('系统升级已完成')
  }, 220)
}

const cancelSmartFirmwareUpgrade = () => {
  if (transferTimer !== undefined) window.clearInterval(transferTimer)
  transferTimer = undefined
  smartUpgradeStage.value = 'confirm'
  transferProgress.value = 0
  showSmartToast('升级已中断，设备版本未变更')
}

const getStepClass = (step: 'start' | 'transfer' | 'complete') => {
  if (step === 'start') {
    if (firmwareStage.value === 'idle') return 'active'
    return 'done'
  }
  if (step === 'transfer') {
    if (firmwareStage.value === 'idle') return 'pending'
    if (firmwareStage.value === 'started') return 'active'
    if (firmwareStage.value === 'transferring') return 'active'
    return firmwareStage.value === 'transferred' ? 'done' : 'pending'
  }
  return firmwareStage.value === 'transferred' ? 'active' : 'pending'
}

const startFirmwareUpgrade = () => {
  if (!hasFirmwareUpdate.value) return
  if (firmwareStage.value !== 'idle') return
  firmwareStage.value = 'started'
}

const startFirmwareTransfer = () => {
  if (!hasFirmwareUpdate.value) return
  if (firmwareStage.value !== 'started') return

  firmwareStage.value = 'transferring'
  transferProgress.value = 0

  transferTimer = window.setInterval(() => {
    const next = Math.min(100, transferProgress.value + Math.floor(Math.random() * 8) + 3)
    transferProgress.value = next
    if (next >= 100) {
      if (transferTimer !== undefined) {
        window.clearInterval(transferTimer)
        transferTimer = undefined
      }
      firmwareStage.value = 'transferred'
    }
  }, 200)
}

const finishFirmwareUpgrade = () => {
  if (firmwareStage.value !== 'transferred') return
  systemInfo.firmwareVersion = latestFirmwareVersion.value
  localStorage.setItem(STORAGE_CURRENT_FW, systemInfo.firmwareVersion)
  closeFirmwareUpgrade()
}

/**
 * 激活设备
 */
const activateDevice = async () => {
  if (!registrationForm.adminPassword || !registrationForm.activationCode) return
  
  isActivating.value = true
  try {
    // 模拟激活过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    systemInfo.registrationStatus = 'activated'
    systemInfo.registrationTime = new Date().toLocaleString('zh-CN')
    
    registrationForm.adminPassword = ''
    registrationForm.activationCode = ''
    
    alert(t('settings.successActivated'))
  } catch (error) {
    alert(t('settings.errorActivate'))
  } finally {
    isActivating.value = false
  }
}

/**
 * 切换开机密码
 */
const toggleBootPassword = () => {
  authSettings.bootPasswordEnabled = !authSettings.bootPasswordEnabled
}

/**
 * 修改开机密码
 */
const changeBootPassword = async () => {
  if (!isPasswordFormValid.value) return
  
  isChangingPassword.value = true
  try {
    // 模拟修改密码过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 清空表单
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
    showPasswordChangeModal.value = false
    alert(t('settings.successPasswordChanged'))
  } catch (error) {
    alert(t('settings.errorPassword'))
  } finally {
    isChangingPassword.value = false
  }
}

/**
 * 验证授权密码
 */
const verifyAuthPassword = async () => {
  if (!authPasswordInput.value) return
  
  isVerifyingPassword.value = true
  try {
    // 模拟密码验证过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 验证成功，进入授权设置页面
    showPasswordInput.value = false
    showDeviceAuth.value = true
    authPasswordInput.value = ''
  } catch (error) {
    alert(t('settings.errorPassword'))
  } finally {
    isVerifyingPassword.value = false
  }
}

/**
 * 保存授权设置
 */
const saveAuthSettings = async () => {
  isSavingAuth.value = true
  try {
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showDeviceAuth.value = false
    alert(t('settings.successAuthSaved'))
  } catch (error) {
    alert(t('settings.errorSave'))
  } finally {
    isSavingAuth.value = false
  }
}

/**
 * 调整授权时间
 */
const adjustAuthTime = (delta: number) => {
  const newValue = authSettings.authTime + delta
  if (newValue >= 1) {
    authSettings.authTime = newValue
  }
}

/**
 * 执行恢复出厂设置
 */
const performFactoryReset = async () => {
  if (!factoryResetForm.adminPassword) return
  
  if (!confirm(t('settings.confirmFactoryResetMessage'))) return
  
  isResetting.value = true
  try {
    // 模拟恢复出厂过程
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 重置设置
    basicSettings.brightness = 10
    basicSettings.touchSound = true
    basicSettings.bluetooth = true
    basicSettings.sleep = true
    basicSettings.sleepTime = 1
    basicSettings.autoShutdown = false
    basicSettings.shutdownTime = 1
    basicSettings.language = 'zh-CN'
    localStorage.setItem('locale_device', 'zh-CN')
    locale.value = 'zh-CN'
    
    systemInfo.registrationStatus = 'not_activated'
    systemInfo.registrationTime = ''
    
    authSettings.bootPasswordEnabled = false
    authSettings.authTime = 1
    authSettings.authTimeUnit = 'hours'

    Object.assign(smartSystemSettingsDraft, createDefaultSmartSystemSettings())
    localStorage.setItem(
      SMART_OTDR_SYSTEM_SETTINGS_KEY,
      JSON.stringify(createDefaultSmartSystemSettings())
    )
    
    factoryResetForm.adminPassword = ''
    showFactoryReset.value = false
    
    alert(t('settings.successReset'))
  } catch (error) {
    alert(t('settings.errorReset'))
  } finally {
    isResetting.value = false
  }
}

const confirmSmartFactoryReset = async () => {
  if (isResetting.value) return

  isResetting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 400))

    Object.assign(smartSystemSettingsDraft, createDefaultSmartSystemSettings())
    Object.assign(smartSystemInfoState, {
      ...createDefaultSmartSystemInfo(),
      softwareVersion: systemInfo.firmwareVersion
    })
    Object.assign(smartDeviceAuthDraft, { years: 'xx', months: 'xx', days: 'xx' })
    Object.assign(smartUiUpdateDraft, { uiIcons: true, startupScreen: true })

    localStorage.setItem(
      SMART_OTDR_SYSTEM_SETTINGS_KEY,
      JSON.stringify(createDefaultSmartSystemSettings())
    )
    showFactoryReset.value = false
    showSmartToast('已恢复默认设置')
  } finally {
    isResetting.value = false
  }
}

const closeSmartFactoryPasswordModal = () => {
  showSmartFactoryPasswordModal.value = false
  smartFactoryPassword.value = ''
}

const verifySmartFactoryPassword = async () => {
  if (!smartFactoryPassword.value.trim()) return

  isVerifyingSmartFactoryPassword.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    showSmartFactoryPasswordModal.value = false
    showFactoryMode.value = true
    smartFactoryPassword.value = ''
  } finally {
    isVerifyingSmartFactoryPassword.value = false
  }
}

const openSmartDeviceAuthModal = () => {
  showFactoryMode.value = false
  showSmartDeviceAuthModal.value = true
}

const openSmartUiUpdateModal = () => {
  showFactoryMode.value = false
  smartUiUpdateFileName.value = ''
  showSmartUiUpdateModal.value = true
}

const handleSmartUiFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  smartUiUpdateFileName.value = file?.name || ''
  if (file && !file.name.toLowerCase().endsWith('.enc')) {
    smartUiUpdateFileName.value = ''
    input.value = ''
    showSmartToast('请选择加密的 .enc 资源包')
  }
}

const saveSmartDeviceAuth = () => {
  const years = smartDeviceAuthDraft.years || 'xx'
  const months = smartDeviceAuthDraft.months || 'xx'
  const days = smartDeviceAuthDraft.days || 'xx'
  smartSystemInfoState.authorizedDuration = `${years}年${months}月${days}日`
  smartSystemInfoState.remainingDuration = smartSystemInfoState.authorizedDuration
  showSmartDeviceAuthModal.value = false
  showSmartToast('授权设置已保存')
}

const importSmartUiAssets = () => {
  if (!smartUiUpdateFileName.value) {
    showSmartToast('请先选择加密资源包')
    return
  }
  if (!smartUiUpdateDraft.uiIcons && !smartUiUpdateDraft.startupScreen) {
    showSmartToast('请至少选择一项更新内容')
    return
  }
  showSmartUiUpdateModal.value = false
  showFactoryMode.value = false
  showSmartToast('资源包校验通过，UI资源已导入')
}

/**
 * 解锁工厂模式
 */
const unlockFactoryMode = async () => {
  if (!factoryModeForm.adminPassword) return
  
  isUnlocking.value = true
  try {
    // 模拟验证过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    factoryModeUnlocked.value = true
    factoryModeForm.adminPassword = ''
  } catch (error) {
    alert(t('settings.errorPassword'))
  } finally {
    isUnlocking.value = false
  }
}

/**
 * 调整轴向
 */
const adjustAxis = (axis: 'x' | 'y', delta: number) => {
  factorySettings.centerline[axis] += delta
}

/**
 * 自动校准中线
 */
const autoCalibrateCenterline = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    factorySettings.centerline.x = 0
    factorySettings.centerline.y = 0
    alert(t('settings.centerlineCalibrated'))
  } catch (error) {
    alert(t('settings.autoCalibrateFailed'))
  }
}

/**
 * 保存中线设置
 */
const saveCenterlineSettings = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    alert(t('settings.centerlineSaved'))
  } catch (error) {
    alert(t('settings.errorSave'))
  }
}

/**
 * 调整区域
 */
const adjustRegion = (axis: 'x' | 'y' | 'z', delta: number) => {
  factorySettings.region[axis] += delta
}

/**
 * 自动捕捉
 */
const autoCapture = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    alert(t('settings.regionCaptured'))
  } catch (error) {
    alert(t('settings.autoCaptureFailed'))
  }
}

/**
 * 保存区域设置
 */
const saveRegionSettings = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    alert(t('settings.regionSaved'))
  } catch (error) {
    alert(t('settings.errorSave'))
  }
}

/**
 * 调整背光
 */
const adjustBacklight = (axis: 'x' | 'y' | 'z', delta: number) => {
  factorySettings.backlight[axis] += delta
}

/**
 * 自动校正背光
 */
const autoCorrectBacklight = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    alert(t('settings.backlightCorrected'))
  } catch (error) {
    alert(t('settings.autoCorrectFailed'))
  }
}

/**
 * 保存背光设置
 */
const saveBacklightSettings = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    alert(t('settings.backlightSaved'))
  } catch (error) {
    alert(t('settings.errorSave'))
  }
}

/**
 * 退出工厂模式
 */
const exitFactoryMode = () => {
  factoryModeUnlocked.value = false
  showFactoryMode.value = false
  activeFactoryTab.value = 'centerline'
}

/**
 * 统一处理自动操作
 */
const handleAutoAction = () => {
  switch (activeFactoryTab.value) {
    case 'centerline':
      autoCalibrateCenterline()
      break
    case 'region':
      autoCapture()
      break
    case 'backlight':
      autoCorrectBacklight()
      break
  }
}

/**
 * 统一处理保存操作
 */
const handleSaveAction = () => {
  switch (activeFactoryTab.value) {
    case 'centerline':
      saveCenterlineSettings()
      break
    case 'region':
      saveRegionSettings()
      break
    case 'backlight':
      saveBacklightSettings()
      break
  }
}

/**
 * 保存设置
 */
const saveSettings = async () => {
  isSaving.value = true
  try {
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert(t('settings.successSaved'))
  } catch (error) {
    alert(t('settings.errorSave'))
  } finally {
    isSaving.value = false
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
/* 主内容区域 */
.content-flex {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 20px;
}

.smart-settings-content {
  display: flex;
  justify-content: center;
  padding: 0;
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
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: none;
  border-bottom: 1px solid #E5E7EB;
  z-index: 10;
  justify-content: center;
  position: relative;
}

.header-placeholder {
  display: none;
}

.back-btn {
  position: absolute;
  left: 16px;
  background: none;
  border: none;
  color: #2563EB; /* 主色 */
  font-size: 16px;
  cursor: pointer;
  padding: 8px 0;
  font-weight: 500;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937; /* 深灰 */
  margin: 0;
}

.smart-system-app {
  background: #f4f7fb;
}

.smart-system-app .header {
  background: rgba(248, 250, 252, 0.82);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.85);
}

.smart-system-app .back-btn {
  color: #3b82f6;
  font-weight: 600;
}

.smart-system-app .page-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.smart-system-app .p-4 {
  padding: 14px 14px 24px;
}

.smart-settings-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.smart-system-page {
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.smart-system-app .smart-settings-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 22px;
  padding: 10px 14px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.smart-system-app .smart-settings-card .section-title {
  margin: 2px 2px 8px;
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.smart-system-app .smart-settings-card .setting-item {
  min-height: 56px;
  padding: 0;
  border-bottom: 1px solid #f1f5f9;
}

.smart-system-app .smart-settings-card .setting-item.clickable {
  margin: 0;
  padding: 0;
  border-radius: 0;
}

.smart-system-app .smart-settings-card .setting-item.clickable:hover {
  background: transparent;
}

.smart-system-app .smart-settings-card .setting-label {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.smart-system-app .smart-settings-card .setting-control {
  gap: 6px;
}

.smart-system-app .smart-settings-card .version-text {
  margin-right: 0;
  font-size: 13px;
  color: #94a3b8;
}

.smart-system-app .smart-settings-card .arrow-icon {
  font-size: 18px;
  color: #cbd5e1;
}

.smart-system-app .smart-settings-card .update-badge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #eef4ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 600;
}

.smart-setting-modal {
  width: min(100%, 360px);
  max-width: 360px;
}

.smart-modal-overlay {
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: none;
  padding: 20px;
}

.smart-mobile-modal {
  width: min(100%, 320px);
  max-width: 320px;
  max-height: min(calc(100vh - 80px), 620px);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #d8e2ef;
  background: #ffffff;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.22);
  backdrop-filter: none;
}

.smart-mobile-modal.smart-setting-modal {
  max-width: 320px;
}

.smart-mobile-modal.smart-large-modal,
.smart-mobile-modal.smart-factory-modal {
  width: min(100%, 320px);
  max-width: 320px;
}

.smart-mobile-modal .modal-header {
  min-height: 48px;
  margin: -4px 0 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #d8e2ef;
}

.smart-mobile-modal .modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.smart-mobile-modal .modal-close {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
}

.smart-mobile-modal .modal-close:active {
  background: #eef2f7;
}

.smart-mobile-modal .modal-body {
  overflow-y: auto;
}

.smart-mobile-modal .editor-group {
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
}

.smart-mobile-modal .radio-row {
  min-height: 44px;
  font-size: 14px;
  color: #0f172a;
}

.smart-mobile-modal .subview-title {
  margin-bottom: 4px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.smart-mobile-modal .editor-inline-input,
.smart-mobile-modal .form-input {
  border-radius: 8px;
  border: 1px solid #d8e2ef;
  background: #ffffff;
  color: #0f172a;
}

.smart-mobile-modal .form-input {
  height: 44px;
}

.smart-mobile-modal .editor-inline-input:focus,
.smart-mobile-modal .form-input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
  background: #ffffff;
}

.smart-mobile-modal .picker-grid {
  gap: 10px;
}

.smart-mobile-modal .picker-column {
  gap: 8px;
}

.smart-mobile-modal .picker-option {
  min-height: 44px;
  border: 1px solid #d8e2ef;
  border-top: 1px solid #d8e2ef;
  border-radius: 8px;
  background: #ffffff;
  color: #64748b;
}

.smart-mobile-modal .picker-column .picker-option:first-child {
  border-top: 1px solid #e2e8f0;
}

.smart-mobile-modal .picker-option.active {
  color: #2563eb;
  font-weight: 700;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.smart-mobile-modal .smart-modal-tabs {
  gap: 8px;
  margin-bottom: 14px;
}

.smart-mobile-modal .smart-modal-tab {
  min-width: 84px;
  min-height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.smart-mobile-modal .smart-modal-tab.active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: none;
}

.smart-mobile-modal .smart-modal-panel {
  padding: 12px 12px 4px;
  background: #f8fafc;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
}

.smart-mobile-modal .info-row {
  min-height: 42px;
  padding: 0;
  border-bottom: 1px solid #e2e8f0;
}

.smart-mobile-modal .info-label-text {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.smart-mobile-modal .info-value-text {
  font-size: 13px;
  color: #0f172a;
  font-weight: 600;
}

.smart-confirm-modal .smart-confirm-body {
  padding: 8px 2px 2px;
}

.smart-confirm-modal .smart-confirm-title {
  margin-bottom: 10px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.smart-confirm-modal .smart-confirm-desc {
  margin-bottom: 18px;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}

.smart-mobile-modal .firmware-actions,
.smart-confirm-modal .smart-confirm-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 2px;
}

.smart-mobile-modal .fw-btn {
  min-width: 120px;
  min-height: 44px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: none;
}

.smart-mobile-modal .fw-btn.primary {
  background: #2563eb;
  box-shadow: none;
}

.smart-mobile-modal .fw-btn.secondary {
  background: #f1f5f9;
  color: #334155;
}

.smart-mobile-modal .fw-btn.danger {
  background: #dc2626;
}

.smart-factory-modal .smart-factory-grid {
  gap: 12px;
}

.smart-factory-modal .smart-factory-card {
  min-height: 132px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: inset 0 0 0 1px #e2e8f0, 0 10px 24px rgba(15, 23, 42, 0.05);
}

.smart-factory-modal .smart-factory-icon {
  position: relative;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
}

.smart-factory-modal .smart-factory-icon::before {
  content: '';
  position: absolute;
  top: 16px;
  left: 16px;
  width: 24px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 0 rgba(255, 255, 255, 0.82);
}

.smart-factory-modal .smart-factory-label {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.smart-factory-modal .smart-factory-actions {
  margin-top: 14px;
}

.smart-factory-modal .smart-factory-exit {
  width: 100%;
}

.smart-mobile-modal .smart-auth-duration {
  padding: 14px;
  margin-bottom: 14px;
  background: #f8fafc;
  border-radius: 18px;
}

.smart-mobile-modal .smart-auth-label,
.smart-mobile-modal .smart-ui-update-title {
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.smart-mobile-modal .smart-auth-inputs {
  gap: 8px;
}

.smart-mobile-modal .smart-auth-input {
  text-align: center;
}

.smart-mobile-modal .smart-auth-unit {
  color: #64748b;
}

.smart-mobile-modal .checkbox-row {
  min-height: 48px;
  padding: 0 14px;
  margin-bottom: 10px;
  background: #f8fafc;
  border-radius: 16px;
  color: #0f172a;
}

.smart-mobile-modal .checkbox-row:last-of-type {
  margin-bottom: 0;
}

.editor-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  color: #374151;
  font-size: 14px;
}

.radio-row input[type='radio'] {
  margin: 0;
}

.inline-input {
  justify-content: space-between;
  gap: 16px;
}

.radio-inline-left,
.radio-inline-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.editor-inline-input {
  width: 106px;
  height: 32px;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 14px;
  color: #111827;
  outline: none;
}

.editor-inline-input:focus {
  border-color: #2563EB;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.time-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 260px;
}

.picker-column {
  display: flex;
  flex-direction: column;
}

.picker-option {
  height: 40px;
  border: none;
  border-top: 1px solid #F1F5F9;
  background: #FFFFFF;
  color: #6B7280;
  font-size: 14px;
  cursor: pointer;
}

.picker-column .picker-option:first-child {
  border-top: none;
}

.picker-option.active {
  color: #2563EB;
  font-weight: 700;
  background: #F8FBFF;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 16px 0;
}

.setting-tip {
  padding: 12px 14px;
  margin-bottom: 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.setting-tip-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.setting-tip-desc {
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

/* 设置卡片 */
.settings-card {
  background: white;
  border-radius: 4px; /* 4px 圆角 */
  padding: 16px; /* 16px 内边距 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04); /* 柔和阴影 */
  border: 1px solid #E5E7EB; /* 浅灰边框 */
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

.setting-item.clickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 12px 8px; /* 增加内边距 */
  margin: 0 -8px; /* 负外边距抵消 */
  border-radius: 4px;
}

.setting-item.clickable:hover {
  background-color: #F9FAFB; /* 悬停背景 */
}

.setting-label {
  font-size: 14px;
  color: #374151; /* 文字颜色 */
  font-weight: 500;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 调整按钮 */
.adjust-btn {
  width: 32px;
  height: 32px;
  background: #F9FAFB; /* 浅灰背景 */
  border: 1px solid #E5E7EB; /* 浅灰边框 */
  border-radius: 4px; /* 4px 圆角 */
  color: #6B7280; /* 文字颜色 */
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.adjust-btn:active:not(:disabled) {
  background: #E5E7EB; /* 点击变色 */
  transform: scale(0.96); /* 缩放反馈 */
}

.adjust-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #F3F4F6;
}

.setting-value {
  min-width: 40px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  background: #F9FAFB; /* 数值背景 */
  padding: 4px 8px;
  border-radius: 4px; /* 4px 圆角 */
}

/* 开关按钮 */
.toggle-btn {
  background: #E5E7EB; /* 关闭状态背景 */
  border: none;
  border-radius: 6px; /* 6px 圆角 */
  color: #9CA3AF; /* 关闭状态文字 */
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 12px;
  transition: all 0.3s ease;
  min-width: 50px;
}

.toggle-btn:active {
  transform: scale(0.96);
}

.toggle-btn.active {
  background: #2563EB; /* 开启状态背景 */
  color: white; /* 开启状态文字 */
}

/* 下拉框 */
.language-select {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  color: #1F2937;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 12px;
  min-width: 100px;
  outline: none;
  transition: border-color 0.2s;
}

.language-select:focus {
  border-color: #2563EB;
}

.version-text {
  font-size: 14px;
  color: #6B7280;
  margin-right: 8px;
}

.smart-large-modal {
  width: min(92vw, 560px);
}

.smart-modal-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.smart-modal-tab {
  min-width: 88px;
  min-height: 38px;
  border: 1px solid #DBEAFE;
  border-radius: 999px;
  background: #fff;
  padding: 0 16px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.smart-modal-tab.active {
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}

.smart-modal-panel {
  padding: 18px 16px;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
}

.smart-confirm-body {
  padding: 28px 24px 24px;
}

.smart-confirm-title {
  text-align: center;
  font-size: 20px;
  line-height: 1.4;
  color: #374151;
  margin-bottom: 12px;
}

.smart-confirm-desc {
  text-align: center;
  font-size: 14px;
  line-height: 1.6;
  color: #6B7280;
  margin-bottom: 20px;
}

.smart-confirm-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.smart-factory-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.smart-factory-card {
  min-height: 148px;
  border: 1px solid #E5E7EB;
  border-radius: 18px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  cursor: pointer;
}

.smart-factory-icon {
  width: 72px;
  height: 72px;
  border: 1px solid #D1D5DB;
  background:
    linear-gradient(45deg, transparent calc(50% - 0.5px), #D1D5DB 50%, transparent calc(50% + 0.5px)),
    linear-gradient(-45deg, transparent calc(50% - 0.5px), #D1D5DB 50%, transparent calc(50% + 0.5px));
}

.smart-factory-label {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.smart-factory-actions {
  margin-top: 22px;
}

.smart-factory-exit {
  width: 100%;
}

.smart-toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  max-width: calc(100vw - 48px);
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.88);
  color: #fff;
  font-size: 13px;
  line-height: 1.4;
  text-align: center;
  z-index: 2001;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
}

.smart-auth-duration {
  margin-bottom: 18px;
}

.smart-auth-label,
.smart-ui-update-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.smart-auth-inputs {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.smart-auth-input {
  min-width: 0;
}

.smart-auth-unit {
  font-size: 16px;
  color: #374151;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-size: 16px;
  color: #374151;
}

.fw-btn.danger {
  background: #ef4444;
  color: #fff;
}

.smart-subview-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: transparent;
  border: none;
  box-shadow: none;
}

.smart-subview-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0;
  background: transparent;
  border-right: none;
}

.smart-subview-item {
  min-width: 88px;
  min-height: 38px;
  border: 1px solid #DBEAFE;
  border-radius: 999px;
  background: #fff;
  text-align: center;
  padding: 0 16px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.smart-subview-item.active {
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}

.smart-subview-content {
  padding: 18px 16px;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.subview-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.smart-connection-group {
  margin-top: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 44px;
  padding: 6px 0;
  border-bottom: 1px solid #F3F4F6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label-text,
.info-value-text {
  font-size: 14px;
  color: #374151;
}

.info-label-text {
  font-weight: 500;
}

.info-value-text {
  color: #6B7280;
  text-align: right;
}

.update-badge {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 600;
  background: #FEF3C7;
  color: #92400E;
}

.firmware-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.firmware-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: #6B7280;
}

.firmware-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 10px 12px;
}

.version-label {
  font-size: 13px;
  color: #6B7280;
}

.version-value {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.firmware-status {
  font-size: 13px;
  color: #6B7280;
  text-align: center;
  padding: 8px 10px;
  border-radius: 8px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
}

.firmware-status.available {
  background: #EFF6FF;
  border-color: #BFDBFE;
  color: #1D4ED8;
}

.firmware-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  padding: 10px 12px;
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
}

.step-item.pending {
  opacity: 0.7;
}

.step-item.active {
  border-color: #BFDBFE;
  background: #EFF6FF;
}

.step-item.done {
  border-color: #A7F3D0;
  background: #ECFDF5;
}

.step-index {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
  background: #9CA3AF;
}

.step-item.active .step-index {
  background: #2563EB;
}

.step-item.done .step-index {
  background: #10B981;
}

.step-text {
  font-size: 14px;
  color: #1F2937;
  font-weight: 500;
}

.transfer-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px 0 4px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: #E5E7EB;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(135deg, #2563EB, #1D4ED8);
  width: 0%;
  transition: width 0.2s ease;
}

.progress-text {
  width: 44px;
  text-align: right;
  font-size: 12px;
  color: #6B7280;
  font-variant-numeric: tabular-nums;
}

.firmware-actions {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.fw-btn {
  border: none;
  border-radius: 8px;
  height: 44px;
  padding: 0 16px;
  min-width: 160px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fw-btn.primary {
  background: #2563EB;
  color: #FFFFFF;
}

.fw-btn.primary:active:not(:disabled) {
  background: #1D4ED8;
  transform: scale(0.98);
}

.fw-btn.secondary {
  background: #F3F4F6;
  color: #374151;
}

.fw-btn.secondary:active:not(:disabled) {
  background: #E5E7EB;
  transform: scale(0.98);
}

.fw-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  margin-right: 8px;
}

.status-badge.activated {
  background: #D1FAE5;
  color: #065F46;
}

.status-badge.not_activated {
  background: #FEF3C7;
  color: #92400E;
}

.arrow-icon {
  font-size: 20px;
  color: #9CA3AF; /* 箭头颜色 */
}

/* 保存按钮 */
.save-section {
  margin-top: 24px;
}

.save-btn {
  width: 100%;
  background: #2563EB; /* 全局主色 */
  border: none;
  border-radius: 8px; /* 8px 圆角 */
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  height: 48px; /* 高度 48px */
  transition: all 0.2s ease;
}

.save-btn:active:not(:disabled) {
  background: #1D4ED8;
  transform: scale(0.98);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.modal-content {
  background: white;
  border-radius: 8px; /* 8px 圆角 */
  width: 90%;
  max-width: 340px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); /* 悬浮阴影 */
  display: flex;
  flex-direction: column;
  padding: 24px; /* 统一内边距 */
}

.factory-mode-modal {
  max-width: 340px;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px; /* 标题底部间距 */
  flex-shrink: 0;
  background: white;
  padding: 0; /* 移除 header padding，由 container 统一管理 */
  border-bottom: none; /* 移除分割线 */
}

.modal-title {
  font-size: 18px;
  font-weight: bold; /* 加粗 */
  color: #1F2937;
  margin: 0;
  text-align: left;
}

.modal-close {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #6B7280; /* 文字颜色 */
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px; /* 4px 圆角 */
  transition: background-color 0.2s;
}

.modal-close:active {
  background: #F9FAFB; /* 点击反馈 */
  transform: scale(0.96);
}

.modal-body {
  padding: 0; /* 移除 body padding，由 container 统一管理 */
  overflow-y: auto;
}

/* 信息列表 */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 8px; /* 最小间距 8px */
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F9FAFB;
  border-radius: 6px;
  border: 1px solid #E5E7EB;
}

.info-label {
  font-size: 14px;
  color: #6B7280;
}

.info-value {
  font-size: 14px;
  color: #1F2937;
  font-weight: 600;
}

/* 按钮统一 */
.activate-btn,
.change-password-btn,
.factory-reset-btn,
.unlock-btn,
.verify-btn,
.save-auth-btn {
  width: 100%;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 0 16px;
  transition: all 0.2s ease;
  margin-top: 16px; /* 按钮顶部间距 16px */
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 主色按钮 */
.activate-btn,
.change-password-btn,
.verify-btn,
.save-auth-btn {
  background: #2563EB;
  color: white;
  height: 48px;
}

.activate-btn:active,
.change-password-btn:active,
.verify-btn:active,
.save-auth-btn:active {
  background: #1D4ED8;
  transform: scale(0.98);
}

/* 危险操作按钮 */
.factory-reset-btn {
  background: #EF4444; /* 错误红 */
  color: white;
  height: 48px;
}

.factory-reset-btn:active {
  background: #DC2626;
  transform: scale(0.98);
}

/* 橙色按钮 */
.unlock-btn {
  background: #2563EB;
  color: white;
  height: 44px;
  border-radius: 6px;
}

.unlock-btn:active {
  background: #1D4ED8;
  transform: scale(0.98);
}

/* 警告区域 */
.warning-section {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #FFFBEB; /* 浅黄 */
  border: 1px solid #FED7AA;
  border-radius: 6px;
  margin-bottom: 16px;
}

.warning-icon {
  color: #92400E; /* 深褐 */
  font-size: 24px;
  flex-shrink: 0;
}

.warning-text {
  flex: 1;
}

.warning-text p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #92400E;
}

.warning-text ul {
  margin: 8px 0;
  padding-left: 16px;
}

.warning-text li {
  font-size: 12px;
  color: #92400E;
  margin-bottom: 4px;
}

.warning-note {
  font-weight: 700;
  color: #EF4444 !important;
}

/* 表单输入框 */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #374151;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  color: #1F2937;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #2563EB;
  background: white;
}

/* 工厂模式样式优化 - V2 */
/* .factory-operations { */
  /* padding 由 modal-body 统一管理 */
/* } */

/* 选项卡区域 - 独立按钮风格 */
.factory-tabs-container {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
  background: transparent;
  padding: 0;
}

.factory-tab-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  background: #F9FAFB;
  color: #6B7280;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0;
}

.factory-tab-item.active {
  background: #2563EB;
  color: white;
  font-weight: 500;
  box-shadow: none;
}

/* 内容区域 */
.factory-content-area {
  margin-bottom: 16px; /* 底部间距 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content-subtitle {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
  text-align: center;
  margin: 0 0 16px 0;
}

/* 中线校准布局 */
.calibration-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 240px;
}

.axis-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.axis-label {
  font-size: 14px;
  color: #4B5563;
  font-weight: 500;
}

.axis-control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-btn {
  width: 32px;
  height: 32px; /* 32px */
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4B5563;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: none;
}

.control-btn:active {
  background: #E5E7EB;
  transform: scale(0.96);
}

.value-display {
  width: 60px;
  height: 32px; /* 32px */
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #1F2937;
  font-weight: 600;
}

/* 区域捕捉 & 背光校正布局 */
.grid-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 260px;
}

.grid-row {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.grid-btn {
  width: 72px;
  height: 48px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  transition: all 0.2s;
}

.grid-btn:active {
  background: #E5E7EB;
  border-color: #E5E7EB;
  color: #374151;
  transform: scale(0.98);
}

/* 底部按钮组 */
.factory-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.footer-btn {
  flex: 1;
  height: 36px; /* 稍微减小高度以适应布局，或者保持40px */
  background: #2563EB;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.footer-btn:active {
  background: #1D4ED8;
  transform: scale(0.98);
}

.footer-btn.secondary {
  background: #F9FAFB;
  border: none;
  color: #6B7280;
}

.footer-btn.secondary:active {
  background: #E5E7EB;
  color: #6B7280;
  transform: scale(0.98);
}

/* 密码输入区域说明 */
.input-info p {
  font-size: 14px;
  color: #6B7280;
  margin: 0 0 16px 0;
}

/* 授权设置弹窗样式 */
.auth-section {
  margin-bottom: 24px;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 12px 0;
}

.setting-item.no-border {
  border-bottom: none;
  padding: 8px 0;
}

.password-change-section {
  margin-top: 8px;
}

.change-password-link {
  background: none;
  border: none;
  color: #2563EB;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  font-weight: 500;
}

.change-password-link:active {
  opacity: 0.7;
}

.auth-time-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0; /* 移除内边距，因为不需要背景容器了 */
  border: none; /* 移除边框 */
  background: transparent; /* 移除背景 */
}

.auth-time-container .adjust-btn {
  width: 32px;
  height: 32px; /* 确保高度一致 */
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  color: #6B7280;
}

.auth-time-container .setting-value {
  width: 60px;
  height: 32px; /* 高度对齐 */
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 8px; /* 间距 */
}

.time-control-group {
  display: flex;
  align-items: center;
  /* gap: 12px; 由 margin 控制 */
}

.time-unit-select {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 0 12px;
  height: 32px; /* 高度对齐 */
  font-size: 14px;
  color: #1F2937;
  min-width: 80px;
  outline: none;
  transition: border-color 0.2s;
}

.time-unit-select:focus {
  border-color: #2563EB;
}

/* 保存授权设置按钮 */
.save-auth-btn {
  width: 100%;
  background: #2563EB;
  color: white;
  border: none;
  border-radius: 8px;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 24px; /* 增加顶部间距 */
}

/* Action Sheet Styles */
.action-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end; /* 底部对齐 */
  justify-content: center; /* 水平居中 */
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.action-sheet-content {
  width: 100%;
  max-width: 373px;
  background: #FFFFFF;
  border-radius: 16px 16px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  animation: slideUp 0.3s ease;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.action-sheet-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
  position: relative;
}

.action-sheet-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

.action-sheet-close {
  position: absolute;
  right: 16px;
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #9CA3AF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.language-list {
  padding: 8px 0;
}

.language-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.language-item:active {
  background: #F9FAFB;
}

.language-item.active {
  background: #F0F9FF;
}

.language-name {
  font-size: 16px;
  color: #374151;
}

.language-item.active .language-name {
  color: #2563EB;
  font-weight: 500;
}

.check-icon {
  font-size: 20px;
  color: #2563EB;
}

/* Date Input Styling */
.date-input {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  color: #1F2937;
  outline: none;
  font-family: inherit;
  cursor: pointer;
}

.date-input:focus {
  border-color: #2563EB;
}

.modal-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  line-height: 1.4;
  white-space: pre-line;
}

.network-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.network-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  background: #F9FAFB;
}

.network-info-label {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.network-info-value {
  font-size: 13px;
  font-weight: 800;
  color: #111827;
  font-variant-numeric: tabular-nums;
}

.setting-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-container.smart-system-app {
  width: min(375px, calc(100vw - 24px));
  max-width: 375px;
  box-sizing: border-box;
  border-radius: 22px;
}

/* Smart OTDR uses the same settings dialog geometry as the dedicated devices. */
.smart-modal-overlay .smart-mobile-modal {
  width: min(100%, 320px);
  max-width: 320px;
  max-height: min(680px, calc(100% - 24px));
  padding: 16px;
  border: 1px solid #d8e2ef;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.24);
  backdrop-filter: none;
}

.smart-modal-overlay .smart-mobile-modal .modal-header {
  min-height: 48px;
  margin: -4px 0 12px;
  padding: 0 0 12px;
  border-bottom: 1px solid #d8e2ef;
}

.smart-modal-overlay .smart-mobile-modal .modal-close {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: transparent;
}

.smart-modal-overlay .smart-mobile-modal .modal-body {
  padding: 0;
}

.smart-modal-overlay .smart-mobile-modal .fw-btn {
  min-height: 44px;
  border-radius: 8px;
}

.smart-remote-entry {
  width: 100%; min-height: 58px; display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-top: 4px; padding: 10px 12px; border: 1px solid #bfdbfe; border-radius: 8px;
  background: #eff6ff; color: #0f172a; text-align: left;
}
.smart-remote-entry span { display: grid; gap: 3px; }
.smart-remote-entry strong { font-size: 12px; }
.smart-remote-entry small { color: #64748b; font-size: 10px; }
.smart-remote-entry b { color: #2563eb; font-size: 11px; }
.smart-remote-entry:disabled { border-color: #e2e8f0; background: #f8fafc; opacity: .55; }
.smart-remote-status { display: grid; gap: 4px; padding: 12px; border: 1px solid #fde68a; border-radius: 8px; background: #fffbeb; }
.smart-remote-status > span { display: flex; align-items: center; gap: 7px; }
.smart-remote-status i { width: 8px; height: 8px; border-radius: 50%; background: #d97706; }
.smart-remote-status strong { font-size: 12px; }
.smart-remote-status small { color: #64748b; font-size: 10px; line-height: 1.5; }
.smart-remote-status.online { border-color: #bbf7d0; background: #f0fdf4; }
.smart-remote-status.online i { background: #16a34a; }
.smart-remote-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 12px 0; padding: 4px; border-radius: 8px; background: #eef2f7; }
.smart-remote-tabs button { min-height: 40px; border: 0; border-radius: 6px; background: transparent; color: #64748b; font-size: 11px; font-weight: 700; }
.smart-remote-tabs button.active { background: #fff; color: #2563eb; box-shadow: 0 3px 8px rgba(15,23,42,.08); }
.smart-remote-list { overflow: hidden; border: 1px solid #d8e2ef; border-radius: 8px; }
.smart-remote-list div { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; border-bottom: 1px solid #e2e8f0; }
.smart-remote-list div:last-child { border-bottom: 0; }
.smart-remote-list span { color: #64748b; font-size: 11px; }
.smart-remote-list strong { font-size: 11px; font-variant-numeric: tabular-nums; }
.smart-remote-parameter-form { display: grid; gap: 8px; }
.smart-remote-parameter-form label { min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 7px 10px; border: 1px solid #d8e2ef; border-radius: 8px; background: #fff; }
.smart-remote-parameter-form span { color: #64748b; font-size: 11px; }
.smart-remote-parameter-form select { min-width: 132px; min-height: 36px; padding: 0 9px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; color: #0f172a; font-size: 11px; }
.smart-remote-parameter-form > button { min-height: 44px; border: 0; border-radius: 8px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; }
.smart-remote-files { display: grid; gap: 7px; }
.smart-remote-files button { min-height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border: 1px solid #d8e2ef; border-radius: 8px; background: #fff; text-align: left; }
.smart-remote-files span { display: grid; gap: 3px; }
.smart-remote-files strong { font-size: 11px; }
.smart-remote-files small, .smart-remote-files b { color: #64748b; font-size: 10px; }
.smart-remote-primary { width: 100%; min-height: 46px; margin-top: 12px; border: 0; border-radius: 8px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 700; }
.smart-remote-note { margin: 8px 0 0; color: #64748b; font-size: 9px; line-height: 1.5; text-align: center; }

.smart-upgrade-methods { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 14px 0 18px; }
.smart-upgrade-methods label { min-height: 70px; display: grid; place-items: center; align-content: center; gap: 4px; padding: 8px; border: 1px solid #d8e2ef; border-radius: 8px; background: #fff; color: #334155; font-size: 11px; font-weight: 700; }
.smart-upgrade-methods label.active { border-color: #60a5fa; background: #eff6ff; color: #2563eb; }
.smart-upgrade-methods input { position: absolute; opacity: 0; pointer-events: none; }
.smart-upgrade-methods small { color: #64748b; font-size: 9px; font-weight: 500; }
.smart-upgrade-progress { height: 8px; margin: 14px 0 18px; overflow: hidden; border-radius: 999px; background: #e2e8f0; }
.smart-upgrade-progress i { display: block; height: 100%; border-radius: inherit; background: #2563eb; transition: width .2s ease; }

.smart-ui-file-picker { min-height: 50px; display: flex; align-items: center; padding: 9px 12px; margin-bottom: 12px; border: 1px dashed #93c5fd; border-radius: 8px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; }
.smart-ui-file-picker input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.smart-ui-file-picker span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
