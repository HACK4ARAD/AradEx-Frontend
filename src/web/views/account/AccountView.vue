<script setup lang="ts">
// W14 · Contul meu: cochilie (T02) cu tab-uri; fiecare tab e ruta și view-ul story-ului lui
// (Bilete T07 · Salvate T06 · Puncte T11 · Oferte T10 · Itinerarii T13 · Setări T03).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/shared/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const tabs = computed(() => [
  { to: '/w/account/tickets', label: t('nav.tickets') },
  { to: '/w/account/saved', label: t('nav.saved') },
  ...(auth.user?.role === 'LOCAL' || auth.user?.role === 'ADMIN' ? [{ to: '/w/account/points', label: t('nav.points') }] : []),
  { to: '/w/account/offers', label: t('nav.offers') },
  { to: '/w/account/itineraries', label: t('nav.itineraries') },
  { to: '/w/account/settings', label: t('nav.settings') },
])
</script>

<template>
  <h1 class="text-[32px] font-semibold tracking-[-0.025em] leading-tight m-0 mb-1">{{ t('nav.account') }}</h1>
  <div class="text-muted text-[14px] mb-4">{{ auth.user?.displayName }} · {{ auth.user?.email }}</div>
  <nav class="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
    <router-link v-for="x in tabs" :key="x.to" :to="x.to"
      class="shrink-0 h-9 px-4 rounded-full border border-line text-[14px] font-semibold no-underline flex items-center text-ink bg-white"
      active-class="!bg-ink !text-white !border-ink">{{ x.label }}</router-link>
  </nav>
  <router-view />
</template>
