<script setup lang="ts">
/**
 * Butonul „Adaugă în calendar” (Google Calendar, fără login), comun aplicației și web-ului. Evenimentul de o zi se deschide
 * direct; cel care ține mai multe zile (expoziții, târguri) deschide întâi un sheet în care alegi ziua și ora vizitei
 * (`useCalendarSlot`), ca în calendar să intre vizita ta, nu tot intervalul. Clasele și atributele merg pe buton / link.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppSheet } from '@/shared/components'
import { googleCalendarUrl } from '@/shared/composables/useEvents'
import { calendarPlan, calendarSlot, slotHours } from '@/shared/composables/useCalendarSlot'
import { useFormat } from '@/shared/composables/useFormat'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  event: { title: string; startAt: string; endAt?: string; locationName: string; address?: string; description?: string }
  label?: string
  iconSize?: number
}>(), { label: undefined, iconSize: 18 })

const { t } = useI18n()
const f = useFormat()
const plan = computed(() => calendarPlan(props.event))
const open = ref(false)
const day = ref('')
const hour = ref('')
const hours = computed(() => (plan.value && day.value ? slotHours(plan.value, day.value) : []))

watch(open, (v) => { if (v && plan.value) { day.value = plan.value.firstDay; hour.value = '' } })
// ziua nouă nu mai are ora aleasă (ex. azi, după ora aceea): alegem prima oră liberă
watch(hours, (h) => { if (!h.includes(hour.value)) hour.value = h[0] ?? '' })

const dayLabel = computed(() => (day.value ? f.longDate(`${day.value}T12:00:00Z`) : ''))

function add() {
  if (!plan.value || !day.value || !hour.value) return
  window.open(googleCalendarUrl({ ...props.event, ...calendarSlot(plan.value, day.value, hour.value) }), '_blank', 'noopener')
  open.value = false
}
</script>

<template>
  <a v-if="!plan" v-bind="$attrs" :href="googleCalendarUrl(event)" target="_blank" rel="noopener">
    <AppIcon name="event_available" :size="iconSize" />{{ label ?? t('events.detail.addToCalendar') }}
  </a>
  <button v-else v-bind="$attrs" type="button" aria-haspopup="dialog" @click="open = true">
    <AppIcon name="event_available" :size="iconSize" />{{ label ?? t('events.detail.addToCalendar') }}
  </button>

  <AppSheet v-if="plan" v-model:open="open" :title="t('events.calendarPick.title')">
    <div class="flex flex-col gap-4">
      <p class="m-0 text-[14px] text-muted">
        {{ t('events.calendarPick.hint', { open: plan.open, close: plan.close, from: f.longDate(`${plan.firstDay}T12:00:00Z`), to: f.longDate(`${plan.lastDay}T12:00:00Z`) }) }}
      </p>
      <label class="flex flex-col gap-1.5">
        <span class="font-semibold text-[14px]">{{ t('events.calendarPick.day') }}</span>
        <input v-model="day" type="date" :min="plan.firstDay" :max="plan.lastDay" required data-test="cal-day"
          class="h-12 rounded-[12px] border border-line bg-white px-3.5 text-[15px] outline-none focus:border-ink">
        <span v-if="dayLabel" class="text-[12.5px] text-muted">{{ dayLabel }}</span>
      </label>
      <div class="flex flex-col gap-1.5">
        <span class="font-semibold text-[14px]">{{ t('events.calendarPick.hour') }}</span>
        <div v-if="hours.length" class="grid grid-cols-4 gap-2" role="radiogroup" :aria-label="t('events.calendarPick.hour')">
          <button v-for="h in hours" :key="h" type="button" role="radio" :aria-checked="hour === h" data-test="cal-hour"
            class="h-11 rounded-[12px] border text-[14px]" :class="hour === h ? 'bg-ink text-white border-ink font-semibold' : 'bg-white text-ink border-line'"
            @click="hour = h">{{ h }}</button>
        </div>
        <p v-else class="m-0 text-[13.5px] text-muted">{{ t('events.calendarPick.noHours') }}</p>
      </div>
    </div>
    <template #footer>
      <button type="button" class="w-full h-12 rounded-[14px] bg-ink text-white text-[15px] font-semibold flex items-center justify-center gap-2 disabled:opacity-45"
        :disabled="!hour" data-test="cal-add" @click="add">
        <AppIcon name="event_available" :size="20" />{{ t('events.calendarPick.add') }}
      </button>
    </template>
  </AppSheet>
</template>
