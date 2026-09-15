import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

export const useStableSourceDevice = () => {
  const route = useRoute()
  const router = useRouter()
  const { user } = useAuth()
  const deviceId = computed(() => String(route.params.id || ''))
  const device = computed(() => user.value?.devices.find(item => item.id === deviceId.value) || null)

  onMounted(() => {
    if (!device.value || device.value.deviceType !== 'stable_light_source') {
      router.replace({
        path: `/device/${deviceId.value}`,
        query: { deviceError: 'unsupported_stable_source' }
      })
    }
  })

  return { deviceId, device }
}
