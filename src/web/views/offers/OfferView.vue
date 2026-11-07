<script setup lang="ts">
// T23 · W11 — detaliul ofertei pe web: în stânga poza + detaliile (OfferDetailBody), în dreapta cardul de revendicare
// (bani sau puncte, ca în aplicație: shared/composables/useOfferClaim); după revendicare același card arată codul cu QR.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, EmptyState, Skeleton } from '@/shared/components'
import OfferDetailBody from '@/shared/components/offers/OfferDetailBody.vue'
import RedemptionCode from '@/shared/components/offers/RedemptionCode.vue'
import { useOfferClaim } from '@/shared/composables/useOfferClaim'
import { useFormat } from '@/shared/composables/useFormat'
import { useAuthStore } from '@/shared/stores/auth'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const f = useFormat()
const auth = useAuthStore()
const id = computed(() => Number(route.params.id))
const { offer, loading, notFound, error, redeeming, reload, active, canEarn, price, pointsOnly, balance, enough, pay, claim } = useOfferClaim(id)
</script>

<template>
  <div class="max-w-[1080px] mx-auto">
    <router-link to="/offers" class="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted no-underline mb-4">
      <AppIcon name="arrow_back" :size="18" />{{ t('offers.web.back') }}
    </router-link>

    <Skeleton v-if="loading" :rows="3" :height="140" />
    <EmptyState v-else-if="notFound" icon="sell" :title="t('offers.detail.notFound')" :text="t('offers.detail.notFoundText')" :action="t('offers.title')" @action="router.push('/offers')" />
    <EmptyState v-else-if="error || !offer" icon="cloud_off" :title="t('business.loadError')" :action="t('common.retry')" @action="reload" />

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
      <div class="min-w-0">
        <div class="h-[220px] md:h-[320px] rounded-[20px] bg-soft bg-cover bg-center mb-5" :style="offer.imageUrl ? { backgroundImage: `url('${offer.imageUrl}')` } : {}" />
        <OfferDetailBody :offer="offer" :business-link="`/businesses/${offer.businessId}`" />
      </div>

      <aside class="bg-white border border-line rounded-[20px] p-5 lg:sticky lg:top-24">
        <template v-if="active">
          <h2 class="text-[20px] font-semibold tracking-[-0.02em] m-0">{{ t('offers.redeem.yourCode') }}</h2>
          <p class="text-muted text-[14px] m-0 mt-1 mb-3">{{ offer.title }} · {{ offer.businessName }}</p>
          <RedemptionCode :redemption="active" :size="200" />
          <router-link to="/account/offers" class="mt-3 h-11 rounded-[14px] border border-line flex items-center justify-center gap-1.5 text-[14.5px] font-semibold no-underline text-ink">
            <AppIcon name="sell" :size="18" />{{ t('offers.web.mine') }}
          </router-link>
        </template>
        <template v-else>
          <h2 class="text-[20px] font-semibold tracking-[-0.02em] m-0">{{ t('offers.web.claimTitle') }}</h2>
          <p class="text-muted text-[14px] leading-relaxed m-0 mt-1 mb-4">{{ t('offers.web.claimText') }}</p>
          <div class="flex flex-col gap-2.5">
            <AppButton v-if="pointsOnly" block icon="stars" class="!bg-green" :class="{ 'opacity-45': auth.isLoggedIn && canEarn && !enough }"
              :loading="redeeming" :disabled="auth.isLoggedIn && !canEarn" @click="pay">
              {{ t('offers.redeem.payPoints', { n: price }) }}
            </AppButton>
            <template v-else>
              <AppButton block :loading="redeeming" icon="redeem" @click="claim">{{ t('offers.redeem.cta') }}</AppButton>
              <AppButton v-if="price && canEarn" block variant="secondary" icon="stars" :class="{ 'opacity-45': !enough }" :disabled="redeeming" @click="pay">
                {{ t('offers.redeem.payPoints', { n: price }) }}
              </AppButton>
            </template>
          </div>
          <p v-if="canEarn && price" class="text-[13px] text-muted m-0 mt-3 flex items-center gap-1.5">
            <AppIcon name="stars" :size="16" class="text-green" />{{ t('offers.web.balance', { points: f.points(balance) }) }}
          </p>
        </template>
      </aside>
    </div>
  </div>
</template>
