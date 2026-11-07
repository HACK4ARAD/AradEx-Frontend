<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import { offerBadge } from '@/shared/composables/useOfferForm'
import type { OfferDto } from '@/shared/types/offers'

/** Corpul detaliului unei oferte (S1c mobil + dialogul de pe web): insigne, titlu, firmă, valabilitate, detalii, puncte, link spre firmă. */
const props = defineProps<{ offer: OfferDto; businessLink: string }>()
const { t } = useI18n()
const f = useFormat()
const badge = computed(() => offerBadge(props.offer))
const valid = computed(() => (props.offer.validUntil
  ? t('offers.detail.valid', { date: f.longDate(props.offer.validUntil + 'T12:00:00+02:00').toLowerCase() })
  : t('offers.detail.validPermanent')))
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-2">
      <span class="h-7 px-2.5 rounded-full text-[12.5px] font-semibold flex items-center" :class="badge.kind === 'points' ? 'bg-green text-white' : 'bg-peach text-accent'">
        {{ badge.kind === 'event' ? t('offers.badge.event') : badge.kind === 'points' ? t('offers.badge.points', { n: offer.pointsPrice }) : t('offers.badge.offer', { label: offer.discountLabel }) }}
      </span>
      <span v-if="offer.localProduct" class="h-7 px-2.5 rounded-full bg-yellow text-[12.5px] font-semibold flex items-center">🧺 {{ t('offers.localBadge') }}</span>
    </div>
    <h1 class="text-[26px] font-semibold tracking-[-0.025em] leading-tight m-0 mt-2.5">{{ offer.title }}</h1>
    <p class="text-muted text-[15px] m-0 mt-1">{{ offer.businessName }}</p>

    <div class="flex items-center gap-2.5 mt-3 text-[14.5px]"><AppIcon name="event_available" class="text-muted" />{{ valid }}</div>

    <h3 class="text-[16px] font-semibold mt-4 mb-1">{{ t('offers.detail.details') }}</h3>
    <p class="text-muted text-[15px] leading-relaxed m-0">{{ offer.description }}</p>

    <div v-if="offer.pointsPrice && badge.kind !== 'points'" class="mt-3 rounded-[14px] bg-green-soft text-green p-3 flex items-start gap-2 text-[13.5px]">
      <AppIcon name="stars" :size="20" /><span>{{ t('offers.detail.orPoints', { n: offer.pointsPrice }) }}</span>
    </div>

    <router-link :to="businessLink" class="mt-3 bg-white rounded-[14px] p-3.5 flex items-center gap-3 no-underline text-ink">
      <AppIcon name="storefront" class="text-muted" />
      <span class="flex-1 font-semibold text-[14.5px]">{{ t('offers.detail.businessPage') }}</span>
      <AppIcon name="chevron_right" class="text-muted" />
    </router-link>
  </div>
</template>
