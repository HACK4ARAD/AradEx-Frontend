<script setup lang="ts">
// T06 · Salvate (din Profil) — design/final `/saved`: lista de EventCard sau starea goală.
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import EventCard from '@/shared/components/events/EventCard.vue'
import { useSavedEvents } from '@/shared/composables/useSavedEvents'
import { useBack } from '@/shared/composables/useBack'
import { useAuthStore } from '@/shared/stores/auth'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const back = useBack('/profile')
const auth = useAuthStore()
const router = useRouter()
/** Lista + scoaterea din Salvate: logica e comună cu web-ul (Contul meu › Salvate). */
const { items, loading, toggle } = useSavedEvents()
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
