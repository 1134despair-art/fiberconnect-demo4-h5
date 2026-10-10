<template>
  <div class="avatar-picker" :aria-busy="processing">
    <div class="avatar-picker-row">
      <button class="avatar-picker-preview" type="button" :aria-label="t('avatar.change')" :disabled="disabled || processing" @click="choose">
        <UserAvatar :src="modelValue" :name="name" class="avatar-picker-image" />
        <span class="avatar-picker-camera"><img :src="cameraIcon" alt="" /></span>
      </button>
      <div class="avatar-picker-copy">
        <button class="avatar-picker-change" type="button" :disabled="disabled || processing" @click="choose">{{ processing ? t('avatar.processing') : t('avatar.change') }}</button>
        <p>{{ t('avatar.hint') }}</p>
        <small>{{ t('avatar.cropHint') }}</small>
      </div>
    </div>
    <input ref="fileInput" class="avatar-file-input" type="file" accept="image/jpeg,image/png,image/webp" :aria-label="t('avatar.change')" @change="selectFile" />
    <p v-if="error || externalError" class="avatar-picker-error" role="alert">{{ error || externalError }}</p>
    <p v-else-if="selected" class="avatar-picker-status" role="status">{{ t('avatar.selected') }}</p>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UserAvatar from './UserAvatar.vue'
import cameraIcon from '@/assets/icons/iconfont/device/camera.svg'

withDefaults(defineProps<{ modelValue: string; name: string; disabled?: boolean; externalError?: string }>(), { disabled: false, externalError: '' })
const emit = defineEmits<{ 'update:modelValue': [value: string]; processing: [value: boolean] }>()
const { t } = useI18n()
const fileInput = ref<HTMLInputElement | null>(null)
const processing = ref(false)
const selected = ref(false)
const error = ref('')
let disposed = false
onBeforeUnmount(() => { disposed = true })
const choose = () => fileInput.value?.click()

const selectFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // Selecting the same file again must still fire change.
  if (!file || processing.value) return
  error.value = ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { error.value = t('avatar.invalidType'); return }
  if (file.size > 10 * 1024 * 1024) { error.value = t('avatar.tooLarge'); return }
  processing.value = true
  emit('processing', true)
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = objectUrl
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Invalid image dimensions')
    const edge = Math.min(image.naturalWidth, image.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = Math.min(512, edge)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas unavailable')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, (image.naturalWidth - edge) / 2, (image.naturalHeight - edge) / 2, edge, edge, 0, 0, canvas.width, canvas.height)
    const avatar = canvas.toDataURL('image/jpeg', 0.86)
    if (!disposed) { emit('update:modelValue', avatar); selected.value = true }
  } catch {
    if (!disposed) error.value = t('avatar.invalidImage')
  } finally {
    URL.revokeObjectURL(objectUrl)
    if (!disposed) { processing.value = false; emit('processing', false) }
  }
}
</script>
<style scoped>
.avatar-picker { width: 100%; }
.avatar-picker-row { display: flex; gap: 16px; align-items: center; }
.avatar-picker-preview { position: relative; flex: 0 0 72px; width: 72px; height: 72px; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; }
.avatar-picker-image { width: 72px; height: 72px; font-size: 28px; }
.avatar-picker-camera { position: absolute; right: -2px; bottom: -2px; display: grid; place-items: center; width: 26px; height: 26px; border: 2px solid #fff; border-radius: 50%; background: #2563eb; box-sizing: border-box; }
.avatar-picker-camera img { width: 14px; height: 14px; filter: brightness(0) invert(1); }
.avatar-picker-copy { min-width: 0; }
.avatar-picker-change { min-height: 36px; padding: 0; border: 0; background: transparent; color: #2563eb; font: inherit; font-size: 14px; font-weight: 600; text-align: left; cursor: pointer; }
.avatar-picker-copy p { margin: 2px 0 3px; color: #64748b; font-size: 11px; line-height: 1.6; }
.avatar-picker-copy small { color: #64748b; font-size: 11px; line-height: 1.6; }
.avatar-picker-error, .avatar-picker-status { margin: 10px 0 0; font-size: 12px; line-height: 1.6; }
.avatar-picker-error { color: #b91c1c; }
.avatar-picker-status { color: #475569; }
.avatar-file-input { display: none; }
.avatar-picker button:focus-visible { outline: 3px solid #93b4ed; outline-offset: 3px; }
.avatar-picker button:disabled { opacity: .55; cursor: wait; }
</style>
