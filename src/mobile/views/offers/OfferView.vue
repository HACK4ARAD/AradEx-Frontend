<script setup lang="ts">
// T10 · S1c · detaliul ofertei: poză, insigne, valabilitate, detalii, firma; jos „Revendică oferta” → sheet cu QR + cod
// („Arată codul la casă”). Dacă am deja un cod activ, butonul devine „Arată codul”.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import OfferDetailBody from '@/shared/components/offers/OfferDetailBody.vue'
import RedemptionCode from '@/shared/components/offers/RedemptionCode.vue'
import { useBack } from '@/shared/composables/useBack'
import { useOffer } from '@/shared/composables/useOffers'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const ui = useUiStore()
const back = useBack('/m/offers')
const id = computed(() => Number(route.params.id))
const { offer, loading, notFound, error, redeeming, reload, redeem } = useOffer(id, t)
const sheet = ref(false)
const active = computed(() => (offer.value?.myRedemption?.status === 'ISSUED' ? offer.value.myRedemption : null))

async function onRedeem() {
  if (!auth.isLoggedIn) {
    ui.toast(t('offers.redeem.login'))
    router.push({ path: '/m/login', query: { next: route.fullPath } })
    return
  }
  if (active.value) { sheet.value = true; return }
  if (await redeem(t('offers.redeem.done'))) sheet.value = true
}
</script>

<template>
  <div class="-mx-5 -mt-3">
    <div class="relative h-[250px] bg-soft bg-cover bg-center" :style="offer?.imageUrl ? { backgroundImage: `url('${offer.imageUrl}')` } : {}">
      <button class="absolute left-4 top-[max(14px,env(safe-area-inset-top))] w-11 h-11 rounded-full bg-white/90 flex items-center justify-center" :aria-label="t('common.back')" @click="back">
        <AppIcon name="arrow_back" />
      </button>
    </div>
  </div>

  <div class="pt-4 pb-28">
    <Skeleton v-if="loading" :rows="3" />
    <EmptyState v-else-if="notFound" icon="sell" :title="t('offers.detail.notFound')" :text="t('offers.detail.notFoundText')" :action="t('offers.title')" @action="router.push('/m/offers')" />
    <EmptyState v-else-if="error || !offer" icon="cloud_off" :title="t('business.loadError')" :action="t('common.retry')" @action="reload" />
    <OfferDetailBody v-else :offer="offer" :business-link="`/m/businesses/${offer.businessId}`" />
  </div>

  <!-- bara de jos din design (`bottombar`), peste tab bar, ca la detaliul evenimentului (T06) -->
  <div v-if="offer" class="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[480px] z-40 px-5 pt-3 pb-[max(30px,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-line flex">
    <AppButton block :loading="redeeming" :icon="active ? 'qr_code_2' : 'redeem'" @click="onRedeem">
      {{ active ? t('offers.redeem.show') : t('offers.redeem.cta') }}
    </AppButton>
  </div>

  <AppSheet v-model:open="sheet" :title="t('offers.redeem.yourCode')">
    <template v-if="offer && offer.myRedemption">
      <p class="m-0 mb-3"><b>{{ offer.title }}</b><br><span class="text-muted text-[14px]">{{ offer.businessName }}</span></p>
      <RedemptionCode :redemption="offer.myRedemption" :points-later="!!offer.pointsPrice" />
    </template>
  </AppSheet>
</template>
