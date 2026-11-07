<script setup lang="ts">
/** Confirmare manuală după cod (`AX-C1-…`): input + buton. Literele mici și spațiile se corectează automat. */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppInput } from '@/shared/components'

defineProps<{ loading?: boolean; label?: string }>()
const emit = defineEmits<{ submit: [code: string] }>()
const { t } = useI18n()
const code = ref('')

function submit() {
  if (!code.value.trim()) return
  emit('submit', code.value)
  code.value = ''
}
</script>

<template>
  <form class="flex gap-2 items-end" @submit.prevent="submit">
    <AppInput v-model="code" :label="label" placeholder="AX-C1-…" autocomplete="off" class="flex-1 min-w-0" />
    <AppButton type="submit" :loading="loading" :disabled="!code.trim()" class="whitespace-nowrap">{{ t('community.scan.confirm') }}</AppButton>
  </form>
</template>
