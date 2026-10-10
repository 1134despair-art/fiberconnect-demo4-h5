<template>
 <div v-smart-otdr-overlay class="policy-overlay" role="presentation" @keydown.esc="$emit('close')">
  <section class="policy-dialog" role="dialog" aria-modal="true" :aria-label="title">
   <header><h2>{{title}}</h2><button type="button" ref="closeButton" :aria-label="t('common.close')" @click="$emit('close')">×</button></header>
   <article v-html="body"></article>
  </section>
 </div>
</template>
<script setup lang="ts">
import {computed,ref,onMounted,onBeforeUnmount} from 'vue'
import {useI18n} from 'vue-i18n'
import {vSmartOtdrOverlay} from '@/directives/smartOtdrOverlay'
import userZh from '@/assets/policies/user-agreement.html?raw'
import userEn from '@/assets/policies/user-agreement-en.html?raw'
import privacyZh from '@/assets/policies/privacy-policy-v2.html?raw'
import privacyEn from '@/assets/policies/privacy-policy-en.html?raw'
const props=defineProps<{type:'user'|'privacy'}>();defineEmits<{close:[]}>()
const {t,locale}=useI18n(),closeButton=ref<HTMLButtonElement|null>(null)
const title=computed(()=>t(props.type==='user'?'login.userAgreement':'login.privacyPolicy'))
const body=computed(()=>{const html=props.type==='user'?(locale.value==='en'?userEn:userZh):(locale.value==='en'?privacyEn:privacyZh);const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style,iframe').forEach(e=>e.remove());return doc.body.innerHTML})
let trigger:HTMLElement|null=null
onMounted(()=>{trigger=document.activeElement as HTMLElement;closeButton.value?.focus()});onBeforeUnmount(()=>trigger?.focus())
</script>
<style scoped>
.policy-overlay{display:flex;z-index:230;background:#0f172a80;color:#334155}.policy-dialog{width:100%;height:100%;background:white;display:flex;flex-direction:column;overflow:hidden!important;border-radius:12px;text-align:left}.policy-dialog header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #e2e8f0;flex-shrink:0}.policy-dialog h2{font-size:15px;margin:0}.policy-dialog button{width:44px;height:44px;background:transparent;border:0;font-size:26px;color:#64748b}.policy-dialog article{padding:16px;overflow:auto;min-height:0;font-size:13px;line-height:1.8;overflow-wrap:anywhere}.policy-dialog article :deep(table){display:block;max-width:100%;overflow:auto}.policy-dialog article :deep(h1){font-size:20px}.policy-dialog article :deep(h2){font-size:16px;margin-top:20px}.policy-dialog article :deep(.critical){color:#b91c1c;font-weight:700}
</style>
