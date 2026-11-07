<script setup lang="ts">
// T10 · secțiunea „Oferte revendicate” din Bilete (S9, design/final `/tickets`): QR mic, oferta, firma, codul, Activ/Folosit;
// atingerea deschide codul mare în sheet („Arată codul la casă”). Emite `count` ca ecranul să știe dacă are ce arăta.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppSheet } from '@/shared/components'
import ClaimedOfferRow from './ClaimedOfferRow.vue'
import RedemptionCode from './RedemptionCode.vue'
import { activeFirst, useMyRedemptions } from '@/shared/composables/useOffers'
import type { RedemptionDto } from '@/shared/types/offers'

const emit = defineEmits<{ count: [n: number] }>()
const { t } = useI18n()
const { items } = useMyRedemptions()
const sorted = computed(() => activeFirst(items.value))
const open = ref<RedemptionDto | null>(null)
const sheet = computed({ get: () => open.value != null, set: (v: boolean) => { if (!v) open.value = null } })
watch(() => items.value.length, (n) => emit('count', n), { immediate: true })
</script>

<template>
  <template v-if="sorted.length">
    <h3 class="text-[16px] font-semibold mt-3.5 mb-2">{{ t('offers.claimed.title') }}</h3>
    <ClaimedOfferRow v-for="r in sorted" :key="r.id" :redemption="r" class="mb-2.5" @open="open = r" />

    <AppSheet v-model:open="sheet" :title="t('offers.redeem.yourCode')">
      <template v-if="open">
        <p class="m-0 mb-3"><b>{{ open.offerTitle }}</b><br><span class="text-muted text-[14px]">{{ open.businessName }}</span></p>
        <RedemptionCode :redemption="open" />
      </template>
    </AppSheet>
  </template>
</template>
