<script setup lang="ts">
// T20 · „Acum în Arad”: 3 evenimente reale din API (GET /events), fără cele demo; fiecare card duce la pagina publică a
// evenimentului (/evenimente/:id/:slug), iar „Vezi toate evenimentele” la /evenimente (SEO: legături interne).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import EventCardWeb from '@/shared/components/events/EventCardWeb.vue'
import { periodRange, useEventList } from '@/shared/composables/useEvents'
import { publicEvents } from '@/shared/composables/usePublicPages'
import { eventPath } from '@/web/seoPages'
import type { EventQuery } from '@/shared/types/events'

const { t } = useI18n()
const query = computed<EventQuery>(() => ({ ...periodRange('week'), size: 12 }))
const list = useEventList(query)
const loading = list.loading
const items = computed(() => publicEvents(list.items.value).slice(0, 3))
</script>

<template>
  <section>
    <h2 class="text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] m-0 mb-1">{{ t('site.now.title') }}</h2>
    <p class="text-[15px] text-muted m-0 mb-5">{{ t('site.now.text') }}</p>
    <Skeleton v-if="loading && !items.length" :rows="1" :height="230" />
    <div v-else-if="items.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <EventCardWeb v-for="e in items" :key="e.id" :event="e" :to="eventPath(e)" />
    </div>
    <p v-else class="text-[15px] text-muted bg-white border border-line rounded-[16px] p-5 m-0">{{ t('site.now.empty') }}</p>
    <router-link to="/evenimente" class="mt-4 inline-flex items-center gap-1 text-[15px] font-semibold text-ink no-underline hover:underline underline-offset-2" data-test="all-events">
      {{ t('site.public.events.all') }}<AppIcon name="arrow_forward" :size="18" />
    </router-link>
  </section>
</template>
