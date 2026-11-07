<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import StatusPill from '@/shared/components/business/StatusPill.vue'
import { useFormat } from '@/shared/composables/useFormat'
import type { OfferDto } from '@/shared/types/offers'

/** O ofertă în panoul firmei (W16 + E5): poză, titlu, valabilitate, afișări / folosite, stare + Pauză/Publică, Editează, Șterge. */
const props = defineProps<{ offer: OfferDto; actions?: boolean; canPublish?: boolean }>()
defineEmits<{ edit: []; remove: []; toggle: [] }>()
const { t } = useI18n()
const f = useFormat()
const nf = new Intl.NumberFormat('ro-RO')
const until = computed(() => (props.offer.validUntil ? t('offers.until', { date: f.dateTime(props.offer.validUntil + 'T12:00:00+02:00', false) }) : t('offers.permanent')))
</script>

<template>
  <div class="bg-white rounded-[16px] p-3.5">
    <div class="flex items-center gap-3.5">
      <div class="relative w-14 h-14 rounded-[12px] bg-soft bg-cover bg-center shrink-0" :style="offer.imageUrl ? { backgroundImage: `url('${offer.imageUrl}')` } : {}">
        <span class="absolute -bottom-1 -right-1 h-5 px-1.5 rounded-full bg-yellow text-[10.5px] font-extrabold flex items-center">{{ offer.discountLabel }}</span>
      </div>
      <div class="min-w-0 flex-1">
        <b class="block text-[15px] leading-snug truncate">{{ offer.title }}</b>
        <span class="block text-[13px] text-muted truncate">{{ until }}<template v-if="offer.pointsPrice"> · {{ t('offers.badge.points', { n: offer.pointsPrice }) }}</template></span>
        <span class="block text-[13px] text-muted">{{ t('offers.biz.views', { n: nf.format(offer.viewsCount) }) }} · {{ t('offers.biz.used', { n: nf.format(offer.usedCount) }) }}</span>
      </div>
      <StatusPill :status="offer.status" class="shrink-0 self-start" />
    </div>
    <div v-if="actions" class="flex justify-end gap-1.5 mt-2.5">
      <button type="button" class="h-9 px-3 rounded-full border border-line text-[12.5px] font-semibold disabled:opacity-40"
        :disabled="offer.status !== 'PUBLISHED' && !canPublish" @click="$emit('toggle')">
        {{ offer.status === 'PUBLISHED' ? t('offers.biz.pause') : t('offers.biz.publish') }}
      </button>
      <button type="button" class="w-9 h-9 rounded-full border border-line flex items-center justify-center" :aria-label="t('business.edit')" :title="t('business.edit')" @click="$emit('edit')"><AppIcon name="edit" :size="18" /></button>
      <button type="button" class="w-9 h-9 rounded-full border border-line flex items-center justify-center text-bad" :aria-label="t('business.delete')" :title="t('business.delete')" @click="$emit('remove')"><AppIcon name="delete" :size="18" /></button>
    </div>
  </div>
</template>
