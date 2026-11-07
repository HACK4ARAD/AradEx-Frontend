<script setup lang="ts">
// T09 · Panou firmă · Evenimente (design/final web.html „Firmă · Evenimente”). `/business/events` = listă,
// `/events/new` = eveniment nou, `/events/:id` = editare. Ce publică firma apare în lista publică (T06) cu „Organizat de”.
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, EmptyState, Skeleton } from '@/shared/components'
import BusinessEventItem from '@/shared/components/business/BusinessEventItem.vue'
import EventForm from '@/shared/components/business/EventForm.vue'
import PanelHeader from '@/shared/components/business/PanelHeader.vue'
import UnverifiedBanner from '@/shared/components/business/UnverifiedBanner.vue'
import { fromEvent } from '@/shared/composables/useEventForm'
import { useBusinessPanel } from '@/shared/composables/useBusiness'
import type { EventCreate } from '@/shared/types/events'
import type { EventDto } from '@/shared/types/events'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const p = useBusinessPanel()

const sub = computed(() => String(route.params.sub ?? ''))
const editing = computed<EventDto | null>(() => (sub.value && sub.value !== 'new' ? p.events.value.find((e) => e.id === Number(sub.value)) ?? null : null))
const initial = computed(() => (editing.value ? fromEvent(editing.value) : undefined))

onMounted(p.load)

async function save(req: EventCreate) {
  const ok = editing.value
    ? await p.updateEvent(editing.value.id, req, t('business.events.saved'))
    : await p.createEvent(req, t('business.events.created'), t('business.events.createdDraft'))
  if (ok) router.push('/business/events')
}
async function remove(e: EventDto) {
  if (window.confirm(t('business.events.confirmDelete', { title: e.title }))) await p.deleteEvent(e.id, t('business.events.deleted'))
}
</script>

<template>
  <Skeleton v-if="p.loading.value" :rows="3" :height="80" />
  <EmptyState v-else-if="!p.me.value" icon="storefront" :title="t('business.loadError')" :action="t('common.retry')" @action="p.load" />
  <template v-else>
    <UnverifiedBanner v-if="!p.me.value.business.verified" />

    <!-- formular: nou / editare -->
    <template v-if="sub">
      <PanelHeader :title="sub === 'new' ? t('business.events.new') : t('business.events.edit')" />
      <EmptyState v-if="sub !== 'new' && !editing" icon="event_busy" :title="t('business.events.notFound')" :action="t('business.events.title')" @action="router.push('/business/events')" />
      <div v-else class="bg-white rounded-[20px] border border-line p-6 max-w-[760px]">
        <EventForm :key="sub" :initial="initial" :saving="p.saving.value"
          :submit-label="editing ? t('business.form.save') : t('business.form.publish')" @submit="save" @cancel="router.push('/business/events')" />
      </div>
    </template>

    <!-- listă -->
    <template v-else>
      <PanelHeader :title="t('business.events.title')" :subtitle="t('business.events.subtitle')">
        <AppButton size="sm" icon="add" @click="router.push('/business/events/new')">{{ t('business.events.new') }}</AppButton>
      </PanelHeader>
      <div v-if="!p.events.value.length" class="bg-white rounded-[16px] border border-line">
        <EmptyState icon="event" :title="t('business.events.empty')" :text="t('business.events.emptyText')" :action="t('business.events.new')" @action="router.push('/business/events/new')" />
      </div>
      <div class="flex flex-col gap-2.5 max-w-[960px]">
        <BusinessEventItem v-for="e in p.upcoming.value" :key="e.id" :event="e" actions @edit="router.push(`/business/events/${e.id}`)" @remove="remove(e)" />
      </div>
      <template v-if="p.past.value.length">
        <h2 class="text-[15px] text-muted font-semibold mt-6 mb-2.5">{{ t('business.events.past') }}</h2>
        <div class="flex flex-col gap-2.5 max-w-[960px] opacity-80">
          <BusinessEventItem v-for="e in p.past.value" :key="e.id" :event="e" />
        </div>
      </template>
    </template>
  </template>
</template>
