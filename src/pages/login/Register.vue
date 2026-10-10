<template>
  <AuthPageShell :title="t('register.title')" :subtitle="copy.registerHint" back @back="goLogin">
    <div class="auth-tabs" role="group" :aria-label="t('register.title')">
      <button v-for="mode in modes" :key="mode" type="button" :class="{ active: form.mode === mode }" :aria-pressed="form.mode === mode" :disabled="busy || success" @click="changeMode(mode)">{{ t(mode === 'phone' ? 'register.phoneRegister' : 'register.emailRegister') }}</button>
    </div>

    <form class="auth-form" novalidate @submit.prevent="submit">
      <div class="auth-field">
        <label for="register-account">{{ form.mode === 'phone' ? copy.phone : copy.email }}</label>
        <div class="auth-input-shell"><input id="register-account" v-model.trim="form.account" :type="form.mode === 'phone' ? 'tel' : 'email'" :inputmode="form.mode === 'phone' ? 'tel' : 'email'" :maxlength="form.mode === 'phone' ? 11 : 254" autocomplete="username" autocapitalize="none" :spellcheck="false" :placeholder="t(form.mode === 'phone' ? 'login.inputPhone' : 'login.inputEmail')" :disabled="busy || success" /></div>
      </div>
      <div class="auth-field">
        <label for="register-code">{{ copy.code }}</label>
        <div class="auth-input-shell auth-code">
          <input id="register-code" v-model.trim="form.code" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" :placeholder="t('login.inputCode')" :disabled="busy || success" />
          <button type="button" class="auth-send-code" :disabled="!validAccount || countdown > 0 || busy || success" @click="sendCode">{{ countdown > 0 ? t('login.resend', { time: countdown }) : t('login.getCode') }}</button>
        </div>
        <p v-if="codeHint" class="auth-field-hint" role="status">{{ codeHint }}</p>
      </div>
      <div class="auth-field">
        <label for="register-password">{{ copy.password }}<span class="auth-label-hint">{{ copy.passwordHint }}</span></label>
        <AuthPasswordField id="register-password" v-model="form.password" autocomplete="new-password" :maxlength="20" :placeholder="t('register.inputPassword')" :disabled="busy || success" />
      </div>
      <div class="auth-field">
        <label for="register-confirm">{{ copy.confirmPassword }}</label>
        <AuthPasswordField id="register-confirm" v-model="form.confirmPassword" autocomplete="new-password" :maxlength="20" :placeholder="t('register.inputConfirmPassword')" :disabled="busy || success" />
      </div>
      <AccountAgreement v-model="agreed" />
      <p v-if="error" role="alert" class="auth-feedback auth-feedback--error">{{ error }}</p>
      <p v-if="success" role="status" class="auth-feedback auth-feedback--success">{{ t('register.registerSuccess') }}</p>
      <button class="auth-submit" type="submit" :disabled="busy || success">{{ t(busy ? 'register.registering' : 'register.register') }}</button>
    </form>
    <div class="auth-switch"><span>{{ t('register.hasAccount') }}</span><button type="button" @click="goLogin">{{ t('register.backToLogin') }}</button></div>
  </AuthPageShell>
</template>

<script setup lang="ts">
import {ref,reactive,computed,onBeforeUnmount} from 'vue'
import {useRouter,useRoute} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useAuth} from '@/composables/useAuth'
import AccountAgreement from '@/components/AccountAgreement.vue'
import AuthPageShell from '@/components/AuthPageShell.vue'
import AuthPasswordField from '@/components/AuthPasswordField.vue'
import { useAuthCopy } from '@/composables/useAuthCopy'
const copy = useAuthCopy()
const {t,locale}=useI18n(),router=useRouter(),route=useRoute(),{registerAccount}=useAuth()
const modes=['phone','email'] as const
const form=reactive({mode:'phone' as 'phone'|'email',account:'',code:'',password:'',confirmPassword:''})
const agreed=ref(false),busy=ref(false),error=ref(''),success=ref(false),countdown=ref(0),codeHint=ref('')
const validAccount=computed(()=>form.mode==='phone'?/^1[3-9]\d{9}$/.test(form.account):/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.account))
let timer:ReturnType<typeof setInterval>|undefined,redirectTimer:ReturnType<typeof setTimeout>|undefined
const changeMode=(mode:'phone'|'email')=>{form.mode=mode;form.account='';form.code='';error.value='';codeHint.value='';countdown.value=0;clearInterval(timer)}
const sendCode=()=>{if(!validAccount.value||countdown.value)return;codeHint.value=locale.value==='en'?'Demo verification code: 123456':'本地演示验证码：123456';countdown.value=60;timer=setInterval(()=>{if(--countdown.value<=0)clearInterval(timer)},1000)}
const goLogin=()=>router.replace({path:'/login',query:route.query})
const submit=async()=>{
 if(busy.value||success.value)return
 error.value=''
 if(!validAccount.value){error.value=t(form.mode==='phone'?'login.invalidPhone':'login.invalidEmail');return}
 if(!/^\d{6}$/.test(form.code)){error.value=t('login.codeError');return}
 if(form.password.length<6||form.password.length>20){error.value=t('login.passwordTooShort');return}
 if(form.password!==form.confirmPassword){error.value=t('register.passwordMismatch');return}
 if(!agreed.value){error.value=t('login.agreementRequired');return}
 busy.value=true
 try {const result=await registerAccount(form.mode,form.account,form.code,form.password)
 if(!result.success){error.value=t(result.message||'register.registerFailed');return}
 success.value=true;redirectTimer=setTimeout(()=>router.replace(typeof route.query.redirect==='string'&&route.query.redirect.startsWith('/')&&!route.query.redirect.startsWith('//')?route.query.redirect:'/'),700)
 }catch{error.value=t('register.registerFailed')}finally{busy.value=false}
}
onBeforeUnmount(()=>{clearInterval(timer);clearTimeout(redirectTimer)})
</script>
