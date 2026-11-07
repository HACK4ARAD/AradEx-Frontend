<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import { offerBadge } from '@/shared/composables/useOfferForm'
import type { OfferSummary } from '@/shared/types/offers'

/** Cardul unei oferte (S1b mobil, W11, pagina firmei): poză cu insigna galbenă, titlu, firma · distanța, valabilitatea. */
const props = defineProps<{ offer: OfferSummary; to: RouteLocationRaw; compact?: boolean }>()
const { t } = useI18n()
const f = useFormat()
const badge = computed(() => offerBadge(props.offer))
const until = computed(() => (props.offer.validUntil ? t('offers.until', { date: f.dateTime(props.offer.validUntil + 'T12:00:00+02:00', false) }) : t('offers.permanent')))
</script>

<template>
  <router-link :to="to" class="block bg-white rounded-[18px] overflow-hidden no-underline text-ink">
    <div class="relative bg-soft bg-cover bg-center" :class="compact ? 'h-[110px]' : 'h-[150px]'" :style="offer.imageUrl ? { backgroundImage: `url('${offer.imageUrl}')` } : {}">
      <span class="absolute left-2.5 top-2.5 h-7 px-2.5 rounded-full text-[12.5px] font-extrabold flex items-center"
        :class="badge.kind === 'points' ? 'bg-green text-white' : 'bg-yellow text-ink'">{{ badge.label }}</span>
      <span v-if="offer.localProduct" class="absolute right-2.5 top-2.5 h-7 px-2.5 rounded-full bg-white/95 text-[12px] font-semibold flex items-center">🧺 {{ t('offers.localBadge') }}</span>
    </div>
    <div class="p-3.5">
      <b class="block text-[15.5px] leading-snug">{{ offer.title }}</b>
      <span class="block text-[13px] text-muted mt-0.5">{{ offer.businessName }}<template v-if="offer.distanceKm != null"> · {{ f.km(offer.distanceKm) }}</template></span>
      <div class="flex items-center gap-2 mt-2 text-[12.5px]">
        <span class="text-muted flex items-center gap-1"><AppIcon name="event_available" :size="16" />{{ until }}</span>
        <span v-if="offer.pointsPrice && badge.kind !== 'points'" class="ml-auto h-6 px-2 rounded-full bg-green-soft text-green font-semibold flex items-center">{{ t('offers.badge.points', { n: offer.pointsPrice }) }}</span>
      </div>
    </div>
  </router-link>
</template>
