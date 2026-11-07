<script setup lang="ts">
// T09/T10 · E5 — Panoul firmei pe telefon (în cochilia /m/panel). Design: mobile.html „Panou firmă (teren)”: firma, 3 statistici,
// „Validează un cod” (T10: text sau QR, într-un sheet), tab-urile simplificate Oferte / Evenimente / Anunțuri cu creare în sheet.
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppChip, AppIcon, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import AnnouncementForm from '@/shared/components/business/AnnouncementForm.vue'
import AnnouncementItem from '@/shared/components/business/AnnouncementItem.vue'
import BusinessEventItem from '@/shared/components/business/BusinessEventItem.vue'
import BusinessStats from '@/shared/components/business/BusinessStats.vue'
import EventForm from '@/shared/components/business/EventForm.vue'
import { fromEvent, type EventForm as EventFormModel } from '@/shared/composables/useEventForm'
import { useBusinessPanel } from '@/shared/composables/useBusiness'
import type { AnnouncementCreate, EventCreate } from '@/shared/types/business'
import type { EventDto } from '@/shared/types/events'
import BizOfferItem from '@/shared/components/offers/BizOfferItem.vue'
import CodeValidator from '@/shared/components/offers/CodeValidator.vue'
import OfferForm from '@/shared/components/offers/OfferForm.vue'
import { fromOffer, type OfferForm as OfferFormModel } from '@/shared/composables/useOfferForm'
import { useBusinessOffers, useCodeValidator } from '@/shared/composables/useOffers'
import type { OfferCreate, OfferDto } from '@/shared/types/offers'

const { t } = useI18n()
const p = useBusinessPanel()

type Tab = 'offers' | 'events' | 'announcements'
const tab = ref<Tab>('offers')
const eventSheet = ref(false)
const annSheet = ref(false)
const editing = ref<EventDto | null>(null)
const editInitial = ref<EventFormModel | undefined>(undefined)
const formKey = ref(0)

const offers = useBusinessOffers()
const validator = useCodeValidator()
const codeSheet = ref(false)
const offerSheet = ref(false)
const editingOffer = ref<OfferDto | null>(null)
const offerInitial = ref<OfferFormModel | undefined>(undefined)

onMounted(() => { p.load(); offers.load() })

function openOffer(o: OfferDto | null) {
  editingOffer.value = o
  offerInitial.value = o ? fromOffer(o) : undefined
  formKey.value++
  offerSheet.value = true
}
async function saveOffer(req: OfferCreate) {
  const msg = editingOffer.value ? { published: t('offers.biz.saved'), draft: t('offers.biz.saved') } : { published: t('offers.biz.created'), draft: t('offers.biz.createdDraft') }
  if (await offers.save(editingOffer.value?.id ?? null, req, msg)) offerSheet.value = false
}
function toggleOffer(o: OfferDto) {
  offers.setPaused(o, o.status === 'PUBLISHED', { published: t('offers.biz.published'), draft: t('offers.biz.paused') })
}
async function removeOffer(o: OfferDto) {
  if (window.confirm(t('offers.biz.confirmDelete', { title: o.title }))) await offers.remove(o.id, t('offers.biz.deleted'))
}
function openNew() {
  if (tab.value === 'offers') openOffer(null)
  else if (tab.value === 'events') openNewEvent()
  else annSheet.value = true
}
/** După un cod validat, statisticile („Coduri folosite”) și lista ofertelor se reîmprospătează. */
function onValidated() { p.load(); offers.load() }

function openNewEvent() {
  editing.value = null
  editInitial.value = undefined
  formKey.value++
  eventSheet.value = true
}
function openEdit(e: EventDto) {
  editing.value = e
  editInitial.value = fromEvent(e)
  formKey.value++
  eventSheet.value = true
}
async function saveEvent(req: EventCreate) {
  const ok = editing.value
    ? await p.updateEvent(editing.value.id, req, t('business.events.saved'))
    : await p.createEvent(req, t('business.events.created'), t('business.events.createdDraft'))
  if (ok) eventSheet.value = false
}
async function removeEvent(e: EventDto) {
  if (window.confirm(t('business.events.confirmDelete', { title: e.title }))) await p.deleteEvent(e.id, t('business.events.deleted'))
}
async function saveAnnouncement(req: AnnouncementCreate) {
  if (await p.createAnnouncement(req, t('business.announcements.created'), t('business.announcements.createdDraft'))) annSheet.value = false
}
async function removeAnnouncement(id: number, title: string) {
  if (window.confirm(t('business.announcements.confirmDelete', { title }))) await p.deleteAnnouncement(id, t('business.announcements.deleted'))
}
</script>

<template>
  <div class="pt-1">
    <h1 class="text-[30px] font-semibold tracking-[-0.025em] m-0">{{ t('business.panel.title') }}</h1>

    <Skeleton v-if="p.loading.value" :rows="4" class="mt-4" />
    <EmptyState v-else-if="!p.me.value" icon="storefront" :title="t('business.loadError')" :action="t('common.retry')" @action="p.load" />
    <template v-else>
      <div class="bg-white rounded-[20px] p-4 flex items-center gap-3 mt-4">
        <span class="w-12 h-12 rounded-[12px] bg-ink text-white flex items-center justify-center shrink-0"><AppIcon name="storefront" /></span>
        <div class="min-w-0 flex-1">
          <b class="block text-[16px] truncate">{{ p.me.value.business.name }}</b>
          <span class="text-muted text-[13px]">{{ p.me.value.business.verified ? t('business.panel.verified') : t('business.panel.pending') }}</span>
        </div>
        <AppIcon v-if="p.me.value.business.verified" name="verified" class="text-green" />
      </div>

      <div v-if="!p.me.value.business.verified" class="mt-3 rounded-[16px] bg-warn-soft text-warn p-3.5 text-[13.5px] leading-snug">
        <b>{{ t('business.panel.unverified') }}</b> {{ t('business.panel.unverifiedText') }}
      </div>

      <BusinessStats :stats="p.me.value.stats" compact class="mt-3" />

      <AppButton block icon="qr_code_scanner" class="mt-3" @click="codeSheet = true">{{ t('business.panel.validate') }}</AppButton>

      <div class="flex items-center gap-2 mt-5">
        <div class="flex gap-2 overflow-x-auto flex-1 min-w-0 -my-1 py-1 [scrollbar-width:none]">
        <AppChip class="shrink-0 whitespace-nowrap" :active="tab === 'offers'" @click="tab = 'offers'">{{ t('business.tabs.offers') }} · {{ offers.items.value.length }}</AppChip>
        <AppChip class="shrink-0 whitespace-nowrap" :active="tab === 'events'" @click="tab = 'events'">{{ t('business.tabs.events') }} · {{ p.events.value.length }}</AppChip>
        <AppChip class="shrink-0 whitespace-nowrap" :active="tab === 'announcements'" @click="tab = 'announcements'">{{ t('business.tabs.announcements') }} · {{ p.announcements.value.length }}</AppChip>
        </div>
        <button type="button" class="w-[38px] h-[38px] rounded-full bg-ink text-white flex items-center justify-center shrink-0"
          :aria-label="tab === 'offers' ? t('offers.biz.new') : tab === 'events' ? t('business.events.new') : t('business.announcements.new')"
          @click="openNew">
          <AppIcon name="add" />
        </button>
      </div>

      <div v-if="tab === 'offers'" class="flex flex-col gap-2.5 mt-3">
        <EmptyState v-if="!offers.loading.value && !offers.items.value.length" icon="sell" :title="t('offers.biz.empty')" :text="t('offers.biz.emptyText')" :action="t('offers.biz.new')" @action="openOffer(null)" />
        <BizOfferItem v-for="o in offers.items.value" :key="o.id" :offer="o" actions :can-publish="p.me.value.business.verified"
          @toggle="toggleOffer(o)" @edit="openOffer(o)" @remove="removeOffer(o)" />
      </div>

      <div v-else-if="tab === 'events'" class="flex flex-col gap-2.5 mt-3">
        <EmptyState v-if="!p.events.value.length" icon="event" :title="t('business.events.empty')" :text="t('business.events.emptyText')" :action="t('business.events.new')" @action="openNewEvent" />
        <BusinessEventItem v-for="e in p.upcoming.value" :key="e.id" :event="e" actions @edit="openEdit(e)" @remove="removeEvent(e)" />
        <template v-if="p.past.value.length">
          <h3 class="text-[14px] text-muted font-semibold mt-3 mb-0">{{ t('business.events.past') }}</h3>
          <BusinessEventItem v-for="e in p.past.value" :key="e.id" :event="e" />
        </template>
      </div>

      <div v-else class="flex flex-col gap-2.5 mt-3">
        <EmptyState v-if="!p.announcements.value.length" icon="campaign" :title="t('business.announcements.empty')" :text="t('business.announcements.emptyText')" :action="t('business.announcements.new')" @action="annSheet = true" />
        <AnnouncementItem v-for="a in p.announcements.value" :key="a.id" :announcement="a" actions @remove="removeAnnouncement(a.id, a.title)" />
      </div>

      <div class="mt-5 rounded-[16px] bg-white p-3.5 flex items-start gap-2.5 text-[13.5px] text-muted">
        <AppIcon name="computer" :size="20" />
        <span>{{ t('business.panel.webOnly') }} <router-link :to="`/m/businesses/${p.me.value.business.id}`" class="text-ink font-semibold">{{ t('business.panel.openPublic') }}</router-link></span>
      </div>
    </template>

    <AppSheet v-model:open="eventSheet" :title="editing ? t('business.events.edit') : t('business.events.new')">
      <EventForm :key="formKey" :initial="editInitial" :saving="p.saving.value" compact
        :submit-label="editing ? t('business.form.save') : t('business.form.publish')" @submit="saveEvent" @cancel="eventSheet = false" />
    </AppSheet>
    <AppSheet v-model:open="codeSheet" :title="t('offers.codes.title')">
      <p class="text-[13.5px] text-muted m-0 mb-3">{{ t('offers.codes.subtitle') }}</p>
      <CodeValidator :validator="validator" compact @validated="onValidated" />
    </AppSheet>
    <AppSheet v-model:open="offerSheet" :title="editingOffer ? t('offers.biz.edit') : t('offers.biz.new')">
      <OfferForm :key="formKey" :initial="offerInitial" :saving="offers.saving.value" compact
        :submit-label="editingOffer ? t('offers.form.save') : t('offers.form.publish')" @submit="saveOffer" @cancel="offerSheet = false" />
    </AppSheet>
    <AppSheet v-model:open="annSheet" :title="t('business.announcements.new')">
      <AnnouncementForm :saving="p.saving.value" compact @submit="saveAnnouncement" @cancel="annSheet = false" />
    </AppSheet>
  </div>
</template>
