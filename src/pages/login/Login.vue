<template>
  <div class="app-container login-page">
    <div class="content-flex hide-scrollbar">
      <div class="login-scroll-content">
        <div class="login-card">
          <!-- Logo 区域 -->
          <div class="logo-section">
            <img :src="logoImg" alt="Logo" class="login-logo" />
          </div>

          <div class="login-content">
            <div class="login-header">
              <h1 class="login-title">{{ t('login.title') }}</h1>
              <div class="login-tabs">
                <div 
                  class="tab-item" 
                  :class="{ active: loginMode === 'phone' }"
                  @click="loginMode = 'phone'"
                >
                  {{ t('login.phoneLogin') }}
                </div>
                <div 
                  class="tab-item" 
                  :class="{ active: loginMode === 'email' }"
                  @click="loginMode = 'email'"
                >
                  {{ t('login.emailLogin') }}
                </div>
              </div>
            </div>

            <form @submit.prevent="handleLogin" class="form-content">
              <!-- 手机号/邮箱输入框 -->
              <div class="input-group">
                <input
                  v-if="loginMode === 'phone'"
                  v-model="loginForm.phone"
                  type="tel"
                  :placeholder="t('login.inputPhone')"
                  class="form-input"
                  maxlength="11"
                />
                <input
                  v-else
                  v-model="loginForm.email"
                  type="email"
                  :placeholder="t('login.inputEmail')"
                  class="form-input"
                />
                <div v-if="errors.account" class="error-message">{{ errors.account }}</div>
              </div>

              <!-- 验证码/密码输入框 -->
              <div class="input-group">
                <div v-if="loginMode === 'phone'" class="verify-wrapper">
                  <input
                    v-model="loginForm.verifyCode"
                    type="text"
                    :placeholder="t('login.inputCode')"
                    class="form-input verify-input"
                    maxlength="6"
                  />
                  <button
                    type="button"
                    class="verify-button"
                    @click="sendVerifyCode"
                    :disabled="!canSendCode || isLoading"
                  >
                    {{ verifyButtonText }}
                  </button>
                </div>
                <input
                  v-else
                  v-model="loginForm.password"
                  type="password"
                  :placeholder="t('login.inputPassword')"
                  class="form-input"
                />
                <div v-if="errors.credential" class="error-message">{{ errors.credential }}</div>
              </div>

              <!-- 登录按钮 -->
              <button
                type="submit"
                class="login-button"
                :disabled="isLoading"
              >
                {{ isLoading ? t('login.loggingIn') : t('login.login') }}
              </button>

              <!-- 错误提示 -->
              <div v-if="loginError" class="login-error">
                {{ loginError }}
              </div>

              <!-- 成功提示 -->
              <div v-if="successMessage" class="success-message">
                {{ successMessage }}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import logoImg from '@/assets/img/logo.png'

const { t } = useI18n()
const router = useRouter()
const { loginWithPhone, loginWithEmail } = useAuth()

const isLoading = ref(false)
const loginError = ref('')
const successMessage = ref('')
const countdown = ref(0)
const loginMode = ref<'phone' | 'email'>('phone')

const loginForm = reactive({
  phone: '',
  verifyCode: '',
  email: '',
  password: ''
})

const errors = reactive({
  account: '',
  credential: ''
})

const canSendCode = computed(() => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return loginMode.value === 'phone' && phoneRegex.test(loginForm.phone) && countdown.value === 0
})

const verifyButtonText = computed(() => {
  return countdown.value > 0 ? t('login.resend', { time: countdown.value }) : t('login.getCode')
})

const validateForm = () => {
  errors.account = ''
  errors.credential = ''
  
  if (loginMode.value === 'phone') {
    if (!loginForm.phone.trim()) {
      errors.account = t('login.inputPhone')
      return false
    }
    
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(loginForm.phone)) {
      errors.account = t('login.invalidPhone')
      return false
    }
    
    if (!loginForm.verifyCode.trim()) {
      errors.credential = t('login.inputCode')
      return false
    }
    
    if (loginForm.verifyCode.length !== 6) {
      errors.credential = t('login.codeError')
      return false
    }
  } else {
    if (!loginForm.email.trim()) {
      errors.account = t('login.inputEmail')
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(loginForm.email)) {
      errors.account = t('login.invalidEmail')
      return false
    }
    
    if (!loginForm.password.trim()) {
      errors.credential = t('login.inputPassword')
      return false
    }
    
    if (loginForm.password.length < 6) {
      errors.credential = t('login.passwordTooShort')
      return false
    }
  }
  
  return true
}

const sendVerifyCode = async () => {
  if (!canSendCode.value) return
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    successMessage.value = t('login.codeSent')
    loginError.value = ''
    
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    loginError.value = '发送验证码失败，请稍后重试'
  }
}

const handleLogin = async () => {
  loginError.value = ''
  successMessage.value = ''
  
  if (!validateForm()) return

  try {
    isLoading.value = true
    let result
    if (loginMode.value === 'phone') {
      result = await loginWithPhone(loginForm.phone, loginForm.verifyCode)
    } else {
      result = await loginWithEmail(loginForm.email, loginForm.password)
    }

    if (result.success) {
      if (result.isNewUser) {
        successMessage.value = t('login.registerSuccess')
      } else {
        successMessage.value = t('login.loginSuccess')
      }
      
      setTimeout(async () => {
        const redirect = router.currentRoute.value.query.redirect as string
        await router.push(redirect || '/')
      }, 1500)
    } else {
      loginError.value = result.message || t('login.loginFailed')
    }
  } catch (error) {
    loginError.value = t('login.loginFailed')
  } finally {
    isLoading.value = false
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

.content-flex {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.login-scroll-content {
  padding: 80px 24px 40px 24px;
  min-height: 100%; /* 确保内容撑开 */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 滚动条隐藏 */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.login-card {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  width: 100%;
  max-width: 100%;
  margin: 0;
  box-sizing: border-box;
  flex: 1; /* 占据剩余空间 */
  display: flex;
  flex-direction: column;
}

.logo-section {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}

.login-logo {
  width: 120px;
  height: auto;
  object-fit: contain;
}

.login-content {
  flex: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.login-tabs {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.tab-item {
  font-size: 18px;
  color: #6B7280;
  cursor: pointer;
  padding-bottom: 8px;
  position: relative;
  transition: all 0.2s ease;
  font-weight: 500;
}

.tab-item.active {
  color: #2563EB;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #2563EB;
  border-radius: 2px;
}

.tab-item:hover {
  color: #2563EB;
}

.form-content {
  margin-bottom: 0;
}

.input-group {
  margin-bottom: 16px;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 18px;
  background: #F9FAFB;
  transition: all 0.2s ease;
  box-sizing: border-box;
  color: #1F2937;
}

.form-input:focus {
  outline: none;
  border-color: #2563EB;
  background: #FFFFFF;
}

.form-input::placeholder {
  color: #9CA3AF;
}

.verify-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.verify-input {
  padding-right: 120px !important;
}

.verify-button {
  position: absolute;
  right: 0;
  top: 0;
  height: 48px;
  background: #F3F4F6;
  border: none;
  border-radius: 6px;
  color: #6B7280;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 0 16px;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.verify-button:hover:not(:disabled) {
  background: #E5E7EB;
}

.verify-button:disabled {
  background: #E5E7EB;
  color: #9CA3AF;
  cursor: not-allowed;
}

.error-message {
  color: #EF4444;
  font-size: 15px;
  margin-top: 6px;
  margin-left: 2px;
}

.login-button {
  width: 100%;
  height: 52px;
  background: #2563EB;
  border: none;
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 24px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.24);
}

.login-button:hover:not(:disabled) {
  background: #1D4ED8;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

.login-button:active:not(:disabled) {
  background: #1D4ED8;
  filter: brightness(0.95);
  transform: none;
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-error {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 12px;
  margin-top: 20px;
  color: #991B1B;
  font-size: 16px;
  text-align: center;
}

.success-message {
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
  border-radius: 8px;
  padding: 12px;
  margin-top: 20px;
  color: #065F46;
  font-size: 16px;
  text-align: center;
}
</style>
