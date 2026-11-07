<script setup lang="ts">
// T10 · tab-ul Oferte din Acasă (S1b): banner „Doar în AradExperience”, cercurile de categorii, cardurile. Folosit și de /offers.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { EmptyState, Skeleton } from '@/shared/components'
import OfferBanner from '@/shared/components/offers/OfferBanner.vue'
import OfferCard from '@/shared/components/offers/OfferCard.vue'
import OfferCategoryBar from '@/shared/components/offers/OfferCategoryBar.vue'
import { useOfferList, type OfferFilter } from '@/shared/composables/useOffers'

const { t } = useI18n()
const filter = ref<OfferFilter>('ALL')
const { items, loading, error, reload } = useOfferList(filter)
</script>

<template>
  <div class="flex flex-col gap-3.5 mt-3.5">
    <OfferBanner @pick="filter = 'CAFE'" />
    <OfferCategoryBar v-model="filter" />
    <Skeleton v-if="loading" :rows="3" :height="220" />
    <EmptyState v-else-if="error" icon="cloud_off" :title="t('business.loadError')" :action="t('common.retry')" @action="reload" />
    <EmptyState v-else-if="!items.length" icon="sell" :title="t('offers.empty')" :text="t('offers.emptyText')" :action="t('offers.cats.ALL')" @action="filter = 'ALL'" />
    <OfferCard v-for="o in items" v-else :key="o.id" :offer="o" :to="`/offers/${o.id}`" />
  </div>
</template>
