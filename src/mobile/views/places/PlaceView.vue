<script setup lang="ts">
// T05 · E3 · Ghid virtual (design/final/mobile, „/place/:id”): hero, badge-uri, bara audio (TTS ro-RO), punctele ghidului,
// informații, „Următorul punct” · „Indicații” (→ hartă, T08) · „Pune în program” (→ planificator, T13).
// „Evenimente aici” vine cu T06 (nu există încă filtru pe loc în /events).
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
import { useBack } from '@/shared/composables/useBack'
import { useShare } from '@/shared/composables/useShare'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { km } = useFormat()
const back = useBack('/m/places')
const share = useShare()

const id = computed(() => Number(route.params.id))
const { place, loading, error, notFound, reload, locate, isHere, located, locating } = usePlace(id)
const points = computed(() => place.value?.guidePoints ?? [])
const guide = useAudioGuide(points, locale)
</script>

<template>
  <Skeleton v-if="loading && !place" :rows="4" :height="120" class="pt-2" />

  <div v-else-if="!place" class="pt-6">
    <EmptyState :icon="notFound ? 'location_off' : 'cloud_off'" :title="notFound ? t('places.detail.notFound') : t('places.list.error')"
      :text="notFound ? t('places.detail.notFoundText') : error ?? undefined"
      :action="notFound ? t('places.detail.backToList') : t('common.retry')" @action="notFound ? router.push('/m/places') : reload()" />
  </div>

  <div v-else class="pb-28">
    <!-- hero pe toată lățimea, sub bara de stare -->
    <div class="relative -mx-5 -mt-[max(12px,env(safe-area-inset-top))] h-[300px] bg-[#6f6f68] bg-cover bg-center flex items-end"
      :style="place.imageUrl ? { backgroundImage: `url('${place.imageUrl}')` } : undefined">
      <div class="absolute inset-x-0 top-0 h-[150px] bg-linear-to-b from-black/45 to-transparent pointer-events-none" />
      <div class="absolute top-[max(16px,env(safe-area-inset-top))] inset-x-4 flex justify-between">
        <button class="w-11 h-11 rounded-full bg-white/85 backdrop-blur flex items-center justify-center" :aria-label="t('common.back')" @click="back">
          <AppIcon name="arrow_back" />
        </button>
        <button class="w-11 h-11 rounded-full bg-white/85 backdrop-blur flex items-center justify-center" :aria-label="t('places.detail.share')" @click="share(place.name)">
          <AppIcon name="ios_share" />
        </button>
      </div>
      <div class="relative w-full px-5 pt-10 pb-5 bg-linear-to-t from-black/75 to-transparent text-white">
        <h1 class="text-[30px] leading-tight font-semibold tracking-[-0.02em] m-0 text-white">{{ place.name }}</h1>
        <div class="text-[14px] opacity-90 mt-1">{{ t(`places.type.${place.type}`) }}</div>
      </div>
      <span v-if="place.imageCredit" class="absolute right-2 top-[max(68px,calc(env(safe-area-inset-top)+56px))] text-[10.5px] text-white/90 bg-black/40 px-2 py-0.5 rounded-lg max-w-[60%] truncate">{{ place.imageCredit }}</span>
    </div>

    <div class="flex flex-wrap gap-2 mt-4">
      <span v-if="place.guidePointsCount" class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[#E6EEFC] text-blue text-[12.5px] font-semibold">
        <AppIcon name="headphones" :size="16" /> {{ t('places.detail.guideBadge', { n: place.guidePointsCount, m: place.guideMinutes }, place.guidePointsCount) }}
      </span>
      <span v-if="isHere" class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-green-soft text-green text-[12.5px] font-semibold">
        <AppIcon name="location_on" :size="16" /> {{ t('places.detail.here') }}
      </span>
      <span v-else-if="located && place.distanceKm !== undefined" class="inline-flex items-center h-7 px-2.5 rounded-full bg-white border border-line text-[12.5px]">
        {{ t('places.detail.away', { km: km(place.distanceKm) }) }}
      </span>
      <button v-else type="button" class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white border border-line text-[12.5px]" @click="locate">
        <AppIcon :name="locating ? 'progress_activity' : 'near_me'" :size="16" :class="locating && 'animate-spin'" /> {{ t('places.detail.whereAmI') }}
      </button>
      <span v-if="place.exteriorOnly" class="inline-flex items-center h-7 px-2.5 rounded-full border border-line text-[12.5px] font-medium" data-test="exterior-only">
        {{ t('places.detail.exteriorOnly') }}
      </span>
    </div>

    <template v-if="points.length">
      <AudioGuideBar class="mt-3.5" :index="guide.index.value" :title="guide.current.value?.title ?? ''" :playing="guide.playing.value"
        :elapsed="guide.elapsed.value" :total="guide.total.value" :rate="guide.rate.value" :supported="guide.supported"
        :has-voice="guide.hasVoice.value" @toggle="guide.toggle()" @rate="guide.cycleRate()" />
      <GuidePointList class="mt-1.5" :points="points" :current="guide.index.value" clamp @pick="guide.pick" />
    </template>
    <p v-else class="text-muted text-[14px] mt-4">{{ t('places.detail.noGuide') }}</p>

    <PlaceInfo :place="place" class="mt-4" />
    <p class="text-muted text-[15px] leading-relaxed mt-4">{{ place.description }}</p>
    <p class="text-muted text-[12px] mt-3">{{ t('places.detail.readAloud') }}</p>

    <!-- bara de jos, deasupra tab bar-ului -->
    <div class="fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-10 mx-auto w-full max-w-[480px] px-4">
      <div class="flex gap-1.5 bg-bg/90 backdrop-blur rounded-[18px] p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <AppButton class="flex-1 min-w-0 !px-3 !text-[14.5px] whitespace-nowrap" :disabled="points.length < 2" @click="guide.next()">
          {{ t('places.detail.next') }} <AppIcon name="arrow_forward" :size="18" />
        </AppButton>
        <AppButton variant="secondary" icon="directions" class="!px-3 !text-[14.5px] whitespace-nowrap" @click="router.push({ path: '/m/map', query: { to: `place:${place.id}` } })">
          {{ t('places.detail.directions') }}
        </AppButton>
        <AppButton variant="secondary" icon="auto_awesome" class="!px-3 !gap-0" :aria-label="t('places.detail.plan')" @click="router.push('/m/plan')" />
      </div>
    </div>
  </div>
</template>
