<template>
 <nav v-if="device?.deviceType === 'fusion_splicer'" class="fusion-function-nav" aria-label="熔接机功能导航">
  <button v-for="item in items" :key="item.path" type="button" :class="{active:route.path === item.path}" :aria-current="route.path === item.path ? 'page' : undefined" @click="router.push(item.path)"><img :src="item.icon" alt="" /><span>{{item.label}}</span></button>
 </nav>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import homeIcon from '@/assets/icons/iconfont/device/power.svg'
import measureIcon from '@/assets/icons/iconfont/device/measure.svg'
import recordIcon from '@/assets/icons/iconfont/device/folder.svg'
import settingsIcon from '@/assets/icons/iconfont/device/settings.svg'
const route=useRoute(),router=useRouter(),{user}=useAuth()
const device=computed(()=>user.value?.devices.find(d=>d.id===route.params.id))
const items=computed(()=>{const base='/device/'+route.params.id;return [{label:'首页',path:base,icon:homeIcon},{label:'熔接操作',path:base+'/fusion-operation',icon:measureIcon},{label:'熔接记录',path:base+'/records',icon:recordIcon},{label:'设备设置',path:base+'/legacy-settings',icon:settingsIcon}]})
</script>
<style scoped>
.fusion-function-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;flex-shrink:0;padding:8px 12px max(10px,env(safe-area-inset-bottom));border-top:1px solid #d8e2ef;background:#fff}.fusion-function-nav button{min-width:0;min-height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;border:0;border-radius:8px;background:transparent;color:#64748b;font:inherit;font-size:12px;cursor:pointer}.fusion-function-nav img{width:24px;height:24px}.fusion-function-nav button.active{background:#2563eb;color:#fff}.fusion-function-nav .active img{filter:brightness(0) invert(1)}
</style>
