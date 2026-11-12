<script setup lang="ts">
// SEO · /evenimente: evenimentele viitoare din Arad, publice (fără cont, doar citire), grupate pe zile; fiecare card duce la
// pagina publică a evenimentului. Fără evenimentele demo. JSON-LD `ItemList` după încărcare; pre-generată la build.
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, Skeleton } from '@/shared/components'
import EventCardWeb from '@/shared/components/events/EventCardWeb.vue'
import PublicCta from '@/web/components/public/PublicCta.vue'
import { groupByDay, useUpcomingEvents } from '@/shared/composables/usePublicPages'
import { useFormat } from '@/shared/composables/useFormat'
import { SEO_PAGES, setJsonLd } from '@/web/seo'
import { eventPath, itemListJsonLd } from '@/web/seoPages'

const { t } = useI18n()
const f = useFormat()
const { items, loading, failed, reload } = useUpcomingEvents()

watch(items, (list) => {
  if (list.length) setJsonLd(itemListJsonLd(SEO_PAGES['w-pub-events'].title, list.map((e) => ({ path: eventPath(e), name: e.title }))))
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="max-w-[760px]">
      <h1 class="text-[30px] md:text-[38px] font-semibold tracking-[-0.025em] leading-tight m-0">{{ t('site.public.events.title') }}</h1>
      <p class="text-muted text-[15px] md:text-[16px] leading-relaxed mt-2.5 mb-0">{{ t('site.public.events.intro') }}</p>
    </header>

    <Skeleton v-if="loading && !items.length" :rows="2" :height="230" />
    <div v-else-if="failed" class="bg-white border border-line rounded-[16px] p-5 flex flex-wrap items-center gap-3" role="alert">
      <span class="flex-1 min-w-[200px] text-[15px]">{{ t('site.public.events.loadError') }}</span>
      <AppButton size="sm" variant="ghost" @click="reload">{{ t('common.retry') }}</AppButton>
    </div>
    <p v-else-if="!items.length" class="text-[15px] text-muted bg-white border border-line rounded-[16px] p-5 m-0">{{ t('site.public.events.empty') }}</p>
    <template v-else>
      <section v-for="g in groupByDay(items)" :key="g.day" :aria-label="f.longDate(g.day + 'T12:00:00Z')">
        <h2 class="text-[18px] font-semibold tracking-[-0.01em] m-0 mb-3">{{ f.longDate(g.day + 'T12:00:00Z') }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <EventCardWeb v-for="e in g.items" :key="e.id" :event="e" :to="eventPath(e)" />
        </div>
      </section>
    </template>

    <PublicCta />
  </div>
</template>
