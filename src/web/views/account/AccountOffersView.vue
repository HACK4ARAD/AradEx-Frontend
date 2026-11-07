<script setup lang="ts">
// T10 · Contul meu · Ofertele mele: codurile revendicate (active primele); clic → QR + cod.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppSheet, EmptyState, Skeleton } from '@/shared/components'
import RedemptionCode from '@/shared/components/offers/RedemptionCode.vue'
import RedemptionItem from '@/shared/components/offers/RedemptionItem.vue'
import { useMyRedemptions } from '@/shared/composables/useOffers'
import type { RedemptionDto } from '@/shared/types/offers'

const router = useRouter()
const { t } = useI18n()
const { items, loading } = useMyRedemptions()
const sorted = computed(() => [...items.value].sort((a, b) => Number(b.status === 'ISSUED') - Number(a.status === 'ISSUED')))
const open = ref<RedemptionDto | null>(null)
const sheet = computed({ get: () => open.value != null, set: (v: boolean) => { if (!v) open.value = null } })
</script>

<template>
  <Skeleton v-if="loading" :rows="3" />
  <div v-else-if="!items.length" class="bg-white rounded-[16px] border border-line">
    <EmptyState icon="sell" :title="t('offers.mine.empty')" :text="t('offers.mine.emptyText')" :action="t('offers.mine.browse')" @action="router.push('/w/offers')" />
  </div>
  <div v-else class="flex flex-col gap-2.5 max-w-[760px]">
    <RedemptionItem v-for="r in sorted" :key="r.id" :redemption="r" show-business clickable @open="open = r" />
  </div>

  <AppSheet v-model:open="sheet" :title="t('offers.redeem.yourCode')">
    <template v-if="open">
      <p class="m-0 mb-3"><b>{{ open.offerTitle }}</b><br><span class="text-muted text-[14px]">{{ open.businessName }}</span></p>
      <RedemptionCode :redemption="open" />
    </template>
  </AppSheet>
</template>
