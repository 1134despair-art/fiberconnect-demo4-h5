<template>
  <div class="app-container legacy-app-page workspace-page workspace-secondary profile-page">
    <!-- 顶部标题栏 -->
    <WorkspaceHeader :title="t('profile.title')" @back="router.push('/settings')">
      <button @click="handleLogout" class="profile-logout" :aria-label="t('profile.logout')" :title="t('profile.logout')"><LocalIcon class="iconify" name="mdi:logout" /></button>
    </WorkspaceHeader>
    
    <!-- 主内容区域 -->
    <div class="content-flex hide-scrollbar">
      <div class="p-4">
        <!-- 用户信息卡片 -->
        <div class="profile-header mb-4">
          <div class="profile-content">
            <div class="avatar-container">
              <UserAvatar :src="user?.avatar" :name="user?.name" class="profile-avatar" />
              <button class="avatar-edit-btn" type="button" :aria-label="t('avatar.change')" @click="openAvatarEditor">
                <img :src="cameraIcon" alt="" />
              </button>
            </div>
            <div class="profile-info">
              <h2 class="profile-name">{{ user?.name }}</h2>
              <p class="profile-title" v-if="user?.title">{{ user?.title }}</p>
              <div class="profile-meta">
                <span class="meta-item" v-if="user?.phone">
                  <LocalIcon class="iconify" name="mdi:phone" />
                  {{ user?.phone }}
                </span>
                <span class="meta-item" v-if="user?.email">
                  <LocalIcon class="iconify" name="mdi:email" />
                  {{ user?.email }}
                </span>
                <span class="meta-item">
                  <LocalIcon class="iconify" name="mdi:account" />
                  {{ user?.role }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 技能标签 -->
        <div class="skills-section mb-4">
          <h3 class="section-title">{{ t('profile.skills') }}</h3>
          <div class="skills-container">
            <div
              v-for="skill in user?.skills"
              :key="skill"
              class="skill-tag"
            >
              {{ skill }}
            </div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-section mb-4">
          <h3 class="section-title">{{ t('profile.stats') }}</h3>
          <div class="stats-grid">
            <div
              v-for="stat in personalStats"
              :key="stat.id"
              class="stat-item"
            >
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <LocalIcon class="iconify" :name="stat.icon" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 功能菜单 -->
        <div class="menu-section mb-4">
          <h3 class="section-title">{{ t('profile.accountManage') }}</h3>
          <div class="menu-list">
            <div
              v-for="menu in menuItems"
              :key="menu.id"
              class="menu-item"
              @click="handleMenuClick(menu)"
            >
              <div class="menu-icon" :style="{ backgroundColor: menu.color }">
                <LocalIcon class="iconify" :name="menu.icon" />
              </div>
              <div class="menu-info">
                <div class="menu-title">{{ menu.title }}</div>
                <div class="menu-desc">{{ menu.description }}</div>
              </div>
              <LocalIcon class="iconify menu-arrow" name="mdi:chevron-right" />
            </div>
          </div>
        </div>

        <!-- 最近活动 -->
        <div class="activity-section">
          <h3 class="section-title">{{ t('profile.recentActivity') }}</h3>
          <div class="activity-list">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-icon" :style="{ backgroundColor: activity.color }">
                <LocalIcon class="iconify" :name="activity.icon" />
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <dialog ref="avatarDialog" class="profile-avatar-dialog" @close="avatarEditorOpen = false" :aria-label="t('avatar.change')" @click.self="avatarDialog?.close()">
      <h2>{{ t('avatar.change') }}</h2>
      <AvatarPicker v-if="avatarEditorOpen" v-model="avatarDraft" :name="user?.name || ''" :external-error="avatarSaveError" @processing="avatarProcessing = $event" />
      <div class="profile-avatar-actions">
        <button type="button" @click="avatarDialog?.close()">{{ t('avatar.cancel') }}</button>
        <button type="button" :disabled="avatarProcessing" @click="saveAvatar">{{ t('avatar.save') }}</button>
      </div>
    </dialog>
    <!-- 底部导航栏 -->
    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import LocalIcon from '@/components/LocalIcon.vue'
import { ref, computed, nextTick } from 'vue'
import AvatarPicker from '@/components/AvatarPicker.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import cameraIcon from '@/assets/icons/iconfont/device/camera.svg'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { useModal } from '@/composables/useModal'
import { useI18n } from 'vue-i18n'
import BottomNavigation from '@/components/BottomNavigation.vue'
import WorkspaceHeader from '@/components/WorkspaceHeader.vue'
import '@/styles/subpages.css'

// 获取用户信息
const { user, logout, updateProfile } = useAuth()
const router = useRouter()
const { confirm } = useModal()
const { t } = useI18n()
const avatarDialog = ref<HTMLDialogElement | null>(null)
const avatarDraft = ref('')
const avatarEditorOpen = ref(false)
const avatarProcessing = ref(false)
const avatarSaveError = ref('')
const openAvatarEditor = async () => {
  avatarDraft.value = user.value?.avatar || ''
  avatarSaveError.value = ''
  avatarProcessing.value = false
  avatarEditorOpen.value = true
  await nextTick()
  avatarDialog.value?.showModal()
}
const saveAvatar = () => {
  if (avatarProcessing.value) return
  try { updateProfile({ avatar: avatarDraft.value }); avatarDialog.value?.close() }
  catch { avatarSaveError.value = t('avatar.saveError') }
}

// 个人统计数据
const personalStats = computed(() => [
  {
    id: 1,
    label: t('profile.daysLogged'),
    value: '128',
    icon: 'mdi:calendar-check',
    color: '#2F80ED'
  },
  {
    id: 2,
    label: t('profile.tasksCompleted'),
    value: '45',
    icon: 'mdi:check-circle',
    color: '#10B981'
  },
  {
    id: 3,
    label: t('profile.pointsEarned'),
    value: '2,340',
    icon: 'mdi:star',
    color: '#F59E0B'
  },
  {
    id: 4,
    label: t('profile.teamContribution'),
    value: '89%',
    icon: 'mdi:account-group',
    color: '#8B5CF6'
  }
])

// 菜单项目
const menuItems = computed(() => [
  {
    id: 1,
    title: t('profile.editProfile'),
    description: t('profile.editProfileDesc'),
    icon: 'mdi:account-edit',
    color: '#2F80ED',
    action: 'edit-profile'
  },
  {
    id: 2,
    title: t('profile.security'),
    description: t('profile.securityDesc'),
    icon: 'mdi:shield-account',
    color: '#10B981',
    action: 'security'
  },
  {
    id: 3,
    title: t('profile.privacy'),
    description: t('profile.privacyDesc'),
    icon: 'mdi:eye-settings',
    color: '#F59E0B',
    action: 'privacy'
  },
  {
    id: 4,
    title: t('profile.notifications'),
    description: t('profile.notificationsDesc'),
    icon: 'mdi:bell-cog',
    color: '#EF4444',
    action: 'notifications'
  }
])

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    title: '完成了项目评审任务',
    time: '2小时前',
    icon: 'mdi:clipboard-check',
    color: '#10B981'
  },
  {
    id: 2,
    title: '更新了个人资料',
    time: '1天前',
    icon: 'mdi:account-edit',
    color: '#2F80ED'
  },
  {
    id: 3,
    title: '参与了团队会议',
    time: '2天前',
    icon: 'mdi:video',
    color: '#8B5CF6'
  },
  {
    id: 4,
    title: '提交了工作报告',
    time: '3天前',
    icon: 'mdi:file-document',
    color: '#F59E0B'
  },
  {
    id: 5,
    title: '获得了技能认证',
    time: '1周前',
    icon: 'mdi:certificate',
    color: '#EF4444'
  }
])

/**
 * 处理菜单点击
 */
const handleMenuClick = (menu: any) => {
  console.log('点击菜单:', menu.action)
  // 这里可以根据不同的action执行不同的操作
  switch (menu.action) {
    case 'edit-profile':
      // 跳转到编辑资料页面
      break
    case 'security':
      // 跳转到安全设置页面
      break
    case 'privacy':
      // 跳转到隐私设置页面
      break
    case 'notifications':
      // 跳转到通知设置页面
      break
    default:
      break
  }
}

/**
 * 处理退出登录
 */
const handleLogout = async () => {
  const confirmed = await confirm(t('profile.confirmLogout'), t('profile.logoutTitle'))
  if (confirmed) {
    await logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.avatar-edit-btn img { width: 16px; height: 16px; filter: brightness(0) invert(1); }
.profile-avatar-dialog { width: min(360px, calc(100vw - 32px)); padding: 22px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; box-sizing: border-box; }
.profile-avatar-dialog::backdrop { background: #17263c66; }
.profile-avatar-dialog h2 { margin: 0 0 24px; color: #17263c; font-size: 18px; }
.profile-avatar-actions { display: flex; gap: 12px; margin-top: 24px; }
.profile-avatar-actions button { flex: 1; min-height: 44px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; color: #475569; font-size: 14px; cursor: pointer; }
.profile-avatar-actions button:last-child { color: #fff; background: #2563eb; border-color: #2563eb; }
.profile-avatar-actions button:disabled { opacity: .5; }

.profile-logout { width: 36px; height: 36px; display: grid; place-items: center; border: 0; background: #fff; color: #af6262; font-size: 20px; }
.profile-page .p-4 { padding: 0 0 20px; }
.profile-page .profile-header { border-radius: 0; box-shadow: none; margin: 0 0 14px; }
.profile-page .profile-content { margin: 0; padding: 24px 20px; }
.profile-page .profile-avatar { width: 62px; height: 62px; border-width: 1px; box-shadow: none; }
.profile-page .profile-name { font-size: 19px; color: #2c3847; }
.profile-page .profile-title { font-size: 13px; }
.profile-page .profile-meta { flex-direction: column; gap: 8px; }
.profile-page .meta-item { overflow-wrap: anywhere; }
.profile-page .skills-section, .profile-page .stats-section, .profile-page .menu-section, .profile-page .activity-section { border: 0; border-radius: 0; box-shadow: none; padding: 20px; background: #fff; margin-bottom: 14px; }
.profile-page .skill-tag { padding: 4px 8px; border-radius: 4px; font-size: 11px; background: #edf4f9; color: #51738c; }
.profile-page .stats-grid { gap: 0; }
.profile-page .stat-item { padding: 14px 8px; gap: 8px; border-radius: 0; box-shadow: none; border-bottom: 1px solid #edf0f3; }
.profile-page .stat-icon { width: 26px; height: 26px; border-radius: 6px; font-size: 15px; }
.profile-page .stat-info, .profile-page .menu-info, .profile-page .activity-content { min-width: 0; }
.profile-page .stat-value { font-size: 17px; }
.profile-page .stat-label { font-size: 10px; line-height: 1.6; overflow-wrap: anywhere; }
.profile-page .menu-list, .profile-page .activity-list { border-radius: 0; box-shadow: none; }
.profile-page .menu-item, .profile-page .activity-item { padding: 16px 0; }
.profile-page .menu-icon, .profile-page .activity-icon { width: 32px; height: 32px; border-radius: 6px; font-size: 17px; }
.profile-page .menu-desc, .profile-page .activity-time { font-size: 11px; line-height: 1.7; }
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

/* 顶部标题栏 */
.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
  background: #EFF6FF;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1E3A8A;
  margin: 0;
}

.logout-btn {
  background: none;
  border: none;
  color: #2563EB;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 12px;
}

/* 个人资料头部 */
.profile-header {
  position: relative;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.profile-bg {
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.profile-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
}

.profile-content {
  position: relative;
  padding: 0 20px 20px;
  margin-top: -40px;
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  background: #2F80ED;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 14px;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: #1E293B;
  margin: 0 0 4px 0;
}

.profile-title {
  font-size: 14px;
  color: #64748B;
  margin: 0 0 12px 0;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748B;
}

/* 技能标签 */
.skills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  background: #F3F4F6;
  color: #374151;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

/* 统计信息 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #64748B;
}

/* 菜单列表 */
.menu-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: #F8FAFD;
}

.menu-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  margin-right: 12px;
  flex-shrink: 0;
}

.menu-info {
  flex: 1;
}

.menu-title {
  font-size: 14px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 2px;
}

.menu-desc {
  font-size: 12px;
  color: #64748B;
}

.menu-arrow {
  font-size: 16px;
  color: #94A3B8;
}

/* 最近活动 */
.activity-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  margin-right: 12px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  color: #1E293B;
  margin-bottom: 2px;
}

.activity-time {
  font-size: 12px;
  color: #64748B;
}

/* 区域标题 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
  margin: 0 0 12px 0;
}

/* 间距 */
.p-4 {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

/* 滚动条隐藏 */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
