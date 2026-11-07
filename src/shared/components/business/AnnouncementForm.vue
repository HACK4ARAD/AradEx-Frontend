<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppInput } from '@/shared/components'
import type { AnnouncementCreate } from '@/shared/types/business'

/** Anunț nou (T09): titlu scurt + 2–3 rânduri. Același pe web și în sheet-ul de pe mobil. */
defineProps<{ saving?: boolean; compact?: boolean }>()
const emit = defineEmits<{ submit: [req: AnnouncementCreate]; cancel: [] }>()
const { t } = useI18n()

const form = reactive({ title: '', body: '' })
const errors = ref<{ title?: string; body?: string }>({})

function submit() {
  errors.value = {}
  if (!form.title.trim()) errors.value.title = t('business.form.required')
  if (!form.body.trim()) errors.value.body = t('business.form.required')
  if (errors.value.title || errors.value.body) return
  emit('submit', { title: form.title.trim(), body: form.body.trim() })
}
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <AppInput v-model="form.title" :label="t('business.form.annTitle')" :placeholder="t('business.form.annTitlePh')" :error="errors.title" />
    <label class="block">
      <span class="block text-[14px] font-semibold mb-2">{{ t('business.form.annBody') }}</span>
      <textarea v-model="form.body" rows="3" maxlength="1000" :placeholder="t('business.form.annBodyPh')"
        class="w-full bg-white border rounded-[14px] px-3.5 py-3 text-[16px] outline-none focus:border-ink resize-y" :class="errors.body ? 'border-accent' : 'border-line'" />
      <span v-if="errors.body" class="block text-[13px] text-accent mt-1">{{ errors.body }}</span>
    </label>
    <div class="flex gap-2.5" :class="compact ? 'flex-col-reverse' : 'justify-end'">
      <AppButton variant="ghost" :block="compact" @click="emit('cancel')">{{ t('business.form.cancel') }}</AppButton>
      <AppButton type="submit" :loading="saving" :block="compact">{{ t('business.form.publish') }}</AppButton>
    </div>
  </form>
</template>
