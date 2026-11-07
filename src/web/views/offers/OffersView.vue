<script setup lang="ts">
// T10 · W11 · Oferte pe web: banner, categorii, grilă de carduri. Detaliul și revendicarea se deschid într-un dialog (?offer=id),
// pentru că web-ul nu are o pagină separată de ofertă.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import OfferBanner from '@/shared/components/offers/OfferBanner.vue'
import OfferCard from '@/shared/components/offers/OfferCard.vue'
import OfferCategoryBar from '@/shared/components/offers/OfferCategoryBar.vue'
import OfferDetailBody from '@/shared/components/offers/OfferDetailBody.vue'
import RedemptionCode from '@/shared/components/offers/RedemptionCode.vue'
import { useOffer, useOfferList, type OfferFilter } from '@/shared/composables/useOffers'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const ui = useUiStore()
const filter = ref<OfferFilter>('ALL')
const { items, loading, error, reload } = useOfferList(filter)

const openId = computed(() => (route.query.offer ? Number(route.query.offer) : null))
const { offer, loading: loadingOffer, notFound, redeeming, redeem } = useOffer(openId, t)
const sheet = computed({ get: () => openId.value != null, set: (v: boolean) => { if (!v) router.replace({ query: {} }) } })
const showCode = ref(false)
const active = computed(() => (offer.value?.myRedemption?.status === 'ISSUED' ? offer.value.myRedemption : null))

async function onRedeem() {
  if (!auth.isLoggedIn) {
    ui.toast(t('offers.redeem.login'))
    router.push({ path: '/w/login', query: { next: route.fullPath } })
    return
  }
  if (active.value || await redeem(t('offers.redeem.done'))) showCode.value = true
}
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
    <div>
      <h1 class="text-[32px] font-semibold tracking-[-0.025em] m-0">{{ t('offers.title') }}</h1>
      <p class="text-muted text-[14px] m-0 mt-1">{{ t('offers.subtitle') }}</p>
    </div>
  </div>
  <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center mb-5">
    <OfferBanner @pick="filter = 'CAFE'" />
    <OfferCategoryBar v-model="filter" />
  </div>

  <Skeleton v-if="loading" :rows="2" :height="220" />
  <EmptyState v-else-if="error" icon="cloud_off" :title="t('business.loadError')" :action="t('common.retry')" @action="reload" />
  <EmptyState v-else-if="!items.length" icon="sell" :title="t('offers.empty')" :text="t('offers.emptyText')" :action="t('offers.cats.ALL')" @action="filter = 'ALL'" />
  <div v-else class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    <OfferCard v-for="o in items" :key="o.id" :offer="o" :to="{ query: { offer: o.id } }" />
  </div>

  <AppSheet v-model:open="sheet" wide :title="showCode ? t('offers.redeem.yourCode') : undefined" @update:open="(v: boolean) => { if (!v) showCode = false }">
    <Skeleton v-if="loadingOffer" :rows="2" />
    <EmptyState v-else-if="notFound" icon="sell" :title="t('offers.detail.notFound')" :text="t('offers.detail.notFoundText')" />
    <template v-else-if="offer">
      <template v-if="showCode && offer.myRedemption">
        <p class="m-0 mb-3"><b>{{ offer.title }}</b><br><span class="text-muted text-[14px]">{{ offer.businessName }}</span></p>
        <RedemptionCode :redemption="offer.myRedemption" :points-later="!!offer.pointsPrice" />
      </template>
      <template v-else>
        <div class="h-[180px] rounded-[16px] bg-soft bg-cover bg-center mb-4" :style="offer.imageUrl ? { backgroundImage: `url('${offer.imageUrl}')` } : {}" />
        <OfferDetailBody :offer="offer" :business-link="`/w/businesses/${offer.businessId}`" />
        <AppButton block class="mt-4" :loading="redeeming" :icon="active ? 'qr_code_2' : 'redeem'" @click="onRedeem">
          {{ active ? t('offers.redeem.show') : t('offers.redeem.cta') }}
        </AppButton>
      </template>
    </template>
  </AppSheet>
</template>
