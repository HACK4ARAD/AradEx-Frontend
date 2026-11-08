import type { RouteLocation, RouteLocationRaw, RouteRecordRaw } from 'vue-router'
import type { Logins } from './guard'
import type { Role } from '@/shared/types/common'

/** Linkurile vechi de panou (`/w/city/…`, de exemplu din bookmark-uri) duc la aceeași cale fără prefix. */
function stripPrefix(to: RouteLocation): RouteLocationRaw {
  const rest = to.params.rest
  return { path: '/' + (Array.isArray(rest) ? rest.join('/') : (rest ?? '')), query: to.query, hash: to.hash }
}

/**
 * Web-ul (build-ul `npm run build`, aradexperience.site) = site-ul de prezentare al aplicației mobile + panourile (Primărie,
 * firme, Admin), fără prefix în URL. Nu conține nimic din aplicația mobilă (build separat, `npm run build:mobile`).
 */
/** Login-ul (W0): conturile personale (telefon + cod) și panourile. */
export const WEB_LOGINS: Logins = { names: ['w-login'] }

/** T23: paginile aplicației pe web, pentru conturile personale conectate (Adminul are voie peste tot). */
const PERSONAL: Role[] = ['VISITOR', 'LOCAL']

export const webRoutes: RouteRecordRaw[] = [
  // W0: pagină întreagă, fără WebLayout (ca în design/final/web.html)
  { path: '/login', name: 'w-login', component: () => import('@/web/views/auth/LoginView.vue'), meta: { title: 'Conectare', screen: 'W0', task: 'T03' } },
  {
    path: '/',
    component: () => import('@/web/layouts/WebLayout.vue'),
    children: [
      { path: '', name: 'w-landing', component: () => import('@/web/views/home/LandingView.vue'), meta: { title: 'Acasă', screen: 'W1', task: 'T20' } },
      { path: 'community', name: 'w-community', component: () => import('@/web/views/community/CommunityView.vue'), meta: { title: 'Comunitate', screen: 'W12', task: 'T11' } },
      { path: 'community/actions/:id', name: 'w-action', component: () => import('@/web/views/community/ActionView.vue'), meta: { title: 'Acțiune comunitară', screen: 'W12', task: 'T23' } },
      { path: 'community/leaderboard', name: 'w-leaderboard', component: () => import('@/web/views/community/LeaderboardView.vue'), meta: { title: 'Clasament', screen: 'W12', task: 'T23' } },
      // T13: pagina linkului „Trimite” din aplicație (publică, după codul de partajare)
      { path: 'itinerary/:code', name: 'w-itinerary', component: () => import('@/web/views/plan/ItineraryView.vue'), meta: { title: 'Itinerariu', screen: 'W10', task: 'T13' } },
      { path: 'businesses/:id', name: 'w-business-page', component: () => import('@/web/views/business/BusinessView.vue'), meta: { title: 'Firmă', screen: 'W15', task: 'T23' } },
      // T23 · web-ul pentru conturile personale conectate (ca în aplicație): evenimente + bilete, hartă, oferte, contul meu
      { path: 'events', name: 'w-events', component: () => import('@/web/views/events/EventsView.vue'), meta: { title: 'Evenimente', screen: 'W5', task: 'T23', roles: PERSONAL } },
      { path: 'events/:id', name: 'w-event', component: () => import('@/web/views/events/EventView.vue'), meta: { title: 'Eveniment', screen: 'W6', task: 'T23', roles: PERSONAL } },
      { path: 'events/:id/tickets', name: 'w-event-tickets', component: () => import('@/web/views/tickets/TicketPickView.vue'), meta: { title: 'Alege biletele', screen: 'W6', task: 'T23', roles: PERSONAL } },
      { path: 'checkout', name: 'w-checkout', component: () => import('@/web/views/tickets/CheckoutView.vue'), meta: { title: 'Plată', screen: 'W6', task: 'T23', roles: PERSONAL } },
      { path: 'confirm/:code', name: 'w-confirm', component: () => import('@/web/views/tickets/ConfirmView.vue'), meta: { title: 'Rezervarea e confirmată', screen: 'W6', task: 'T23', roles: PERSONAL } },
      { path: 'tickets', redirect: '/account/tickets' },
      { path: 'tickets/:code', name: 'w-ticket', component: () => import('@/web/views/tickets/TicketView.vue'), meta: { title: 'Bilet', screen: 'W14', task: 'T23', roles: PERSONAL } },
      { path: 'map', name: 'w-map', component: () => import('@/web/views/map/MapView.vue'), meta: { title: 'Hartă', screen: 'W9', task: 'T23', roles: PERSONAL } },
      { path: 'offers', name: 'w-offers', component: () => import('@/web/views/offers/OffersView.vue'), meta: { title: 'Oferte', screen: 'W11', task: 'T23', roles: PERSONAL } },
      { path: 'offers/:id', name: 'w-offer', component: () => import('@/web/views/offers/OfferView.vue'), meta: { title: 'Ofertă', screen: 'W11', task: 'T23', roles: PERSONAL } },
      {
        path: 'account', component: () => import('@/web/views/account/AccountView.vue'), meta: { roles: PERSONAL, screen: 'W14', task: 'T23' },
        children: [
          { path: '', redirect: '/account/tickets' },
          { path: 'tickets', name: 'w-account-tickets', component: () => import('@/web/views/account/AccountTicketsView.vue'), meta: { title: 'Biletele mele' } },
          { path: 'saved', name: 'w-account-saved', component: () => import('@/web/views/account/AccountSavedView.vue'), meta: { title: 'Salvate' } },
          { path: 'points', name: 'w-account-points', component: () => import('@/web/views/account/AccountPointsView.vue'), meta: { title: 'Puncte & înscrieri' } },
          { path: 'offers', name: 'w-account-offers', component: () => import('@/web/views/account/AccountOffersView.vue'), meta: { title: 'Ofertele mele' } },
          { path: 'settings', name: 'w-account-settings', component: () => import('@/web/views/account/AccountSettingsView.vue'), meta: { title: 'Setări' } },
        ],
      },
      { path: 'privacy', name: 'w-privacy', component: () => import('@/web/views/legal/PrivacyView.vue'), meta: { title: 'Confidențialitate', task: 'T20' } },
      { path: 'terms', name: 'w-terms', component: () => import('@/web/views/legal/TermsView.vue'), meta: { title: 'Termeni și condiții', task: 'GDPR' } },
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
  },
  { path: '/w/:rest(.*)*', redirect: stripPrefix },
  // orice altă cale → prezentarea
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
