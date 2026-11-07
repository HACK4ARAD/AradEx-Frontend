<script setup lang="ts">
// W14 · Contul meu — cochilie (T02) după design/final `accountPage`: în stânga cardul utilizatorului + meniul, în dreapta tab-ul
// (fiecare tab e ruta și view-ul story-ului lui: Bilete T07 · Salvate T06 · Puncte T11 · Oferte T10 · Itinerarii T13 · Setări T03).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useAuthStore } from '@/shared/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const initials = computed(() => (auth.user?.displayName ?? '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase())
const menu = computed(() => [
  { to: '/account/tickets', icon: 'confirmation_number', label: t('nav.myTickets') },
  { to: '/account/saved', icon: 'bookmark', label: t('nav.saved') },
  ...(auth.user?.role === 'LOCAL' || auth.user?.role === 'ADMIN' ? [{ to: '/account/points', icon: 'volunteer_activism', label: t('nav.pointsAndRegistrations') }] : []),
  { to: '/account/offers', icon: 'sell', label: t('nav.myOffers') },
  { to: '/account/settings', icon: 'settings', label: t('nav.settings') },
])
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-6 items-start">
    <aside>
      <div class="bg-white border border-line rounded-[16px] p-[18px] flex items-center gap-3 mb-3">
        <span class="w-8 h-8 rounded-full bg-ink text-white text-[12px] font-bold flex items-center justify-center shrink-0">{{ initials }}</span>
        <div class="min-w-0"><b class="block truncate">{{ auth.user?.displayName }}</b><div class="text-muted text-[12px] truncate">{{ auth.user?.email }}</div></div>
      </div>
      <nav class="flex lg:flex-col gap-0.5 overflow-x-auto" :aria-label="t('nav.account')">
        <router-link v-for="m in menu" :key="m.to" :to="m.to" class="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] no-underline text-muted font-medium shrink-0"
          active-class="!bg-soft !text-ink !font-semibold"><AppIcon :name="m.icon" :size="18" />{{ m.label }}</router-link>
      </nav>
    </aside>
    <div class="min-w-0"><router-view /></div>
  </div>
</template>
