<script setup lang="ts">
// T23 · W14 — Contul meu › Ofertele mele (design/final web `accountPage` tab „offers”): codurile revendicate, active primele,
// fiecare cu QR-ul mic, oferta, firma și starea; „Cod” deschide codul mare (dialog) de arătat la casă.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppSheet, EmptyState, Skeleton } from '@/shared/components'
import ClaimedOfferRow from '@/shared/components/offers/ClaimedOfferRow.vue'
import RedemptionCode from '@/shared/components/offers/RedemptionCode.vue'
import { activeFirst, useMyRedemptions } from '@/shared/composables/useOffers'
import type { RedemptionDto } from '@/shared/types/offers'

const { t } = useI18n()
const router = useRouter()
const { items, loading, error, reload } = useMyRedemptions()
const sorted = computed(() => activeFirst(items.value))
const open = ref<RedemptionDto | null>(null)
const dialog = computed({ get: () => open.value != null, set: (v: boolean) => { if (!v) open.value = null } })
</script>

<template>
  <h2 class="text-[22px] font-semibold tracking-[-0.02em] m-0 mb-3">{{ t('offers.web.mine') }}</h2>
  <Skeleton v-if="loading" :rows="3" :height="84" />
  <EmptyState v-else-if="error" icon="cloud_off" :title="t('business.loadError')" :action="t('common.retry')" @action="reload" />
  <EmptyState v-else-if="!sorted.length" icon="sell" :title="t('offers.web.mineEmpty')" :text="t('offers.web.mineEmptyText')" :action="t('offers.web.browse')" @action="router.push('/offers')" />
  <div v-else class="flex flex-col gap-2.5">
    <ClaimedOfferRow v-for="r in sorted" :key="r.id" :redemption="r" class="border border-line" @open="open = r" />
  </div>

  <AppSheet v-model:open="dialog" :title="t('offers.redeem.yourCode')">
    <template v-if="open">
      <p class="m-0 mb-3"><b>{{ open.offerTitle }}</b><br><span class="text-muted text-[14px]">{{ open.businessName }}</span></p>
      <RedemptionCode :redemption="open" />
    </template>
  </AppSheet>
</template>
