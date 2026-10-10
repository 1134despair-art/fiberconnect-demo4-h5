<template>
  <span class="user-avatar">
    <img :src="avatarSource" :alt="name" @error="failed = true" />
  </span>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import defaultAvatar from '@/assets/app/default-avatar.svg'
const props = withDefaults(defineProps<{ src?: string; name?: string }>(), { src: '', name: '' })
const failed = ref(false)
// Previously generated defaults can remain in saved profiles. Replace them only
// at display time, so uploaded photos and other custom images stay untouched.
const isLegacyDefault = (src: string) => {
  try {
    const url = new URL(src)
    return url.hostname === 'api.dicebear.com' && url.pathname === '/7.x/avataaars/svg'
  } catch { return false }
}
const avatarSource = computed(() => !props.src || failed.value || isLegacyDefault(props.src) ? defaultAvatar : props.src)
watch(() => props.src, () => { failed.value = false })
</script>
<style scoped>
.user-avatar { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 52px; height: 52px; overflow: hidden; border-radius: 50%; background: #edf2f8; color: #2563eb; font-size: 21px; font-weight: 650; }
.user-avatar img { display: block; width: 100%; height: 100%; object-fit: cover; }
</style>
