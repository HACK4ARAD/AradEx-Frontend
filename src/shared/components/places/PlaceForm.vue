<script setup lang="ts">
/** Formularul unui obiectiv (W25). Valorile ca text; conversia + validarea în `usePlaceForm`. Erorile = chei din `places.form.errors`. */
import { useI18n } from 'vue-i18n'
import { AppInput } from '@/shared/components'
import { PLACE_TYPES } from '@/shared/composables/usePlaces'
import type { FormErrors, PlaceForm } from '@/shared/composables/usePlaceForm'

defineProps<{ errors: FormErrors }>()
const form = defineModel<PlaceForm>({ required: true })
const { t } = useI18n()
const err = (errors: FormErrors, k: string) => (errors[k] ? t(`places.form.errors.${errors[k]}`) : undefined)
const box = 'w-full bg-white border rounded-[14px] px-3.5 text-[15px] outline-none focus:border-ink'
</script>

<template>
  <div class="grid gap-3">
    <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_110px]">
      <AppInput v-model="form.name" :label="t('places.form.name')" :error="err(errors, 'name')" />
      <label class="block">
        <span class="block text-[14px] font-semibold mb-2">{{ t('places.form.type') }}</span>
        <select v-model="form.type" :class="[box, 'h-12 border-line']">
          <option v-for="ty in PLACE_TYPES" :key="ty" :value="ty">{{ t(`places.type.${ty}`) }}</option>
        </select>
      </label>
      <AppInput v-model="form.visitMinutes" :label="t('places.form.visitMinutes')" type="number" :error="err(errors, 'visitMinutes')" />
    </div>
    <div class="grid gap-3 md:grid-cols-2">
      <AppInput v-model="form.coords" :label="t('places.form.coords')" placeholder="46.1711, 21.3319" :error="err(errors, 'coords')" />
      <AppInput v-model="form.address" :label="t('places.form.address')" />
    </div>
    <label class="block">
      <span class="block text-[14px] font-semibold mb-2">{{ t('places.form.openingHours') }}</span>
      <textarea v-model="form.openingHours" rows="2" :class="[box, 'py-3 leading-relaxed border-line']" />
    </label>
    <div class="grid gap-3 md:grid-cols-2">
      <AppInput v-model="form.parkingHint" :label="t('places.form.parkingHint')" />
      <AppInput v-model="form.tags" :label="t('places.form.tags')" placeholder="istorie, familie" :error="err(errors, 'tags')" />
    </div>
    <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px]">
      <AppInput v-model="form.imageUrl" :label="t('places.form.imageUrl')" placeholder="/img/loc-ca.jpg" />
      <AppInput v-model="form.imageCredit" :label="t('places.form.imageCredit')" />
      <AppInput v-model="form.rating" :label="t('places.form.rating')" :error="err(errors, 'rating')" />
    </div>
    <label class="block">
      <span class="block text-[14px] font-semibold mb-2">{{ t('places.form.description') }}</span>
      <textarea v-model="form.description" rows="4" :class="[box, 'py-3 leading-relaxed', errors.description ? 'border-accent' : 'border-line']" />
      <span v-if="errors.description" class="block text-[13px] text-accent mt-1">{{ err(errors, 'description') }}</span>
    </label>
    <div class="grid gap-3 md:grid-cols-2 items-end">
      <AppInput v-model="form.slug" :label="t('places.form.slug')" :placeholder="t('places.form.slugHint')" :error="err(errors, 'slug')" />
      <label class="flex items-center gap-2.5 h-12 text-[14px] font-medium select-none">
        <input v-model="form.exteriorOnly" type="checkbox" class="w-5 h-5 accent-[#111]" /> {{ t('places.form.exteriorOnly') }}
      </label>
    </div>
  </div>
</template>
