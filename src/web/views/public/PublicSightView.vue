<script setup lang="ts">
// SEO · /obiective/:id/:slug: un obiectiv turistic, public (fără cont, doar citire): nume, tip, poză, descriere, adresă cu
// indicații, durata vizitei, programul și, dacă are ghid audio, titlurile punctelor cu începutul textului (text indexabil).
// Slug-ul se corectează (router.replace); după încărcare: titlu, descriere, canonical, poză și JSON-LD (TouristAttraction /
// Museum / Park). Ce nu e obiectiv (restaurant, cafenea…) sau nu există: „nu e aici” + `noindex`.
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, Skeleton } from '@/shared/components'
import PublicCta from '@/web/components/public/PublicCta.vue'
import PublicNotFound from '@/web/components/public/PublicNotFound.vue'
import { usePublicPlace } from '@/shared/composables/usePublicPages'
import { useFormat } from '@/shared/composables/useFormat'
import { setNoindex, setPageSeo } from '@/web/seo'
import { absoluteUrl, excerpt, placeJsonLd, placePath, slugify } from '@/web/seoPages'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const f = useFormat()
const id = computed(() => Number(route.params.id))
const { item: p, loading, notFound, failed, reload } = usePublicPlace(id)
const directions = computed(() => (p.value ? `https://www.google.com/maps/dir/?api=1&destination=${p.value.lat},${p.value.lng}` : ''))
const points = computed(() => [...(p.value?.guidePoints ?? [])].sort((a, b) => a.position - b.position))

watch(p, async (v) => {
  if (!v) return
  const slug = slugify(v.name)
  if (route.params.slug !== slug) await router.replace({ name: 'w-pub-sight', params: { id: v.id, slug }, query: route.query, hash: route.hash })
  setPageSeo({
    title: `${v.name} · Obiective turistice în Arad`,
    description: excerpt(v.description) || `${v.name}, Arad.`,
    path: placePath(v),
    image: absoluteUrl(v.imageUrl),
    jsonLd: placeJsonLd(v),
  })
})
watch(notFound, (v) => { if (v) setNoindex() })
</script>

<template>
  <PublicNotFound v-if="notFound" :title="t('site.public.sight.notFoundTitle')" :text="t('site.public.sight.notFoundText')" to="/obiective"
    :link="t('site.public.sights.back')" />
  <div v-else class="max-w-[860px] mx-auto flex flex-col gap-5">
    <router-link to="/obiective" class="self-start inline-flex items-center gap-1 text-[14px] text-muted no-underline hover:text-ink">
      <AppIcon name="arrow_back" :size="18" />{{ t('site.public.sights.back') }}
    </router-link>

    <Skeleton v-if="loading && !p" :rows="1" :height="320" />
    <div v-else-if="failed" class="bg-white border border-line rounded-[16px] p-5 flex flex-wrap items-center gap-3" role="alert">
      <span class="flex-1 min-w-[200px] text-[15px]">{{ t('site.public.sight.loadError') }}</span>
      <AppButton size="sm" variant="ghost" @click="reload">{{ t('common.retry') }}</AppButton>
    </div>

    <article v-else-if="p" class="flex flex-col gap-5" data-test="public-sight">
      <div class="rounded-[18px] overflow-hidden bg-soft">
        <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="w-full h-[220px] md:h-[340px] object-cover block" />
      </div>
      <header>
        <span class="inline-flex text-[12.5px] font-semibold px-2.5 py-1 rounded-full bg-soft">{{ t(`places.type.${p.type}`) }}</span>
        <h1 class="text-[28px] md:text-[36px] font-semibold tracking-[-0.025em] leading-tight mt-2.5 mb-0">{{ p.name }}</h1>
        <p v-if="p.guidePointsCount" class="mt-2 mb-0 inline-flex items-center gap-1.5 text-[14px] font-semibold">
          <AppIcon name="headphones" :size="18" />{{ t('site.public.sights.guide', { n: p.guidePointsCount }, p.guidePointsCount) }} · {{ f.minutes(p.guideMinutes) }}
        </p>
      </header>

      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 m-0">
        <div class="bg-white border border-line rounded-[14px] p-4 flex gap-3">
          <AppIcon name="location_on" class="text-muted shrink-0" />
          <div class="min-w-0">
            <dt class="text-[12.5px] text-muted">{{ t('site.public.sight.address') }}</dt>
            <dd class="m-0 font-semibold text-[15px]">{{ p.address || 'Arad' }}</dd>
            <dd class="m-0 mt-1"><a :href="directions" target="_blank" rel="noopener" class="text-[13.5px] font-semibold text-ink">{{ t('site.public.sight.directions') }}</a></dd>
          </div>
        </div>
        <div class="bg-white border border-line rounded-[14px] p-4 flex gap-3">
          <AppIcon name="schedule" class="text-muted shrink-0" />
          <div class="min-w-0">
            <dt class="text-[12.5px] text-muted">{{ t('site.public.sight.visit') }}</dt>
            <dd class="m-0 font-semibold text-[15px]">{{ f.minutes(p.visitMinutes) }}</dd>
            <dd v-if="p.exteriorOnly" class="m-0 text-[13.5px] text-muted">{{ t('site.public.sight.exterior') }}</dd>
          </div>
        </div>
        <div v-if="p.openingHours" class="bg-white border border-line rounded-[14px] p-4 flex gap-3 sm:col-span-2">
          <AppIcon name="door_open" class="text-muted shrink-0" />
          <div class="min-w-0"><dt class="text-[12.5px] text-muted">{{ t('site.public.sight.hours') }}</dt><dd class="m-0 text-[14.5px]">{{ p.openingHours }}</dd></div>
        </div>
      </dl>

      <section v-if="p.description">
        <h2 class="text-[19px] font-semibold m-0 mb-2">{{ t('site.public.sight.about') }}</h2>
        <p class="text-[15.5px] leading-relaxed m-0 whitespace-pre-line">{{ p.description }}</p>
      </section>

      <section v-if="points.length" class="bg-white border border-line rounded-[16px] p-4 md:p-5" data-test="guide-points">
        <h2 class="text-[19px] font-semibold m-0 flex items-center gap-2"><AppIcon name="headphones" />{{ t('site.public.sight.guideTitle', { n: points.length }, points.length) }}</h2>
        <p class="text-muted text-[14px] mt-1 mb-3">{{ t('site.public.sight.guideText') }}</p>
        <ol class="m-0 p-0 list-none flex flex-col gap-3">
          <li v-for="(g, i) in points" :key="g.id" class="flex gap-3">
            <span class="w-7 h-7 rounded-full bg-soft text-[13px] font-bold flex items-center justify-center shrink-0">{{ i + 1 }}</span>
            <div class="min-w-0">
              <h3 class="text-[15px] font-semibold m-0">{{ g.title }}</h3>
              <p class="text-[14px] text-muted leading-relaxed m-0 mt-0.5">{{ excerpt(g.text, 220) }}</p>
            </div>
          </li>
        </ol>
      </section>

      <p v-if="p.imageCredit" class="text-[12px] text-muted m-0">{{ p.imageCredit }}</p>
      <PublicCta />
    </article>
  </div>
</template>
