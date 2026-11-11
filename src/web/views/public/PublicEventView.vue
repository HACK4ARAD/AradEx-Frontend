<script setup lang="ts">
// SEO · /evenimente/:id/:slug: un eveniment, public (fără cont, doar citire): titlu, când (ora Aradului), loc și adresă cu
// indicații pe Google Maps, descriere, poză, preț sau „intrare liberă”, organizator și îndemnul spre aplicație.
// Slug-ul greșit sau lipsă se corectează (router.replace); după încărcare: titlu, descriere, canonical, poză și JSON-LD `Event`.
// Evenimentele demo și cele inexistente arată „nu mai e aici” și primesc `noindex`.
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, Skeleton } from '@/shared/components'
import EventImage from '@/shared/components/events/EventImage.vue'
import PublicCta from '@/web/components/public/PublicCta.vue'
import PublicNotFound from '@/web/components/public/PublicNotFound.vue'
import { usePublicEvent } from '@/shared/composables/usePublicPages'
import { useEventFormat } from '@/shared/composables/useEvents'
import { setNoindex, setPageSeo } from '@/web/seo'
import { absoluteUrl, eventJsonLd, eventPath, excerpt, slugify } from '@/web/seoPages'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const fmt = useEventFormat()
const id = computed(() => Number(route.params.id))
const { item: e, loading, notFound, failed, reload } = usePublicEvent(id)

const ended = computed(() => !!e.value && Date.parse(e.value.endAt ?? e.value.startAt) < Date.now())
const price = computed(() => {
  const v = e.value
  if (!v) return ''
  if (v.ticketType === 'FREE') return t('site.public.event.free')
  const p = v.priceAdult ?? v.priceFrom
  return p != null ? (v.priceAdult != null ? fmt.money(p) : t('site.public.event.from', { price: fmt.money(p) })) : fmt.price(v)
})
const directions = computed(() => (e.value ? `https://www.google.com/maps/dir/?api=1&destination=${e.value.lat},${e.value.lng}` : ''))

watch(e, async (v) => {
  if (!v) return
  const slug = slugify(v.title)
  if (route.params.slug !== slug) await router.replace({ name: 'w-pub-event', params: { id: v.id, slug }, query: route.query, hash: route.hash })
  setPageSeo({
    title: `${v.title} · Evenimente în Arad`,
    description: excerpt(v.description) || `${v.title}, ${v.locationName}, Arad.`,
    path: eventPath(v),
    image: absoluteUrl(v.imageUrl),
    jsonLd: eventJsonLd(v),
  })
})
watch(notFound, (v) => { if (v) setNoindex() })
</script>

<template>
  <PublicNotFound v-if="notFound" :title="t('site.public.event.notFoundTitle')" :text="t('site.public.event.notFoundText')" to="/evenimente"
    :link="t('site.public.events.all')" />
  <div v-else class="max-w-[860px] mx-auto flex flex-col gap-5">
    <router-link to="/evenimente" class="self-start inline-flex items-center gap-1 text-[14px] text-muted no-underline hover:text-ink">
      <AppIcon name="arrow_back" :size="18" />{{ t('site.public.events.back') }}
    </router-link>

    <Skeleton v-if="loading && !e" :rows="1" :height="320" />
    <div v-else-if="failed" class="bg-white border border-line rounded-[16px] p-5 flex flex-wrap items-center gap-3" role="alert">
      <span class="flex-1 min-w-[200px] text-[15px]">{{ t('site.public.event.loadError') }}</span>
      <AppButton size="sm" variant="ghost" @click="reload">{{ t('common.retry') }}</AppButton>
    </div>

    <article v-else-if="e" class="flex flex-col gap-5" data-test="public-event">
      <div class="rounded-[18px] overflow-hidden">
        <img v-if="e.imageUrl" :src="e.imageUrl" :alt="e.title" class="w-full h-[220px] md:h-[340px] object-cover block" />
        <EventImage v-else :category="e.category" class="h-[220px] md:h-[300px]" />
      </div>
      <header>
        <span class="inline-flex text-[12.5px] font-semibold px-2.5 py-1 rounded-full bg-soft">{{ t(`events.category.${e.category}`) }}</span>
        <h1 class="text-[28px] md:text-[36px] font-semibold tracking-[-0.025em] leading-tight mt-2.5 mb-0">{{ e.title }}</h1>
        <p v-if="ended" class="mt-2 mb-0 text-[14px] text-muted">{{ t('site.public.event.ended') }}
          <router-link to="/evenimente" class="text-ink font-semibold">{{ t('site.public.events.all') }}</router-link></p>
      </header>

      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 m-0">
        <div class="bg-white border border-line rounded-[14px] p-4 flex gap-3">
          <AppIcon name="calendar_month" class="text-muted shrink-0" />
          <div class="min-w-0"><dt class="text-[12.5px] text-muted">{{ t('site.public.event.when') }}</dt><dd class="m-0 font-semibold text-[15px]">{{ fmt.when(e) }}</dd></div>
        </div>
        <div class="bg-white border border-line rounded-[14px] p-4 flex gap-3">
          <AppIcon name="location_on" class="text-muted shrink-0" />
          <div class="min-w-0">
            <dt class="text-[12.5px] text-muted">{{ t('site.public.event.where') }}</dt>
            <dd class="m-0 font-semibold text-[15px]">{{ e.locationName }}</dd>
            <dd v-if="e.address" class="m-0 text-[13.5px] text-muted">{{ e.address }}</dd>
            <dd class="m-0 mt-1"><a :href="directions" target="_blank" rel="noopener" class="text-[13.5px] font-semibold text-ink">{{ t('site.public.event.directions') }}</a></dd>
          </div>
        </div>
        <div class="bg-white border border-line rounded-[14px] p-4 flex gap-3">
          <AppIcon name="confirmation_number" class="text-muted shrink-0" />
          <div class="min-w-0"><dt class="text-[12.5px] text-muted">{{ t('site.public.event.price') }}</dt><dd class="m-0 font-semibold text-[15px]">{{ price }}</dd></div>
        </div>
        <div class="bg-white border border-line rounded-[14px] p-4 flex gap-3">
          <AppIcon name="groups" class="text-muted shrink-0" />
          <div class="min-w-0">
            <dt class="text-[12.5px] text-muted">{{ t('site.public.event.organizer') }}</dt>
            <dd class="m-0 font-semibold text-[15px]">{{ e.organizerName }}</dd>
            <dd v-if="e.externalUrl" class="m-0 mt-1"><a :href="e.externalUrl" target="_blank" rel="noopener nofollow" class="text-[13.5px] font-semibold text-ink">{{ t('site.public.event.website') }}</a></dd>
          </div>
        </div>
      </dl>

      <section v-if="e.description">
        <h2 class="text-[19px] font-semibold m-0 mb-2">{{ t('site.public.event.about') }}</h2>
        <p class="text-[15.5px] leading-relaxed m-0 whitespace-pre-line">{{ e.description }}</p>
        <p v-if="e.imageCredit" class="text-[12px] text-muted mt-3 mb-0">{{ e.imageCredit }}</p>
      </section>

      <PublicCta />
    </article>
  </div>
</template>
