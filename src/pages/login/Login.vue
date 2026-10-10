<template>
  <AuthPageShell :title="copy.welcome" :subtitle="copy.welcomeHint">
    <div class="auth-tabs" role="group" :aria-label="t('login.login')">
      <button v-for="mode in modes" :key="mode" type="button" :class="{ active: loginMode === mode }" :aria-pressed="loginMode === mode" :disabled="isLoading" @click="changeMode(mode)">{{ t(mode === 'phone' ? 'login.phoneLogin' : 'login.emailLogin') }}</button>
    </div>

    <form class="auth-form" novalidate @submit.prevent="handleLogin">
      <div class="auth-field">
        <label for="login-account">{{ loginMode === 'phone' ? copy.phone : copy.email }}</label>
        <div class="auth-input-shell" :class="{ 'has-error': errors.account }">
          <input :key="loginMode" id="login-account" v-model.trim="account" :type="loginMode === 'phone' ? 'tel' : 'email'" :inputmode="loginMode === 'phone' ? 'tel' : 'email'" :maxlength="loginMode === 'phone' ? 11 : 254" autocomplete="username" autocapitalize="none" :spellcheck="false" :placeholder="t(loginMode === 'phone' ? 'login.inputPhone' : 'login.inputEmail')" :aria-invalid="!!errors.account || undefined" :aria-describedby="errors.account ? 'login-account-error' : undefined" :disabled="isLoading" />
        </div>
        <p v-if="errors.account" id="login-account-error" class="auth-field-error" role="alert">{{ errors.account }}</p>
      </div>

      <div class="auth-field">
        <label for="login-credential">{{ loginMode === 'phone' ? copy.code : copy.password }}</label>
        <div v-if="loginMode === 'phone'" class="auth-input-shell auth-code" :class="{ 'has-error': errors.credential }">
          <input id="login-credential" v-model.trim="loginForm.verifyCode" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" :placeholder="t('login.inputCode')" :aria-invalid="!!errors.credential || undefined" :aria-describedby="errors.credential ? 'login-credential-error' : undefined" :disabled="isLoading" />
          <button type="button" class="auth-send-code" :disabled="!canSendCode || isLoading || sendingCode" @click="sendVerifyCode">{{ verifyButtonText }}</button>
        </div>
        <AuthPasswordField v-else id="login-credential" v-model="loginForm.password" autocomplete="current-password" :placeholder="t('login.inputPassword')" :invalid="!!errors.credential" :describedby="errors.credential ? 'login-credential-error' : undefined" :disabled="isLoading" />
        <p v-if="errors.credential" id="login-credential-error" class="auth-field-error" role="alert">{{ errors.credential }}</p>
      </div>

      <div v-if="loginMode === 'email'" class="auth-recovery"><button type="button" @click="router.push({path:'/reset-password',query:{account:loginForm.email,redirect:router.currentRoute.value.query.redirect}})">忘记密码？</button></div>
      <AccountAgreement v-model="agreementAccepted" />
      <p v-if="loginError" class="auth-feedback auth-feedback--error" role="alert">{{ loginError }}</p>
      <p v-if="successMessage" class="auth-feedback auth-feedback--success" role="status">{{ successMessage }}</p>
      <button type="submit" class="auth-submit" :disabled="isLoading">{{ isLoading ? t('login.loggingIn') : t('login.login') }}</button>
    </form>
    <div class="auth-switch"><span>{{ t('login.noAccount') }}</span><button type="button" :disabled="isLoading" @click="router.push({ path: '/register', query: router.currentRoute.value.query })">{{ t('login.registerNow') }}</button></div>
  </AuthPageShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import AccountAgreement from '@/components/AccountAgreement.vue'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import AuthPageShell from '@/components/AuthPageShell.vue'
import AuthPasswordField from '@/components/AuthPasswordField.vue'
import { useAuthCopy } from '@/composables/useAuthCopy'
const copy = useAuthCopy()

const { t } = useI18n()
const router = useRouter()
const { loginWithPhone, loginWithEmail } = useAuth()

const agreementAccepted = ref(false)
const isLoading = ref(false)
const loginError = ref('')
const successMessage = ref('')
let countdownTimer: ReturnType<typeof setInterval> | undefined
let messageTimer: ReturnType<typeof setTimeout> | undefined
let loginTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => { clearInterval(countdownTimer); clearTimeout(messageTimer); clearTimeout(loginTimer) })
const countdown = ref(0)
const loginMode = ref<'phone' | 'email'>('phone')
const modes = ['phone', 'email'] as const
const sendingCode = ref(false)
const changeMode = (mode: 'phone' | 'email') => {
  loginMode.value = mode
  errors.account = ''; errors.credential = ''; loginError.value = ''; successMessage.value = ''
}
const account = computed({
  get: () => loginMode.value === 'phone' ? loginForm.phone : loginForm.email,
  set: (value: string) => { if (loginMode.value === 'phone') loginForm.phone = value; else loginForm.email = value }
})

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
  if (!canSendCode.value || sendingCode.value) return
  sendingCode.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    successMessage.value = t('login.codeSent')
    loginError.value = ''
    
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
      }
    }, 1000)
    
    messageTimer = setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    loginError.value = t('register.codeSendFailed')
  } finally {
    sendingCode.value = false
  }
}

const handleLogin = async () => {
  if (isLoading.value) return
  loginError.value = ''
  successMessage.value = ''
  
  if (!validateForm()) return
  if (!agreementAccepted.value) { loginError.value = t('login.agreementRequired'); return }

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
      
      loginTimer = setTimeout(async () => {
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

<style scoped>.auth-recovery{display:flex;justify-content:flex-end}.auth-recovery button{min-height:44px;padding:4px 0 4px 16px;border:0;background:transparent;color:#2563eb;font-size:14px;cursor:pointer}</style>
