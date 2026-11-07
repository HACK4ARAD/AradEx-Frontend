<script setup lang="ts">
// T06 · Salvate (din Profil) — design/final `/saved`: lista de EventCard sau starea goală.
import { onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import EventCard from '@/shared/components/events/EventCard.vue'
import { eventsApi } from '@/shared/api/events'
import { useSaveEvent } from '@/shared/composables/useEvents'
import { useGeo } from '@/shared/composables/useGeo'
import { useBack } from '@/shared/composables/useBack'
import { useUiStore } from '@/shared/stores/ui'
import { useAuthStore } from '@/shared/stores/auth'
import { useRouter } from 'vue-router'
import type { EventSummary } from '@/shared/types/events'

const { t } = useI18n()
const back = useBack('/profile')
const ui = useUiStore()
const auth = useAuthStore()
const router = useRouter()
const saver = useSaveEvent()
const geo = useGeo()
const items = shallowRef<EventSummary[]>([])
const loading = ref(true)

async function load() {
  if (!auth.isLoggedIn) { loading.value = false; return }
  loading.value = true
  try { items.value = await eventsApi.saved(geo.near()) } catch (err) { ui.error(err) } finally { loading.value = false }
}
async function toggle(e: EventSummary) {
  await saver.toggle(e, '/login')
  if (!e.saved) items.value = items.value.filter((x) => x.id !== e.id)
}
onMounted(load)
</script>

<template>
  <div class="flex items-center gap-1 -ml-2.5 pt-2 mb-3.5">
    <button type="button" class="w-11 h-11 rounded-full flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <h1 class="flex-1 text-[24px] font-semibold tracking-[-0.03em] m-0">{{ t('events.savedList.title') }}</h1>
  </div>
  <Skeleton v-if="loading" :rows="2" :height="300" />
  <template v-else-if="items.length">
    <EventCard v-for="e in items" :key="e.id" :event="e" :to="`/events/${e.id}`" @toggle-save="toggle(e)" />
  </template>
  <EmptyState v-else-if="!auth.isLoggedIn" icon="bookmark" :title="t('events.savedList.title')" :text="t('events.savedList.loginText')" :action="t('nav.login')"
    @action="router.push({ path: '/login', query: { next: '/saved' } })" />
  <EmptyState v-else icon="bookmark" :title="t('events.savedList.emptyTitle')" :text="t('events.savedList.emptyText')" />
</template>
