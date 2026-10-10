<template>
  <div class="auth-input-shell" :class="{ 'has-error': invalid }">
    <input :id="id" :value="modelValue" :type="visible ? 'text' : 'password'" :autocomplete="autocomplete" :maxlength="maxlength" :placeholder="placeholder" :aria-invalid="invalid || undefined" :aria-describedby="describedby" :disabled="disabled" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
    <button class="auth-password-toggle" type="button" :aria-label="visible ? copy.hidePassword : copy.showPassword" :aria-pressed="visible" :disabled="disabled" @click="visible = !visible"><img :src="visible ? eyeOff : eye" alt="" /></button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthCopy } from '@/composables/useAuthCopy'
import eye from '@/assets/app/icons/auth/eye.png'
import eyeOff from '@/assets/app/icons/auth/eye-off.png'
defineProps<{ id: string; modelValue: string; autocomplete: 'current-password' | 'new-password'; maxlength?: number; placeholder?: string; invalid?: boolean; describedby?: string; disabled?: boolean }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
const visible = ref(false)
const copy = useAuthCopy()
</script>
