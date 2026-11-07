<script setup lang="ts">
// T05 · E3 · Ghid virtual (design/final/mobile, „/place/:id”): hero 300 px cu butoane „glass”, badge-uri, bara audio (TTS ro-RO),
// punctele ghidului, „Informații”, descrierea; bara de jos (peste tab bar, ca în design): „Următorul punct” · „Indicații” (→ T08) · AI (→ T13).
// „Evenimente aici” vine cu T06; butonul de salvare din hero cere „locuri salvate” în API (nu există încă).
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import AudioGuideBar from '@/shared/components/places/AudioGuideBar.vue'
import GuidePointList from '@/shared/components/places/GuidePointList.vue'
import PlaceInfo from '@/shared/components/places/PlaceInfo.vue'
import NearestStop from '@/shared/components/transit/NearestStop.vue'
import { usePlace } from '@/shared/composables/usePlaces'
import { useAudioGuide } from '@/shared/composables/useAudioGuide'
import { useFormat } from '@/shared/composables/useFormat'
import { useBack } from '@/shared/composables/useBack'
import { useShare } from '@/shared/composables/useShare'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { km } = useFormat()
const back = useBack('/places')
const share = useShare()

const id = computed(() => Number(route.params.id))
const { place, loading, error, notFound, reload, locate, isHere, locating } = usePlace(id)
const points = computed(() => place.value?.guidePoints ?? [])
const guide = useAudioGuide(points, locale)
/** Sub titlu: tipul · programul pe scurt (prima propoziție, ca rândul scurt din design). */
const hours = computed(() => place.value?.openingHours?.split(/(?<=\.)\s/)[0]?.replace(/\.$/, ''))
const glass = 'w-11 h-11 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.14)] flex items-center justify-center text-ink'
const badge = 'inline-flex items-center gap-[5px] px-2.5 py-1 rounded-full text-[13px] font-medium leading-[1.3]'
const btn = 'flex items-center justify-center gap-2 min-h-[52px] rounded-2xl text-[16px] font-semibold'
</script>

<template>
  <Skeleton v-if="loading && !place" :rows="4" :height="120" class="pt-2" />

  <div v-else-if="!place" class="pt-6">
    <EmptyState :icon="notFound ? 'location_off' : 'cloud_off'" :title="notFound ? t('places.detail.notFound') : t('places.list.error')"
      :text="notFound ? t('places.detail.notFoundText') : error ?? undefined"
      :action="notFound ? t('places.detail.backToList') : t('common.retry')" @action="notFound ? router.push('/places') : reload()" />
  </div>

  <div v-else class="-mx-5 -mt-[max(12px,env(safe-area-inset-top))]">
    <!-- hero -->
    <div class="relative h-[300px] bg-[#666] bg-cover bg-center flex items-end"
      :style="place.imageUrl ? { backgroundImage: `url('${place.imageUrl}')` } : undefined">
      <div class="absolute inset-x-0 top-0 h-[150px] bg-linear-to-b from-black/40 to-transparent pointer-events-none" />
      <div class="absolute top-[max(16px,calc(env(safe-area-inset-top)+8px))] inset-x-4 flex justify-between">
        <button :class="glass" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
        <button :class="glass" :aria-label="t('places.detail.share')" @click="share(place.name)"><AppIcon name="ios_share" /></button>
      </div>
      <div class="relative w-full px-5 pt-5 pb-[22px] bg-linear-to-t from-black/70 to-transparent text-white">
        <h1 class="text-[30px] leading-[1.08] font-semibold tracking-[-0.035em] m-0 text-white">{{ place.name }}</h1>
        <div class="text-[14px] opacity-90 mt-1">{{ t(`places.type.${place.type}`) }}<template v-if="hours"> · {{ hours }}</template></div>
      </div>
      <span v-if="place.imageCredit" class="absolute right-3 top-[max(68px,calc(env(safe-area-inset-top)+60px))] text-[11px] text-white bg-black/45 px-2 py-[3px] rounded-lg max-w-[60%] truncate">{{ place.imageCredit }}</span>
    </div>

    <div class="px-5 pt-[18px] pb-6">
      <div class="flex flex-wrap gap-2">
        <span v-if="place.guidePointsCount" :class="[badge, 'bg-[#E6EEFC] text-blue']">
          <AppIcon name="headphones" :size="16" /> {{ t('places.detail.guideBadge', { n: place.guidePointsCount, m: place.guideMinutes }, place.guidePointsCount) }}
        </span>
        <span v-if="isHere" :class="[badge, 'bg-green-soft text-green-deep font-semibold']"><AppIcon name="location_on" :size="16" /> {{ t('places.detail.here') }}</span>
        <button v-else type="button" :class="[badge, 'bg-soft']" :title="t('places.detail.whereAmI')" @click="locate()">
          <AppIcon v-if="locating" name="progress_activity" :size="16" class="animate-spin" /> {{ km(place.distanceKm) }}
        </button>
        <span v-if="place.exteriorOnly" :class="[badge, 'border border-[#8C8C86]']" data-test="exterior-only">{{ t('places.detail.exteriorOnly') }}</span>
      </div>

      <template v-if="points.length">
        <AudioGuideBar class="mt-3.5" :index="guide.index.value" :title="guide.current.value?.title ?? ''" :playing="guide.playing.value"
          :elapsed="guide.elapsed.value" :total="guide.total.value" :rate="guide.rate.value" :supported="guide.supported"
          :has-voice="guide.hasVoice.value" :error="guide.error.value" @toggle="guide.toggle()" @rate="guide.cycleRate()" />
        <GuidePointList class="mt-1.5" :points="points" :current="guide.index.value" @pick="guide.pick" />
      </template>
      <p v-else class="text-muted text-[14px] mt-4">{{ t('places.detail.noGuide') }}</p>

      <PlaceInfo :place="place" class="mt-4" />
      <!-- T22: stația CTP cea mai apropiată de obiectiv + următoarele sosiri -->
      <NearestStop :lat="place.lat" :lng="place.lng" />
      <p class="text-muted text-[15px] leading-relaxed mt-4">{{ place.description }}</p>
      <p class="text-muted text-[12px] mt-4">{{ t('places.detail.readAloud') }}</p>
    </div>

    <!-- bara de jos: peste tab bar, ca în design (.bottombar) -->
    <div class="fixed bottom-0 inset-x-0 z-50 mx-auto w-full max-w-[480px] flex items-center gap-3 px-5 pt-3 pb-[max(30px,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-[10px] border-t border-line">
      <button type="button" :class="[btn, 'flex-1 min-w-0 px-5 bg-ink text-white disabled:opacity-45']" :disabled="points.length < 2" @click="guide.next()">
        <span class="leading-tight">{{ t('places.detail.next') }}</span> <AppIcon name="arrow_forward" :size="18" />
      </button>
      <button type="button" :class="[btn, 'px-4 bg-white border border-line text-ink']" @click="router.push({ path: '/map', query: { to: `place:${place.id}` } })">
        <AppIcon name="directions" :size="18" /> {{ t('places.detail.directions') }}
      </button>
      <button type="button" :class="[btn, 'px-3.5 bg-white border border-line text-ink']" :aria-label="t('places.detail.plan')" @click="router.push('/plan')">
        <AppIcon name="auto_awesome" :size="18" />
      </button>
    </div>
  </div>
</template>
