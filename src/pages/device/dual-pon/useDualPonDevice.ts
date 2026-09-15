import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

export const useDualPonDevice = () => {
  const route = useRoute()
  const router = useRouter()
  const { user } = useAuth()
  const deviceId = computed(() => String(route.params.id || ''))
  const device = computed(() => user.value?.devices.find(item => item.id === deviceId.value) || null)

  onMounted(() => {
    if (!device.value || device.value.deviceType !== 'dual_port_pon_meter') {
      router.replace({ path: `/device/${deviceId.value}`, query: { deviceError: 'unsupported_dual_pon' } })
    }
  })

  return { deviceId, device }
}
