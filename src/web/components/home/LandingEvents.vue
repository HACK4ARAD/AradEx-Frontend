<script setup lang="ts">
// T06 · evenimentele de pe landing (W1): chips Azi / Weekend / 7 zile / Popular + grid de EventCardWeb din GET /events.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { EmptyState, Skeleton } from '@/shared/components'
import EventCardWeb from '@/shared/components/events/EventCardWeb.vue'
import { periodRange, useEventList } from '@/shared/composables/useEvents'
import type { EventQuery } from '@/shared/types/events'

type P = 'today' | 'weekend' | 'week' | 'hot'
const { t } = useI18n()
const p = ref<P>('today')
const query = computed<EventQuery>(() => (p.value === 'hot' ? { hot: true, size: 6 } : { ...periodRange(p.value), size: 6 }))
const { items, loading } = useEventList(query)
const chips: { key: P; label: () => string }[] = [
  { key: 'today', label: () => t('events.period.today') }, { key: 'weekend', label: () => t('events.period.weekendShort') },
  { key: 'week', label: () => t('events.period.weekShort') }, { key: 'hot', label: () => `🔥 ${t('home.popular')}` },
]
</script>

<template>
  <div class="flex gap-2 flex-wrap my-4">
    <button v-for="c in chips" :key="c.key" type="button" :aria-pressed="p === c.key"
      class="h-9 px-3.5 rounded-full inline-flex items-center text-[13.5px] font-medium border whitespace-nowrap"
      :class="p === c.key ? 'bg-ink text-white border-ink font-semibold' : 'bg-white border-line'" @click="p = c.key">{{ c.label() }}</button>
  </div>
  <Skeleton v-if="loading && !items.length" :rows="2" :height="200" />
  <div v-else-if="items.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
    <EventCardWeb v-for="e in items" :key="e.id" :event="e" />
  </div>
  <EmptyState v-else icon="event_busy" :title="t('events.empty.title')" :text="t('events.empty.text')" />
  <router-link to="/events" class="inline-flex mt-4 h-10 px-4 rounded-[12px] border border-line bg-white font-semibold text-[14px] items-center no-underline text-ink">{{ t('events.web.title') }} →</router-link>
</template>
