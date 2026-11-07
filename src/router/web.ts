import type { RouteRecordRaw } from 'vue-router'

/**
 * Aplicația web = site-ul de prezentare al aplicației mobile + panourile (Primărie, firme, Admin), fără prefix în URL.
 * Paginile publice ale aplicației (agendă, ghid, hartă, oferte, chat, cont…) sunt doar în aplicația mobilă.
 */
export const webRoutes: RouteRecordRaw[] = [
  // W0: pagină întreagă, fără WebLayout (ca în design/final/web.html)
  { path: '/login', name: 'w-login', component: () => import('@/web/views/auth/LoginView.vue'), meta: { title: 'Conectare', screen: 'W0', task: 'T03' } },
  {
    path: '/',
    component: () => import('@/web/layouts/WebLayout.vue'),
    children: [
      { path: '', name: 'w-landing', component: () => import('@/web/views/home/LandingView.vue'), meta: { title: 'Acasă', screen: 'W1', task: 'T20' } },
      { path: 'community', name: 'w-community', component: () => import('@/web/views/community/CommunityView.vue'), meta: { title: 'Comunitate', screen: 'W12', task: 'T11' } },
      { path: 'privacy', name: 'w-privacy', component: () => import('@/web/views/legal/PrivacyView.vue'), meta: { title: 'Confidențialitate', task: 'T20' } },
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
  },
]
