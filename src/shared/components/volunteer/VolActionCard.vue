<script setup lang="ts">
/**
 * O acțiune alocată voluntarului (design/final `/vol/actions`): data în colț, titlul, ora și locul, „3/5 confirmați” cu bara
 * verde, „Scanează aici” + „Indicații”. Peste card: lacătul până cu 30 de minute înainte de start, bifa verde când toți
 * înscrișii sunt confirmați, „Acțiune încheiată” după ziua ei.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { dayParts, directionsUrl } from '@/shared/composables/useCommunity'
import { useFormat } from '@/shared/composables/useFormat'
import type { VolunteerActionDto } from '@/shared/types/volunteer'

const props = defineProps<{ action: VolunteerActionDto; firstName?: string; now?: number }>()
const emit = defineEmits<{ scan: [id: number] }>()
const { t } = useI18n()
const f = useFormat()

const parts = computed(() => dayParts(props.action.startAt))
const pct = computed(() => (props.action.registered ? Math.round((props.action.confirmed / props.action.registered) * 100) : 0))
const done = computed(() => props.action.registered > 0 && props.action.confirmed >= props.action.registered)
const day = computed(() => f.dateTime(props.action.startAt, false).toLowerCase())
const opens = computed(() => f.timeRange(props.action.opensAt))
const days = computed(() => {
  const today = new Date(props.now ?? Date.now())
  const key = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(d)
  return Math.round((Date.parse(key(new Date(props.action.startAt))) - Date.parse(key(today))) / 864e5)
})
/** Peste card: lacăt (încă închisă), bifă (toți confirmați) sau „încheiată”; deschisă = fără nimic. */
const veil = computed<'locked' | 'done' | 'ended' | null>(() =>
  props.action.state === 'LOCKED' ? 'locked' : done.value ? 'done' : props.action.state === 'ENDED' ? 'ended' : null)
</script>

<template>
  <div class="relative" data-test="vol-action">
    <div class="bg-white border border-line rounded-[20px] p-4 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)]"
      :class="veil === 'locked' ? 'opacity-50 select-none pointer-events-none' : ''" :style="veil === 'locked' ? { filter: 'blur(4px)', WebkitFilter: 'blur(4px)' } : undefined"
      :aria-hidden="veil === 'locked' || undefined">
      <div class="flex items-start gap-3">
        <div class="w-[54px] shrink-0 py-1.5 rounded-[14px] border border-line flex flex-col items-center leading-[1.05]">
          <span class="text-[10px] font-extrabold text-muted">{{ parts.dow }}</span>
          <b class="text-[20px]">{{ parts.day }}</b>
          <span class="text-[10px] font-extrabold text-muted">{{ parts.mon }}</span>
        </div>
        <div class="min-w-0 flex-1">
          <b class="block text-[16px] leading-[1.25]">{{ action.title }}</b>
          <span class="block text-muted text-[13px] mt-0.5">{{ f.timeRange(action.startAt, action.endAt) }} · {{ action.locationName }}</span>
          <div class="flex flex-wrap gap-1.5 mt-2">
            <span class="inline-flex items-center h-6 px-2 rounded-full bg-green-soft text-green-deep text-[12px] font-semibold">{{ t('volunteer.actions.confirmed', { n: action.confirmed, total: action.registered }) }}</span>
            <span v-if="action.confirmedByMe" class="inline-flex items-center h-6 px-2 rounded-full bg-soft text-ink text-[12px] font-semibold">{{ t('volunteer.actions.byMe', { n: action.confirmedByMe }) }}</span>
          </div>
        </div>
      </div>
      <div class="h-1.5 rounded-full bg-soft overflow-hidden my-3"><div class="h-full rounded-full bg-green transition-[width]" :style="{ width: `${pct}%` }" /></div>
      <div class="flex gap-2">
        <button type="button" class="flex-1 h-11 rounded-[14px] bg-ink text-white text-[14.5px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          :disabled="action.state !== 'OPEN'" data-test="vol-scan-here" @click="emit('scan', action.id)">
          <AppIcon name="qr_code_scanner" :size="20" />{{ t('volunteer.actions.scanHere') }}
        </button>
        <a :href="directionsUrl(action)" target="_blank" rel="noopener"
          class="h-11 px-4 rounded-[14px] bg-white border border-line text-ink text-[14.5px] font-semibold inline-flex items-center justify-center gap-1.5 no-underline">
          <AppIcon name="directions" :size="20" />{{ t('volunteer.actions.directions') }}
        </a>
      </div>
    </div>

    <!-- un strat semi-opac sub text: textul lacătului rămâne lizibil și unde filtrul blur nu merge (WebView-uri vechi) -->
    <div v-if="veil === 'locked'" class="absolute inset-0 rounded-[20px] flex flex-col items-center justify-center text-center gap-1.5 px-6" style="background: rgba(250, 250, 247, 0.72)" data-test="vol-locked">
      <span class="w-14 h-14 rounded-full bg-ink text-white flex items-center justify-center mb-1"><AppIcon name="lock" /></span>
      <b class="text-[17px]">{{ t('volunteer.actions.opensOn', { day }) }}</b>
      <span class="text-muted text-[13.5px] leading-snug">{{ t('volunteer.actions.opensAt', { time: opens }) }}<template v-if="days > 0"> · {{ t('volunteer.actions.inDays', { n: days }, days) }}</template></span>
    </div>
    <div v-else-if="veil" class="absolute inset-0 rounded-[20px] flex flex-col items-center justify-center text-center gap-1.5 px-6"
      :class="veil === 'done' ? 'bg-green-deep/95 text-white' : 'bg-white/90 text-ink'" data-test="vol-done">
      <span class="w-14 h-14 rounded-full flex items-center justify-center mb-1" :class="veil === 'done' ? 'bg-white text-green-deep' : 'bg-soft text-muted'">
        <AppIcon :name="veil === 'done' ? 'check' : 'event_available'" />
      </span>
      <b class="text-[17px]">{{ veil === 'done' ? t('volunteer.actions.doneTitle') : t('volunteer.actions.endedTitle') }}</b>
      <span class="text-[13.5px]" :class="veil === 'done' ? 'opacity-90' : 'text-muted'">
        {{ veil === 'done' ? t('volunteer.actions.doneSub', { n: action.confirmed, total: action.registered, name: firstName ?? '' }) : t('volunteer.actions.endedSub', { n: action.confirmedByMe }) }}
      </span>
    </div>
  </div>
</template>
