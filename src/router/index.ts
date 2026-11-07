import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import type { Role } from '@/shared/types/common'
import { useAuthStore } from '@/shared/stores/auth'
import { landingFor } from '@/shared/composables/useAuthForm'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    roles?: Role[]      // rute protejate: cine are voie (ADMIN are voie peste tot)
    screen?: string     // codul ecranului din design (S3, E1, W2…)
    task?: string       // task-ul din docs/PLAN.md
    hideTabs?: boolean  // mobil: ascunde tab bar-ul (login, checkout, scanner)
  }
}

const UI_KEY = 'ax.ui'

/**
 * Rutele mobile — vezi docs/API.md §Rute FE. Fiecare rută are deja fișierul ei de view în `views/<feature>/` (T02):
 * story-ul din `meta.task` completează doar acel fișier; acest fișier nu se mai modifică.
 */
const mobile: RouteRecordRaw = {
  path: '/m',
  component: () => import('@/mobile/layouts/MobileLayout.vue'),
  children: [
    { path: '', name: 'm-home', component: () => import('@/mobile/views/home/HomeView.vue'), meta: { title: 'Acasă', screen: 'S1/E6', task: 'T06' } },
    { path: 'login', name: 'm-login', component: () => import('@/mobile/views/auth/LoginView.vue'), meta: { title: 'Conectare', screen: 'S12', task: 'T03', hideTabs: true } },
    { path: 'search', name: 'm-search', component: () => import('@/mobile/views/events/SearchView.vue'), meta: { title: 'Caută', screen: 'S2', task: 'T06' } },
    { path: 'events/:id', name: 'm-event', component: () => import('@/mobile/views/events/EventView.vue'), meta: { title: 'Eveniment', screen: 'S3', task: 'T06' } },
    { path: 'events/:id/tickets', name: 'm-event-tickets', component: () => import('@/mobile/views/tickets/TicketPickView.vue'), meta: { title: 'Alege biletele', screen: 'S4', task: 'T07', roles: ['VISITOR', 'LOCAL', 'BUSINESS', 'CITY_HALL'] } },
    { path: 'checkout', name: 'm-checkout', component: () => import('@/mobile/views/tickets/CheckoutView.vue'), meta: { title: 'Plată', screen: 'S5', task: 'T07', hideTabs: true, roles: ['VISITOR', 'LOCAL', 'BUSINESS', 'CITY_HALL'] } },
    { path: 'confirm/:code', name: 'm-confirm', component: () => import('@/mobile/views/tickets/ConfirmView.vue'), meta: { title: 'Rezervarea e confirmată', screen: 'S6', task: 'T07', hideTabs: true } },
    { path: 'map', name: 'm-map', component: () => import('@/mobile/views/map/MapView.vue'), meta: { title: 'Hartă', screen: 'S7', task: 'T08' } },
    { path: 'chat', name: 'm-chat', component: () => import('@/mobile/views/chat/ChatView.vue'), meta: { title: 'Chat', screen: 'S8', task: 'T12' } },
    { path: 'tickets', name: 'm-tickets', component: () => import('@/mobile/views/tickets/TicketsView.vue'), meta: { title: 'Biletele mele', screen: 'S9', task: 'T07', roles: ['VISITOR', 'LOCAL'] } },
    { path: 'tickets/:code', name: 'm-ticket', component: () => import('@/mobile/views/tickets/TicketView.vue'), meta: { title: 'Bilet', screen: 'S10', task: 'T07', roles: ['VISITOR', 'LOCAL'] } },
    { path: 'saved', name: 'm-saved', component: () => import('@/mobile/views/events/SavedView.vue'), meta: { title: 'Salvate', screen: 'S1', task: 'T06' } },
    { path: 'profile', name: 'm-profile', component: () => import('@/mobile/views/profile/ProfileView.vue'), meta: { title: 'Profil', screen: 'S11', task: 'T03' } },
    { path: 'offers', name: 'm-offers', component: () => import('@/mobile/views/offers/OffersView.vue'), meta: { title: 'Oferte', screen: 'S1b', task: 'T10' } },
    { path: 'offers/:id', name: 'm-offer', component: () => import('@/mobile/views/offers/OfferView.vue'), meta: { title: 'Ofertă', screen: 'S1c', task: 'T10' } },
    { path: 'community', name: 'm-community', component: () => import('@/mobile/views/community/CommunityView.vue'), meta: { title: 'Comunitate', screen: 'S1d', task: 'T11' } },
    { path: 'community/actions/:id', name: 'm-action', component: () => import('@/mobile/views/community/ActionView.vue'), meta: { title: 'Acțiune comunitară', screen: 'S1e', task: 'T11' } },
    { path: 'community/leaderboard', name: 'm-leaderboard', component: () => import('@/mobile/views/community/LeaderboardView.vue'), meta: { title: 'Clasament', screen: 'S1f', task: 'T11' } },
    { path: 'places', name: 'm-places', component: () => import('@/mobile/views/places/PlacesView.vue'), meta: { title: 'Obiective', task: 'T05' } },
    { path: 'places/:id', name: 'm-place', component: () => import('@/mobile/views/places/PlaceView.vue'), meta: { title: 'Ghid virtual', screen: 'E3', task: 'T05' } },
    { path: 'plan', name: 'm-plan', component: () => import('@/mobile/views/plan/PlanView.vue'), meta: { title: 'Planifică-ți vizita', screen: 'E1', task: 'T13' } },
    { path: 'itineraries', name: 'm-itineraries', component: () => import('@/mobile/views/plan/ItinerariesView.vue'), meta: { title: 'Itinerariile mele', task: 'T13' } },
    { path: 'itinerary/:id', name: 'm-itinerary', component: () => import('@/mobile/views/plan/ItineraryView.vue'), meta: { title: 'Programul tău', screen: 'E2', task: 'T13' } },
    { path: 'itinerary/:id/map', name: 'm-itinerary-map', component: () => import('@/mobile/views/plan/ItineraryMapView.vue'), meta: { title: 'Traseul tău', screen: 'E4', task: 'T13', hideTabs: true } },
    { path: 'businesses/:id', name: 'm-business', component: () => import('@/mobile/views/business/BusinessView.vue'), meta: { title: 'Firmă', task: 'T09' } },
    { path: 'panel', name: 'm-panel', component: () => import('@/mobile/views/panel/PanelView.vue'), meta: { title: 'Panou', screen: 'E5/E7', task: 'T09/T11', roles: ['BUSINESS', 'CITY_HALL'] } },
    // T19 · Transport în comun (tab în navbar): destinație → trasee → hartă cu tot drumul
    { path: 'transport', name: 'm-transport', component: () => import('@/mobile/views/transport/TransportView.vue'), meta: { title: 'Transport în comun', task: 'T19' } },
    { path: 'transport/lines/:id/:dir', name: 'm-transport-line', component: () => import('@/mobile/views/transport/LineView.vue'), meta: { title: 'Linie de tramvai', task: 'T19' } },
    { path: 'transport/trip/:to', name: 'm-transport-trip', component: () => import('@/mobile/views/transport/TripView.vue'), meta: { title: 'Traseul tău', task: 'T19', hideTabs: true } },
    // T18 · Voluntar (cont creat de Primărie, intră cu cod de 6 cifre); fără cont → /m/vol/login
    { path: 'vol/login', name: 'm-vol-login', component: () => import('@/mobile/views/volunteer/VolLoginView.vue'), meta: { title: 'Intră ca voluntar', task: 'T18', hideTabs: true } },
    { path: 'vol/actions', name: 'm-vol-actions', component: () => import('@/mobile/views/volunteer/VolActionsView.vue'), meta: { title: 'Acțiunile mele', task: 'T18', roles: ['VOLUNTEER'] } },
    { path: 'vol/scan', name: 'm-vol-scan', component: () => import('@/mobile/views/volunteer/VolScanView.vue'), meta: { title: 'Scanează', task: 'T18', roles: ['VOLUNTEER'] } },
    { path: 'vol/messages', name: 'm-vol-messages', component: () => import('@/mobile/views/volunteer/VolMessagesView.vue'), meta: { title: 'Mesaje', task: 'T18', roles: ['VOLUNTEER'] } },
  ],
}

/** Rutele web. Panourile cer rol. */
const web: RouteRecordRaw = {
  path: '/w',
  component: () => import('@/web/layouts/WebLayout.vue'),
  children: [
    { path: '', name: 'w-landing', component: () => import('@/web/views/home/LandingView.vue'), meta: { title: 'Acasă', screen: 'W1', task: 'T06' } },
    { path: 'events', name: 'w-events', component: () => import('@/web/views/events/EventsView.vue'), meta: { title: 'Evenimente', screen: 'W1', task: 'T06' } },
    { path: 'events/:id', name: 'w-event', component: () => import('@/web/views/events/EventView.vue'), meta: { title: 'Eveniment', screen: 'S3', task: 'T06' } },
    { path: 'places', name: 'w-places', component: () => import('@/web/views/places/PlacesView.vue'), meta: { title: 'Obiective', task: 'T05' } },
    { path: 'places/:id', name: 'w-place', component: () => import('@/web/views/places/PlaceView.vue'), meta: { title: 'Ghid virtual', screen: 'E3', task: 'T05' } },
    { path: 'map', name: 'w-map', component: () => import('@/web/views/map/MapView.vue'), meta: { title: 'Hartă', screen: 'S7', task: 'T08' } },
    { path: 'plan', name: 'w-plan', component: () => import('@/web/views/plan/PlanView.vue'), meta: { title: 'Planifică-ți vizita', screen: 'E1/E2', task: 'T13' } },
    { path: 'offers', name: 'w-offers', component: () => import('@/web/views/offers/OffersView.vue'), meta: { title: 'Oferte', task: 'T10' } },
    { path: 'community', name: 'w-community', component: () => import('@/web/views/community/CommunityView.vue'), meta: { title: 'Comunitate', task: 'T11' } },
    { path: 'chat', name: 'w-chat', component: () => import('@/web/views/chat/ChatView.vue'), meta: { title: 'Chat', screen: 'W13', task: 'T12' } },
    // W14 · Contul meu: cochilie + câte o rută pe tab (fiecare view e al story-ului lui)
    {
      path: 'account', component: () => import('@/web/views/account/AccountView.vue'),
      meta: { title: 'Contul meu', screen: 'W14', roles: ['VISITOR', 'LOCAL', 'BUSINESS', 'CITY_HALL'] },
      children: [
        { path: '', name: 'w-account', redirect: '/w/account/tickets' },
        { path: 'tickets', name: 'w-account-tickets', component: () => import('@/web/views/account/AccountTicketsView.vue'), meta: { title: 'Biletele mele', task: 'T07' } },
        { path: 'saved', name: 'w-account-saved', component: () => import('@/web/views/account/AccountSavedView.vue'), meta: { title: 'Salvate', task: 'T06' } },
        { path: 'points', name: 'w-account-points', component: () => import('@/web/views/account/AccountPointsView.vue'), meta: { title: 'Punctele mele', task: 'T11' } },
        { path: 'offers', name: 'w-account-offers', component: () => import('@/web/views/account/AccountOffersView.vue'), meta: { title: 'Ofertele mele', task: 'T10' } },
        { path: 'itineraries', name: 'w-account-itineraries', component: () => import('@/web/views/account/AccountItinerariesView.vue'), meta: { title: 'Itinerariile mele', task: 'T13' } },
        { path: 'settings', name: 'w-account-settings', component: () => import('@/web/views/account/AccountSettingsView.vue'), meta: { title: 'Setări', task: 'T03' } },
      ],
    },
    { path: 'businesses/:id', name: 'w-business-public', component: () => import('@/web/views/business/BusinessView.vue'), meta: { title: 'Firmă', screen: 'W15', task: 'T09' } },
    // Panou firmă (W4): o rută + un view pe secțiune; `:sub?` = new / :id pentru formulare
    {
      path: 'business', meta: { roles: ['BUSINESS'], screen: 'W4' },
      children: [
        { path: '', name: 'w-business', component: () => import('@/web/views/business-panel/BizDashboardView.vue'), meta: { title: 'Panou firmă', task: 'T09' } },
        { path: 'offers/:sub?', name: 'w-business-offers', component: () => import('@/web/views/business-panel/BizOffersView.vue'), meta: { title: 'Oferte', task: 'T10' } },
        { path: 'events/:sub?', name: 'w-business-events', component: () => import('@/web/views/business-panel/BizEventsView.vue'), meta: { title: 'Evenimente', task: 'T09' } },
        { path: 'announcements/:sub?', name: 'w-business-announcements', component: () => import('@/web/views/business-panel/BizAnnouncementsView.vue'), meta: { title: 'Anunțuri', task: 'T09' } },
        { path: 'codes', name: 'w-business-codes', component: () => import('@/web/views/business-panel/BizCodesView.vue'), meta: { title: 'Validează coduri', task: 'T10' } },
        { path: 'reviews', name: 'w-business-reviews', component: () => import('@/web/views/business-panel/BizReviewsView.vue'), meta: { title: 'Recenzii', task: 'T17' } },
        { path: 'profile', name: 'w-business-profile', component: () => import('@/web/views/business-panel/BizProfileView.vue'), meta: { title: 'Profilul firmei', task: 'T09' } },
      ],
    },
    // Panou Primărie (W2), folosit și de Admin (ADMIN are voie peste tot)
    {
      path: 'city', meta: { roles: ['CITY_HALL'], screen: 'W2' },
      children: [
        { path: '', name: 'w-city', component: () => import('@/web/views/city/CityDashboardView.vue'), meta: { title: 'Panou Primărie', task: 'T11' } },
        { path: 'events/:sub?', name: 'w-city-events', component: () => import('@/web/views/city/CityEventsView.vue'), meta: { title: 'Evenimente', task: 'T06' } },
        { path: 'places/:sub?', name: 'w-city-places', component: () => import('@/web/views/city/CityPlacesView.vue'), meta: { title: 'Obiective & ghiduri', task: 'T05' } },
        { path: 'actions/:sub?', name: 'w-city-actions', component: () => import('@/web/views/city/CityActionsView.vue'), meta: { title: 'Acțiuni comunitare', task: 'T11' } },
        { path: 'validate', name: 'w-city-validate', component: () => import('@/web/views/city/CityValidateView.vue'), meta: { title: 'Validare', task: 'T11' } },
        { path: 'volunteers/:sub?', name: 'w-city-volunteers', component: () => import('@/web/views/city/CityVolunteersView.vue'), meta: { title: 'Voluntari', task: 'T18' } },
        { path: 'messages', name: 'w-city-messages', component: () => import('@/web/views/city/CityMessagesView.vue'), meta: { title: 'Mesaje', task: 'T18' } },
        { path: 'leaderboard', name: 'w-city-leaderboard', component: () => import('@/web/views/city/CityLeaderboardView.vue'), meta: { title: 'Clasament', task: 'T11' } },
        { path: 'partners/:sub?', name: 'w-city-partners', component: () => import('@/web/views/city/CityPartnersView.vue'), meta: { title: 'Firme partenere', task: 'T14' } },
      ],
    },
    // Administrare (W3): doar Admin
    {
      path: 'admin', meta: { roles: ['ADMIN'], screen: 'W3', task: 'T14' },
      children: [
        { path: '', name: 'w-admin', component: () => import('@/web/views/admin/AdminDashboardView.vue'), meta: { title: 'Administrare' } },
        { path: 'content', name: 'w-admin-content', component: () => import('@/web/views/admin/AdminContentView.vue'), meta: { title: 'Conținut & moderare' } },
        { path: 'users', name: 'w-admin-users', component: () => import('@/web/views/admin/AdminUsersView.vue'), meta: { title: 'Utilizatori' } },
        { path: 'settings', name: 'w-admin-settings', component: () => import('@/web/views/admin/AdminSettingsView.vue'), meta: { title: 'Setări' } },
      ],
    },
  ],
}

/** `/` → /m pe ecrane înguste, /w pe desktop; `?ui=m|w` forțează și se ține minte. Aplicația nativă (Capacitor) e mereu /m. */
function preferredUi(query: Record<string, unknown>): 'm' | 'w' {
  if (Capacitor.isNativePlatform()) return 'm'
  const forced = query.ui
  if (forced === 'm' || forced === 'w') {
    try { localStorage.setItem(UI_KEY, forced) } catch { /* ignore */ }
    return forced
  }
  try {
    const saved = localStorage.getItem(UI_KEY)
    if (saved === 'm' || saved === 'w') return saved
  } catch { /* ignore */ }
  return window.innerWidth < 768 ? 'm' : 'w'
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: (to) => ({ path: '/' + preferredUi(to.query as Record<string, unknown>), query: {} }) },
    mobile,
    // W0: pagină întreagă, fără WebLayout (ca în design/final/web.html)
    { path: '/w/login', name: 'w-login', component: () => import('@/web/views/auth/LoginView.vue'), meta: { title: 'Conectare', screen: 'W0', task: 'T03' } },
    web,
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()
  const ui = to.path.startsWith('/w') ? 'w' : 'm'
  const base = `/${ui}`
  // deja conectat → login-ul nu mai are rost: mergi unde voiai (?next=) sau acasă la rolul tău (pentru alt cont: Deconectare)
  if (auth.user && (to.name === 'm-login' || to.name === 'w-login' || to.name === 'm-vol-login')) {
    return landingFor(auth.user.role, ui, to.query.next, (p) => router.resolve(p).meta.roles)
  }
  const roles = to.meta.roles
  if (roles && roles.length) {
    if (!auth.isLoggedIn) {
      const login = roles.includes('VOLUNTEER') ? '/m/vol/login' : `${base}/login`
      return { path: login, query: { next: to.fullPath } }
    }
    if (!auth.hasRole(...roles)) return { path: base }
  }
  if (to.meta.title) document.title = `${to.meta.title} · AradExperience`
  return true
})
