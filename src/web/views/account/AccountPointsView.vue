<script setup lang="ts">
// T11 · W14 Contul meu → „Puncte & înscrieri” (design/final web): cardul cu puncte, înscrierile mele (QR-ul fiecăreia),
// istoricul punctelor.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import PointsCard from '@/shared/components/community/PointsCard.vue'
import RegistrationTicket from '@/shared/components/community/RegistrationTicket.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { useMyRegistrations, usePoints } from '@/shared/composables/useCommunity'
import type { RegistrationDto } from '@/shared/types/community'

const { t } = useI18n()
const f = useFormat()
const router = useRouter()
const pts = usePoints()
const regs = useMyRegistrations()
const open = ref<RegistrationDto | null>(null)
const tone: Record<string, string> = { REGISTERED: 'bg-warn-soft text-warn', CONFIRMED: 'bg-ok-soft text-ok', NO_SHOW: 'bg-bad-soft text-bad', CANCELLED: 'bg-soft text-muted' }
const hasData = computed(() => !!pts.points.value)

onMounted(() => { pts.load(); regs.load() })
</script>

<template>
  <Skeleton v-if="pts.loading.value" :rows="2" :height="120" />
  <EmptyState v-else-if="!hasData" icon="cloud_off" :title="t('community.loadError')" :action="t('common.retry')" @action="pts.load" />
  <div v-else class="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
    <div class="flex flex-col gap-3.5">
      <PointsCard :points="pts.points.value!" to="/w/community" />
      <div class="bg-white rounded-[16px] border border-line p-4">
        <b class="block mb-1">{{ t('community.account.myRegs') }}</b>
        <Skeleton v-if="regs.loading.value" :rows="2" :height="56" />
        <EmptyState v-else-if="!regs.items.value.length" icon="volunteer_activism" :title="t('community.account.noRegs')" :action="t('community.account.seeActions')" @action="router.push('/w/community')" />
        <button v-for="r in regs.items.value" :key="r.id" class="w-full flex items-center gap-3 py-2.5 border-b border-line last:border-b-0 text-left" @click="open = r">
          <AppIcon :name="r.status === 'CONFIRMED' ? 'check_circle' : 'qr_code_2'" :class="r.status === 'CONFIRMED' ? 'text-green' : 'text-ink'" />
          <span class="flex-1 min-w-0"><b class="block text-[14px] truncate">{{ r.actionTitle }}</b><span class="text-muted text-[12.5px]">{{ f.dateTime(r.actionStartAt) }}</span></span>
          <span class="rounded-full text-[12px] font-semibold px-2 py-0.5 whitespace-nowrap" :class="tone[r.status]">{{ t(`community.status.${r.status}`) }}</span>
        </button>
      </div>
    </div>

    <div class="bg-white rounded-[16px] border border-line p-4 min-w-0">
      <b class="block mb-2">{{ t('community.account.history') }}</b>
      <EmptyState v-if="!pts.points.value!.transactions.length" icon="stars" :title="t('community.account.noHistory')" />
      <div v-else class="overflow-x-auto">
        <table class="w-full text-[14px] border-collapse">
          <thead><tr class="text-left text-muted text-[12.5px]"><th class="py-2 font-semibold">{{ t('community.account.when') }}</th><th class="py-2 font-semibold">{{ t('community.account.what') }}</th><th class="py-2 font-semibold text-right">{{ t('community.account.points') }}</th></tr></thead>
          <tbody>
            <tr v-for="tx in pts.points.value!.transactions" :key="tx.id" class="border-t border-line">
              <td class="py-2.5 pr-3 whitespace-nowrap text-muted">{{ f.dateTime(tx.createdAt, false) }}</td>
              <td class="py-2.5 pr-3">{{ tx.note ?? t(`community.pointsType.${tx.type}`) }}<span class="block text-muted text-[12px]">{{ t(`community.pointsType.${tx.type}`) }}</span></td>
              <td class="py-2.5 text-right font-semibold whitespace-nowrap" :class="tx.amount > 0 ? 'text-green' : 'text-accent'">{{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <AppSheet :open="!!open" :title="t('community.ticket.title')" @update:open="(v: boolean) => { if (!v) open = null }">
    <RegistrationTicket v-if="open" :registration="open" />
    <template v-if="open" #footer>
      <AppButton block variant="ghost" @click="router.push('/w/community'); open = null">{{ t('community.account.seeActions') }}</AppButton>
    </template>
  </AppSheet>
</template>
