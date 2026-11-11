<script setup lang="ts">
import { computed, watch } from 'vue'
import { useMyTickets } from '@/shared/composables/useTickets'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import DemoAccountBanner from '@/shared/components/auth/DemoAccountBanner.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { refreshVolunteerUnread, volunteerUnread } from '@/shared/composables/useVolunteer'

const route = useRoute()
const auth = useAuthStore()
const { t } = useI18n()

/** Tab bar (design/final): Evenimente · Chat · [Hartă] · Bilete/Panou · Transport. Firma și Primăria au „Panou” în loc de „Bilete”.
 *  Salvate e în Profil. Voluntarul (T18, rutele /vol/*) are doar Acțiuni · [Scanează] · Mesaje. */
const tabs = computed(() => {
  if (route.path.startsWith('/vol/') && route.path !== '/vol/login') return [
    { to: '/vol/actions', icon: 'event_available', label: t('nav.volActions'), match: (p: string) => p.startsWith('/vol/actions') },
    { to: '/vol/scan', icon: 'qr_code_scanner', label: t('nav.volScan'), center: true, match: (p: string) => p.startsWith('/vol/scan') },
    { to: '/vol/messages', icon: 'forum', label: t('nav.volMessages'), match: (p: string) => p.startsWith('/vol/messages') },
  ]
  const panel = auth.hasRole('BUSINESS', 'CITY_HALL')
  return [
    { to: '/', icon: 'calendar_month', label: t('nav.events'), match: (p: string) => p === '/' || p.startsWith('/search') || p.startsWith('/events') || p.startsWith('/offers') || p.startsWith('/community') || p.startsWith('/places') || p.startsWith('/businesses') },
    { to: '/chat', icon: 'chat_bubble', label: t('nav.chat'), match: (p: string) => p.startsWith('/chat') },
    { to: '/map', icon: 'map', label: t('nav.map'), center: true, match: (p: string) => p.startsWith('/map') },
    panel
      ? { to: '/panel', icon: 'dashboard', label: t('nav.panel'), match: (p: string) => p.startsWith('/panel') }
      : { to: '/tickets', icon: 'confirmation_number', label: t('nav.tickets'), match: (p: string) => p.startsWith('/tickets') },
    { to: '/transport', icon: 'tram', label: t('nav.transport'), match: (p: string) => p.startsWith('/transport') },
  ]
})
const hideTabs = computed(() => route.meta.hideTabs === true)
/** Punctul de pe „Bilete” (design/final): ai bilete viitoare și nu ești pe tab-ul lor (T07; lista se reîncarcă după o cumpărare). */
const myTickets = useMyTickets()
watch(() => [auth.user?.id, route.path === '/tickets' || route.path.startsWith('/confirm')], () => { if (auth.user && auth.user.role !== 'VOLUNTEER') void myTickets.load() }, { immediate: true })
/** T18: punctul de pe „Mesaje” al voluntarului (mesaje noi de la coordonator); se reîmprospătează la fiecare tab. */
watch(() => route.path, (p) => { if (auth.user?.role === 'VOLUNTEER' && p.startsWith('/vol/') && p !== '/vol/messages') void refreshVolunteerUnread() }, { immediate: true })
const hasUpcomingTickets = computed(() => !!auth.user && myTickets.upcoming.value.length > 0)
</script>

<template>
  <div class="min-h-dvh bg-bg flex flex-col mx-auto w-full max-w-[480px]">
    <main class="flex-1 px-5 pt-[max(12px,env(safe-area-inset-top))]" :class="hideTabs ? 'pb-10' : 'pb-[120px]'">
      <!-- cont demo public: fără date personale reale (se închide pentru sesiune) -->
      <DemoAccountBanner class="rounded-xl border mb-3" />
      <router-view />
    </main>

    <!-- design/final `.nav`: bară albă rotundă, plutitoare; tab-ul activ are „bula” gri și icon plin; Harta e cercul negru din mijloc -->
    <div v-if="!hideTabs" class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[110px] pointer-events-none z-30 bg-gradient-to-t from-bg from-40% to-transparent" />
    <nav v-if="!hideTabs" :aria-label="t('nav.aria')" class="fixed left-1/2 -translate-x-1/2 bottom-[max(22px,env(safe-area-inset-bottom))] w-[calc(100%-32px)] max-w-[448px] z-[35] h-[68px] grid items-center px-1.5 rounded-full bg-white border border-line shadow-[0_10px_30px_rgba(17,17,17,.10)]"
      :class="tabs.length === 3 ? 'grid-cols-3' : 'grid-cols-5'">
      <router-link v-for="tab in tabs" :key="tab.to" :to="tab.to" :aria-current="tab.match(route.path) ? 'page' : undefined"
        class="relative flex flex-col items-center gap-0.5 min-h-14 pt-[5px] text-[11px] leading-[1.15] text-center no-underline"
        :class="[tab.center ? '-mt-[30px] text-ink font-semibold' : tab.match(route.path) ? 'text-ink font-bold' : 'text-muted font-medium']">
        <span v-if="tab.center" class="w-[62px] h-[62px] rounded-full flex items-center justify-center text-white border-[5px] border-bg shadow-[0_10px_22px_rgba(17,17,17,.22)]"
          :class="tab.match(route.path) ? 'bg-accent' : 'bg-ink'">
          <AppIcon :name="tab.icon" :size="28" fill />
        </span>
        <span v-else class="relative w-[52px] h-8 rounded-full flex items-center justify-center" :class="tab.match(route.path) ? 'bg-soft' : ''">
          <AppIcon :name="tab.icon" :fill="tab.match(route.path)" />
          <span v-if="(tab.to === '/tickets' && hasUpcomingTickets || tab.to === '/vol/messages' && volunteerUnread > 0) && !tab.match(route.path)" class="absolute top-[3px] right-2 w-[9px] h-[9px] rounded-full bg-accent border-2 border-white" data-test="tab-dot" />
        </span>
        <span>{{ tab.label }}</span>
      </router-link>
    </nav>
  </div>
</template>
