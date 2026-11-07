<script setup lang="ts">
/**
 * Cardul unei acțiuni comunitare (design/final mobile: `actcard`): poză cu data în colț și „+50 puncte”, titlu, ore · loc,
 * apoi fie starea înscrierii mele, fie „Radu, Elena și încă 16 merg”. Folosit în Comunitate (mobil) și pe web.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import { isActiveRegistration, isEnded } from '@/shared/composables/useCommunity'
import type { ActionSummary } from '@/shared/types/community'

const props = defineProps<{ action: ActionSummary; to: string }>()
const { t } = useI18n()
const f = useFormat()

const TZ = 'Europe/Bucharest'
const parts = computed(() => {
  const d = new Date(props.action.startAt)
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('ro-RO', { timeZone: TZ, ...o }).format(d).replace('.', '').toUpperCase()
  return { dow: fmt({ weekday: 'short' }), day: fmt({ day: 'numeric' }), mon: fmt({ month: 'short' }) }
})
const reg = computed(() => (isActiveRegistration(props.action.myRegistration) ? props.action.myRegistration : undefined))
const more = computed(() => Math.max(0, props.action.registeredCount - props.action.goingPreview.length))
const ended = computed(() => isEnded(props.action))
</script>

<template>
  <router-link :to="to" class="block w-full rounded-[22px] overflow-hidden bg-white border border-line no-underline text-ink">
    <div class="relative h-[160px] bg-green-deep bg-cover bg-center" :style="action.imageUrl ? { backgroundImage: `url('${action.imageUrl}')` } : undefined">
      <div class="absolute left-3 top-3 w-[54px] py-1.5 rounded-[14px] bg-white flex flex-col items-center leading-[1.05] shadow-[0_4px_12px_rgba(0,0,0,.18)]">
        <span class="text-[10px] font-extrabold text-muted">{{ parts.dow }}</span>
        <b class="text-[24px] text-green">{{ parts.day }}</b>
        <span class="text-[10px] font-extrabold text-muted">{{ parts.mon }}</span>
      </div>
      <span class="absolute right-3 top-3 bg-green-soft text-green-deep font-bold text-[13px] px-3 py-1.5 rounded-full">
        {{ t('community.card.points', { n: action.pointsReward }) }}
      </span>
      <span v-if="!action.imageUrl" class="absolute inset-0 flex items-center justify-center text-white/70"><AppIcon name="volunteer_activism" :size="48" /></span>
    </div>
    <div class="px-4 pt-3 pb-3.5">
      <h3 class="text-[18px] font-semibold leading-snug m-0">{{ action.title }}</h3>
      <div class="text-muted text-[13.5px] mt-0.5">{{ f.timeRange(action.startAt, action.endAt) }} · {{ action.locationName }}</div>
      <div v-if="reg" class="mt-2">
        <span class="inline-flex items-center gap-1 rounded-full bg-green-soft text-green-deep text-[12.5px] font-semibold px-2.5 py-1">
          <AppIcon name="check_circle" :size="16" />
          {{ reg.status === 'CONFIRMED' ? t('community.card.confirmed', { n: action.pointsReward }) : t('community.card.registered') }}
        </span>
      </div>
      <div v-else-if="ended" class="mt-2 text-[13px] text-muted">{{ t('community.card.ended') }}</div>
      <div v-else-if="action.goingPreview.length" class="flex items-center gap-2 text-[13px] text-muted mt-2">
        <span class="flex">
          <i v-for="(g, i) in action.goingPreview" :key="i" class="not-italic w-6 h-6 rounded-full bg-soft border-2 border-white text-[10px] font-bold text-ink flex items-center justify-center" :class="i > 0 && '-ml-1.5'">{{ g.charAt(0) }}</i>
        </span>
        <span>{{ more ? t('community.card.goingMore', { names: action.goingPreview.join(', '), n: more }) : t('community.card.going', { names: action.goingPreview.join(', ') }) }}</span>
      </div>
      <div v-else class="mt-2 text-[13px] text-muted">{{ t('community.card.beFirst') }}</div>
    </div>
  </router-link>
</template>
