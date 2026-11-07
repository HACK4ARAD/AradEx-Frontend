<script setup lang="ts">
// T10 · S1c · detaliul ofertei: poză, insigne, valabilitate, detalii, firma; jos „Revendică oferta” → sheet cu QR + cod
// („Arată codul la casă”). Dacă am deja un cod activ, butonul devine „Arată codul”.
// T11 — plata cu puncte (design/final `offer`): oferta doar pe puncte are un singur buton verde „Plătește cu N de puncte”;
// oferta normală cu `pointsPrice` are în plus butonul „N p”; ambele estompate dacă soldul nu ajunge (la apăsare, toast cu câte puncte ai și câte îți trebuie).
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import OfferDetailBody from '@/shared/components/offers/OfferDetailBody.vue'
import RedemptionCode from '@/shared/components/offers/RedemptionCode.vue'
import { useBack } from '@/shared/composables/useBack'
import { useOfferClaim } from '@/shared/composables/useOfferClaim'
import { useAuthStore } from '@/shared/stores/auth'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const back = useBack('/offers')
const id = computed(() => Number(route.params.id))
// revendicarea + plata cu puncte sunt comune cu web-ul: shared/composables/useOfferClaim
const { offer, loading, notFound, error, redeeming, reload, active, canEarn, price, pointsOnly, enough, pay, claim } = useOfferClaim(id)
const sheet = ref(false)

async function onPay() { if (await pay()) sheet.value = true }
async function onRedeem() { if (await claim()) sheet.value = true }
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
    <EmptyState v-else-if="notFound" icon="sell" :title="t('offers.detail.notFound')" :text="t('offers.detail.notFoundText')" :action="t('offers.title')" @action="router.push('/offers')" />
    <EmptyState v-else-if="error || !offer" icon="cloud_off" :title="t('business.loadError')" :action="t('common.retry')" @action="reload" />
    <OfferDetailBody v-else :offer="offer" :business-link="`/businesses/${offer.businessId}`" />
  </div>

  <!-- bara de jos din design (`bottombar`), peste tab bar, ca la detaliul evenimentului (T06) -->
  <div v-if="offer" class="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[480px] z-40 px-5 pt-3 pb-[max(30px,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-line flex">
    <AppButton v-if="active" block icon="qr_code_2" @click="sheet = true">{{ t('offers.redeem.show') }}</AppButton>
    <AppButton v-else-if="pointsOnly" block icon="stars" class="!bg-green" :class="{ 'opacity-45': auth.isLoggedIn && canEarn && !enough }" :loading="redeeming" :disabled="auth.isLoggedIn && !canEarn" @click="onPay">
      {{ t('offers.redeem.payPoints', { n: price }) }}
    </AppButton>
    <template v-else>
      <AppButton v-if="price && canEarn" variant="secondary" class="!w-auto !px-3.5 mr-2.5 shrink-0" :class="{ 'opacity-45': !enough }" :disabled="redeeming" @click="onPay">
        {{ t('offers.redeem.pointsShort', { n: price }) }}
      </AppButton>
      <AppButton block :loading="redeeming" icon="redeem" @click="onRedeem">{{ t('offers.redeem.cta') }}</AppButton>
    </template>
  </div>

  <AppSheet v-model:open="sheet" :title="t('offers.redeem.yourCode')">
    <template v-if="offer && offer.myRedemption">
      <p class="m-0 mb-3"><b>{{ offer.title }}</b><br><span class="text-muted text-[14px]">{{ offer.businessName }}</span></p>
      <RedemptionCode :redemption="offer.myRedemption" />
    </template>
  </AppSheet>
</template>
