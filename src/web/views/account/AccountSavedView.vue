<script setup lang="ts">
// T23 · W14 Contul meu › Salvate (design/final web `accountPage` tab „saved”): grid-ul cu evenimentele salvate (carduri web cu link
// spre detaliu și butonul de salvare, care scoate evenimentul din listă). Datele: `useSavedEvents` (comun cu Salvate din aplicație).
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { EmptyState, Skeleton } from '@/shared/components'
import EventCardWeb from '@/shared/components/events/EventCardWeb.vue'
import { useSavedEvents } from '@/shared/composables/useSavedEvents'

const { t } = useI18n()
const router = useRouter()
const { items, loading, error, load, toggle } = useSavedEvents()
</script>

<template>
  <h2 class="text-[22px] font-semibold tracking-[-0.02em] m-0 mb-3.5">{{ t('events.savedList.title') }}</h2>
  <Skeleton v-if="loading" :rows="2" :height="220" />
  <EmptyState v-else-if="error && !items.length" icon="cloud_off" :title="error" :action="t('common.retry')" @action="load" />
  <div v-else-if="items.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
    <EventCardWeb v-for="e in items" :key="e.id" :event="e" :to="`/events/${e.id}`" saveable @toggle-save="toggle(e)" />
  </div>
  <EmptyState v-else icon="bookmark" :title="t('events.savedList.emptyTitle')" :text="t('events.savedList.emptyText')"
    :action="t('tickets.mine.find')" @action="router.push('/events')" />
</template>
