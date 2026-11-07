<script setup lang="ts">
// T10 · W19 · Panou firmă · Validează coduri: cod scris sau scanat (QR) → „folosit” o singură dată; dedesubt codurile recente.
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { EmptyState, Skeleton } from '@/shared/components'
import PanelHeader from '@/shared/components/business/PanelHeader.vue'
import CodeValidator from '@/shared/components/offers/CodeValidator.vue'
import RedemptionItem from '@/shared/components/offers/RedemptionItem.vue'
import { useCodeValidator } from '@/shared/composables/useOffers'

const { t } = useI18n()
const validator = useCodeValidator()
onMounted(() => validator.loadRecent())
</script>

<template>
  <PanelHeader :title="t('offers.codes.title')" :subtitle="t('offers.codes.subtitle')" />
  <div class="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)] items-start">
    <div class="bg-white rounded-[20px] border border-line p-5">
      <CodeValidator :validator="validator" />
    </div>
    <div class="min-w-0">
      <b class="block text-[15px] mb-2.5">{{ t('offers.codes.recent') }}</b>
      <Skeleton v-if="validator.loadingRecent.value" :rows="3" />
      <div v-else-if="!validator.recent.value.length" class="bg-white rounded-[16px] border border-line">
        <EmptyState icon="qr_code_2" :title="t('offers.codes.recentEmpty')" :text="t('offers.codes.recentEmptyText')" />
      </div>
      <div v-else class="flex flex-col gap-2">
        <RedemptionItem v-for="r in validator.recent.value" :key="r.id" :redemption="r" />
      </div>
    </div>
  </div>
</template>
