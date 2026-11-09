# AradEx-Frontend — context pentru Claude Code

Frontend-ul AradExperience (Hack4Arad 2026): un singur repo Vue cu **două build-uri complet separate** (același backend), fără prefix în URL — **aplicația mobilă** (iOS + Android, are tot; tab bar) și **web-ul** (site-ul de prezentare al aplicației: prezentarea, Comunitate, Confidențialitate, login și panourile Primărie / firme / Admin cu sidebar; din T23, un cont personal conectat — Vizitator / Localnic, cu e-mail + parolă — vede pe web și paginile aplicației: evenimente + bilete, hartă cu transport, oferte, comunitate, contul meu) — peste același client API. Web-ul nu conține nimic din aplicația mobilă: alias-ul Vite `@app` arată spre `src/web/` (`npm run build`) sau `src/mobile/` (`npm run build:mobile`), iar `npm run check:web` verifică build-ul web. Repo în organizația HACK4ARAD, frate cu `AradEx-Plan` (planul comun), `AradEx-Backend`, `AradEx-Infrastructure` și `AradEx-Ops` (agenții Paperclip). **Citește întâi `../AradEx-Plan/CLAUDE.md`** (regulile echipei) ; `../AradEx-Plan/STRUCTURE.md` descrie toate repo-urile. Documentația e în `../AradEx-Plan/docs/`, designul în `../AradEx-Plan/design/`. Skill-urile (`fe-feature`, `task-workflow`, `review-pr`) sunt într-un singur loc: `../AradEx-Plan/.claude/skills/`.

## Citește înainte de orice task
1. `../AradEx-Plan/docs/PLAN.md` — task-ul curent (partea „FE”). 2. `../AradEx-Plan/docs/API.md` — contractul; `src/shared/types/<modul>.ts` îl oglindesc. 3. `../AradEx-Plan/docs/FEATURES.md` — regulile pe roluri și diferențele mobil vs web.
Design: **`../AradEx-Plan/design/final/`** — sursa de adevăr: `mobile.html` (aplicația, 36 de ecrane, cu Transport și Voluntar) și `web.html` (site public + panourile Primărie / Admin / Firmă, 37 de pagini), planșele în `design/final/screens/`, tabelul mobil / web în `design/final/README.md`. Prototipurile vechi din `design/` sunt doar istoric. Poze cu licență în `../AradEx-Plan/design/assets/`, copiate în `public/img/` (vezi `../AradEx-Plan/design/README.md`). Stil „Clean Ink” (valorile din `design/final/shared/ui.css`, deja în `base.css`): fundal `#FAFAF7`, ink `#111`, muted `#5C5C5C`, line `#E8E8E3`, accent `#FF5A36`, verde `#3B6D11` / închis `#1F3A12`, galben `#FFC244`, piersică `#FFE8E2`; panouri web cu sidebar întunecat `#0E0E10` pe fundal `#F6F6F3`; carduri albe radius 16, butoane negre radius 14; Inter + Material Symbols Outlined (fonturi locale în `public/fonts`).

## Stack aprobat
Vue 3.5 (Composition API, `<script setup lang="ts">`) · Vite 8 · TypeScript strict (`erasableSyntaxOnly`: fără `enum`, folosește union types / `as const`) · Pinia · Vue Router 4 · Tailwind CSS 4 (tokens în `src/shared/styles/base.css`, clase `bg-bg text-ink text-muted border-line bg-soft bg-accent bg-green bg-green-deep bg-yellow bg-peach`; panouri `bg-abg bg-side text-sidetx`) · vue-i18n · @vueuse/core · Google Maps JavaScript API (hartă, cheie `VITE_GOOGLE_MAPS_KEY`) + Leaflet ca rezervă fără cheie · OSRM (trasee) · qrcode (generare) · html5-qrcode (scanare) · vite-plugin-pwa · Capacitor 6 (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli` — aplicația Android, T15) · vitest + @vue/test-utils.
Fără UI kit-uri (Vuetify etc.), fără pachete de icon-uri, fără loader-e npm pentru Google Maps (scriptul oficial, din `useGoogleMaps`) — componentele de bază sunt ale noastre.

## Structură — aceleași „layere” ca în BE, pe feature
```
src/
  shared/                     tot ce e comun mobil + web (aici stă logica; mobile/ și web/ doar o așază pe ecran)
    types/<modul>.ts          DTO-urile din docs/API.md pe module: common, auth, business, places, events, tickets, offers, community,
                              chat, plan, admin, volunteer (api.ts doar le re-exportă — cod nou importă din fișierul modulului)
    api/                      client.ts (fetch wrapper: Bearer, ProblemDetail → ApiError, 401 → logout) + un fișier per interfață din BE,
                              toate create în T02: auth, health, places, events, tickets, business, offers, community, ai, admin, volunteer
    stores/                   stare globală (Pinia): auth.ts (token + user + rol, hasRole), ui.ts (toast); de adăugat doar ce e cu adevărat global
    composables/              logica de ecran, refolosibilă (= service): useFormat, useAuthForm, useBack, useGeo (T02); vin useRouteOsrm, useTts, useEvents(filters)…
    components/ui/            componente generice Clean Ink: AppButton, AppChip, AppCard, AppInput, AppIcon, AppSheet, AppToast, EmptyState, Skeleton, ApiStatus, PlaceholderScreen
    components/<feature>/     componente de feature, comune mobil + web: auth/LoginForm, qr/QrCode + QrScanner (T02); vin events/EventCard, offers/OfferCard,
                              community/ActionCard, places/PlaceCard + AudioGuideBar, map/MapView
    i18n/                     ro/<modul>.json + en/<modul>.json + hu/<modul>.json (fișierul = cheia de top: ro/events.json → t('events.…')), încărcate automat
    styles/base.css           tokens + bază Tailwind
  mobile/  layouts/MobileLayout.vue (tab bar)   views/<feature>/XView.vue (câte unul per rută)   components/home/ (tab-urile din Acasă), components/panel/ (/panel)
  web/     layouts/WebLayout.vue (bară + sidebar) views/<feature>/XView.vue (câte unul per rută; business-panel/, city/, admin/ = câte unul pe secțiune;
           legal/ = Confidențialitate)   components/site/ (secțiunile prezentării, T20)   presentation.ts (linkuri de descărcare, contact)
           T23: web/views/{events,tickets,map,offers,account,business}/ + community/{Action,Leaderboard}View = paginile aplicației pentru conturile
                              personale (rute cu `roles: ['VISITOR','LOCAL']`); places, plan, chat și transport rămân doar în aplicație
  router/                     mobile.ts / web.ts: rutele din API.md §Rute FE (fără prefix; o rută nouă se scrie fără /m sau /w), fiecare cu catch-all
                              → `/`; web.ts are și redirectul vechi /w/* → /* · guard.ts: guard-ul comun (login, meta.roles, titlu)
  mobile/router.ts · web/router.ts  routerul fiecărui build (importat prin `@app/router`); `shared/app.ts`: `APP` = 'web' | 'mobile' din build
public/                       manifest, icon-uri, fonturi, `_redirects` (nefolosit pe AWS), img/ (pozele din seed, copiate din ../AradEx-Plan/design/assets)
.github/workflows/deploy.yml   deploy pe AWS la push pe `main` (teste + build → imagine nginx în ECR → ECS); infrastructura: ../AradEx-Infrastructure
deploy/                       Dockerfile + nginx.conf ale imaginii de producție (fallback SPA, cache: `index.html`/`sw.js` fără cache, `assets/` imutabile)
```
Feature-urile (subfolderele) sunt aceleași ca în BE: `auth`, `home`, `events`, `tickets`, `places`, `map`, `offers`, `community`, `chat`, `plan` (itinerar), `profile`, `business`, `city`, `admin`. Testele stau lângă cod: `useFormat.test.ts`, `EventCard.test.ts`.

## Comenzi
```
npm install
npm run dev            # :5173 — web (prezentarea + panourile)
npm run dev:mobile     # :5174 — aplicația mobilă (doar local; pe site nu există)
npm run build          # web → dist/ (asta face deploy)        npm run check:web   # dist/ nu are voie să conțină nimic din aplicația mobilă
npm run build:mobile   # aplicația → dist-mobile/ (pentru Capacitor)
npm run test           # vitest
cp .env.example .env   # VITE_API_URL=http://localhost:8080/api/v1, VITE_DEMO=true
npm run android:run    # aplicația Android pe emulator/telefon (Capacitor; JDK 21 + Android SDK 34 — ../AradEx-Plan/docs/SETUP.md)
npm run cap:sync       # build:mobile + copiere în android/ (apoi `npm run android:open` → Android Studio)
```

## Reguli
- O view = o rută = un fișier în `views/<feature>/`. View-urile nu conțin logică de date: o iau din composables/store-uri și compun componente din `shared`. Dacă mobil și web au 80% același markup → componentă în `shared/components/<feature>/` folosită de amândouă (ex. `LoginForm`). O view nu importă altă view.
- Nu apela `fetch` direct în view-uri sau componente — doar prin `shared/api`. Nu scrie `/api/v1` în cod (vine din `VITE_API_URL`). Fără `any`; tipurile vin din `shared/types/<modul>.ts` și se schimbă în același task cu `docs/API.md`.
- Stări: fiecare listă are loading (`Skeleton`), empty (`EmptyState` cu text + acțiune) și error (toast cu `detail` din ProblemDetail + „Reîncearcă”). Niciodată ecran alb.
- Texte: `t('events.title')`, cheile în `shared/i18n/ro/<modul>.json` grupate pe ecran, diacritice corecte (ă â î ș ț). `en/<modul>.json` și `hu/<modul>.json` au **aceleași chei, traduse în engleză și în maghiară** (nu o copie a textului românesc): `shared/i18n/i18n.test.ts` verifică cheile și `{placeholder}`-ele în toate trei limbile. Limbile și numele lor sunt în `LOCALES` (`shared/i18n/index.ts`); alegerea limbii = `shared/components/profile/LocaleSwitch.vue` (listă derulantă; `compact` în bara de sus a web-ului). Titlurile paginilor: `nav.routes.<numele rutei>` (web) și `home.routes.<numele rutei>` (aplicație); datele/banii/punctele prin `useFormat` (urmează limba; `intlLocale()` pentru `Intl`).
- Formatare: `useFormat().date(startAt)` → „Sâm., 7 nov. · 11:00”; `.money(40)` → „40 lei”; `.km(0.4)` → „0,4 km”.
- Hartă: ecranele folosesc doar `shared/components/map/MapView` (Google Maps când există cheia, altfel Leaflet); doar `map/GoogleMapCanvas` folosește Google și doar `map/LeafletMapCanvas` importă Leaflet. QR: `QrCode` primește `value` (codul text `AX-…`); `QrScanner` emite `scanned(code)` și se oprește după prima citire. TTS: `useTts()` cu `speechSynthesis`, pornește doar la tap.
- Autentificare (T03): token în `localStorage` (`ax.token`), `authStore.user` din `/me` la pornire; 401 pe o cerere cu token → logout (+ login cu `?next=` dacă ruta cere cont). După login fiecare rol ajunge acasă la el (`homeFor` / `landingFor` din `shared/composables/useAuthForm`); limba se schimbă cu `auth.changeLocale`. Rutele au `meta.roles`.
- Mobil: conținut cu `pb-24` ca tab bar-ul să nu acopere butonul de jos; butonul principal fix jos. Web: panourile au sidebar întunecat 256px pe grupuri (Adminul vede panoul Primăriei + „Administrare”) + conținut max 1280px.
- **Web adaptiv (obligatoriu, decizia din 7 nov):** orice pagină web (prezentare, Comunitate, panouri) se folosește și pe telefon, la 390px, fără scroll orizontal pe pagină. Sub `lg` sidebar-ul panourilor e un meniu ☰ (`WebLayout`); sub `md` tabelele devin carduri pe rând (`md:hidden` cu cardurile + `hidden md:block` cu tabelul; model: `web/views/city/CityActionsView.vue`, clasa `MROW` din `web/components/community/panel.ts`); grilele trec pe o coloană, butoanele dintr-un rând se pot înfășura. Se verifică la 390×844 și la ≥1280 înainte de PR.

## Teste
- vitest pe composables cu logică (`useFormat`, `useAuthForm`, `useGeo` există; urmează totalul biletelor, filtrarea itinerarului) și pe componente cheie (`QrCode` randează SVG și `AppSheet` se închide cu Esc există; urmează `EventCard` cu badge-ul Popular), lângă fișierul testat.
- Nu testăm layout-uri. Ecranele se verifică manual din checklist-ul task-ului, pe 390×844 și ≥1280 (+ telefon real pentru cameră/TTS).

## Nu
- Nu pune chei API în FE (OpenAI e doar în BE). Nu duplica un ecran în `web/` copiind codul din `mobile/`. Nu adăuga librării fără motiv notat în descrierea PR-ului. Designul se modifică doar în `../AradEx-Plan/design/`.

## Culoare (4 oameni în paralel)
Din T02 fiecare rută are fișierul ei de view (`meta.task` din router spune al cui e) și fiecare modul are fișierele lui de texte, tipuri și API. Fiecare story lucrează **doar** în fișierele lui; `router/` (rutele, guard-ul), `mobile/router.ts`, `web/router.ts`, layout-urile, navigația, `client.ts`, `components/ui/`, `components/qr/`, `useGeo`, `i18n/index.ts` și fișierele index (`types/api.ts`, `api/index.ts`, `components/index.ts`), plus cochiliile `HomeView`, `LandingView`, `PanelView`, `AccountView`, sunt ale lui P1 și nu se mai ating (ce îți lipsește ceri în PR-ul lui P1). Poți importa orice, dar nu modifici fișierele altui story.

| Story | Fișierele tale (în `src/`) |
|---|---|
| T05 Locuri & ghid | `mobile/views/places/*`, `web/views/places/*`, `web/views/city/CityPlacesView.vue`, `shared/components/places/`, `types/places.ts`, `api/places.ts`, `i18n/*/places.json` |
| T06 Evenimente | `mobile/views/events/*`, `web/views/events/*`, `mobile/components/home/HomeEventsTab.vue`, `web/components/home/LandingEvents.vue`, `web/views/account/AccountSavedView.vue`, `web/views/city/CityEventsView.vue`, `shared/components/events/`, `types/events.ts`, `api/events.ts`, `i18n/*/events.json` |
| T07 Bilete | `mobile/views/tickets/*`, `web/views/account/AccountTicketsView.vue`, `shared/components/tickets/`, `types/tickets.ts`, `api/tickets.ts`, `i18n/*/tickets.json` |
| T08 Hartă | `mobile/views/map/*`, `web/views/map/*`, `web/components/home/LandingMap.vue`, `shared/components/map/`, `i18n/*/map.json` |
| T09 Firme | `mobile/views/business/*`, `web/views/business/*`, `mobile/components/panel/BusinessPanel.vue`, `web/views/business-panel/Biz{Dashboard,Events,Announcements,Profile}View.vue`, `shared/components/business/`, `types/business.ts`, `api/business.ts`, `i18n/*/business.json` |
| T10 Oferte | `mobile/views/offers/*`, `web/views/offers/*`, `mobile/components/home/HomeOffersTab.vue`, `web/views/business-panel/Biz{Offers,Codes}View.vue`, `web/views/account/AccountOffersView.vue`, `shared/components/offers/`, `types/offers.ts`, `api/offers.ts`, `i18n/*/offers.json`; în `BusinessPanel.vue` doar după ce T09 e pe `main` |
| T11 Comunitate | `mobile/views/community/*`, `web/views/community/*`, `mobile/components/home/HomeCommunityTab.vue`, `mobile/components/panel/CityPanel.vue`, `web/views/city/City{Dashboard,Actions,Validate,Leaderboard}View.vue`, `web/views/account/AccountPointsView.vue`, `shared/components/community/`, `types/community.ts`, `api/community.ts`, `i18n/*/community.json` |
| T12 Chat · T13 Planificator | `mobile/views/chat/*`, `web/views/chat/*` · `mobile/views/plan/*`, `web/views/plan/*`, `web/views/account/AccountItinerariesView.vue`; `types/chat.ts`, `types/plan.ts`, `api/ai.ts`, `i18n/*/chat.json`, `i18n/*/plan.json` |
| T14 Admin | `web/views/admin/*`, `web/views/city/CityPartnersView.vue`, `types/admin.ts`, `api/admin.ts`, `i18n/*/admin.json` |
| T18 Voluntari | `mobile/views/volunteer/*` (inclusiv chatul de grup al fiecărei acțiuni), `web/views/city/CityVolunteersView.vue` (Primăria nu are mesaje), `shared/components/volunteer/` (cardul acțiunii, rezultatul scanării, chatul de grup, contul), `web/components/volunteer/` (formularul „Voluntar nou”, bifele de acțiuni), `shared/composables/useVolunteer.ts`, `types/volunteer.ts`, `api/volunteer.ts`, `i18n/*/volunteer.json` (rutele `/vol/*` au `roles: ['VOLUNTEER']`, fără cont → `/vol/login`; în aplicație voluntarul e ținut în `/vol/*` de `router/guard.ts`) |
| T19 Transport | `mobile/views/transport/*`, `mobile/components/transport/*`, `shared/composables/useTripPlanner.ts` (planul, testat) + `useTransport.ts` (rețeaua CTP, destinațiile, planul cu plecări live), `shared/components/transit/LineBadge.vue`, `shared/data/transport/destinations.ts`, `i18n/*/transport.json` |

## Commit-uri
Mesaje scurte în engleză (`feat(events): list + filters`). **Fără `Co-Authored-By:` și fără „Generated with Claude Code”** — hook-ul din `.githooks` le scoate (`git config core.hooksPath .githooks`). Branch `feat/Txx-...` din `origin/main`, PR în acest repo; regulile complete: `../AradEx-Plan/CLAUDE.md`.
