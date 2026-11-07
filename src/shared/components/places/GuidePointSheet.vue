<script setup lang="ts">
/** Sheet-ul „Punct nou” / „Editează punctul” (W25). Emite `save` cu formularul; părintele întoarce erorile prin prop. */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppInput, AppSheet } from '@/shared/components'
import { emptyGuidePointForm, guidePointToForm, type FormErrors, type GuidePointForm } from '@/shared/composables/usePlaceForm'
import type { GuidePointDto } from '@/shared/types/places'

const props = defineProps<{ point?: GuidePointDto | null; errors: FormErrors; saving?: boolean }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ save: [form: GuidePointForm] }>()
const { t } = useI18n()
const form = ref<GuidePointForm>(emptyGuidePointForm())
watch(open, (v) => { if (v) form.value = props.point ? guidePointToForm(props.point) : emptyGuidePointForm() }, { immediate: true })
const err = (k: string) => (props.errors[k] ? t(`places.form.errors.${props.errors[k]}`) : undefined)
</script>

<template>
  <AppSheet v-model:open="open" :title="point ? t('places.panel.editPoint') : t('places.panel.newPoint')" wide>
    <form class="grid gap-3" @submit.prevent="emit('save', form)">
      <AppInput v-model="form.title" :label="t('places.form.pointTitle')" :error="err('title')" />
      <label class="block">
        <span class="block text-[14px] font-semibold mb-2">{{ t('places.form.pointText') }}</span>
        <textarea v-model="form.text" rows="6" class="w-full bg-white border rounded-[14px] px-3.5 py-3 text-[15px] leading-relaxed outline-none focus:border-ink"
          :class="errors.text ? 'border-accent' : 'border-line'" />
        <span class="block text-[12.5px] mt-1" :class="errors.text ? 'text-accent' : 'text-muted'">{{ err('text') ?? t('places.form.pointTextHint') }}</span>
      </label>
      <div class="grid gap-3 md:grid-cols-2">
        <AppInput v-model="form.durationSec" type="number" :label="t('places.form.durationSec')" :placeholder="t('places.form.durationHint')" :error="err('durationSec')" />
        <AppInput v-model="form.coords" :label="t('places.form.pointCoords')" placeholder="46.1711, 21.3319" :error="err('coords')" />
      </div>
      <button type="submit" class="hidden" />
    </form>
    <template #footer>
      <AppButton variant="ghost" @click="open = false">{{ t('common.cancel') }}</AppButton>
      <AppButton class="flex-1" :loading="saving" @click="emit('save', form)">{{ t('common.save') }}</AppButton>
    </template>
  </AppSheet>
</template>
