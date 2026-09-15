<template>
  <div class="smart-activation-card">
    <div class="activation-head">
      <div class="head-main">
        <h3 class="section-title">{{ t('deviceDetail.smartActivationTitle') }}</h3>
        <div class="section-desc">{{ statusMeta.title }} · {{ statusMeta.description }}</div>
      </div>
      <div class="activation-badge" :class="activation.state">
        {{ statusMeta.badge }}
      </div>
    </div>

    <div class="activation-body">
      <div class="status-panel">
        <div class="status-info">
          <div class="status-label">{{ t('deviceDetail.smartActivationAuthorizedUntil') }}</div>
          <div class="status-value">{{ activation.authorizedUntil || '--' }}</div>
        </div>
        <div class="status-info">
          <div class="status-label">{{ t('deviceDetail.smartActivationLastTime') }}</div>
          <div class="status-value">{{ activation.lastActivatedAt || '--' }}</div>
        </div>
      </div>

      <div class="action-panel">
        <div class="form-group">
          <label class="form-label">{{ t('deviceDetail.smartActivationCode') }}</label>
          <input
            v-model.trim="activation.code"
            class="activation-input"
            type="text"
            :placeholder="t('deviceDetail.inputActivationCode')"
          />
        </div>
        <div class="action-row">
          <button class="secondary-btn" type="button" @click="fillMockScanCode">
            {{ t('deviceDetail.smartActivationScan') }}
          </button>
          <button class="secondary-btn" type="button" @click="clearActivationCode">
            {{ t('deviceDetail.smartActivationClear') }}
          </button>
          <button
            class="primary-btn"
            type="button"
            :disabled="!bluetoothConnected || activation.loading"
            @click="submitActivation"
          >
            {{ activation.loading ? t('settings.activating') : statusMeta.buttonText }}
          </button>
        </div>
      </div>
    </div>

    <div class="activation-footer">
      <div v-if="statusMeta.showAlert" class="alert-bar">
        {{ statusMeta.footerText }}
      </div>
      <div v-else class="feedback-text">
        {{ statusMeta.footerText }}
      </div>
      <div v-if="activation.successMessage" class="success-text">
        {{ activation.successMessage }}
      </div>
      <div v-if="activation.errorMessage" class="error-text">
        {{ activation.errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type ActivationState = 'inactive' | 'pending_lock' | 'activated' | 'expired'

interface Props {
  bluetoothConnected: boolean
  activationStatus?: string
  authorizationExpiry?: string
  initialState?: ActivationState
}

const props = withDefaults(defineProps<Props>(), {
  activationStatus: 'not_activated',
  authorizationExpiry: '',
  initialState: undefined
})

const emit = defineEmits<{
  (e: 'activated', payload: { authorizationExpiry: string; activatedAt: string }): void
}>()

const { t } = useI18n()

const activation = reactive({
  state: 'inactive' as ActivationState,
  code: '',
  authorizedUntil: props.authorizationExpiry || '',
  lastActivatedAt: '',
  loading: false,
  errorMessage: '',
  successMessage: ''
})

const isExpiredDate = (date?: string) => {
  if (!date) return false
  return new Date(date).getTime() < Date.now()
}

const deriveStateFromProps = (): ActivationState => {
  if (props.initialState) return props.initialState

  if (props.activationStatus === 'activated') {
    return isExpiredDate(props.authorizationExpiry) ? 'expired' : 'activated'
  }

  return 'inactive'
}

watch(
  () => [props.activationStatus, props.authorizationExpiry, props.initialState],
  () => {
    activation.state = deriveStateFromProps()
    activation.authorizedUntil = props.authorizationExpiry || ''
  },
  { immediate: true }
)

const statusMeta = computed(() => {
  switch (activation.state) {
    case 'pending_lock':
      return {
        title: t('deviceDetail.smartActivationLock'),
        badge: t('deviceDetail.smartActivationPending'),
        description: t('deviceDetail.smartActivationExpiryAlert'),
        footerText: t('deviceDetail.smartActivationExpiryAlert'),
        buttonText: t('deviceDetail.smartActivationRetry'),
        showAlert: true
      }
    case 'activated':
      return {
        title: t('deviceDetail.smartActivationActive'),
        badge: t('deviceDetail.smartActivationActive'),
        description: t('deviceDetail.smartActivationSuccess'),
        footerText: t('deviceDetail.smartActivationSuccess'),
        buttonText: t('deviceDetail.smartActivationRetry'),
        showAlert: false
      }
    case 'expired':
      return {
        title: t('deviceDetail.smartActivationExpired'),
        badge: t('deviceDetail.smartActivationExpiredShort'),
        description: t('deviceDetail.smartActivationExpiryAlert'),
        footerText: t('deviceDetail.smartActivationExpiryAlert'),
        buttonText: t('deviceDetail.smartActivationRetry'),
        showAlert: true
      }
    default:
      return {
        title: t('deviceDetail.smartActivationBoot'),
        badge: t('deviceDetail.smartActivationInactive'),
        description: t('deviceDetail.smartActivationHint'),
        footerText: t('deviceDetail.smartActivationHint'),
        buttonText: t('deviceDetail.smartActivationSubmit'),
        showAlert: false
      }
  }
})

const fillMockScanCode = () => {
  activation.code = `SOTDR-ACT-${Date.now().toString().slice(-8)}`
  activation.successMessage = t('deviceDetail.smartActivationScanningSuccess')
  activation.errorMessage = ''
}

const clearActivationCode = () => {
  activation.code = ''
  activation.successMessage = ''
  activation.errorMessage = ''
}

const submitActivation = async () => {
  if (!props.bluetoothConnected) {
    activation.errorMessage = t('deviceDetail.smartActivationNeedBluetooth')
    activation.successMessage = ''
    return
  }

  if (!activation.code.trim()) {
    activation.errorMessage = t('deviceDetail.smartActivationNeedCode')
    activation.successMessage = ''
    return
  }

  activation.loading = true
  activation.errorMessage = ''
  activation.successMessage = ''

  await new Promise(resolve => setTimeout(resolve, 800))

  const authorizedUntil = '2026-12-31'
  const activatedAt = new Date().toLocaleString('zh-CN', { hour12: false })

  activation.loading = false
  activation.state = 'activated'
  activation.authorizedUntil = authorizedUntil
  activation.lastActivatedAt = activatedAt
  activation.successMessage = t('deviceDetail.smartActivationSuccess')

  emit('activated', {
    authorizationExpiry: authorizedUntil,
    activatedAt
  })
}
</script>

<style scoped>
.smart-activation-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.activation-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.section-desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: #6b7280;
}

.activation-badge {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.activation-badge.inactive {
  background: #fef3c7;
  color: #b45309;
}

.activation-badge.pending_lock,
.activation-badge.expired {
  background: #fee2e2;
  color: #b91c1c;
}

.activation-badge.activated {
  background: #dcfce7;
  color: #047857;
}

.activation-body {
  padding-top: 16px;
}

.status-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.status-info {
  min-width: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.status-label,
.form-label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.status-value {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: #1f2937;
  word-break: break-all;
}

.action-panel {
  margin-top: 14px;
  padding-top: 16px;
  border-top: 1px solid #eef2f7;
}

.form-group {
  margin: 0;
}

.activation-input {
  width: 100%;
  height: 44px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 14px;
  color: #1f2937;
  outline: none;
  box-sizing: border-box;
}

.activation-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.primary-btn,
.secondary-btn {
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  height: 44px;
  padding: 0 16px;
}

.primary-btn {
  border: none;
  background: #2563eb;
  color: #ffffff;
  flex: 1 1 180px;
  min-width: 160px;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-btn {
  border: 1px solid #dbeafe;
  background: #f8fbff;
  color: #1d4ed8;
  flex: 0 0 auto;
}

.activation-footer {
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feedback-text,
.success-text,
.error-text {
  font-size: 13px;
  line-height: 1.5;
}

.feedback-text {
  color: #64748b;
}

.success-text {
  color: #047857;
}

.error-text {
  color: #dc2626;
}

.alert-bar {
  padding: 12px 14px;
  border-radius: 12px;
  background: #ef4444;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .activation-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-panel {
    grid-template-columns: 1fr;
  }

  .secondary-btn,
  .primary-btn {
    width: 100%;
  }
}
</style>
