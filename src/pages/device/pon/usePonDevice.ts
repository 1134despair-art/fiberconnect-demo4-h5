import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

export function usePonDevice() {
  const route = useRoute()
  const router = useRouter()
  const { user, updateDevice } = useAuth()
  const deviceId = computed(() => String(route.params.id || ''))
  const device = computed(() => user.value?.devices.find(item => item.id === deviceId.value) || null)
  const isPonDevice = computed(() => device.value?.deviceType === 'pon_power_meter')

  const validateRoute = () => {
    if (!deviceId.value || !device.value) {
      router.replace('/')
      return false
    }
    if (!isPonDevice.value) {
      router.replace({
        path: `/device/${deviceId.value}`,
        query: { deviceError: 'unsupported_pon' }
      })
      return false
    }
    return true
  }

  onMounted(validateRoute)

  return {
    deviceId,
    device,
    isPonDevice,
    updateDevice,
    validateRoute
  }
}
