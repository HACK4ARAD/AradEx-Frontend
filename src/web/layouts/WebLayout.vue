<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppButton } from '@/shared/components'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const { t, locale } = useI18n()

const topNav = computed(() => [
  { to: '/w/events', label: t('nav.events') },
  { to: '/w/map', label: t('nav.map') },
  { to: '/w/offers', label: t('nav.offers') },
  { to: '/w/community', label: t('nav.community') },
  { to: '/w/places', label: t('nav.places') },
])

type NavItem = { to: string; icon: string; label: string }
type NavGroup = { title?: string; items: NavItem[] }

/** Panourile (design/final, web.html): sidebar întunecat pe grupuri. Adminul folosește panoul Primăriei + grupul „Administrare”.
 *  Paginile publice au doar bara de sus. */
const isPanel = computed(() => /^\/w\/(business|city|admin)(\/|$)/.test(route.path))
const sidebar = computed<NavGroup[] | null>(() => {
  if (!isPanel.value) return null
  if (route.path.startsWith('/w/business')) return [{ items: [
    { to: '/w/business', icon: 'space_dashboard', label: 'Panou' }, { to: '/w/business/offers', icon: 'sell', label: 'Oferte' },
    { to: '/w/business/events', icon: 'calendar_month', label: 'Evenimente' }, { to: '/w/business/announcements', icon: 'campaign', label: 'Anunțuri' },
    { to: '/w/business/codes', icon: 'qr_code_scanner', label: 'Validează coduri' }, { to: '/w/business/reviews', icon: 'reviews', label: 'Recenzii' },
    { to: '/w/business/profile', icon: 'storefront', label: 'Profilul firmei' },
  ] }]
  const admin = auth.role === 'ADMIN'
  const groups: NavGroup[] = [
    { title: 'General', items: [
      { to: admin ? '/w/admin' : '/w/city', icon: 'space_dashboard', label: admin ? 'Dashboard' : 'Panou' },
      { to: '/w/city/events', icon: 'calendar_month', label: 'Evenimente' }, { to: '/w/city/places', icon: 'headphones', label: 'Obiective & ghiduri' },
    ] },
    { title: 'Comunitate', items: [
      { to: '/w/city/actions', icon: 'volunteer_activism', label: 'Acțiuni comunitare' }, { to: '/w/city/validate', icon: 'fact_check', label: 'Validare' },
      { to: '/w/city/volunteers', icon: 'badge', label: 'Voluntari' }, { to: '/w/city/messages', icon: 'forum', label: 'Mesaje' },
      { to: '/w/city/leaderboard', icon: 'emoji_events', label: 'Clasament' },
    ] },
    { title: 'Parteneri', items: [{ to: '/w/city/partners', icon: 'storefront', label: 'Firme partenere' }] },
  ]
  if (admin) groups.push({ title: 'Administrare', items: [
    { to: '/w/admin/content', icon: 'rule_folder', label: 'Conținut & moderare' }, { to: '/w/admin/users', icon: 'group', label: 'Utilizatori' },
    { to: '/w/admin/settings', icon: 'settings', label: 'Setări' },
  ] })
  return groups
})
const isRoot = (to: string) => to === '/w/city' || to === '/w/admin' || to === '/w/business'
const isActive = (to: string) => route.path === to || (!isRoot(to) && route.path.startsWith(to + '/'))

const panelLink = computed(() => {
  switch (auth.role) {
    case 'BUSINESS': return { to: '/w/business', label: t('nav.business') }
    case 'CITY_HALL': return { to: '/w/city', label: t('nav.city') }
    case 'ADMIN': return { to: '/w/admin', label: t('nav.admin') }
    default: return null
  }
})

function logout() { auth.logout(); router.push('/w') }

/** Selector RO/EN (T03): local imediat; pentru utilizatorul logat se salvează și în cont (auth.changeLocale). */
function toggleLocale() {
  auth.changeLocale(locale.value === 'ro' ? 'en' : 'ro').catch((e) => ui.error(e))
}
</script>

<template>
  <!-- Panouri: sidebar întunecat + topbar cu titlul paginii -->
  <div v-if="sidebar" class="min-h-dvh bg-abg flex">
    <aside class="w-[256px] shrink-0 bg-side text-sidetx flex flex-col gap-0.5 p-3.5 sticky top-0 h-dvh overflow-y-auto">
      <router-link to="/w" class="flex items-center gap-2.5 px-2 py-2 mb-2 no-underline text-white">
        <span class="w-8 h-8 rounded-[10px] bg-accent flex items-center justify-center"><AppIcon name="location_city" :size="18" /></span>
        <span class="font-bold text-[15px]">{{ t('app.name') }}</span>
      </router-link>
      <template v-for="g in sidebar" :key="g.title ?? 'main'">
        <div v-if="g.title" class="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidetx/70">{{ g.title }}</div>
        <router-link v-for="s in g.items" :key="s.to" :to="s.to"
          class="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[14px] no-underline"
          :class="isActive(s.to) ? 'bg-side2 text-white font-semibold' : 'text-sidetx hover:text-white'">
          <AppIcon :name="s.icon" :size="20" /> {{ s.label }}
        </router-link>
      </template>
      <div class="flex-1" />
      <router-link to="/w" class="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[14px] no-underline text-sidetx hover:text-white">
        <AppIcon name="public" :size="20" /> {{ t('nav.public') }}
      </router-link>
      <div v-if="auth.user" class="flex items-center gap-2.5 px-2 pt-3 mt-2 border-t border-side2">
        <span class="w-8 h-8 rounded-full bg-side2 text-white text-[12px] font-bold flex items-center justify-center">{{ auth.user.displayName.charAt(0) }}</span>
        <span class="flex-1 min-w-0 text-[13px] text-white font-semibold truncate">{{ auth.user.displayName }}</span>
        <button class="text-sidetx hover:text-white" :title="t('nav.logout')" @click="logout"><AppIcon name="logout" :size="18" /></button>
      </div>
    </aside>
    <div class="flex-1 min-w-0 flex flex-col">
      <header class="h-14 bg-white border-b border-line flex items-center px-7 text-[14px] font-semibold sticky top-0 z-20">{{ route.meta.title }}</header>
      <main class="flex-1 min-w-0 px-8 py-7 max-w-[1280px] w-full">
        <router-view />
      </main>
    </div>
  </div>

  <!-- Site public: bară sus -->
  <div v-else class="min-h-dvh bg-bg flex flex-col">
    <header class="h-16 bg-white border-b border-line flex items-center px-4 md:px-7 gap-3 md:gap-7 sticky top-0 z-20">
      <router-link to="/w" class="font-bold text-[16px] flex items-center gap-2 no-underline text-ink shrink-0">
        <span class="w-2.5 h-2.5 rounded-full bg-accent inline-block" /> {{ t('app.name') }}
      </router-link>
      <nav class="hidden md:flex gap-1 text-[14px] font-medium">
        <router-link v-for="n in topNav" :key="n.to" :to="n.to" class="no-underline h-9 px-3 rounded-[10px] inline-flex items-center"
          :class="route.path.startsWith(n.to) ? 'bg-soft text-ink font-semibold' : 'text-muted hover:text-ink'">{{ n.label }}</router-link>
      </nav>
      <div class="ml-auto flex items-center gap-2 md:gap-2.5 min-w-0">
        <button type="button" class="h-8 px-2.5 rounded-full border border-line text-[12px] font-semibold uppercase" :aria-label="t('profile.language')" @click="toggleLocale">
          {{ locale === 'ro' ? 'RO' : 'EN' }}
        </button>
        <router-link v-if="panelLink" :to="panelLink.to" class="text-[14px] font-semibold no-underline text-ink">{{ panelLink.label }}</router-link>
        <AppButton v-if="!auth.isLoggedIn" variant="ghost" size="sm" @click="router.push({ path: '/w/login', query: { next: route.fullPath } })">{{ t('nav.login') }}</AppButton>
        <template v-else>
          <span class="w-8 h-8 rounded-full bg-ink text-white text-[12px] font-bold flex items-center justify-center">{{ auth.user?.displayName.charAt(0) }}</span>
          <span class="text-[14px] font-semibold hidden md:inline">{{ auth.user?.displayName }}</span>
          <span class="text-[12px] text-muted hidden lg:inline">· {{ t(`auth.role.${auth.user?.role}`) }}</span>
          <AppButton variant="ghost" size="sm" icon="logout" @click="logout">{{ t('nav.logout') }}</AppButton>
        </template>
        <span class="hidden sm:inline-flex"><AppButton size="sm" icon="auto_awesome" @click="router.push('/w/plan')">{{ t('nav.plan') }}</AppButton></span>
      </div>
    </header>
    <main class="flex-1 min-w-0 px-4 md:px-8 py-5 md:py-7 max-w-[1280px] mx-auto w-full">
      <router-view />
    </main>
  </div>
</template>
