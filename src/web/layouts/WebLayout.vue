<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppButton } from '@/shared/components'
import LocaleSwitch from '@/shared/components/profile/LocaleSwitch.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { CONTACT_EMAIL } from '@/web/presentation'
import { routeTitle } from '@/router/guard'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t, locale } = useI18n()

// Site-ul de prezentare (T20): secțiunile prezentării + Comunitate. T23: un cont personal conectat (Vizitator / Localnic)
// vede în schimb paginile aplicației: evenimente, hartă, oferte, comunitate, contul meu.
const personal = computed(() => auth.user?.role === 'VISITOR' || auth.user?.role === 'LOCAL')
const topNav = computed(() => personal.value
  ? [
      { to: '/', label: t('nav.personal.home') },
      { to: '/events', label: t('nav.personal.events') },
      { to: '/map', label: t('nav.personal.map') },
      { to: '/offers', label: t('nav.personal.offers') },
      { to: '/community', label: t('nav.personal.community') },
      { to: '/account', label: t('nav.personal.account') },
    ]
  : [
      { to: '/#features', label: t('site.nav.features') },
      { to: '/community', label: t('site.nav.community') },
      { to: '/#panels', label: t('site.nav.panels') },
    ])
/** Titlul paginii din bara panoului, în limba curentă (se recalculează și când se schimbă limba). */
const pageTitle = computed(() => { void locale.value; return routeTitle(route) })
const navActive = (to: string) => !to.includes('#') && (to === '/' ? route.path === '/' : route.path.startsWith(to))

type NavItem = { to: string; icon: string; label: string; badge?: number }
type NavGroup = { title?: string; items: NavItem[] }

/** Panourile (design/final, web.html): sidebar întunecat pe grupuri. Adminul folosește panoul Primăriei + grupul „Administrare”.
 *  Paginile publice au doar bara de sus. */
const isPanel = computed(() => /^\/(business|city|admin)(\/|$)/.test(route.path))
const sidebar = computed<NavGroup[] | null>(() => {
  if (!isPanel.value) return null
  const n = (k: string) => t(`nav.sidebar.${k}`)
  if (route.path.startsWith('/business')) return [{ items: [
    { to: '/business', icon: 'space_dashboard', label: n('business.dashboard') }, { to: '/business/offers', icon: 'sell', label: n('business.offers') },
    { to: '/business/events', icon: 'calendar_month', label: n('business.events') }, { to: '/business/announcements', icon: 'campaign', label: n('business.announcements') },
    { to: '/business/codes', icon: 'qr_code_scanner', label: n('business.codes') }, { to: '/business/reviews', icon: 'reviews', label: n('business.reviews') },
    { to: '/business/profile', icon: 'storefront', label: n('business.profile') },
  ] }]
  const admin = auth.role === 'ADMIN'
  const groups: NavGroup[] = [
    { title: n('groups.general'), items: [
      { to: admin ? '/admin' : '/city', icon: 'space_dashboard', label: admin ? n('city.adminDashboard') : n('city.dashboard') },
      { to: '/city/events', icon: 'calendar_month', label: n('city.events') }, { to: '/city/places', icon: 'headphones', label: n('city.places') },
    ] },
    { title: n('groups.community'), items: [
      { to: '/city/actions', icon: 'volunteer_activism', label: n('city.actions') }, { to: '/city/validate', icon: 'fact_check', label: n('city.validate') },
      { to: '/city/volunteers', icon: 'badge', label: n('city.volunteers') },
      { to: '/city/leaderboard', icon: 'emoji_events', label: n('city.leaderboard') },
    ] },
    { title: n('groups.partners'), items: [{ to: '/city/partners', icon: 'storefront', label: n('city.partners') }] },
  ]
  if (admin) groups.push({ title: n('groups.admin'), items: [
    { to: '/admin/content', icon: 'rule_folder', label: n('admin.content') }, { to: '/admin/users', icon: 'group', label: n('admin.users') },
    { to: '/admin/settings', icon: 'settings', label: n('admin.settings') },
  ] })
  return groups
})
/** Pe ecrane sub lg (telefon, tabletă) sidebar-ul panourilor e un meniu care se deschide din bara de sus (☰); se închide la navigare. */
const menuOpen = ref(false)
watch(() => route.fullPath, () => { menuOpen.value = false })
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') menuOpen.value = false }
window.addEventListener('keydown', onKey)
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const isRoot = (to: string) => to === '/city' || to === '/admin' || to === '/business'
const isActive = (to: string) => route.path === to || (!isRoot(to) && route.path.startsWith(to + '/'))

const panelLink = computed(() => {
  switch (auth.role) {
    case 'BUSINESS': return { to: '/business', label: t('nav.business') }
    case 'CITY_HALL': return { to: '/city', label: t('nav.city') }
    case 'ADMIN': return { to: '/admin', label: t('nav.admin') }
    default: return null
  }
})

function logout() { auth.logout(); router.push('/') }

</script>

<template>
  <!-- Panouri: sidebar întunecat + topbar cu titlul paginii -->
  <div v-if="sidebar" class="min-h-dvh bg-abg flex">
    <!-- sub lg: fundal întunecat în spatele meniului deschis -->
    <div v-if="menuOpen" class="lg:hidden fixed inset-0 z-30 bg-black/40" aria-hidden="true" @click="menuOpen = false" />
    <aside class="w-[256px] shrink-0 bg-side text-sidetx flex flex-col gap-0.5 p-3.5 h-dvh overflow-y-auto fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0"
      :class="menuOpen ? 'translate-x-0' : '-translate-x-full'">
      <router-link to="/" class="flex items-center gap-2.5 px-2 py-2 mb-2 no-underline text-white">
        <span class="w-8 h-8 rounded-[10px] bg-accent flex items-center justify-center"><AppIcon name="location_city" :size="18" /></span>
        <span class="font-bold text-[15px]">{{ t('app.name') }}</span>
      </router-link>
      <template v-for="g in sidebar" :key="g.title ?? 'main'">
        <div v-if="g.title" class="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidetx/70">{{ g.title }}</div>
        <router-link v-for="s in g.items" :key="s.to" :to="s.to"
          class="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[14px] no-underline"
          :class="isActive(s.to) ? 'bg-side2 text-white font-semibold' : 'text-sidetx hover:text-white'">
          <AppIcon :name="s.icon" :size="20" /> {{ s.label }}
          <span v-if="s.badge" class="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-accent text-white text-[11.5px] font-bold flex items-center justify-center" data-test="nav-badge">{{ s.badge }}</span>
        </router-link>
      </template>
      <div class="flex-1" />
      <router-link to="/" class="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[14px] no-underline text-sidetx hover:text-white">
        <AppIcon name="public" :size="20" /> {{ t('nav.public') }}
      </router-link>
      <div v-if="auth.user" class="flex items-center gap-2.5 px-2 pt-3 mt-2 border-t border-side2">
        <span class="w-8 h-8 rounded-full bg-side2 text-white text-[12px] font-bold flex items-center justify-center">{{ auth.user.displayName.charAt(0) }}</span>
        <span class="flex-1 min-w-0 text-[13px] text-white font-semibold truncate">{{ auth.user.displayName }}</span>
        <button class="text-sidetx hover:text-white" :title="t('nav.logout')" @click="logout"><AppIcon name="logout" :size="18" /></button>
      </div>
    </aside>
    <div class="flex-1 min-w-0 flex flex-col">
      <header class="h-14 bg-white border-b border-line flex items-center gap-2 px-4 lg:px-7 text-[14px] font-semibold sticky top-0 z-[25]">
        <button type="button" class="lg:hidden w-10 h-10 -ml-2 rounded-[10px] flex items-center justify-center" :aria-label="t('nav.menu')" :aria-expanded="menuOpen" @click="menuOpen = true">
          <AppIcon name="menu" />
        </button>
        <span class="truncate flex-1">{{ pageTitle }}</span>
        <LocaleSwitch compact />
      </header>
      <main class="flex-1 min-w-0 px-4 py-5 lg:px-8 lg:py-7 max-w-[1280px] w-full">
        <router-view />
      </main>
    </div>
  </div>

  <!-- Site public: bară sus -->
  <div v-else class="min-h-dvh bg-bg flex flex-col">
    <header class="h-16 bg-white border-b border-line flex items-center px-4 md:px-7 gap-3 md:gap-7 sticky top-0 z-[25]">
      <router-link to="/" class="font-bold text-[16px] flex items-center gap-2 no-underline text-ink shrink-0">
        <img src="@/shared/assets/logo-ax.png" alt="AradExperience" class="h-[18px] w-auto shrink-0" /> {{ t('app.name') }}
      </router-link>
      <nav class="hidden gap-1 text-[14px] font-medium" :class="personal ? 'lg:flex' : 'md:flex'">
        <router-link v-for="n in topNav" :key="n.to" :to="n.to" class="no-underline h-9 px-3 rounded-[10px] inline-flex items-center whitespace-nowrap"
          :class="navActive(n.to) ? 'bg-soft text-ink font-semibold' : 'text-muted hover:text-ink'">{{ n.label }}</router-link>
      </nav>
      <div class="ml-auto flex items-center gap-2 md:gap-2.5 min-w-0">
        <LocaleSwitch compact />
        <router-link v-if="panelLink" :to="panelLink.to" class="text-[14px] font-semibold no-underline text-ink">{{ panelLink.label }}</router-link>
        <AppButton v-if="!auth.isLoggedIn" variant="ghost" size="sm" @click="router.push('/login')">{{ t('site.nav.login') }}</AppButton>
        <!-- contul: avatarul duce la profil (Contul meu) sau, pentru Primărie / firmă / Admin, la panou; „Deconectare” e în profil / panou -->
        <router-link v-else :to="personal ? '/account' : (panelLink?.to ?? '/')" class="flex items-center gap-2.5 no-underline text-ink min-w-0 rounded-full"
          :aria-label="personal ? t('nav.personal.account') : panelLink?.label" data-test="profile-link">
          <span class="w-10 h-10 rounded-full bg-ink text-white text-[15px] font-bold flex items-center justify-center shrink-0">{{ auth.user?.displayName.charAt(0) }}</span>
          <span class="text-[14px] font-semibold hidden xl:inline whitespace-nowrap">{{ auth.user?.displayName }}</span>
          <span class="text-[12px] text-muted hidden xl:inline whitespace-nowrap">· {{ t(`auth.role.${auth.user?.role}`) }}</span>
        </router-link>
        <router-link v-if="!personal" to="/#download" class="hidden sm:inline-flex h-10 px-4 rounded-[12px] bg-ink text-white text-[14px] font-semibold items-center gap-1.5 no-underline shrink-0">
          <AppIcon name="download" :size="18" /> {{ t('site.nav.download') }}
        </router-link>
      </div>
    </header>
    <!-- T23: pe telefon, navigația contului personal e un rând care se derulează sub bară -->
    <nav v-if="personal" class="lg:hidden flex gap-1 overflow-x-auto px-3 py-2 bg-white border-b border-line sticky top-16 z-10 [scrollbar-width:none] text-[14px] font-medium">
      <router-link v-for="n in topNav" :key="n.to" :to="n.to" class="no-underline h-9 px-3 rounded-[10px] inline-flex items-center whitespace-nowrap"
        :class="navActive(n.to) ? 'bg-soft text-ink font-semibold' : 'text-muted'">{{ n.label }}</router-link>
    </nav>
    <main class="flex-1 min-w-0 px-4 md:px-8 py-5 md:py-7 max-w-[1280px] mx-auto w-full">
      <router-view />
    </main>
    <footer class="border-t border-line bg-white">
      <div class="max-w-[1280px] mx-auto px-4 md:px-8 py-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-muted">
        <span class="font-bold text-ink flex items-center gap-2"><img src="@/shared/assets/logo-ax.png" alt="AradExperience" class="h-[18px] w-auto shrink-0" /> {{ t('app.name') }}</span>
        <router-link to="/privacy" class="no-underline text-muted hover:text-ink">{{ t('site.footer.privacy') }}</router-link>
        <router-link to="/terms" class="no-underline text-muted hover:text-ink">{{ t('site.footer.terms') }}</router-link>
        <a v-if="CONTACT_EMAIL" :href="`mailto:${CONTACT_EMAIL}`" class="no-underline text-muted hover:text-ink">{{ t('site.footer.contact') }}: {{ CONTACT_EMAIL }}</a>
        <span class="ml-auto">{{ t('site.footer.made') }}</span>
      </div>
    </footer>
  </div>
</template>
