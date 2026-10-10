<template>
  <div class="app-container smart-otdr-portrait-page">
    <div class="content-flex">
      <SmartOtdrPageShell title="连接与激活" :show-quick-panel="false" @back="router.replace('/')">
        <main v-if="device" class="connect-page">
          <ol class="entry-steps" aria-label="设备接入流程"><li :class="{done:connected}"><b>1</b>连接设备</li><li :class="{done:ready,active:connected && !ready}"><b>2</b>激活设备</li><li :class="{active:ready}"><b>3</b>进入首页</li></ol>
          <section class="connect-device">
            <img :src="deviceImage" alt="智能 OTDR 设备" />
            <h2>{{ device.name }}</h2><p>{{ device.model }}</p><span>SN {{ device.serialNumber || '--' }}</span>
          </section>
          <section v-if="!connected" class="connection-step">
            <h3>先连接设备</h3><p>请打开设备并保持在连接范围内，连接成功后确认激活与授权状态。</p>
            <div class="connection-channel"><label><input v-model="connectChannel" type="radio" value="bluetooth" :disabled="connecting" /> 蓝牙连接</label><label><input v-model="connectChannel" type="radio" value="4g" :disabled="connecting" /> 4G 连接</label></div>
            <button class="action-primary" :disabled="connecting" @click="connect">{{ connecting ? '正在连接…' : '连接设备' }}</button>
            <p v-if="connectionError" class="error" role="alert">{{ connectionError }}</p>
          </section>
          <section v-else-if="!runtime.authorizationChecked || runtime.authorizationError" class="connection-step">
            <h3>{{ runtime.authorizationLoading ? '正在确认设备授权' : '暂时无法确认授权' }}</h3>
            <p role="status">{{ runtime.authorizationError || '设备已连接，请稍候…' }}</p>
            <button v-if="!runtime.authorizationLoading" class="action-primary" @click="refreshAuthorization">重新检查</button>
          </section>
          <template v-else>
            <p class="connected-state">已连接 · {{ device.serialNumber }}</p>
            <SmartOtdrActivationCard v-if="!ready" :bluetooth-connected="connected" :authorization-expiry="authorization?.expiresAt" :activation-status="device.activationStatus" />
            <section v-else class="connection-step"><h3>设备已就绪</h3><p>连接与授权检查完成，正在进入设备首页。</p><button class="action-primary" @click="enterHome">进入设备首页</button></section>
          </template>
          <p v-if="getSmartOtdrAdapter().mode === 'prototype'" class="prototype-note">当前为原型演示，连接与激活使用模拟设备状态。</p>
        </main>
        <main v-else class="connect-page"><h2>未找到设备</h2><button class="action-primary" @click="router.replace('/')">返回设备列表</button></main>
      </SmartOtdrPageShell>
    </div>
  </div>
</template>
<script setup lang="ts">
import {computed,ref,watch,onUnmounted} from 'vue'
import {useRoute,useRouter} from 'vue-router'
import {useAuth} from '@/composables/useAuth'
import {useSmartOtdrDevice} from '@/composables/useSmartOtdrDevice'
import {useSmartOtdrConnectionState} from '@/composables/useSmartOtdrConnectionState'
import {getSmartOtdrAdapter} from '@/services/smartOtdr'
import SmartOtdrPageShell from './components/SmartOtdrPageShell.vue'
import SmartOtdrActivationCard from './components/SmartOtdrActivationCard.vue'
import deviceImage from '@/assets/app/products/smart-otdr-realistic.jpg'
const route=useRoute();const router=useRouter();const {user,updateDevice}=useAuth()
const device=computed(()=>user.value?.devices.find(d=>d.id===route.params.id))
const {runtime,authorization,locked,refreshAuthorization}=useSmartOtdrDevice(device)
const {connectionState,setBluetoothEnabled,setNetwork4gEnabled}=useSmartOtdrConnectionState()
const connectChannel=ref<'bluetooth'|'4g'>(connectionState.bluetoothEnabled?'bluetooth':'4g')
const connected=computed(()=>device.value?.status==='connected')
const ready=computed(()=>connected.value&&runtime.value.authorizationChecked&&!runtime.value.authorizationLoading&&!runtime.value.authorizationError&&!locked.value)
const entering=ref(false);const connecting=ref(false);const connectionError=ref('');let disposed=false
async function connect(){
  const target=device.value;if(!target||connecting.value)return
  connecting.value=true;connectionError.value=''
  try {
    const channel=connectChannel.value
    if(channel==='bluetooth')setBluetoothEnabled(true);else setNetwork4gEnabled(true)
    const receipt=await getSmartOtdrAdapter().connect(target,channel)
    if(disposed)return
    updateDevice(target.id,{status:'connected',lastConnected:receipt.connectedAt})
  }catch(error){connectionError.value=error instanceof Error?error.message:'连接失败，请重试'}finally{connecting.value=false}
}
async function enterHome(){
  if(!ready.value||!device.value||entering.value)return
  entering.value=true
  try { await router.replace(`/device/${device.value.id}`) } finally { entering.value=false }
}
watch(ready,value=>{if(value)enterHome()},{immediate:true})
onUnmounted(()=>{disposed=true})
</script>
<style scoped lang="scss">
@use './components/smartOtdrPortrait.scss';
.connect-page { padding:8px 4px 20px; }.entry-steps { display:flex;align-items:center;justify-content:space-between;list-style:none;padding:0;margin:0 0 24px;gap:6px; }.entry-steps li { display:flex;align-items:center;gap:5px;font-size:11px;color:#7c8b9d; }.entry-steps b { display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#e6edf5;color:#718198;font-size:12px; }.entry-steps li.done,.entry-steps li.active { color:#2563eb; }.entry-steps li.done b,.entry-steps li.active b { background:#2563eb;color:white; }
.connect-device { text-align:center;padding:8px 0 24px; }.connect-device img { display:block;margin:0 auto;width:132px;height:132px;object-fit:contain;background:white;border:1px solid #e3eaf2;border-radius:18px; }.connect-device h2 { margin:16px 0 6px;font-size:19px;color:#22364e; }.connect-device p { margin:0 0 8px;font-size:12px;color:#64748b; }.connect-device > span { font-size:11px;color:#7a8a9d;font-variant-numeric:tabular-nums; }
.connection-step { padding:18px;border:1px solid #dfe6ee;border-radius:14px;background:white; }.connection-step h3 { font-size:15px;color:#253a55;margin:0 0 10px; }.connection-step p { font-size:12px;line-height:1.7;color:#718095;margin:0 0 16px; }.connected-state { font-size:11px;color:#15803d;text-align:center; }.prototype-note { font-size:11px;line-height:1.6;color:#8592a3;text-align:center;margin:18px 8px 0; }.connection-step .error { margin-top:12px;color:#b42318; }
.connection-channel { display:flex;gap:18px;margin-bottom:16px;font-size:12px;color:#425b77; }.connection-channel label { display:flex;align-items:center;gap:4px;min-height:36px; }.connection-channel input { accent-color:#2563eb; }
</style>
