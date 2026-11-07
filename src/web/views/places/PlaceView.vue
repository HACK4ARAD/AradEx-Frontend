<script setup lang="ts">
// T05 · W8 · Ghid virtual (design/final/web, „/places/:id”): hero, badge-uri, bara audio, punctele cu text întreg;
// în dreapta: informații, „Pune în program” (T13), „Indicații” (T08), Google Maps.
// Harta punctelor de ghid vine cu MapView (T08); „Evenimente aici” cu T06.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, EmptyState, Skeleton } from '@/shared/components'
import AudioGuideBar from '@/shared/components/places/AudioGuideBar.vue'
import GuidePointList from '@/shared/components/places/GuidePointList.vue'
import PlaceInfo from '@/shared/components/places/PlaceInfo.vue'
import { usePlace } from '@/shared/composables/usePlaces'
import { useAudioGuide } from '@/shared/composables/useAudioGuide'
import { useFormat } from '@/shared/composables/useFormat'
import { useShare } from '@/shared/composables/useShare'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { km } = useFormat()
const share = useShare()

const id = computed(() => Number(route.params.id))
const { place, loading, error, notFound, reload, locate, isHere, located, locating } = usePlace(id)
const points = computed(() => place.value?.guidePoints ?? [])
const guide = useAudioGuide(points, locale)
const mapsUrl = computed(() => place.value ? `https://www.google.com/maps/search/?api=1&query=${place.value.lat},${place.value.lng}` : '')
const firstTag = computed(() => place.value?.tags[0])
</script>

<template>
  <Skeleton v-if="loading && !place" :rows="3" :height="160" />

  <EmptyState v-else-if="!place" :icon="notFound ? 'location_off' : 'cloud_off'" :title="notFound ? t('places.detail.notFound') : t('places.list.error')"
    :text="notFound ? t('places.detail.notFoundText') : error ?? undefined"
    :action="notFound ? t('places.detail.backToList') : t('common.retry')" @action="notFound ? router.push('/w/places') : reload()" />

  <div v-else>
    <div class="text-[13px] text-muted mb-2.5">
      <router-link to="/w/places" class="text-muted hover:text-ink">{{ t('places.detail.breadcrumb') }}</router-link>
      <template v-if="firstTag"> › {{ firstTag }}</template>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
      <div class="min-w-0">
        <div class="relative rounded-[20px] overflow-hidden min-h-[320px] bg-[#6f6f68] bg-cover bg-center flex items-end text-white"
          :style="place.imageUrl ? { backgroundImage: `url('${place.imageUrl}')` } : undefined">
          <div class="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
          <div class="relative p-6 md:p-7">
            <h1 class="text-[28px] md:text-[34px] leading-tight font-semibold tracking-[-0.02em] m-0 text-white">{{ place.name }}</h1>
            <div class="mt-1.5 text-[15px] opacity-90">{{ t(`places.type.${place.type}`) }}<template v-if="place.parkingHint"> · {{ t('places.detail.parking', { p: place.parkingHint }) }}</template></div>
          </div>
          <span v-if="place.imageCredit" class="absolute right-3 bottom-2.5 text-[11px] opacity-85">{{ place.imageCredit }}</span>
        </div>

        <div class="flex flex-wrap gap-2 my-3.5">
          <span v-if="place.guidePointsCount" class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[#E6EEFC] text-blue text-[12.5px] font-semibold">
            <AppIcon name="headphones" :size="16" /> {{ t('places.detail.guideBadge', { n: place.guidePointsCount, m: place.guideMinutes }, place.guidePointsCount) }}
          </span>
          <span v-if="place.exteriorOnly" class="inline-flex items-center h-7 px-2.5 rounded-full border border-line text-[12.5px] font-medium" data-test="exterior-only">{{ t('places.detail.exteriorOnly') }}</span>
          <span v-if="isHere" class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-green-soft text-green text-[12.5px] font-semibold"><AppIcon name="location_on" :size="16" /> {{ t('places.detail.here') }}</span>
          <span v-else-if="located && place.distanceKm !== undefined" class="inline-flex items-center h-7 px-2.5 rounded-full bg-white border border-line text-[12.5px]">{{ t('places.detail.away', { km: km(place.distanceKm) }) }}</span>
        </div>

        <template v-if="points.length">
          <AudioGuideBar :index="guide.index.value" :title="guide.current.value?.title ?? ''" :playing="guide.playing.value"
            :elapsed="guide.elapsed.value" :total="guide.total.value" :rate="guide.rate.value" :supported="guide.supported"
            :has-voice="guide.hasVoice.value" @toggle="guide.toggle()" @rate="guide.cycleRate()" />
          <GuidePointList class="mt-2" :points="points" :current="guide.index.value" @pick="guide.pick" />
          <div class="flex gap-2 mt-3">
            <AppButton size="sm" :disabled="points.length < 2" @click="guide.next()">{{ t('places.detail.next') }} <AppIcon name="arrow_forward" :size="18" /></AppButton>
          </div>
        </template>
        <p v-else class="text-muted text-[14px]">{{ t('places.detail.noGuide') }}</p>
        <p class="text-muted text-[12px] mt-3.5">{{ t('places.detail.readAloud') }}</p>
      </div>

      <aside class="flex flex-col gap-3.5 lg:sticky lg:top-[84px]">
        <PlaceInfo :place="place">
          <div class="flex flex-wrap gap-2 mt-3">
            <AppButton size="sm" icon="auto_awesome" @click="router.push('/w/plan')">{{ t('places.detail.plan') }}</AppButton>
            <AppButton size="sm" variant="secondary" icon="directions" @click="router.push({ path: '/w/map', query: { to: `place:${place.id}` } })">{{ t('places.detail.directions') }}</AppButton>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[13px]">
            <a :href="mapsUrl" target="_blank" rel="noopener" class="text-ink font-medium inline-flex items-center gap-1"><AppIcon name="open_in_new" :size="16" /> {{ t('places.detail.googleMaps') }}</a>
            <button v-if="!located" type="button" class="text-ink font-medium inline-flex items-center gap-1" @click="locate">
              <AppIcon :name="locating ? 'progress_activity' : 'near_me'" :size="16" :class="locating && 'animate-spin'" /> {{ t('places.detail.whereAmI') }}
            </button>
            <button type="button" class="text-ink font-medium inline-flex items-center gap-1" @click="share(place.name)"><AppIcon name="ios_share" :size="16" /> {{ t('places.detail.share') }}</button>
          </div>
        </PlaceInfo>
        <div class="bg-white rounded-[16px] p-4">
          <h3 class="text-[16px] font-semibold m-0 mb-1.5">{{ t('places.detail.about') }}</h3>
          <p class="text-muted text-[14px] leading-relaxed m-0">{{ place.description }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>
