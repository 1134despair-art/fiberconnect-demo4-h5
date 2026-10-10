<template>
  <div class="app-container auth-page" :class="{ 'auth-page--register': back }">
    <main class="auth-scroll">
      <div class="auth-body">
        <header class="auth-brand">
          <button v-if="back" class="auth-back" type="button" :aria-label="t('register.backToLogin')" @click="$emit('back')"><img :src="backIcon" alt="" /></button>
          <img :src="logo" class="auth-logo" alt="" />
          <span>{{ t('login.title') }}</span>
        </header>
        <div class="auth-heading">
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import logo from '@/assets/img/logo.png'
import backIcon from '@/assets/icons/iconfont/device/back.svg'
import '@/styles/auth.css'
defineProps<{ title: string; subtitle: string; back?: boolean }>()
defineEmits<{ back: [] }>()
const { t } = useI18n()
</script>
