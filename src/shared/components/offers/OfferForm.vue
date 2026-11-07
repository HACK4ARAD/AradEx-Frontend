<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppChip, AppInput } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import { OFFER_CATEGORIES, emptyOfferForm, toOfferCreate, validateOfferForm, type OfferForm, type OfferFormErrors } from '@/shared/composables/useOfferForm'
import type { OfferCreate } from '@/shared/types/offers'

/** Ofertă nouă / editare în panoul firmei (W16 pe web, sheet pe mobil). Emite `submit` cu cererea gata de trimis. */
const props = defineProps<{ initial?: OfferForm; saving?: boolean; compact?: boolean; submitLabel?: string }>()
const emit = defineEmits<{ submit: [req: OfferCreate]; cancel: [] }>()
const { t } = useI18n()
const { todayIso } = useFormat()

const of = reactive<OfferForm>({ ...(props.initial ?? emptyOfferForm(todayIso())) })
const errors = ref<OfferFormErrors>({})
const err = (k: keyof OfferForm) => (errors.value[k] ? t(errors.value[k] as string) : undefined)

function submit() {
  errors.value = validateOfferForm(of)
  if (Object.keys(errors.value).length) return
  emit('submit', toOfferCreate(of))
}
const field = 'w-full bg-white border rounded-[14px] px-3.5 py-3 text-[16px] outline-none focus:border-ink resize-y'
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <AppInput v-model="of.title" :label="t('offers.form.title')" :placeholder="t('offers.form.titlePh')" :error="err('title')" />
    <label class="block">
      <span class="block text-[14px] font-semibold mb-2">{{ t('offers.form.description') }}</span>
      <textarea v-model="of.description" rows="3" maxlength="2000" :placeholder="t('offers.form.descriptionPh')" :class="[field, err('description') ? 'border-accent' : 'border-line']" />
      <span v-if="err('description')" class="block text-[13px] text-accent mt-1">{{ err('description') }}</span>
    </label>
    <div class="grid gap-3" :class="compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'">
      <AppInput v-model="of.discountLabel" :label="t('offers.form.discountLabel')" :placeholder="t('offers.form.discountLabelPh')" :error="err('discountLabel')" />
      <AppInput v-model="of.pointsPrice" type="number" :label="t('offers.form.pointsPrice')" :error="err('pointsPrice')" />
    </div>
    <p class="text-[12.5px] text-muted -mt-2 m-0">{{ t('offers.form.pointsHint') }}</p>
    <div>
      <span class="block text-[14px] font-semibold mb-2">{{ t('offers.form.category') }}</span>
      <div class="flex flex-wrap gap-2">
        <AppChip :active="of.category === ''" @click="of.category = ''">{{ t('offers.form.categoryAuto') }}</AppChip>
        <AppChip v-for="c in OFFER_CATEGORIES" :key="c" :active="of.category === c" @click="of.category = c">{{ t(`offers.cats.${c}`) }}</AppChip>
      </div>
    </div>
    <div class="grid gap-3 grid-cols-2">
      <AppInput v-model="of.validFrom" type="date" :label="t('offers.form.validFrom')" />
      <AppInput v-model="of.validUntil" type="date" :label="t('offers.form.validUntil')" :error="err('validUntil')" />
    </div>
    <AppInput v-model="of.imageUrl" :label="t('offers.form.imageUrl')" />
    <label class="flex items-center gap-3 text-[14.5px] font-semibold"><input v-model="of.localProduct" type="checkbox" class="w-5 h-5 accent-ink" />{{ t('offers.form.localProduct') }}</label>
    <label class="flex items-center gap-3 text-[14.5px] font-semibold"><input v-model="of.paused" type="checkbox" class="w-5 h-5 accent-ink" />{{ t('offers.form.paused') }}</label>
    <div class="flex gap-2.5 pt-1" :class="compact ? 'flex-col-reverse' : 'justify-end'">
      <AppButton variant="ghost" :block="compact" @click="emit('cancel')">{{ t('offers.form.cancel') }}</AppButton>
      <AppButton type="submit" :loading="saving" :block="compact">{{ submitLabel ?? t('offers.form.publish') }}</AppButton>
    </div>
  </form>
</template>
