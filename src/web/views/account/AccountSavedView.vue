<script setup lang="ts">
// T06 · Contul meu › Salvate — design/final: titlu + grid de EventCardWeb.
import { onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { EmptyState, Skeleton } from '@/shared/components'
import EventCardWeb from '@/shared/components/events/EventCardWeb.vue'
import { eventsApi } from '@/shared/api/events'
import { useGeo } from '@/shared/composables/useGeo'
import { useUiStore } from '@/shared/stores/ui'
import type { EventSummary } from '@/shared/types/events'

const { t } = useI18n()
const ui = useUiStore()
const geo = useGeo()
const items = shallowRef<EventSummary[]>([])
const loading = ref(true)
onMounted(async () => {
  try { items.value = await eventsApi.saved(geo.near()) } catch (err) { ui.error(err) } finally { loading.value = false }
})
</script>

<template>
  <h2 class="text-[20px] font-semibold tracking-[-0.02em] m-0">{{ t('events.savedList.title') }}</h2>
  <Skeleton v-if="loading" :rows="2" :height="200" class="mt-3.5" />
  <div v-else-if="items.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-3.5"><EventCardWeb v-for="e in items" :key="e.id" :event="e" /></div>
  <EmptyState v-else icon="bookmark" :title="t('events.savedList.emptyTitle')" :text="t('events.savedList.emptyText')" class="mt-3.5" />
</template>
