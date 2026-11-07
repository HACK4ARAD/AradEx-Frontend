<script setup lang="ts">
/**
 * Corpul detaliului unei acțiuni comunitare (design/final mobile „Acțiune comunitară”, web W12 „Detalii”): +puncte, ore + Calendar,
 * loc + Indicații, locuri cu bara de umplere, cine merge, despre, „Cum primești punctele”. Mobil (T11) și web (T23).
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import { actionCalendarUrl, actionMapTo, spotsLeft } from '@/shared/composables/useCommunity'
import type { ActionDto } from '@/shared/types/community'

const props = defineProps<{ action: ActionDto }>()
const { t } = useI18n()
const f = useFormat()
const a = computed(() => props.action)
const free = computed(() => spotsLeft(a.value))
const fill = computed(() => Math.min(100, Math.round((a.value.registeredCount / a.value.capacity) * 100)))
const more = computed(() => Math.max(0, a.value.registeredCount - a.value.goingPreview.length))
const calendarUrl = computed(() => actionCalendarUrl(a.value))
const mapTo = computed(() => actionMapTo(a.value.id))
</script>

<template>
  <div>
    <div class="mt-4 rounded-[16px] bg-green-soft text-green-deep p-3.5 flex gap-3">
      <AppIcon name="volunteer_activism" class="shrink-0" />
      <span class="text-[14px]"><b class="text-[16px]">{{ t('community.card.points', { n: a.pointsReward }) }}</b><br>{{ t('community.action.pointsNote') }}</span>
    </div>

    <div class="flex items-center gap-3 py-3.5 border-b border-line">
      <AppIcon name="schedule" class="text-muted" />
      <span class="flex-1 font-medium text-[15px]">{{ f.dateTime(a.startAt, false) }} · {{ f.timeRange(a.startAt, a.endAt) }}</span>
      <a :href="calendarUrl" target="_blank" rel="noopener" class="h-8 px-3 rounded-full border border-line text-[13px] font-semibold flex items-center gap-1 no-underline text-ink"><AppIcon name="event_available" :size="16" />{{ t('community.action.calendar') }}</a>
    </div>
    <div class="flex items-center gap-3 py-3.5 border-b border-line">
      <AppIcon name="location_on" class="text-muted" />
      <span class="flex-1 font-medium text-[15px] min-w-0">{{ a.locationName }}<small v-if="a.address" class="block text-muted text-[13px] font-normal">{{ a.address }}</small></span>
      <router-link :to="mapTo" class="h-8 px-3 rounded-full border border-line text-[13px] font-semibold flex items-center gap-1 no-underline text-ink shrink-0"><AppIcon name="directions" :size="16" />{{ t('community.action.directions') }}</router-link>
    </div>
    <div class="flex items-start gap-3 py-3.5">
      <AppIcon name="group" class="text-muted" />
      <div class="flex-1">
        <span class="font-medium text-[15px]">{{ t('community.action.spots', { taken: a.registeredCount, total: a.capacity, free }) }}</span>
        <div class="h-2 rounded bg-soft mt-2 overflow-hidden"><i class="block h-full bg-green rounded" :style="{ width: `${fill}%` }" /></div>
      </div>
    </div>
    <div v-if="a.goingPreview.length" class="flex items-center gap-2 text-[13px] text-muted">
      <span class="flex"><i v-for="(g, i) in a.goingPreview" :key="i" class="not-italic w-6 h-6 rounded-full bg-soft border-2 border-white text-[10px] font-bold text-ink flex items-center justify-center" :class="i > 0 && '-ml-1.5'">{{ g.charAt(0) }}</i></span>
      <span>{{ more ? t('community.card.goingMore', { names: a.goingPreview.join(', '), n: more }) : t('community.card.going', { names: a.goingPreview.join(', ') }) }}</span>
    </div>

    <h3 class="text-[17px] font-semibold m-0 mt-5 mb-1.5">{{ t('community.action.about') }}</h3>
    <p class="text-muted text-[15px] m-0 whitespace-pre-line">{{ a.description }}</p>
    <p v-if="a.organizer" class="text-muted text-[13.5px] m-0 mt-2">{{ t('community.action.partner', { name: a.organizer }) }}</p>

    <h3 class="text-[17px] font-semibold m-0 mt-5 mb-2.5">{{ t('community.action.howTitle') }}</h3>
    <div v-for="n in 3" :key="n" class="flex gap-3 mb-3">
      <span class="w-7 h-7 rounded-full border-2 border-green text-green-deep font-bold text-[13px] flex items-center justify-center shrink-0">{{ n }}</span>
      <div><b class="text-[15px]">{{ t(`community.action.how${n}Title`) }}</b><p class="text-muted text-[13.5px] m-0">{{ t(`community.action.how${n}Text`, { n: a.pointsReward }) }}</p></div>
    </div>
  </div>
</template>
