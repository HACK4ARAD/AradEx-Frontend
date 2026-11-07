<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { OfferFilter } from '@/shared/composables/useOffers'

/** Cercurile de categorii din tab-ul Oferte (design: Toate, Cafenele, Restaurante, Făcut în Arad, Evenimente, Cu puncte). */
const model = defineModel<OfferFilter>({ default: 'ALL' })
const { t } = useI18n()
const cats: [OfferFilter, string][] = [['ALL', '🛍️'], ['CAFE', '☕'], ['RESTAURANT', '🍽️'], ['LOCAL', '🧺'], ['EVENT', '🎉'], ['POINTS', '⭐']]
</script>

<template>
  <div class="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1" role="tablist">
    <button v-for="[k, e] in cats" :key="k" type="button" role="tab" :aria-selected="model === k" class="shrink-0 flex flex-col items-center gap-1.5 w-[70px] text-[12px] font-semibold"
      @click="model = k">
      <i class="not-italic w-[58px] h-[58px] rounded-full flex items-center justify-center text-[24px] border-2"
        :class="model === k ? 'bg-yellow border-ink' : 'bg-white border-transparent'">{{ e }}</i>
      <span :class="model === k ? 'text-ink' : 'text-muted'">{{ t(`offers.cats.${k}`) }}</span>
    </button>
  </div>
</template>
