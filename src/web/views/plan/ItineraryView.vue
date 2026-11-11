<script setup lang="ts">
// T13 · /itinerary/:code pe web (public): pagina linkului „Trimite” din aplicație. Programul citit după codul de partajare,
// ca secțiunea „Programul tău” din design/final web (W10): ore, opriri numerotate, durată, ghid audio, drumurile dintre opriri;
// pe fiecare oprire „Indicații” (Google Maps) și, la evenimente / oferte, „Detalii”. În dreapta: tot traseul în Google Maps,
// „Salvează în contul meu” (cu login) și aplicația. Bifele, harta și ghidul audio rămân în aplicație.
// Logica: shared/composables/useItinerary.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import { itinerariesApi } from '@/shared/api/itineraries'
import { MODE_ICON, legsOf, navigateUrl, routeUrl, stopsForDay, useItinerary, useItineraryFormat } from '@/shared/composables/useItinerary'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import { DOWNLOAD_LINKS } from '@/web/presentation'
import type { ItineraryStop } from '@/shared/types/plan'
import { isDemoReadOnlyError } from '@/shared/api/client'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const ui = useUiStore()
const fmt = useItineraryFormat()
const code = computed(() => String(route.params.code))
const { it, loading, notFound, load, days, total } = useItinerary(code)

const sub = computed(() => {
  const v = it.value
  if (!v) return ''
  const parts = [fmt.when(v), t('plan.stops', { n: total.value })]
  if (v.totalKm) parts.push(t(`plan.detail.km.${v.transport}`, { km: fmt.km(v.totalKm) }))
  return parts.join(' · ')
})

/** zilele cu opririle și drumul de după fiecare oprire */
const sections = computed(() => {
  const v = it.value
  if (!v) return []
  return days.value.map((d) => {
    const stops = stopsForDay(v.stops, d, v.days)
    return { day: d, stops, legAfter: new Map(legsOf(stops).map((l) => [l.from.order, l])), route: routeUrl(stops, v.transport) }
  })
})

const detailsHref = (s: ItineraryStop) => (s.kind === 'EVENT' ? `/events/${s.refId}` : s.kind === 'OFFER' ? `/offers/${s.refId}` : null)

const saving = ref(false)
async function save() {
  if (!it.value?.shareCode || saving.value) return
  saving.value = true
  try {
    const mine = await itinerariesApi.saveToMine(it.value.shareCode)
    ui.toast(t('plan.web.saved'), 'success', undefined, 6000)
    if (mine.shareCode && mine.shareCode !== it.value.shareCode) await router.replace(`/itinerary/${mine.shareCode}`)
  } catch (e) {
    // modul demo: doar vizualizare până la lansare
    ui.toast(isDemoReadOnlyError(e) ? t('common.demoReadOnly') : t('plan.detail.saveError'), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-[1080px] mx-auto">
    <router-link to="/" class="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted no-underline hover:text-ink mb-4">
      <AppIcon name="arrow_back" :size="18" />{{ t('plan.web.back') }}
    </router-link>

    <Skeleton v-if="loading && !it" :rows="4" :height="96" />
    <EmptyState v-else-if="notFound" icon="route" :title="t('plan.web.notFound')" :action="t('plan.web.back')" @action="router.push('/')" />
    <EmptyState v-else-if="!it" icon="cloud_off" :title="t('plan.detail.loadError')" :action="t('common.retry')" @action="load" />
    <div v-else class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8 items-start">
      <article class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-[5px] text-[13px] font-semibold px-2.5 py-1 rounded-full bg-ink text-white"><AppIcon name="auto_awesome" :size="15" />{{ t('plan.madeBy') }}</span>
          <span v-if="it.offline" class="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-[3px] rounded-full bg-soft text-muted" :title="t('plan.detail.offlineAria')"><AppIcon name="cloud_off" :size="14" />{{ t('plan.detail.offline') }}</span>
          <span class="text-muted text-[13px]">{{ t('plan.web.shared') }}</span>
        </div>
        <h1 class="text-[30px] md:text-[36px] font-semibold tracking-[-0.025em] leading-tight m-0 mt-2.5">{{ it.title }}</h1>
        <p class="text-muted text-[15px] mt-1.5 mb-0">{{ sub }}</p>
        <div v-if="it.summary" class="flex gap-2.5 mt-4 px-4 py-3.5 rounded-[16px] bg-soft text-[14px] leading-[1.5]">
          <AppIcon name="auto_awesome" :size="18" class="shrink-0 mt-0.5" /><span>{{ it.summary }}</span>
        </div>

        <section v-for="sec in sections" :key="sec.day" class="mt-6">
          <div v-if="sections.length > 1" class="flex items-center justify-between gap-3 mb-1">
            <h2 class="m-0 text-[20px] font-semibold tracking-[-0.02em]">{{ t('plan.web.day', { n: sec.day }) }} · {{ fmt.weekday(it, sec.day) }}</h2>
            <a v-if="sec.route" :href="sec.route" target="_blank" rel="noopener" class="text-[13.5px] font-semibold text-ink inline-flex items-center gap-1"><AppIcon name="map" :size="16" />{{ t('plan.web.wholeRoute') }}</a>
          </div>
          <div v-for="s in sec.stops" :key="s.order">
            <div class="flex gap-3 md:gap-3.5 items-start py-3 border-b border-line">
              <div class="w-11 shrink-0 text-muted text-[12.5px] leading-[1.3] pt-1">{{ fmt.time(s) }}</div>
              <span class="w-[26px] h-[26px] shrink-0 rounded-full bg-ink text-white text-[12px] font-semibold flex items-center justify-center mt-0.5">{{ s.order }}</span>
              <div class="hidden sm:flex w-16 h-16 shrink-0 rounded-[12px] bg-soft bg-cover bg-center items-center justify-center text-muted" :style="s.imageUrl ? { backgroundImage: `url('${s.imageUrl}')` } : undefined">
                <AppIcon v-if="!s.imageUrl" :name="s.kind === 'EVENT' ? 'event' : s.kind === 'OFFER' ? 'sell' : 'place'" />
              </div>
              <div class="flex-1 min-w-0">
                <b class="block text-[15px] leading-[1.3]">{{ s.name }}</b>
                <div class="text-muted text-[13px] mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span v-if="s.subtitle">{{ s.subtitle }} ·</span><span>{{ fmt.duration(s.durationMin) }}</span>
                  <span v-if="s.hasGuide" class="inline-flex items-center gap-1 rounded-full bg-soft text-ink text-[11.5px] font-medium px-2 py-0.5"><AppIcon name="headphones" :size="13" />{{ t('plan.web.guideBadge') }}</span>
                </div>
                <p v-if="s.note" class="text-muted text-[13px] leading-[1.45] mt-1.5 mb-0">{{ s.note }}</p>
                <p v-if="s.parkingHint" class="text-muted text-[13px] mt-1 mb-0 inline-flex items-center gap-1"><AppIcon name="local_parking" :size="15" />{{ t('plan.web.parking', { hint: s.parkingHint }) }}</p>
                <div class="flex flex-wrap gap-2 mt-2">
                  <a :href="navigateUrl(s, it.transport)" target="_blank" rel="noopener" class="h-8 px-3 rounded-[10px] border border-line bg-white text-ink text-[13px] font-semibold inline-flex items-center gap-1 no-underline"><AppIcon name="directions" :size="15" />{{ t('plan.web.directions') }}</a>
                  <router-link v-if="detailsHref(s)" :to="detailsHref(s)!" class="h-8 px-3 rounded-[10px] border border-line bg-white text-ink text-[13px] font-semibold inline-flex items-center gap-1 no-underline"><AppIcon name="info" :size="15" />{{ t('plan.web.details') }}</router-link>
                </div>
              </div>
            </div>
            <div v-if="sec.legAfter.get(s.order)" class="flex items-center gap-1.5 py-2 pl-[58px] text-[13px] text-muted">
              <AppIcon :name="MODE_ICON[sec.legAfter.get(s.order)!.mode]" :size="16" />{{ fmt.legText(sec.legAfter.get(s.order)!.minutes, sec.legAfter.get(s.order)!.km) }}
            </div>
          </div>
        </section>
      </article>

      <aside class="lg:sticky lg:top-24 flex flex-col gap-3">
        <div class="bg-white border border-line rounded-[16px] p-4 flex flex-col gap-2.5">
          <a v-if="sections.length === 1 && sections[0].route" :href="sections[0].route" target="_blank" rel="noopener"
            class="h-11 rounded-[14px] bg-ink text-white text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 no-underline"><AppIcon name="map" :size="18" />{{ t('plan.web.wholeRoute') }}</a>
          <button v-if="auth.user" type="button" :disabled="saving" class="h-11 rounded-[14px] border border-line bg-white text-[15px] font-semibold text-ink inline-flex items-center justify-center gap-1.5 disabled:opacity-50" @click="save">
            <AppIcon name="bookmark" :size="18" />{{ t('plan.web.save') }}</button>
          <router-link v-else :to="{ path: '/login', query: { next: route.fullPath } }" class="h-11 rounded-[14px] border border-line bg-white text-[15px] font-semibold text-ink inline-flex items-center justify-center gap-1.5 no-underline">
            <AppIcon name="bookmark" :size="18" />{{ t('plan.web.signIn') }}</router-link>
        </div>
        <div class="rounded-[16px] bg-ink text-white p-4">
          <b class="block text-[16px]">{{ t('plan.web.appTitle') }}</b>
          <p class="text-[13.5px] opacity-80 mt-1 mb-3 leading-[1.45]">{{ t('plan.web.appText') }}</p>
          <div class="flex gap-2">
            <component :is="DOWNLOAD_LINKS.android ? 'a' : 'span'" :href="DOWNLOAD_LINKS.android ?? undefined" class="flex-1 h-10 rounded-[12px] bg-white/15 text-white text-[13.5px] font-semibold inline-flex items-center justify-center gap-1.5 no-underline">
              <AppIcon name="android" :size="17" />{{ t('plan.web.android') }}<span v-if="!DOWNLOAD_LINKS.android" class="opacity-70 font-normal">· {{ t('plan.web.soon') }}</span></component>
            <component :is="DOWNLOAD_LINKS.ios ? 'a' : 'span'" :href="DOWNLOAD_LINKS.ios ?? undefined" class="flex-1 h-10 rounded-[12px] bg-white/15 text-white text-[13.5px] font-semibold inline-flex items-center justify-center gap-1.5 no-underline">
              <AppIcon name="phone_iphone" :size="17" />{{ t('plan.web.ios') }}<span v-if="!DOWNLOAD_LINKS.ios" class="opacity-70 font-normal">· {{ t('plan.web.soon') }}</span></component>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
