<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppChip, AppInput } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import {
  EVENT_CATEGORIES, TICKET_TYPES, emptyEventForm, toEventCreate, validateEventForm, type EventForm, type EventFormErrors,
} from '@/shared/composables/useEventForm'
import type { EventCreate } from '@/shared/types/business'

/**
 * Formularul unui eveniment al firmei (T09) — același pe web (pagină) și pe mobil (în AppSheet).
 * Locul e opțional: gol = la sediul firmei. Emite `submit` cu cererea gata de trimis.
 */
const props = defineProps<{ initial?: EventForm; saving?: boolean; submitLabel?: string; compact?: boolean }>()
const emit = defineEmits<{ submit: [req: EventCreate]; cancel: [] }>()
const { t } = useI18n()
const { todayIso } = useFormat()

const ev = reactive<EventForm>({ ...(props.initial ?? emptyEventForm(todayIso())) })
const errors = ref<EventFormErrors>({})
const err = (k: keyof EventForm) => (errors.value[k] ? t(errors.value[k] as string) : undefined)
const hasPrices = computed(() => ev.ticketType !== 'FREE')
const isExternal = computed(() => ev.ticketType === 'EXTERNAL')
const URL_HINT = 'https://'

function submit() {
  errors.value = validateEventForm(ev)
  if (Object.keys(errors.value).length) return
  emit('submit', toEventCreate(ev))
}

const field = 'w-full bg-white border border-line rounded-[14px] px-3.5 text-[16px] outline-none focus:border-ink'
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <AppInput v-model="ev.title" :label="t('business.form.title')" :placeholder="t('business.form.titlePh')" :error="err('title')" />

    <label class="block">
      <span class="block text-[14px] font-semibold mb-2">{{ t('business.form.description') }}</span>
      <textarea v-model="ev.description" rows="3" :placeholder="t('business.form.descriptionPh')" :class="[field, 'py-3 resize-y', err('description') && 'border-accent']" />
      <span v-if="err('description')" class="block text-[13px] text-accent mt-1">{{ err('description') }}</span>
    </label>

    <div>
      <span class="block text-[14px] font-semibold mb-2">{{ t('business.form.category') }}</span>
      <div class="flex flex-wrap gap-2">
        <AppChip v-for="c in EVENT_CATEGORIES" :key="c" :active="ev.category === c" @click="ev.category = c">{{ t(`business.eventCategory.${c}`) }}</AppChip>
      </div>
    </div>

    <div class="grid gap-3" :class="compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'">
      <AppInput v-model="ev.date" type="date" :label="t('business.form.date')" :error="err('date')" :class="compact && 'col-span-2'" />
      <AppInput v-model="ev.start" type="time" :label="t('business.form.start')" :error="err('start')" />
      <AppInput v-model="ev.end" type="time" :label="t('business.form.end')" :error="err('end')" />
    </div>

    <div>
      <span class="block text-[14px] font-semibold mb-2">{{ t('business.form.ticketType') }}</span>
      <div class="flex flex-wrap gap-2">
        <AppChip v-for="tt in TICKET_TYPES" :key="tt" :active="ev.ticketType === tt" @click="ev.ticketType = tt">{{ t(`business.ticketType.${tt}`) }}</AppChip>
      </div>
    </div>

    <div v-if="hasPrices" class="grid grid-cols-2 gap-3">
      <AppInput v-model="ev.priceAdult" type="number" :label="t('business.form.priceAdult')" :error="err('priceAdult')" />
      <AppInput v-model="ev.priceChild" type="number" :label="t('business.form.priceChild')" :error="err('priceChild')" />
    </div>
    <AppInput v-if="isExternal" v-model="ev.externalUrl" type="url" :label="t('business.form.externalUrl')" :placeholder="URL_HINT" :error="err('externalUrl')" />

    <div class="grid gap-3 grid-cols-1" :class="!compact && 'sm:grid-cols-2'">
      <AppInput v-model="ev.capacity" type="number" :label="t('business.form.capacity')" :error="err('capacity')" />
      <AppInput v-model="ev.imageUrl" :label="t('business.form.imageUrl')" />
    </div>
    <div class="grid gap-3 grid-cols-1" :class="!compact && 'sm:grid-cols-2'">
      <AppInput v-model="ev.locationName" :label="t('business.form.location')" :placeholder="t('business.form.locationPh')" />
      <AppInput v-model="ev.address" :label="t('business.form.address')" />
    </div>

    <div class="flex gap-2.5 pt-1" :class="compact ? 'flex-col-reverse' : 'justify-end'">
      <AppButton variant="ghost" :block="compact" @click="emit('cancel')">{{ t('business.form.cancel') }}</AppButton>
      <AppButton type="submit" :loading="saving" :block="compact">{{ submitLabel ?? t('business.form.publish') }}</AppButton>
    </div>
  </form>
</template>
