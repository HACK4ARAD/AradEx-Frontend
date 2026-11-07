<script setup lang="ts">
/** QR-ul înscrierii mele la o acțiune: codul `AX-C…` (doar text în QR), acțiunea, data, locul și starea. Mobil (sheet) și web. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import QrCode from '@/shared/components/qr/QrCode.vue'
import { useFormat } from '@/shared/composables/useFormat'
import type { RegistrationDto } from '@/shared/types/community'

const props = defineProps<{ registration: RegistrationDto }>()
const { t } = useI18n()
const f = useFormat()
const confirmed = computed(() => props.registration.status === 'CONFIRMED')
</script>

<template>
  <div class="flex flex-col items-center text-center">
    <div class="rounded-[18px] bg-white border border-line p-3" :class="confirmed && 'opacity-40'">
      <QrCode :value="registration.code" :size="210" :label="registration.code" />
    </div>
    <code class="mt-2 text-[16px] font-bold tracking-[0.06em]">{{ registration.code }}</code>
    <b class="mt-3 text-[16px]">{{ registration.actionTitle }}</b>
    <span class="text-muted text-[13.5px]">{{ f.dateTime(registration.actionStartAt) }} · {{ registration.locationName }}</span>
    <span v-if="confirmed" class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-soft text-green-deep font-semibold text-[13.5px] px-3 py-1.5">
      <AppIcon name="check_circle" :size="18" />{{ t('community.ticket.confirmed', { n: registration.pointsReward }) }}
    </span>
    <span v-else-if="registration.status === 'NO_SHOW'" class="mt-3 rounded-full bg-bad-soft text-bad font-semibold text-[13.5px] px-3 py-1.5">{{ t('community.status.NO_SHOW') }}</span>
    <p v-else class="mt-3 mb-0 text-[13.5px] text-muted">{{ t('community.ticket.hint', { n: registration.pointsReward }) }}</p>
  </div>
</template>
