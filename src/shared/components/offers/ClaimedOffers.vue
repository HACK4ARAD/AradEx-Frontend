<script setup lang="ts">
// T10 · secțiunea „Oferte revendicate” din Bilete (S9, design/final `/tickets`): QR mic, oferta, firma, codul, Activ/Folosit;
// atingerea deschide codul mare în sheet („Arată codul la casă”). Emite `count` ca ecranul să știe dacă are ce arăta.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppSheet } from '@/shared/components'
import QrCode from '@/shared/components/qr/QrCode.vue'
import RedemptionCode from './RedemptionCode.vue'
import { useMyRedemptions } from '@/shared/composables/useOffers'
import type { RedemptionDto } from '@/shared/types/offers'

const emit = defineEmits<{ count: [n: number] }>()
const { t } = useI18n()
const { items } = useMyRedemptions()
const sorted = computed(() => [...items.value].sort((a, b) => Number(b.status === 'ISSUED') - Number(a.status === 'ISSUED')))
const open = ref<RedemptionDto | null>(null)
const sheet = computed({ get: () => open.value != null, set: (v: boolean) => { if (!v) open.value = null } })
watch(() => items.value.length, (n) => emit('count', n), { immediate: true })
</script>

<template>
  <template v-if="sorted.length">
    <h3 class="text-[16px] font-semibold mt-3.5 mb-2">{{ t('offers.claimed.title') }}</h3>
    <button v-for="r in sorted" :key="r.id" type="button" class="w-full bg-white rounded-[16px] p-3.5 mb-2.5 flex items-center gap-3.5 text-left"
      @click="open = r">
      <QrCode :value="r.code" :size="56" class="shrink-0" />
      <span class="min-w-0 flex-1">
        <b class="block text-[15.5px] leading-tight">{{ r.offerTitle }}</b>
        <span class="block text-[13px] text-muted">{{ r.businessName }}</span>
        <span class="flex items-center gap-2 mt-1.5">
          <span class="font-mono text-[12px]">{{ r.code }}</span>
          <span class="h-[22px] px-2 rounded-full text-[11.5px] font-semibold flex items-center" :class="r.status === 'ISSUED' ? 'bg-green text-white' : 'bg-soft text-muted'">
            {{ t(`offers.status.${r.status}`) }}
          </span>
        </span>
      </span>
      <AppIcon name="chevron_right" class="text-muted shrink-0" />
    </button>

    <AppSheet v-model:open="sheet" :title="t('offers.redeem.yourCode')">
      <template v-if="open">
        <p class="m-0 mb-3"><b>{{ open.offerTitle }}</b><br><span class="text-muted text-[14px]">{{ open.businessName }}</span></p>
        <RedemptionCode :redemption="open" />
      </template>
    </AppSheet>
  </template>
</template>
