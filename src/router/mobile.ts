import type { RouteRecordRaw } from 'vue-router'

/**
 * Aplicația mobilă (iOS + Android, Capacitor; build-ul `npm run build:mobile`): toate ecranele, fără prefix în URL. Vezi docs/API.md §Rute FE.
 * Fiecare rută are fișierul ei de view în `mobile/views/<feature>/`; story-ul din `meta.task` completează doar acel fișier.
 */
export const mobileRoutes: RouteRecordRaw[] = [
  {
    path: '/',
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
      // T18 · Voluntar (cont creat de Primărie, intră cu cod de 6 cifre); fără cont → /vol/login
      { path: 'vol/login', name: 'm-vol-login', component: () => import('@/mobile/views/volunteer/VolLoginView.vue'), meta: { title: 'Intră ca voluntar', task: 'T18', hideTabs: true } },
      { path: 'vol/actions', name: 'm-vol-actions', component: () => import('@/mobile/views/volunteer/VolActionsView.vue'), meta: { title: 'Acțiunile mele', task: 'T18', roles: ['VOLUNTEER'] } },
      { path: 'vol/scan', name: 'm-vol-scan', component: () => import('@/mobile/views/volunteer/VolScanView.vue'), meta: { title: 'Scanează', task: 'T18', roles: ['VOLUNTEER'] } },
      { path: 'vol/messages', name: 'm-vol-messages', component: () => import('@/mobile/views/volunteer/VolMessagesView.vue'), meta: { title: 'Mesaje', task: 'T18', roles: ['VOLUNTEER'] } },
    ],
  },
  // orice altă cale → Acasă
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
