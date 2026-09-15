<template>
  <MultiOpmVfl v-if="device" :device="device" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import MultiOpmVfl from '../multi-opm/MultiOpmVfl.vue'

const route = useRoute()
const { user } = useAuth()
const device = computed(() => user.value?.devices?.find(item => item.id === String(route.params.id)) || null)
</script>
