<script setup lang="ts">
/**
 * Formularul unei acțiuni comunitare (design/final web „Acțiune comunitară nouă”): detalii, ziua și orele, locul,
 * puncte și locuri (alegeri rapide), descriere, poză din cele cu licență — cu previzualizarea cardului ca în aplicație.
 * Emite `submit(req)` cu starea aleasă (ciornă / publicată; la editare starea rămâne dacă nu se alege alta).
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppChip, AppInput } from '@/shared/components'
import ActionCard from '@/shared/components/community/ActionCard.vue'
import { useFormat } from '@/shared/composables/useFormat'
import {
  ACTION_CATEGORIES, ACTION_IMAGES, POINT_CHOICES, SPOT_CHOICES, emptyActionForm, toActionCreate, validateActionForm,
  type ActionForm, type ActionFormErrors,
} from '@/shared/composables/useCommunity'
import { bucharestIso } from '@/shared/composables/useEventForm'
import type { ActionCreate, ActionStatus, ActionSummary } from '@/shared/types/community'

const props = defineProps<{ initial?: ActionForm; status?: ActionStatus; registered?: number; saving?: boolean }>()
const emit = defineEmits<{ submit: [req: ActionCreate]; cancel: [] }>()
const { t } = useI18n()
const { todayIso } = useFormat()

/** O acțiune nouă pornește de mâine (azi, la ore trecute, ar apărea deja încheiată). */
const tomorrow = () => { const d = new Date(`${todayIso()}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10) }
const form = reactive<ActionForm>({ ...(props.initial ?? emptyActionForm(tomorrow())) })
const errors = ref<ActionFormErrors>({})
const err = (k: keyof ActionForm) => (errors.value[k] ? t(errors.value[k] as string) : undefined)
const editing = computed(() => !!props.initial)

function submit(status?: ActionCreate['status']) {
  errors.value = validateActionForm(form, props.registered ?? 0)
  if (Object.keys(errors.value).length) return
  emit('submit', toActionCreate(form, status))
}

/** Cardul așa cum apare în aplicație, din ce e scris acum în formular. */
const preview = computed<ActionSummary>(() => {
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(form.date) && /^\d{2}:\d{2}$/.test(form.start) && /^\d{2}:\d{2}$/.test(form.end)
  const start = ok ? bucharestIso(form.date, form.start) : new Date().toISOString()
  return {
    id: 0, title: form.title || t('community.form.titlePh'), category: form.category, organizer: form.organizer,
    startAt: start, endAt: ok ? bucharestIso(form.date, form.end) : start, locationName: form.locationName || t('community.form.placePh'),
    lat: 0, lng: 0, pointsReward: Number(form.pointsReward) || 0, capacity: Number(form.capacity) || 0, registeredCount: props.registered ?? 0,
    imageUrl: form.imageUrl || undefined, goingPreview: [],
  }
})

const field = 'w-full bg-white border border-line rounded-[14px] px-3.5 text-[16px] outline-none focus:border-ink'
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
    <form class="bg-white rounded-[16px] border border-line p-5 flex flex-col gap-4 min-w-0" novalidate @submit.prevent="submit()">
      <b class="text-[13px] uppercase tracking-[0.06em] text-muted">{{ t('community.form.details') }}</b>
      <AppInput v-model="form.title" :label="t('community.form.title')" :placeholder="t('community.form.titlePh')" :error="err('title')" />
      <div>
        <span class="block text-[14px] font-semibold mb-2">{{ t('community.form.category') }}</span>
        <div class="flex flex-wrap gap-2">
          <AppChip v-for="c in ACTION_CATEGORIES" :key="c" :active="form.category === c" @click="form.category = c">{{ t(`community.categoryIcon.${c}`) }} {{ t(`community.category.${c}`) }}</AppChip>
        </div>
      </div>
      <AppInput v-model="form.organizer" :label="t('community.form.organizer')" :placeholder="t('community.form.organizerPh')" />
      <div class="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <AppInput v-model="form.date" type="date" :label="t('community.form.date')" :error="err('date')" />
        <AppInput v-model="form.start" type="time" :label="t('community.form.start')" :error="err('start')" />
        <AppInput v-model="form.end" type="time" :label="t('community.form.end')" :error="err('end')" />
      </div>
      <AppInput v-model="form.locationName" :label="t('community.form.place')" :placeholder="t('community.form.placePh')" :error="err('locationName')" />
      <AppInput v-model="form.address" :label="t('community.form.address')" :placeholder="t('community.form.addressPh')" />

      <b class="text-[13px] uppercase tracking-[0.06em] text-muted mt-2">{{ t('community.form.pointsAndSpots') }}</b>
      <div>
        <span class="block text-[14px] font-semibold mb-2">{{ t('community.form.points') }}</span>
        <div class="flex flex-wrap gap-2 items-center">
          <AppChip v-for="p in POINT_CHOICES" :key="p" :active="Number(form.pointsReward) === p" @click="form.pointsReward = p">{{ p }}</AppChip>
          <input v-model.number="form.pointsReward" type="number" min="10" max="200" :aria-label="t('community.form.points')" :class="[field, 'h-9 w-24 text-[14px]']">
        </div>
        <span v-if="err('pointsReward')" class="block text-[13px] text-accent mt-1">{{ err('pointsReward') }}</span>
      </div>
      <div>
        <span class="block text-[14px] font-semibold mb-2">{{ t('community.form.spots') }}</span>
        <div class="flex flex-wrap gap-2 items-center">
          <AppChip v-for="s in SPOT_CHOICES" :key="s" :active="Number(form.capacity) === s" @click="form.capacity = s">{{ s }}</AppChip>
          <input v-model.number="form.capacity" type="number" min="1" max="1000" :aria-label="t('community.form.spots')" :class="[field, 'h-9 w-24 text-[14px]']">
        </div>
        <span v-if="err('capacity')" class="block text-[13px] text-accent mt-1">{{ err('capacity') }}</span>
      </div>
      <label class="block">
        <span class="block text-[14px] font-semibold mb-2">{{ t('community.form.description') }}</span>
        <textarea v-model="form.description" rows="4" :placeholder="t('community.form.descriptionPh')" :class="[field, 'py-3 resize-y', err('description') && 'border-accent']" />
        <span v-if="err('description')" class="block text-[13px] text-accent mt-1">{{ err('description') }}</span>
      </label>

      <b class="text-[13px] uppercase tracking-[0.06em] text-muted mt-2">{{ t('community.form.photo') }}</b>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="w-[96px] h-[64px] rounded-[12px] border-2 bg-soft text-[12px] text-muted" :class="!form.imageUrl ? 'border-ink' : 'border-transparent'" @click="form.imageUrl = ''">{{ t('community.form.noPhoto') }}</button>
        <button v-for="img in ACTION_IMAGES" :key="img.url" type="button" class="w-[96px] h-[64px] rounded-[12px] border-2 bg-cover bg-center"
          :class="form.imageUrl === img.url ? 'border-ink' : 'border-transparent'" :style="{ backgroundImage: `url('${img.url}')` }" :aria-label="img.credit" @click="form.imageUrl = img.url" />
      </div>

      <div class="flex flex-wrap justify-end gap-2 mt-2">
        <AppButton variant="ghost" @click="emit('cancel')">{{ t('community.form.cancel') }}</AppButton>
        <template v-if="!editing">
          <AppButton variant="secondary" :loading="saving" @click="submit('DRAFT')">{{ t('community.form.saveDraft') }}</AppButton>
          <AppButton icon="publish" :loading="saving" @click="submit('PUBLISHED')">{{ t('community.form.publish') }}</AppButton>
        </template>
        <template v-else>
          <AppButton v-if="status === 'DRAFT'" variant="secondary" icon="publish" :loading="saving" @click="submit('PUBLISHED')">{{ t('community.form.publish') }}</AppButton>
          <AppButton :loading="saving" @click="submit()">{{ t('community.form.save') }}</AppButton>
        </template>
      </div>
    </form>

    <div class="lg:sticky lg:top-4 self-start">
      <b class="block text-[13px] uppercase tracking-[0.06em] text-muted mb-2">{{ t('community.form.preview') }}</b>
      <div class="rounded-[28px] bg-bg border border-line p-3 pointer-events-none">
        <ActionCard :action="preview" to="#" />
      </div>
      <p class="text-muted text-[12.5px] m-0 mt-2">{{ t('community.form.previewHint') }}</p>
    </div>
  </div>
</template>
