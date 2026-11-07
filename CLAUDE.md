# AradEx-Frontend — context pentru Claude Code

Frontend-ul AradExperience (Hack4Arad 2026): o singură aplicație Vue cu două interfețe — **mobil** (`/m/*`, PWA, tab bar) și **web** (`/w/*`, bară sus + sidebar) — peste același client API. Repo în organizația HACK4ARAD, frate cu `AradEx-Plan` (planul comun), `AradEx-Backend`, `AradEx-Infrastructure` și `AradEx-Ops` (agenții Paperclip). **Citește întâi `../AradEx-Plan/CLAUDE.md`** (regulile echipei) ; `../AradEx-Plan/STRUCTURE.md` descrie toate repo-urile. Documentația e în `../AradEx-Plan/docs/`, designul în `../AradEx-Plan/design/`. Skill-urile (`fe-feature`, `task-workflow`, `review-pr`) sunt într-un singur loc: `../AradEx-Plan/.claude/skills/`.

## Citește înainte de orice task
1. `../AradEx-Plan/docs/PLAN.md` — task-ul curent (partea „FE”). 2. `../AradEx-Plan/docs/API.md` — contractul; `src/shared/types/api.ts` îl oglindește. 3. `../AradEx-Plan/docs/FEATURES.md` — regulile pe roluri și diferențele mobil vs web.
Design: **`../AradEx-Plan/design/final/`** — sursa de adevăr: `mobile.html` (aplicația, 36 de ecrane, cu Transport și Voluntar) și `web.html` (site public + panourile Primărie / Admin / Firmă, 37 de pagini), planșele în `design/final/screens/`, tabelul mobil / web în `design/final/README.md`. Prototipurile vechi din `design/` sunt doar istoric. Poze cu licență în `../AradEx-Plan/design/assets/`, copiate în `public/img/` (vezi `../AradEx-Plan/design/README.md`). Stil „Clean Ink” (valorile din `design/final/shared/ui.css`, deja în `base.css`): fundal `#FAFAF7`, ink `#111`, muted `#5C5C5C`, line `#E8E8E3`, accent `#FF5A36`, verde `#3B6D11` / închis `#1F3A12`, galben `#FFC244`, piersică `#FFE8E2`; panouri web cu sidebar întunecat `#0E0E10` pe fundal `#F6F6F3`; carduri albe radius 16, butoane negre radius 14; Inter + Material Symbols Outlined (fonturi locale în `public/fonts`).

## Stack aprobat
Vue 3.5 (Composition API, `<script setup lang="ts">`) · Vite 8 · TypeScript strict (`erasableSyntaxOnly`: fără `enum`, folosește union types / `as const`) · Pinia · Vue Router 4 · Tailwind CSS 4 (tokens în `src/shared/styles/base.css`, clase `bg-bg text-ink text-muted border-line bg-soft bg-accent bg-green bg-green-deep bg-yellow bg-peach`; panouri `bg-abg bg-side text-sidetx`) · vue-i18n · @vueuse/core · Leaflet (+ OSM, OSRM) · qrcode (generare) · html5-qrcode (scanare) · vite-plugin-pwa · Capacitor 6 (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli` — aplicația Android, T15) · vitest + @vue/test-utils.
Fără UI kit-uri (Vuetify etc.), fără Google Maps, fără pachete de icon-uri — componentele de bază sunt ale noastre.

## Structură — aceleași „layere” ca în BE, pe feature
```
src/
  shared/                     tot ce e comun mobil + web (aici stă logica; mobile/ și web/ doar o așază pe ecran)
    types/api.ts              DTO-urile din docs/API.md (= modulul api din BE); sursa de adevăr pentru tipuri
    api/                      client.ts (fetch wrapper: Bearer, ProblemDetail → ApiError, 401 → logout) + un fișier per interfață din BE:
                              auth.ts, health.ts, apoi events.ts, tickets.ts, places.ts, business.ts, offers.ts, community.ts, ai.ts, admin.ts
    stores/                   stare globală (Pinia): auth.ts (token + user + rol, hasRole), ui.ts (toast); de adăugat doar ce e cu adevărat global
    composables/              logica de ecran, refolosibilă (= service): useFormat (date/bani/km în ro); vin useGeo, useRouteOsrm, useTts, useEvents(filters)…
    components/ui/            componente generice Clean Ink: AppButton, AppChip, AppCard, AppInput, AppIcon, AppToast, EmptyState, Skeleton, ApiStatus, PlaceholderScreen (+ AppSheet)
    components/<feature>/     componente de feature, comune mobil + web: auth/LoginForm; vin events/EventCard, offers/OfferCard, community/ActionCard,
                              places/PlaceCard + AudioGuideBar, map/MapView, qr/QrCode + QrScanner
    i18n/                     ro.json, en.json (chei grupate pe ecran)
    styles/base.css           tokens + bază Tailwind
  mobile/  layouts/MobileLayout.vue (tab bar)   views/<feature>/XView.vue  (home/HomeView, auth/LoginView; restul PlaceholderView până la task-ul lor)
  web/     layouts/WebLayout.vue (bară + sidebar) views/<feature>/XView.vue  (home/LandingView, auth/LoginView; business/, city/, admin/ vin în task-uri)
  router/index.ts             toate rutele din API.md §Rute FE; meta.roles; `/` → /m sau /w după lățime; `?ui=m|w` forțează, se ține în localStorage
public/                       manifest, icon-uri, fonturi, `_redirects` (Netlify), img/ (pozele din seed, copiate din ../AradEx-Plan/design/assets)
```
Feature-urile (subfolderele) sunt aceleași ca în BE: `auth`, `home`, `events`, `tickets`, `places`, `map`, `offers`, `community`, `chat`, `plan` (itinerar), `profile`, `business`, `city`, `admin`. Testele stau lângă cod: `useFormat.test.ts`, `EventCard.test.ts`.

## Comenzi
```
npm install
npm run dev            # :5173 — /m mobil, /w web
npm run build          # vue-tsc + vite build + PWA
npm run test           # vitest
cp .env.example .env   # VITE_API_URL=http://localhost:8080/api/v1, VITE_DEMO=true
npm run android:run    # aplicația Android pe emulator/telefon (Capacitor; JDK 21 + Android SDK 34 — ../AradEx-Plan/docs/SETUP.md)
npm run cap:sync       # doar build + copiere în android/ (apoi `npm run android:open` → Android Studio)
```

## Reguli
- O view = o rută = un fișier în `views/<feature>/`. View-urile nu conțin logică de date: o iau din composables/store-uri și compun componente din `shared`. Dacă mobil și web au 80% același markup → componentă în `shared/components/<feature>/` folosită de amândouă (ex. `LoginForm`). O view nu importă altă view.
- Nu apela `fetch` direct în view-uri sau componente — doar prin `shared/api`. Nu scrie `/api/v1` în cod (vine din `VITE_API_URL`). Fără `any`; tipurile vin din `shared/types/api.ts` și se schimbă în același task cu `docs/API.md`.
- Stări: fiecare listă are loading (`Skeleton`), empty (`EmptyState` cu text + acțiune) și error (toast cu `detail` din ProblemDetail + „Reîncearcă”). Niciodată ecran alb.
- Texte: `t('events.title')`, cheile în `ro.json` grupate pe ecran, diacritice corecte (ă â î ș ț). `en.json` poate rămâne cu aceleași texte până la T15.
- Formatare: `useFormat().date(startAt)` → „Sâm., 7 nov. · 11:00”; `.money(40)` → „40 lei”; `.km(0.4)` → „0,4 km”.
- Hartă: `MapView` e singura componentă care importă Leaflet. QR: `QrCode` primește `value` (codul text `AX-…`); `QrScanner` emite `scanned(code)` și se oprește după prima citire. TTS: `useTts()` cu `speechSynthesis`, pornește doar la tap.
- Autentificare (T03): token în `localStorage` (`ax.token`), `authStore.user` din `/me` la pornire; 401 pe o cerere cu token → logout (+ login cu `?next=` dacă ruta cere cont). După login fiecare rol ajunge acasă la el (`homeFor` / `landingFor` din `shared/composables/useAuthForm`); limba se schimbă cu `auth.changeLocale`. Rutele au `meta.roles`.
- Mobil: conținut cu `pb-24` ca tab bar-ul să nu acopere butonul de jos; butonul principal fix jos. Web: panourile au sidebar întunecat 256px pe grupuri (Adminul vede panoul Primăriei + „Administrare”) + conținut max 1280px; paginile web rămân utilizabile pe telefon (fără scroll orizontal).

## Teste
- vitest pe composables cu logică (`useFormat` există; urmează totalul biletelor, filtrarea itinerarului) și pe componente cheie (`EventCard` randează badge-ul Popular, `QrCode` randează SVG), lângă fișierul testat.
- Nu testăm layout-uri. Ecranele se verifică manual din checklist-ul task-ului, pe 390×844 și ≥1280 (+ telefon real pentru cameră/TTS).

## Nu
- Nu pune chei API în FE (OpenAI e doar în BE). Nu duplica un ecran în `web/` copiind codul din `mobile/`. Nu adăuga librării fără motiv notat în descrierea PR-ului. Designul se modifică doar în `../AradEx-Plan/design/`.

## Culoare (4 oameni în paralel)
Fiecare story lucrează doar în fișierele feature-ului lui. După T02 fiecare rută are deja fișierul ei de view în `views/<feature>/`, iar textele, tipurile și clientul API sunt împărțite pe fișiere de modul (`shared/i18n/ro/<modul>.json`, `shared/types/<modul>.ts`, `shared/api/<modul>.ts`) — tu doar completezi fișierele tale; `router/index.ts`, layout-urile, navigația și `components/ui/` sunt ale lui P1. Poți importa componentele/composables altui culoar, dar nu le modifici.

## Commit-uri
Mesaje scurte în engleză (`feat(events): list + filters`). **Fără `Co-Authored-By:` și fără „Generated with Claude Code”** — hook-ul din `.githooks` le scoate (`git config core.hooksPath .githooks`). Branch `feat/Txx-...` din `origin/main`, PR în acest repo; regulile complete: `../AradEx-Plan/CLAUDE.md`.
