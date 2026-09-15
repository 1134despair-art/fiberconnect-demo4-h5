<template>
  <nav class="bottom-navigation" :aria-label="t('common.home')">
    <button v-for="item in items" :key="item.path" class="bottom-navigation-item"
      :class="{ active: item.active }" :aria-current="item.active ? 'page' : undefined"
      @click="router.push(item.path)">
      <span class="navigation-symbol"><img class="navigation-icon" :src="item.icon" alt="" /></span>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import homeIcon from '@/assets/icons/nav-home.svg'
import productIcon from '@/assets/icons/nav-product.svg'
import settingsIcon from '@/assets/icons/nav-settings.svg'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const items = computed(() => [
  { path: '/', label: t('common.home'), icon: homeIcon, active: route.path === '/' },
  { path: '/catalog', label: t('common.product'), icon: productIcon, active: route.path === '/catalog' || route.path.startsWith('/product/') },
  { path: '/settings', label: t('common.settings'), icon: settingsIcon, active: ['/settings', '/profile', '/after-sales'].includes(route.path) }
])
</script>

<style scoped>
.bottom-navigation { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); flex-shrink: 0; min-height: 66px; padding: 5px 8px calc(5px + env(safe-area-inset-bottom)); background: #fff; border-top: 1px solid #e8ebef; z-index: 20; }
.bottom-navigation-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; min-width: 0; padding: 3px 0; border: 0; background: transparent; color: #7e8590; font: inherit; font-size: 11px; line-height: 1.3; cursor: pointer; }
.navigation-symbol { display: grid; place-items: center; width: 44px; height: 28px; border-radius: 8px; font-size: 23px; }
.navigation-icon { width: 22px; height: 22px; object-fit: contain; opacity: 0.5; }
.bottom-navigation-item.active .navigation-icon { opacity: 1; filter: invert(32%) sepia(80%) saturate(1800%) hue-rotate(206deg) brightness(85%); }
.bottom-navigation-item.active { color: #245bc5; font-weight: 650; }
.bottom-navigation-item.active .navigation-symbol { background: #edf2ff; }
.bottom-navigation-item:focus-visible { outline: 2px solid #2563eb; outline-offset: -2px; border-radius: 6px; }
.bottom-navigation-item:hover { color: #245bc5; }
</style>
