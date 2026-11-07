<script setup lang="ts">
// T23 · W14 Contul meu · Puncte & înscrieri (design/final web `accountPage('points')`): înscrierile mele la acțiunile comunitare
// cu starea și QR-ul (sheet, cu „Anulează înscrierea” cât așteaptă validarea), istoricul punctelor; în dreapta cardul cu puncte și nivel.
// Datele: GET /me/community/registrations, GET /me/points, DELETE /community/actions/{id}/register.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import PointsCard from '@/shared/components/community/PointsCard.vue'
import RegistrationSheet from '@/shared/components/community/RegistrationSheet.vue'
import StatusPill from '@/shared/components/tickets/StatusPill.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { registrationPill, useMyRegistrations, usePoints } from '@/shared/composables/useCommunity'
import { useUiStore } from '@/shared/stores/ui'
import type { RegistrationDto } from '@/shared/types/community'

const { t } = useI18n()
const router = useRouter()
const f = useFormat()
const ui = useUiStore()
const regs = useMyRegistrations()
const pts = usePoints()
const shown = ref<RegistrationDto | null>(null)
const open = computed({ get: () => !!shown.value, set: (v: boolean) => { if (!v) shown.value = null } })
/** Înscrierile active (în așteptare, confirmate, neprezentat); cele anulate nu mai apar. */
const items = computed(() => regs.items.value.filter((r) => r.status !== 'CANCELLED'))

async function cancel() {
  if (!shown.value || !window.confirm(t('community.action.cancelConfirm'))) return
  if (await regs.cancel(shown.value.actionId)) {
    shown.value = null
    ui.toast(t('community.action.cancelledToast'), 'success')
  }
}

onMounted(() => { regs.load(); pts.load() })
</script>

<template>
  <div>
    <h2 class="text-[24px] font-semibold tracking-[-0.02em] m-0">{{ t('community.account.title') }}</h2>
    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start mt-4">
      <div class="min-w-0 flex flex-col gap-6">
        <section>
          <h3 class="text-[17px] font-semibold m-0 mb-2.5">{{ t('community.account.registrations') }}</h3>
          <Skeleton v-if="regs.loading.value" :rows="2" :height="88" />
          <EmptyState v-else-if="!items.length" icon="volunteer_activism" :title="t('community.account.emptyTitle')" :text="t('community.account.emptyText')"
            :action="t('community.account.toCommunity')" @action="router.push('/community')" />
          <div v-else class="flex flex-col gap-2.5">
            <div v-for="r in items" :key="r.id" class="bg-white border border-line rounded-[16px] p-3 flex flex-wrap sm:flex-nowrap items-center gap-3.5">
              <router-link :to="`/community/actions/${r.actionId}`" :aria-label="r.actionTitle"
                class="w-16 h-16 shrink-0 rounded-[12px] bg-green-deep bg-cover bg-center flex items-center justify-center text-white/90"
                :style="r.actionImageUrl ? { backgroundImage: `url('${r.actionImageUrl}')` } : undefined"><AppIcon v-if="!r.actionImageUrl" name="volunteer_activism" :size="26" /></router-link>
              <div class="flex-1 min-w-0 flex flex-col gap-1">
                <router-link :to="`/community/actions/${r.actionId}`" class="text-[15.5px] font-semibold leading-snug no-underline text-ink hover:underline">{{ r.actionTitle }}</router-link>
                <span class="text-muted text-[13px]">{{ f.dateTime(r.actionStartAt) }} · {{ t('community.card.points', { n: r.pointsReward }) }}</span>
                <code class="text-[12.5px] text-muted">{{ r.code }}</code>
              </div>
              <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <StatusPill :tone="registrationPill(r).tone" :label="t(registrationPill(r).key, { n: r.pointsReward })" />
                <button type="button" class="h-9 px-3 rounded-[12px] border border-line bg-white text-[13.5px] font-semibold text-ink inline-flex items-center gap-1" @click="shown = r">
                  <AppIcon name="qr_code_2" :size="18" />{{ t('community.account.qr') }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 class="text-[17px] font-semibold m-0 mb-2.5">{{ t('community.account.history') }}</h3>
          <Skeleton v-if="pts.loading.value" :rows="3" :height="44" />
          <EmptyState v-else-if="!pts.points.value" icon="cloud_off" :title="t('community.account.loadError')" :action="t('common.retry')" @action="pts.load" />
          <p v-else-if="!pts.points.value.transactions.length" class="text-muted text-[14px] m-0">{{ t('community.account.historyEmpty') }}</p>
          <div v-else class="bg-white border border-line rounded-[16px] px-4">
            <div v-for="tx in pts.points.value.transactions" :key="tx.id" class="flex items-center gap-3 py-3 border-b border-line last:border-b-0">
              <b class="w-12 shrink-0 text-[15px]" :class="tx.amount >= 0 ? 'text-green' : 'text-bad'">{{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}</b>
              <span class="flex-1 min-w-0 text-[14.5px]">{{ tx.note || t(`community.pointsType.${tx.type}`) }}</span>
              <span class="text-muted text-[12.5px] whitespace-nowrap">{{ f.dateTime(tx.createdAt, false) }}</span>
            </div>
          </div>
        </section>
      </div>

      <aside class="flex flex-col gap-3 min-w-0 order-first xl:order-none">
        <Skeleton v-if="pts.loading.value" :rows="1" :height="170" />
        <PointsCard v-else-if="pts.points.value" :points="pts.points.value" to="/community/leaderboard" />
      </aside>
    </div>

    <RegistrationSheet v-model:open="open" :registration="shown" :saving="regs.cancelling.value" @cancel="cancel" />
  </div>
</template>
