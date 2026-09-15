<template>
  <div class="app-container legacy-app-page legacy-settings-page workspace-page workspace-dialogs">
    <!-- 顶部标题栏 -->
    <header class="workspace-header">
      <h1>{{ t('settings.title') }}</h1>
    </header>
    
    <!-- 主内容区域 -->
    <div class="content-flex hide-scrollbar">
      <div class="settings-workspace">
        <button class="settings-account" @click="showProfile" :aria-label="t('settings.profile')">
          <span class="account-avatar" aria-hidden="true">{{ user?.name?.slice(0, 1) || 'L' }}</span>
          <span class="account-copy"><strong>{{ user?.name }}</strong><small>{{ user?.phone || user?.email }}</small></span>
          <span class="iconify row-chevron" data-icon="mdi:chevron-right" aria-hidden="true"></span>
        </button>
        <!-- 个人资料 -->
        <div class="settings-section mb-4">
          <div class="settings-group">
            <button class="setting-item" @click="showProfile">
              <div class="setting-info">
                <div class="setting-icon">
                  <span class="iconify" data-icon="mdi:account-circle" style="color: #2563EB;"></span>
                </div>
                <div class="setting-content">
                  <div class="setting-title">{{ t('settings.profile') }}</div>
                  <div class="setting-desc">{{ t('settings.profileDesc') }}</div>
                </div>
              </div>
              <span class="iconify setting-arrow" data-icon="mdi:chevron-right"></span>
            </button>
          </div>
        </div>

        <!-- 语言设置 -->
        <div class="settings-section mb-4">
          <div class="settings-group">
            <button class="setting-item" @click="showLanguageModal = true">
              <div class="setting-info">
                <div class="setting-icon">
                  <span class="iconify" data-icon="mdi:translate" style="color: #10B981;"></span>
                </div>
                <div class="setting-content">
                  <div class="setting-title">{{ t('settings.language') }}</div>
                  <div class="setting-desc">{{ languageLabels[settings.language as keyof typeof languageLabels] }}</div>
                </div>
              </div>
              <span class="iconify setting-arrow" data-icon="mdi:chevron-right"></span>
            </button>
          </div>
        </div>



        <!-- 售后服务 -->
        <div class="settings-section mb-4 settings-group-start">
          <div class="settings-group">
            <button class="setting-item" @click="navigateToAfterSales">
              <div class="setting-info">
                <div class="setting-icon">
                  <span class="iconify" data-icon="mdi:headset" style="color: #F59E0B;"></span>
                </div>
                <div class="setting-content">
                  <div class="setting-title">{{ t('settings.afterSales') }}</div>
                  <div class="setting-desc">{{ t('settings.afterSalesDesc') }}</div>
                </div>
              </div>
              <span class="iconify setting-arrow" data-icon="mdi:chevron-right"></span>
            </button>
          </div>
        </div>

        <!-- 操作手册 -->
        <div class="settings-section mb-4">
          <div class="settings-group">
            <button class="setting-item" @click="navigateToOperationManual">
              <div class="setting-info">
                <div class="setting-icon manual-icon"><span class="iconify" data-icon="mdi:book-open-page-variant-outline"></span></div>
                <div class="setting-content">
                  <div class="setting-title">操作手册</div>
                  <div class="setting-desc">按类型查看操作手册</div>
                </div>
              </div>
              <span class="iconify setting-arrow" data-icon="mdi:chevron-right"></span>
            </button>
          </div>
        </div>

        <!-- 销售联系 -->
        <div class="settings-section mb-4">
          <div class="settings-group">
            <button class="setting-item" @click="showSalesContactModal = true">
              <div class="setting-info">
                <div class="setting-icon sales-icon"><span class="iconify" data-icon="mdi:phone-outline"></span></div>
                <div class="setting-content">
                  <div class="setting-title">销售联系</div>
                  <div class="setting-desc">联系人、电话和官方网站</div>
                </div>
              </div>
              <span class="iconify setting-arrow" data-icon="mdi:chevron-right"></span>
            </button>
          </div>
        </div>

        <!-- 关于应用 -->
        <div class="settings-section mb-4 settings-group-start">
          <div class="settings-group">
            <button class="setting-item" @click="showAbout">
              <div class="setting-info">
                <div class="setting-icon">
                  <span class="iconify" data-icon="mdi:information" style="color: #F59E0B;"></span>
                </div>
                <div class="setting-content">
                  <div class="setting-title">{{ t('settings.about') }}</div>
                  <div class="setting-desc">{{ t('settings.aboutDesc') }}</div>
                </div>
              </div>
              <span class="iconify setting-arrow" data-icon="mdi:chevron-right"></span>
            </button>
          </div>
        </div>

        <!-- 退出登录 -->
        <div class="logout-section">
          <button @click="handleLogout" class="logout-button">
            <span class="iconify" data-icon="mdi:logout"></span>
            {{ t('settings.logout') }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 底部导航栏 -->
    <BottomNavigation />

    <!-- 个人资料弹窗 -->
    <div v-if="showProfileModal" class="modal-overlay" @click="showProfileModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('settings.profile') }}</h3>
          <button @click="showProfileModal = false" class="modal-close" :aria-label="t('common.close')">
            <span class="iconify" data-icon="mdi:close" style="font-size: 20px;"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="profile-form">
            <div class="profile-form-avatar"><span class="account-avatar">{{ user?.name?.slice(0, 1) || 'L' }}</span><span class="account-copy"><strong>{{ user?.name }}</strong><small>{{ user?.phone || user?.email }}</small></span></div>
            <div class="form-group">
              <label class="form-label">{{ t('settings.name') }}</label>
              <input v-model="profileForm.name" type="text" class="form-input" :placeholder="t('settings.inputName')" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('settings.phone') }}</label>
              <input v-model="profileForm.phone" type="tel" class="form-input" :placeholder="t('settings.inputPhone')" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('settings.email') }}</label>
              <input v-model="profileForm.email" type="email" class="form-input" :placeholder="t('settings.inputEmail')" />
            </div>
            <div class="form-actions">
              <button @click="saveProfile" class="save-btn" :disabled="isSavingProfile">
                {{ isSavingProfile ? t('common.saving') : t('common.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 关于应用弹窗 -->
    <div v-if="showAboutModal" class="modal-overlay" @click="showAboutModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('settings.about') }}</h3>
          <button @click="showAboutModal = false" class="modal-close" :aria-label="t('common.close')">
            <span class="iconify" data-icon="mdi:close" style="font-size: 20px;"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="about-content">
            <div class="app-logo">
              <img :src="appLogo" class="about-logo" :alt="t('settings.appName')" />
            </div>
            <div class="app-info">
              <h4 class="app-name">{{ t('settings.appName') }}</h4>
              <div class="app-version">{{ t('settings.version') }} v1.0.0</div>
              <div class="app-description">
                {{ t('settings.appDescription') }}
              </div>
            </div>
            <div class="app-details">
              <div class="detail-item">
                <span class="detail-label">{{ t('settings.developer') }}:</span>
                <span class="detail-value">{{ t('settings.companyName') }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('settings.releaseDate') }}:</span>
                <span class="detail-value">2025年12月</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('settings.techSupport') }}:</span>
                <span class="detail-value">123456789</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 销售联系弹窗 -->
    <div v-if="showSalesContactModal" class="modal-overlay" @click="showSalesContactModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">销售联系</h3>
          <button class="modal-close" type="button" :aria-label="t('common.close')" @click="showSalesContactModal = false">×</button>
        </div>
        <div class="modal-body sales-contact-body">
          <div class="sales-contact-row"><span>销售联系人</span><strong>产品销售部</strong></div>
          <div class="sales-contact-row"><span>联系电话</span><strong>400-000-0000</strong></div>
          <div class="sales-contact-row"><span>官方网站</span><strong>www.liumada.com</strong></div>
        </div>
      </div>
    </div>

    <!-- 语言设置弹窗 (Action Sheet) -->
    <div v-if="showLanguageModal" class="action-sheet-overlay" @click="showLanguageModal = false">
      <div class="action-sheet-content" @click.stop>
        <div class="action-sheet-header">
          <div class="action-sheet-title">{{ t('settings.selectLanguage') }}</div>
          <button @click="showLanguageModal = false" class="action-sheet-close" :aria-label="t('common.close')">
            <span class="iconify" data-icon="mdi:close" style="font-size: 20px;"></span>
          </button>
        </div>
        <div class="language-list">
          <label
            v-for="(label, key) in languageLabels" 
            :key="key"
            class="language-item"
            :class="{ active: settings.language === key }"
          >
            <span class="language-name">{{ label }}</span>
            <input type="radio" name="app-language" :value="key" :checked="settings.language === key" @change="selectLanguage(key)" />
          </label>
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { useModal } from '@/composables/useModal'
import BottomNavigation from '@/components/BottomNavigation.vue'
import '@/styles/workspace.css'
import '@/styles/subpages.css'
import appLogo from '@/assets/img/logo.png'

// Router and authentication
const router = useRouter()
const { t, locale } = useI18n()
const { logout, user } = useAuth()
const { showModal, modalOptions, confirm, alert, handleConfirm, handleCancel } = useModal()

// Modal states
const showProfileModal = ref(false)
const showAboutModal = ref(false)
const showLanguageModal = ref(false)
const showSalesContactModal = ref(false)
const isSavingProfile = ref(false)

// Settings data
const settings = reactive({
  language: localStorage.getItem('locale_app') || localStorage.getItem('language') || 'zh-CN'
})

// Profile form
const profileForm = reactive({
  name: '',
  phone: '',
  email: ''
})

// Language labels
const languageLabels = {
  'zh-CN': '简体中文',
  'zh-TW': '繁体中文',
  'en': 'English'
}

/**
 * Show profile
 */
const showProfile = () => {
  // Load data from user info
  if (user.value) {
    profileForm.name = user.value.name || ''
    profileForm.phone = user.value.phone || ''
    profileForm.email = user.value.email || ''
  }
  showProfileModal.value = true
}

/**
 * Save profile
 */
const saveProfile = async () => {
  isSavingProfile.value = true
  try {
    // Simulate save process
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Here you can call API to save user info
    showProfileModal.value = false
    await alert(t('settings.successSaved') || '保存成功', t('common.success'))
  } catch (error) {
    await alert(t('settings.errorSave') || '保存失败', t('common.error'))
  } finally {
    isSavingProfile.value = false
  }
}

/**
 * Select language
 */
const selectLanguage = async (lang: string) => {
  settings.language = lang
  locale.value = lang
  localStorage.setItem('locale_app', lang)
  // 同时更新 legacy key 以保持兼容
  localStorage.setItem('language', lang)
  showLanguageModal.value = false
}

/**
 * Show about info
 */
const showAbout = () => {
  showAboutModal.value = true
}

/**
 * Navigate to after sales page
 */
const navigateToAfterSales = () => {
  router.push('/after-sales')
}

const navigateToOperationManual = () => {
  router.push('/operation-manual')
}

/**
 * Handle logout
 */
const handleLogout = async () => {
  const confirmed = await confirm(t('settings.confirmLogout'), t('settings.logout'))
  if (confirmed) {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
}
</script>

<style scoped>
.settings-workspace { padding-bottom: 20px; }
.settings-account { display: flex; align-items: center; gap: 13px; width: 100%; padding: 22px 20px; margin-bottom: 16px; text-align: left; background: white; border: 0; border-bottom: 1px solid #e9ebef; }
.settings-account .account-avatar { width: 52px; height: 52px; flex-basis: 52px; font-size: 21px; }
.settings-workspace .settings-section { margin: 0; padding: 0 20px; background: #fff; }
.settings-workspace .settings-group-start { margin-top: 14px; }
.settings-workspace .setting-item { width: 100%; min-height: 69px; margin: 0; padding: 13px 0; border: 0; border-bottom: 1px solid #eff0f3; border-radius: 0; box-shadow: none; text-align: left; gap: 10px; }
.settings-workspace .setting-item:hover { background: #fafbfc; }
.settings-workspace .setting-item:active { transform: none; }
.settings-workspace .setting-info, .settings-workspace .setting-content { min-width: 0; }
.settings-workspace .setting-icon { width: 34px; height: 34px; margin-right: 12px; font-size: 21px; border-radius: 8px; background: #f3f5f8; text-shadow: none; }
.settings-workspace .manual-icon { background: #fdf0ef; color: #bf5d55; }
.settings-workspace .sales-icon { background: #eaf6f1; color: #2c8969; }
.settings-workspace .setting-title { font-size: 14px; font-weight: 550; margin-bottom: 3px; line-height: 1.5; overflow-wrap: anywhere; }
.settings-workspace .setting-desc { font-size: 11px; color: #8a9099; line-height: 1.5; overflow-wrap: anywhere; }
.settings-workspace .setting-arrow { flex: 0 0 18px; font-size: 18px; }
.settings-workspace .logout-section { margin: 22px 20px 0; }
.settings-workspace .logout-button { height: 44px; border: 1px solid #e7e9ee; border-radius: 8px; background: #fff; box-shadow: none; color: #b95151; font-size: 13px; font-weight: 500; }
.settings-workspace .logout-button:active { background: #fdf0ef; }
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

/* Header styles */
.header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #E5E7EB;
  position: relative;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

/* Settings section */
.settings-section {
  margin-bottom: 16px;
}

.settings-group {
  background: transparent;
  border: none;
  border-radius: 0;
  overflow: visible;
  box-shadow: none;
}

/* Setting item */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  height: auto;
  min-height: 56px;
  box-sizing: border-box;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  margin-bottom: 12px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item:active {
  transform: scale(0.98);
}

.setting-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.setting-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 12px;
  flex-shrink: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
}

.manual-icon {
  width: 40px;
  height: 40px;
  background: #FEF2F2;
  color: #DC2626;
  font-size: 11px;
  font-weight: 800;
  text-shadow: none;
}

.sales-icon {
  color: #2563EB;
  text-shadow: none;
}

.sales-contact-body {
  padding-top: 8px;
}

.sales-contact-row {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #E5E7EB;
  font-size: 14px;
}

.sales-contact-row:last-child {
  border-bottom: 0;
}

.sales-contact-row span {
  color: #6B7280;
}

.sales-contact-row strong {
  color: #1F2937;
  text-align: right;
}

.setting-content {
  flex: 1;
}

.setting-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.4;
}

.setting-arrow {
  font-size: 20px;
  color: #9CA3AF;
}

/* Select box */
.setting-value {
  position: relative;
}

.setting-select {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  color: #1F2937;
  cursor: pointer;
  min-width: 120px;
}

.setting-select:focus {
  outline: none;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Logout button */
.logout-section {
  margin-top: 24px;
}

.logout-button {
  width: 100%;
  height: 52px;
  background: #EF4444;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.24);
}

.logout-button:active {
  background: #DC2626; /* Darker by ~5% */
  transform: scale(0.98);
}

/* Modal styles - Unified with Home.vue add-device-modal style */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* 加深遮罩，与截图一致 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(2px);
  box-sizing: border-box;
}

.modal-content {
  background: #FFFFFF; /* 纯白背景 */
  border-radius: 16px; /* 大圆角 */
  width: 100%;
  max-width: 300px; /* 限制宽度，与截图一致 */
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); /* 柔和阴影 */
  box-sizing: border-box;
  border: none; /* 移除边框 */
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #FFFFFF; /* 纯白背景 */
  border-bottom: none; /* 移除分割线，让界面更干净，或者用极淡的 #F3F4F6 */
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

.modal-close {
  background: transparent; /* 透明背景 */
  border: none; /* 无边框 */
  padding: 4px;
  cursor: pointer;
  color: #9CA3AF; /* 灰色图标 */
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
  transform: none;
}

.modal-body {
  padding: 20px;
  padding-top: 0; /* 减少顶部间距，因为header没有分割线 */
}

/* Profile form */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 16px;
  background: #FFFFFF;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input:read-only {
  background: #F9FAFB;
  color: #6B7280;
}

.form-actions {
  margin-top: 8px;
}

.save-btn {
  width: 100%;
  background: #2563EB;
  border: none;
  border-radius: 8px; /* 8px 圆角，与首页一致 */
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 14px 24px; /* 调整内边距 */
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
}

.save-btn:hover:not(:disabled) {
  background: #1D4ED8;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* About app content */
.about-content {
  text-align: center;
}

.app-logo {
  margin-bottom: 20px;
}

.app-info {
  margin-bottom: 24px;
}

.app-name {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 8px 0;
}

.app-version {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 12px;
}

.app-description {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.5;
}

.app-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #E5E7EB;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #6B7280;
}

.detail-value {
  font-size: 14px;
  color: #1F2937;
  font-weight: 500;
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
  max-width: 373px; /* 修改最大宽度为 373px */
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

/* 底部导航栏样式已移至 BottomNavigation 组件 */

/* Confirm Modal Styles */
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
</style>
