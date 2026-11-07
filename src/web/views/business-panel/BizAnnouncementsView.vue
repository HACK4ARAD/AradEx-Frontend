<script setup lang="ts">
// T09 · Panou firmă · Anunțuri (design/final web.html „Firmă · Anunțuri”): scurte, fără dată; apar pe pagina publică a firmei.
// `/business/announcements/new` deschide direct formularul.
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import AnnouncementForm from '@/shared/components/business/AnnouncementForm.vue'
import AnnouncementItem from '@/shared/components/business/AnnouncementItem.vue'
import PanelHeader from '@/shared/components/business/PanelHeader.vue'
import UnverifiedBanner from '@/shared/components/business/UnverifiedBanner.vue'
import { useBusinessPanel } from '@/shared/composables/useBusiness'
import type { AnnouncementCreate } from '@/shared/types/business'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const p = useBusinessPanel()

const sheet = computed({
  get: () => route.params.sub === 'new',
  set: (v: boolean) => { router.replace(v ? '/business/announcements/new' : '/business/announcements') },
})

onMounted(p.load)

async function save(req: AnnouncementCreate) {
  if (await p.createAnnouncement(req, t('business.announcements.created'), t('business.announcements.createdDraft'))) sheet.value = false
}
async function remove(id: number, title: string) {
  if (window.confirm(t('business.announcements.confirmDelete', { title }))) await p.deleteAnnouncement(id, t('business.announcements.deleted'))
}
</script>

<template>
  <Skeleton v-if="p.loading.value" :rows="3" :height="80" />
  <EmptyState v-else-if="!p.me.value" icon="storefront" :title="t('business.loadError')" :action="t('common.retry')" @action="p.load" />
  <template v-else>
    <UnverifiedBanner v-if="!p.me.value.business.verified" />
    <PanelHeader :title="t('business.announcements.title')" :subtitle="t('business.announcements.subtitle')">
      <AppButton size="sm" icon="add" @click="sheet = true">{{ t('business.announcements.new') }}</AppButton>
    </PanelHeader>
    <div v-if="!p.announcements.value.length" class="bg-white rounded-[16px] border border-line">
      <EmptyState icon="campaign" :title="t('business.announcements.empty')" :text="t('business.announcements.emptyText')" :action="t('business.announcements.new')" @action="sheet = true" />
    </div>
    <div class="flex flex-col gap-2.5 max-w-[860px]">
      <AnnouncementItem v-for="a in p.announcements.value" :key="a.id" :announcement="a" actions @remove="remove(a.id, a.title)" />
    </div>
  </template>

  <AppSheet v-model:open="sheet" :title="t('business.announcements.new')">
    <AnnouncementForm :saving="p.saving.value" @submit="save" @cancel="sheet = false" />
  </AppSheet>
</template>
