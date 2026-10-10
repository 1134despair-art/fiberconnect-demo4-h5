<template>
 <div class="account-agreement">
  <label class="agreement-check" :for="id"><input :id="id" type="checkbox" :checked="modelValue" @change="$emit('update:modelValue',($event.target as HTMLInputElement).checked)" :aria-label="t('login.agreementPrefix') + t('login.userAgreement') + t('login.agreementConnector') + t('login.privacyPolicy')" /></label>
  <div class="agreement-copy"><label :for="id">{{t('login.agreementPrefix')}}</label> <button type="button" @click="policy='user'">{{t('login.userAgreement')}}</button> {{t('login.agreementConnector')}} <button type="button" @click="policy='privacy'">{{t('login.privacyPolicy')}}</button></div>
  <PolicyDialog v-if="policy" :type="policy" @close="policy=null" />
 </div>
</template>
<script setup lang="ts">
import {ref,useId} from 'vue'
import {useI18n} from 'vue-i18n'
import PolicyDialog from './PolicyDialog.vue'
defineProps<{modelValue:boolean}>();defineEmits<{'update:modelValue':[boolean]}>()
const {t}=useI18n(),id=useId(),policy=ref<'user'|'privacy'|null>(null)
</script>
<style scoped>
.account-agreement { display: flex; align-items: flex-start; gap: 0; margin-top: 20px; color: #7b8798; font-size: 12px; line-height: 1.8; text-align: left; }
.agreement-check { display: grid; place-items: center; flex: 0 0 44px; width: 44px; height: 44px; margin-left: -12px; cursor: pointer; }
.agreement-check input { display: block; width: 18px; height: 18px; margin: 0; accent-color: #2563eb; cursor: pointer; }
.agreement-copy { flex: 1; min-width: 0; padding-top: 11px; overflow-wrap: anywhere; }
.agreement-copy label { cursor: pointer; }
.account-agreement button { border: 0; padding: 0; background: transparent; color: #2563eb; font: inherit; line-height: inherit; text-align: left; cursor: pointer; }
.account-agreement button:focus-visible, .agreement-check input:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
</style>
