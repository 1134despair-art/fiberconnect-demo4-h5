<template>
  <section class="activation-card" aria-label="设备激活与授权">
    <header><h3>设备授权</h3><span :class="{limited:locked}">{{ locked ? (authorization?.activated ? '授权受限' : '待激活') : '授权有效' }}</span></header>
    <dl><div><dt>设备序列号</dt><dd>{{ device?.serialNumber || '--' }}</dd></div><div><dt>授权到期时间</dt><dd>{{ formatDate(authorization?.expiresAt || authorizationExpiry) }}</dd></div></dl>
    <form v-if="authorization ? !authorization.activated : device?.activationStatus !== 'activated'" @submit.prevent="activate">
      <label for="device-activation-code">激活码</label>
      <input id="device-activation-code" v-model.trim="code" placeholder="输入设备激活码" autocomplete="off" :disabled="busy" />
      <div class="activation-actions"><button v-if="prototype" type="button" :disabled="busy" @click="code = 'SOTDR-ACT-DEMO2026'">填入演示码</button><button class="primary" :disabled="busy || !code || !bluetoothConnected">{{ busy ? '激活中…' : '激活设备' }}</button></div>
    </form>
    <p v-else-if="locked" class="lock-message">授权已到期或被停用，测量功能已锁定。请联系管理员续期，完成后刷新授权。</p>
    <button type="button" :disabled="busy" @click="refresh">{{ busy ? '读取中…' : '刷新授权状态' }}</button>
    <p v-if="message" role="status">{{ message }}</p>
    <small v-if="prototype">原型演示 · 激活与授权状态保存在本机</small>
  </section>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useSmartOtdrDevice } from '@/composables/useSmartOtdrDevice'
import { getSmartOtdrAdapter } from '@/services/smartOtdr'
defineProps<{ bluetoothConnected: boolean; activationStatus?: string; authorizationExpiry?: string; initialState?: string }>()
const emit = defineEmits<{ (e:'activated',payload:{authorizationExpiry:string;activatedAt:string}):void }>()
const { user } = useAuth(); const route = useRoute()
const device = computed(() => user.value?.devices.find(d => d.id === route.params.id))
const { authorization, locked, refreshAuthorization, runtime } = useSmartOtdrDevice(device)
const prototype = getSmartOtdrAdapter().mode === 'prototype'
const code = ref(''); const busy = ref(false); const message = ref('')
const formatDate = (value?: string) => {
  if (!value) return '未设置'
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(value)) return `${value} 23:59:59`
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '授权日期异常' : date.toLocaleString()
}
async function activate() {
  if (!device.value || busy.value) return
  busy.value=true; message.value=''
  try {
    const result = await getSmartOtdrAdapter().activate(device.value,code.value)
    await refreshAuthorization(); code.value=''; message.value='设备已激活'
    emit('activated',{authorizationExpiry:result.expiresAt,activatedAt:result.activatedAt})
  } catch(error) { message.value=error instanceof Error ? error.message : '激活失败，请重试' }
  finally { busy.value=false }
}
async function refresh() {
  busy.value=true; message.value=''; runtime.value.authorizationError=''
  try { await refreshAuthorization(); message.value=runtime.value.authorizationError || '授权状态已刷新' }
  finally { busy.value=false }
}
</script>
<style scoped>
.activation-card { padding:16px;background:white;border:1px solid #e4eaf2;border-radius:16px;color:#24344a; }
header { display:flex;align-items:center;justify-content:space-between;gap:12px; }h3 { font-size:15px;margin:0; }header span { color:#15803d;font-size:12px; }header span.limited { color:#b45309; }
dl { display:grid;gap:10px;font-size:12px; }dl div { display:flex;justify-content:space-between;gap:16px; }dt { color:#68778b; }dd { margin:0;text-align:right;overflow-wrap:anywhere; }
form label { display:block;font-size:12px;margin-bottom:8px; }input { box-sizing:border-box;width:100%;padding:12px;border:1px solid #ccd8e6;border-radius:10px;font-size:14px; }.activation-actions { display:flex;gap:8px;margin:10px 0; }
button { min-height:40px;padding:8px 12px;border:1px solid #d4dfed;border-radius:10px;background:#f8faff;color:#265aa8; }.primary { background:#2563eb;color:#fff;border-color:#2563eb;flex:1; }button:disabled { opacity:.5; }p { font-size:12px;line-height:1.6; }.lock-message { background:#fff7ed;color:#9a3412;padding:10px;border-radius:8px; }small { display:block;margin-top:10px;color:#7c899b;font-size:11px; }
</style>
