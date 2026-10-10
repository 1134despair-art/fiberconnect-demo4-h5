<template>
 <AuthPageShell title="找回密码" subtitle="验证账号后设置新的登录密码" back @back="goBack">
  <form v-if="!done" class="auth-form" novalidate @submit.prevent="submit">
   <div class="auth-field"><label for="reset-account">手机号或邮箱</label><div class="auth-input-shell"><input id="reset-account" v-model.trim="account" autocomplete="username" :disabled="busy" placeholder="请输入已注册账号" /></div></div>
   <div class="auth-field"><label for="reset-code">验证码</label><div class="auth-input-shell auth-code"><input id="reset-code" v-model.trim="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" :disabled="busy" placeholder="请输入验证码" /><button type="button" class="auth-send-code" :disabled="busy || countdown > 0 || !validAccount" @click="send">{{ countdown ? countdown + 's' : '获取验证码' }}</button></div><p v-if="hint" class="auth-field-hint" role="status">{{ hint }}</p></div>
   <div class="auth-field"><label for="reset-password">新密码<span class="auth-label-hint">6～20 位</span></label><AuthPasswordField id="reset-password" v-model="password" autocomplete="new-password" placeholder="请输入新密码" :disabled="busy" /></div>
   <div class="auth-field"><label for="reset-confirm">确认密码</label><AuthPasswordField id="reset-confirm" v-model="confirmation" autocomplete="new-password" placeholder="请再次输入新密码" :disabled="busy" /></div>
   <p v-if="error" class="auth-feedback auth-feedback--error" role="alert">{{ error }}</p>
   <button type="submit" class="auth-submit" :disabled="busy">{{ busy ? '处理中…' : '确认重置' }}</button>
  </form>
  <div v-else class="recovery-success" role="status"><h2>密码已更新</h2><p>下次登录请使用新密码。</p><button type="button" class="auth-submit" @click="goBack">{{ user ? '返回设置' : '返回登录' }}</button></div>
 </AuthPageShell>
</template>
<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AuthPageShell from '@/components/AuthPageShell.vue'
import AuthPasswordField from '@/components/AuthPasswordField.vue'
const router = useRouter(), route = useRoute()
const { user, requestPasswordReset, resetPassword } = useAuth()
const account = ref(String(route.query.account || user.value?.email || user.value?.phone || ''))
const code = ref(''), password = ref(''), confirmation = ref(''), error = ref(''), hint = ref('')
const busy = ref(false), done = ref(false), countdown = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
const validAccount = computed(() => /^1[3-9]\d{9}$/.test(account.value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.value))
watch(account, () => { code.value = ''; hint.value = ''; error.value = '' })
onBeforeUnmount(() => clearInterval(timer))
const goBack = () => router.replace(user.value ? '/settings' : { path: '/login', query: { redirect: route.query.redirect } })
const send = async () => {
 if (!validAccount.value || countdown.value || busy.value) return
 busy.value = true; error.value = ''
 try { await requestPasswordReset(account.value); hint.value = '本地演示验证码：123456'; countdown.value = 60; timer = setInterval(() => { if (--countdown.value <= 0) clearInterval(timer) },1000) }
 catch(e) { error.value = e instanceof Error ? e.message : '验证码获取失败，请重试' }
 finally { busy.value = false }
}
const submit = async () => {
 if (busy.value) return
 error.value = ''
 if (!validAccount.value) { error.value = '请输入有效的手机号或邮箱'; return }
 if (password.value.length < 6 || password.value.length > 20) { error.value = '密码需为 6～20 位'; return }
 if (password.value !== confirmation.value) { error.value = '两次输入的密码不一致'; return }
 busy.value = true
 try { await resetPassword(account.value,code.value,password.value); done.value = true }
 catch(e) { error.value = e instanceof Error ? e.message : '重置失败，请重试' }
 finally { busy.value = false }
}
</script>
<style scoped>.recovery-success{text-align:center;padding:24px 0}.recovery-success h2{font-size:20px;color:#17263c}.recovery-success p{font-size:14px;line-height:1.6;color:#64748b;margin:16px 0 28px}</style>
