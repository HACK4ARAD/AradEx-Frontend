<script setup lang="ts">
// T09/T10 · W4 — Panou firmă (design/final web.html „Firmă · Panou”): statistici, ofertele tale, evenimentele următoare, validare cod, activitate recentă.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import AnnouncementForm from '@/shared/components/business/AnnouncementForm.vue'
import BusinessEventItem from '@/shared/components/business/BusinessEventItem.vue'
import BusinessStats from '@/shared/components/business/BusinessStats.vue'
import PanelHeader from '@/shared/components/business/PanelHeader.vue'
import UnverifiedBanner from '@/shared/components/business/UnverifiedBanner.vue'
import { activityLine, useBusinessPanel } from '@/shared/composables/useBusiness'
import type { AnnouncementCreate } from '@/shared/types/business'
import BizOfferItem from '@/shared/components/offers/BizOfferItem.vue'
import CodeValidator from '@/shared/components/offers/CodeValidator.vue'
import { useBusinessOffers, useCodeValidator } from '@/shared/composables/useOffers'

const router = useRouter()
const { t } = useI18n()
const p = useBusinessPanel()
const annSheet = ref(false)
const nextEvents = computed(() => p.upcoming.value.slice(0, 4))
const offers = useBusinessOffers()
const validator = useCodeValidator()
const topOffers = computed(() => offers.items.value.slice(0, 4))

onMounted(() => { p.load(); offers.load() })
/** După un cod validat, „Coduri folosite”, activitatea și ofertele se reîmprospătează. */
function onValidated() { p.load(); offers.load() }

async function saveAnnouncement(req: AnnouncementCreate) {
  if (await p.createAnnouncement(req, t('business.announcements.created'), t('business.announcements.createdDraft'))) annSheet.value = false
}
</script>

<template>
  <Skeleton v-if="p.loading.value" :rows="3" :height="96" />
  <EmptyState v-else-if="!p.me.value" icon="storefront" :title="t('business.loadError')" :action="t('common.retry')" @action="p.load" />
  <template v-else>
    <UnverifiedBanner v-if="!p.me.value.business.verified" />
    <PanelHeader :title="t('business.panel.title')" :subtitle="`${p.me.value.business.name} · ${p.me.value.business.address ?? ''}`">
      <AppButton variant="ghost" size="sm" icon="add" @click="annSheet = true">{{ t('business.panel.newAnnouncement') }}</AppButton>
      <AppButton variant="ghost" size="sm" icon="add" @click="router.push('/business/events/new')">{{ t('business.panel.newEvent') }}</AppButton>
      <AppButton size="sm" icon="add" @click="router.push('/business/offers/new')">{{ t('offers.biz.new') }}</AppButton>
    </PanelHeader>

    <BusinessStats :stats="p.me.value.stats" />

    <div class="grid gap-5 mt-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="min-w-0">
        <div class="flex items-center justify-between mb-2.5">
          <b class="text-[15px]">{{ t('offers.biz.title') }} · {{ offers.items.value.length }}</b>
          <router-link to="/business/offers" class="text-[13px] text-muted no-underline flex items-center">{{ t('business.panel.seeAll') }}<AppIcon name="chevron_right" :size="18" /></router-link>
        </div>
        <div v-if="topOffers.length" class="flex flex-col gap-2.5 mb-5">
          <BizOfferItem v-for="o in topOffers" :key="o.id" :offer="o" />
        </div>
        <EmptyState v-else-if="!offers.loading.value" class="mb-5" icon="sell" :title="t('offers.biz.empty')" :text="t('offers.biz.emptyText')" :action="t('offers.biz.new')" @action="router.push('/business/offers/new')" />
        <div class="flex items-center justify-between mb-2.5">
          <b class="text-[15px]">{{ t('business.panel.upcomingTitle') }} · {{ p.me.value.stats.upcomingEvents }}</b>
          <router-link to="/business/events" class="text-[13px] text-muted no-underline flex items-center">{{ t('business.panel.seeAll') }}<AppIcon name="chevron_right" :size="18" /></router-link>
        </div>
        <div v-if="nextEvents.length" class="flex flex-col gap-2.5">
          <BusinessEventItem v-for="e in nextEvents" :key="e.id" :event="e" />
        </div>
        <EmptyState v-else icon="event" :title="t('business.events.empty')" :text="t('business.events.emptyText')" :action="t('business.events.new')" @action="router.push('/business/events/new')" />
      </div>

      <div class="flex flex-col gap-4">
        <div class="bg-white rounded-[16px] border border-line p-4">
          <b class="block text-[15px] mb-1">{{ t('business.panel.validateTitle') }}</b>
          <p class="text-[12.5px] text-muted m-0 mb-3">{{ t('offers.codes.subtitle') }}</p>
          <CodeValidator :validator="validator" compact @validated="onValidated" />
        </div>
        <div class="bg-white rounded-[16px] border border-line p-4">
          <b class="block text-[15px]">{{ t('business.activity.title') }}</b>
          <ul v-if="p.activity.value.length" class="list-none p-0 m-0 mt-2 flex flex-col gap-2 text-[14px]">
            <li v-for="(a, i) in p.activity.value" :key="i">{{ activityLine(a, t) }}</li>
          </ul>
          <p v-else class="text-[13.5px] text-muted m-0 mt-2">{{ t('business.activity.emptyText') }}</p>
        </div>
      </div>
    </div>

    <AppSheet v-model:open="annSheet" :title="t('business.announcements.new')">
      <AnnouncementForm :saving="p.saving.value" @submit="saveAnnouncement" @cancel="annSheet = false" />
    </AppSheet>
  </template>
</template>
