<script setup lang="ts">
// T20 · „Acum în Arad”: 3 evenimente reale din API (GET /events), doar de privit; detaliile și biletele sunt în aplicație.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Skeleton } from '@/shared/components'
import EventCardWeb from '@/shared/components/events/EventCardWeb.vue'
import { periodRange, useEventList } from '@/shared/composables/useEvents'
import type { EventQuery } from '@/shared/types/events'

const { t } = useI18n()
const query = computed<EventQuery>(() => ({ ...periodRange('week'), size: 3 }))
const { items, loading } = useEventList(query)
</script>

<template>
  <section>
    <h2 class="text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] m-0 mb-1">{{ t('site.now.title') }}</h2>
    <p class="text-[15px] text-muted m-0 mb-5">{{ t('site.now.text') }}</p>
    <Skeleton v-if="loading && !items.length" :rows="1" :height="230" />
    <div v-else-if="items.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <EventCardWeb v-for="e in items.slice(0, 3)" :key="e.id" :event="e" />
    </div>
    <p v-else class="text-[15px] text-muted bg-white border border-line rounded-[16px] p-5 m-0">{{ t('site.now.empty') }}</p>
  </section>
</template>
