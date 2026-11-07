<script setup lang="ts">
// T10 · W16 · Panou firmă · Oferte: lista cu afișări / folosite, Pauză / Publică, Editează, Șterge; `/new` și `/:id` = formularul.
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, EmptyState, Skeleton } from '@/shared/components'
import PanelHeader from '@/shared/components/business/PanelHeader.vue'
import UnverifiedBanner from '@/shared/components/business/UnverifiedBanner.vue'
import BizOfferItem from '@/shared/components/offers/BizOfferItem.vue'
import OfferForm from '@/shared/components/offers/OfferForm.vue'
import { useBusinessPanel } from '@/shared/composables/useBusiness'
import { useBusinessOffers } from '@/shared/composables/useOffers'
import { fromOffer } from '@/shared/composables/useOfferForm'
import { useAuthStore } from '@/shared/stores/auth'
import type { OfferCreate, OfferDto } from '@/shared/types/offers'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const o = useBusinessOffers()
const panel = useBusinessPanel()
const verified = computed(() => panel.me.value?.business.verified ?? auth.user?.business?.verified ?? true)
const msg = computed(() => ({ published: t('offers.biz.created'), draft: t('offers.biz.createdDraft') }))

const sub = computed(() => String(route.params.sub ?? ''))
const editing = computed<OfferDto | null>(() => (sub.value && sub.value !== 'new' ? o.items.value.find((x) => x.id === Number(sub.value)) ?? null : null))
const initial = computed(() => (editing.value ? fromOffer(editing.value) : undefined))

onMounted(() => { o.load(); panel.load() })

async function save(req: OfferCreate) {
  const ok = await o.save(editing.value?.id ?? null, req, editing.value ? { published: t('offers.biz.saved'), draft: t('offers.biz.saved') } : msg.value)
  if (ok) router.push('/w/business/offers')
}
function toggle(x: OfferDto) {
  o.setPaused(x, x.status === 'PUBLISHED', { published: t('offers.biz.published'), draft: t('offers.biz.paused') })
}
async function remove(x: OfferDto) {
  if (window.confirm(t('offers.biz.confirmDelete', { title: x.title }))) await o.remove(x.id, t('offers.biz.deleted'))
}
</script>

<template>
  <UnverifiedBanner v-if="!verified" />
  <template v-if="sub">
    <PanelHeader :title="sub === 'new' ? t('offers.biz.new') : t('offers.biz.edit')" />
    <Skeleton v-if="o.loading.value && sub !== 'new'" :rows="2" />
    <EmptyState v-else-if="sub !== 'new' && !editing" icon="sell" :title="t('offers.biz.notFound')" :action="t('offers.biz.title')" @action="router.push('/w/business/offers')" />
    <div v-else class="bg-white rounded-[20px] border border-line p-6 max-w-[760px]">
      <OfferForm :key="sub" :initial="initial" :saving="o.saving.value" :submit-label="editing ? t('offers.form.save') : t('offers.form.publish')"
        @submit="save" @cancel="router.push('/w/business/offers')" />
    </div>
  </template>
  <template v-else>
    <PanelHeader :title="t('offers.biz.title')" :subtitle="t('offers.biz.subtitle')">
      <AppButton size="sm" icon="add" @click="router.push('/w/business/offers/new')">{{ t('offers.biz.new') }}</AppButton>
    </PanelHeader>
    <Skeleton v-if="o.loading.value" :rows="3" :height="80" />
    <EmptyState v-else-if="o.error.value" icon="cloud_off" :title="t('business.loadError')" :action="t('common.retry')" @action="o.load" />
    <div v-else-if="!o.items.value.length" class="bg-white rounded-[16px] border border-line">
      <EmptyState icon="sell" :title="t('offers.biz.empty')" :text="t('offers.biz.emptyText')" :action="t('offers.biz.new')" @action="router.push('/w/business/offers/new')" />
    </div>
    <div v-else class="flex flex-col gap-2.5 max-w-[960px]">
      <BizOfferItem v-for="x in o.items.value" :key="x.id" :offer="x" actions :can-publish="verified"
        @toggle="toggle(x)" @edit="router.push(`/w/business/offers/${x.id}`)" @remove="remove(x)" />
    </div>
  </template>
</template>
