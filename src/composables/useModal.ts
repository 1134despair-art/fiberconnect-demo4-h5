import { ref } from 'vue'

interface ModalOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: string
  cancelColor?: string
}

export function useModal() {
  const showModal = ref(false)
  const modalOptions = ref<ModalOptions>({
    title: '确认操作',
    message: '',
    confirmText: '确认',
    cancelText: '取消',
    confirmColor: '#2563EB',
    cancelColor: '#6B7280'
  })
  const resolvePromise = ref<((value: boolean) => void) | null>(null)

  const openModal = (options: ModalOptions): Promise<boolean> => {
    modalOptions.value = {
      title: '确认操作',
      confirmText: '确认',
      cancelText: '取消',
      confirmColor: '#2563EB',
      cancelColor: '#6B7280',
      ...options
    }
    showModal.value = true

    return new Promise<boolean>((resolve) => {
      resolvePromise.value = resolve
    })
  }

  const confirm = (message: string, title?: string): Promise<boolean> => {
    return openModal({
      title: title || '确认操作',
      message,
      confirmText: '确认',
      cancelText: '取消'
    })
  }

  const alert = (message: string, title?: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      openModal({
        title: title || '提示',
        message,
        confirmText: '确定',
        cancelText: ''
      }).then(() => {
        resolve()
      })
    })
  }

  const handleConfirm = () => {
    showModal.value = false
    if (resolvePromise.value) {
      resolvePromise.value(true)
      resolvePromise.value = null
    }
  }

  const handleCancel = () => {
    showModal.value = false
    if (resolvePromise.value) {
      resolvePromise.value(false)
      resolvePromise.value = null
    }
  }

  return {
    showModal,
    modalOptions,
    openModal,
    confirm,
    alert,
    handleConfirm,
    handleCancel
  }
}