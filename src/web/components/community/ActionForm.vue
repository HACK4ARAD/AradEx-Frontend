<script setup lang="ts">
/**
 * Formularul unei acțiuni comunitare — design/final web `#/city/actions/new` (`.form` = `.fcard` + `.phone-pv`):
 * Detalii (titlu, categorie, partener, ziua și orele, locul), Puncte și locuri (alegeri rapide), descriere, poză — cu
 * previzualizarea cardului din aplicație. Emite `submit(req)` cu starea aleasă (ciornă / publicată; la editare rămâne).
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import * as P from '@/web/components/community/panel'
import { useFormat } from '@/shared/composables/useFormat'
import {
  ACTION_CATEGORIES, ACTION_IMAGES, POINT_CHOICES, SPOT_CHOICES, dayParts, emptyActionForm, toActionCreate, validateActionForm,
  type ActionForm, type ActionFormErrors,
} from '@/shared/composables/useCommunity'
import { bucharestIso } from '@/shared/composables/useEventForm'
import type { ActionCreate, ActionStatus } from '@/shared/types/community'

const props = defineProps<{ initial?: ActionForm; status?: ActionStatus; registered?: number; saving?: boolean }>()
const emit = defineEmits<{ submit: [req: ActionCreate]; cancel: [] }>()
const { t } = useI18n()
const { todayIso, timeRange } = useFormat()

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

/* previzualizarea (design `actPreview()`) */
const okTimes = computed(() => /^\d{4}-\d{2}-\d{2}$/.test(form.date) && /^\d{2}:\d{2}$/.test(form.start) && /^\d{2}:\d{2}$/.test(form.end))
const startIso = computed(() => (okTimes.value ? bucharestIso(form.date, form.start) : new Date().toISOString()))
const parts = computed(() => dayParts(startIso.value))
const when = computed(() => (okTimes.value ? timeRange(startIso.value, bucharestIso(form.date, form.end)) : `${form.start}–${form.end}`))
const credit = computed(() => ACTION_IMAGES.find((i) => i.url === form.imageUrl)?.credit)
const invalid = (k: keyof ActionForm) => (err(k) ? '!border-accent' : '')
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-5 items-start">
    <form :class="P.FCARD" novalidate @submit.prevent="submit(editing ? undefined : 'PUBLISHED')">
      <div :class="P.FSEC">{{ t('community.form.details') }}</div>
      <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('community.form.title') }}</span>
        <input v-model="form.title" :class="[P.INPUT, invalid('title')]" :placeholder="t('community.form.titlePh')" maxlength="160">
        <span v-if="err('title')" class="text-[12.5px] text-accent">{{ err('title') }}</span></label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('community.form.category') }}</span>
          <select v-model="form.category" :class="P.INPUT"><option v-for="c in ACTION_CATEGORIES" :key="c" :value="c">{{ t(`community.category.${c}`) }}</option></select></label>
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('community.form.organizer') }}</span>
          <input v-model="form.organizer" :class="P.INPUT" :placeholder="t('community.form.organizerPh')" maxlength="120"></label>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('community.form.date') }}</span><input v-model="form.date" type="date" :class="[P.INPUT, invalid('date')]"></label>
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('community.form.start') }}</span><input v-model="form.start" type="time" :class="[P.INPUT, invalid('start')]"></label>
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('community.form.end') }}</span><input v-model="form.end" type="time" :class="[P.INPUT, invalid('end')]">
          <span v-if="err('end')" class="text-[12.5px] text-accent">{{ err('end') }}</span></label>
      </div>
      <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('community.form.place') }}</span>
        <input v-model="form.locationName" :class="[P.INPUT, invalid('locationName')]" :placeholder="t('community.form.placePh')" maxlength="200">
        <span v-if="err('locationName')" class="text-[12.5px] text-accent">{{ err('locationName') }}</span></label>
      <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('community.form.address') }}</span>
        <input v-model="form.address" :class="P.INPUT" :placeholder="t('community.form.addressPh')" maxlength="250"></label>

      <div :class="P.FSEC">{{ t('community.form.pointsAndSpots') }}</div>
      <div class="flex flex-col gap-1.5">
        <span :class="P.LABEL">{{ t('community.form.points') }}</span>
        <div class="flex flex-wrap gap-2 items-center">
          <button v-for="p in POINT_CHOICES" :key="p" type="button" :class="P.chip(Number(form.pointsReward) === p)" @click="form.pointsReward = p">{{ p }}</button>
          <input v-model.number="form.pointsReward" type="number" min="10" max="200" :aria-label="t('community.form.points')" :class="[P.INPUT, 'h-8 !w-24', invalid('pointsReward')]">
        </div>
        <span v-if="err('pointsReward')" class="text-[12.5px] text-accent">{{ err('pointsReward') }}</span>
      </div>
      <div class="flex flex-col gap-1.5">
        <span :class="P.LABEL">{{ t('community.form.spots') }}</span>
        <div class="flex flex-wrap gap-2 items-center">
          <button v-for="s in SPOT_CHOICES" :key="s" type="button" :class="P.chip(Number(form.capacity) === s)" @click="form.capacity = s">{{ s }}</button>
          <input v-model.number="form.capacity" type="number" min="1" max="1000" :aria-label="t('community.form.spots')" :class="[P.INPUT, 'h-8 !w-24', invalid('capacity')]">
        </div>
        <span v-if="err('capacity')" class="text-[12.5px] text-accent">{{ err('capacity') }}</span>
      </div>
      <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('community.form.description') }}</span>
        <textarea v-model="form.description" rows="4" :class="[P.INPUT, 'h-auto py-2.5', invalid('description')]" :placeholder="t('community.form.descriptionPh')" maxlength="4000" />
        <span v-if="err('description')" class="text-[12.5px] text-accent">{{ err('description') }}</span></label>

      <div :class="P.FSEC">{{ t('community.form.photo') }}</div>
      <div class="flex flex-wrap items-center gap-3.5 p-3 border-[1.5px] border-dashed border-[#D3D2CC] rounded-xl bg-[#FBFBFA]">
        <div class="w-20 h-14 rounded-[9px] bg-[#E8E7E2] bg-center bg-cover shrink-0 flex items-center justify-center text-[#A8A7A1]" :style="form.imageUrl ? { backgroundImage: `url('${form.imageUrl}')` } : undefined">
          <AppIcon v-if="!form.imageUrl" name="image" :size="22" />
        </div>
        <div class="flex-1 min-w-[160px] text-[12.5px] text-muted">{{ credit ?? t('community.form.photoHint') }}</div>
        <div class="flex gap-1.5">
          <button v-for="img in ACTION_IMAGES" :key="img.url" type="button" class="w-12 h-9 rounded-lg bg-cover bg-center border-2"
            :class="form.imageUrl === img.url ? 'border-ink' : 'border-transparent'" :style="{ backgroundImage: `url('${img.url}')` }" :aria-label="img.credit" @click="form.imageUrl = img.url" />
          <button type="button" :class="P.BTN_SM_SEC" @click="form.imageUrl = ''">{{ t('community.form.noPhoto') }}</button>
        </div>
      </div>

      <div class="flex flex-wrap gap-2.5 justify-end pt-4 border-t border-line">
        <button type="button" :class="P.BTN_SEC" :disabled="saving" @click="emit('cancel')">{{ t('community.form.cancel') }}</button>
        <template v-if="!editing">
          <button type="button" :class="P.BTN_SEC" :disabled="saving" @click="submit('DRAFT')">{{ t('community.form.saveDraft') }}</button>
          <button type="submit" :class="P.BTN" :disabled="saving"><AppIcon name="publish" :size="16" />{{ t('community.form.publish') }}</button>
        </template>
        <template v-else>
          <button v-if="status === 'DRAFT'" type="button" :class="P.BTN_SEC" :disabled="saving" @click="submit('PUBLISHED')"><AppIcon name="publish" :size="16" />{{ t('community.form.publish') }}</button>
          <button type="submit" :class="P.BTN" :disabled="saving">{{ t('community.form.save') }}</button>
        </template>
      </div>
    </form>

    <!-- previzualizare pe telefon (design `.phone-pv` + `actPreview()`) -->
    <div class="xl:sticky xl:top-[84px] bg-[#0A0A0A] rounded-[38px] p-[9px] shadow-[0_24px_60px_rgba(0,0,0,.18)]">
      <div class="bg-bg rounded-[30px] px-3.5 pt-[18px] pb-[22px] min-h-[440px] flex flex-col gap-3">
        <div class="text-[11px] font-bold text-[#6E6E73] tracking-[.07em] uppercase text-center">{{ t('community.form.preview') }}</div>
        <div class="rounded-[20px] overflow-hidden bg-white shadow-[0_2px_10px_rgba(0,0,0,.08)]">
          <div class="relative h-[150px] bg-[#4F7A3A] bg-cover bg-center flex items-center justify-center text-white/80" :style="form.imageUrl ? { backgroundImage: `url('${form.imageUrl}')` } : undefined">
            <AppIcon v-if="!form.imageUrl" name="park" :size="46" />
            <div class="absolute left-3 top-3 w-[54px] py-1.5 rounded-[14px] bg-white flex flex-col items-center leading-[1.05] shadow-[0_4px_12px_rgba(0,0,0,.18)]">
              <span class="text-[10px] font-extrabold text-muted">{{ parts.dow }}</span><b class="text-[24px] text-green">{{ parts.day }}</b><span class="text-[10px] font-extrabold text-muted">{{ parts.mon }}</span>
            </div>
            <span class="absolute right-3 top-3 bg-green-soft text-green-deep font-bold text-[12.5px] px-2.5 py-1 rounded-full">{{ t('community.card.points', { n: form.pointsReward || 0 }) }}</span>
          </div>
          <div class="px-3.5 pt-3 pb-3.5 flex flex-col gap-1">
            <b class="text-[16px]" :class="form.title ? 'text-ink' : 'text-[#9a9a9a]'">{{ form.title || t('community.form.titlePh') }}</b>
            <span class="text-[12.5px] text-muted">{{ when }} · {{ form.locationName || t('community.form.placePh') }}</span>
            <span class="text-[12px] text-muted">{{ t('community.form.previewSpots', { taken: registered ?? 0, total: form.capacity || 0, org: form.organizer || t('community.action.organizer') }) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
