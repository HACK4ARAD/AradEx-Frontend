# Fără `/m` și `/w`: plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicația mobilă (nativă) și aplicația web (prezentare + panouri) rulează fiecare cu routerul ei, fără prefixele `/m` și `/w` în URL.

**Architecture:**
- `src/router/app.ts` alege aplicația o singură dată, la pornire: nativ → mobil; `?app=` (ținut minte); implicit web.
- `src/router/mobile.ts` și `src/router/web.ts` dau rutele fără prefix.
- `src/router/index.ts` creează routerul pentru aplicația aleasă și păstrează guard-ul.
- Linkurile `/m/…` și `/w/…` din cod devin `/…`.

**Tech Stack:** Vue 3.5, Vue Router 4, Capacitor 6, vitest.

**Spec:** `docs/superpowers/specs/2026-11-07-no-prefix-two-apps-design.md`

## Global Constraints
- Branch `feat/T20-no-prefix` în `AradEx-Frontend` (worktree `../_wt/AradEx-Frontend-T20`) și în `AradEx-Plan`.
- Commit-uri în engleză, fără `Co-Authored-By`.
- Numele rutelor rămân (`m-*`, `w-*`). Tipul `Ui = 'm' | 'w'` din `useAuthForm` rămâne și înseamnă „care aplicație”.
- `localStorage`: cheia nouă `ax.app` (`'mobile' | 'web'`); `ax.ui` nu se mai citește.
- Rutele web păstrate: `/`, `/community` (`w-community`), `/privacy` (`w-privacy`, nou), `/login`, `/business` (+ `offers/:sub?`, `events/:sub?`, `announcements/:sub?`, `codes`, `reviews`, `profile`), `/city` (+ `events/:sub?`, `places/:sub?`, `actions/:sub?`, `validate`, `volunteers/:sub?`, `messages`, `leaderboard`, `partners/:sub?`), `/admin` (+ `content`, `users`, `settings`).
- Mobil: toate rutele de acum de sub `/m`, cu aceleași meta.
- Linkurile vechi `/m/:rest*` și `/w/:rest*` redirecționează pe `/:rest*`.
- Comenzi: `npm run test`, `npm run build` (vue-tsc), `npm run dev`.

## Review Focus
1. **Login și `?next=`** în fiecare aplicație: după login, fiecare rol ajunge acasă la el. Un `next` cu prefix vechi (`/m/tickets`) trebuie să funcționeze.
2. **Rol greșit sau fără cont** pe o rută protejată: login-ul aplicației curente. Voluntarul ajunge pe `/vol/login`.
3. **Aplicația nativă cu `?app=web` ținut minte** în `localStorage`, de la un test vechi în WebView: nativul trebuie să fie mobil, oricum.
4. **Linkuri relative:** înlocuirea nu trebuie să atingă `/api/...`, URL-uri externe sau căi de imagini (`/img/...`).
5. **Componentele comune folosite în ambele aplicații:** linkul trebuie să ducă la o rută care există în aplicația curentă.

---

### Task 1: Selectorul de aplicație
**Files:** Create `src/router/app.ts`, `src/router/app.test.ts`.
**Produces:**
- `type AppKind = 'mobile' | 'web'`;
- `selectApp(opts: { native: boolean; search: string; storage?: Pick<Storage,'getItem'|'setItem'> }): AppKind`;
- `currentApp(): AppKind`, care memorează rezultatul la primul apel, din `Capacitor.isNativePlatform()`, `location.search` și `localStorage`;
- `uiOf(app): 'm' | 'w'`.
- [ ] **Teste** (eșuează întâi):
  - `native wins`: `{native: true, search: '?app=web'}` → `mobile`;
  - `query wins and is saved`: `?app=mobile` → `mobile`, iar `setItem('ax.app', 'mobile')` a fost apelat;
  - `saved value`: storage `ax.app=mobile` → `mobile`;
  - `default web`: → `web`;
  - `invalid ignored`: `?app=x` → `web`, fără `setItem`;
  - `storage throws`: tot funcționează și întoarce `web`.
- [ ] Implementare; `npm run test -- app` trece. Commit `feat(router): app selector (native → mobile, ?app=, default web)`.

### Task 2: Routerele fără prefix
**Files:** Create `src/router/mobile.ts`, `src/router/web.ts`, `src/router/router.test.ts`. Modify `src/router/index.ts`.
**Produces:**
- `mobileRoutes: RouteRecordRaw[]` (un layout `MobileLayout` la `/` cu copiii fără prefix);
- `webRoutes: RouteRecordRaw[]` (`/login` pagină întreagă + layout `WebLayout` la `/` cu landing și panouri);
- `routesFor(app): RouteRecordRaw[]` (adaugă redirecturile pentru căile vechi și catch-all-ul);
- `router` creat pentru `currentApp()`.
- [ ] **Teste** (eșuează întâi, cu `createRouter({ history: createMemoryHistory(), routes: routesFor(app) })`):
  - mobil `/events/1` → `m-event`, iar `/places/1` → `m-place`;
  - mobil `/vol/actions` are `roles: ['VOLUNTEER']`;
  - web `/city/places` → `w-city-places`, iar `/business` → `w-business`, ambele cu `meta.roles`;
  - web `/events/1` nu e rută (catch-all → `/`);
  - web `/community` → `w-community` și `/privacy` → `w-privacy`, ambele fără rol;
  - redirecturile `/m/tickets` → `/tickets` (mobil) și `/w/city` → `/city` (web);
  - web `/login` → `w-login`; mobil `/login` → `m-login`.
- [ ] **Implementare.** Mută rutele din `index.ts` fără să le schimbi meta-urile. Pe web rămân doar rutele din Global Constraints. Guard-ul:
  - `base = '/'`;
  - login = `/vol/login` pentru rutele de voluntar, altfel `/login`;
  - rol greșit → `/`;
  - `landingFor(role, uiOf(currentApp()), …)`.

  Scoate `preferredUi`, `UI_KEY` și redirectul după lățime.
- [ ] `npm run test` trece. Commit `feat(router): mobile and web routers without prefixes`.

### Task 3: `useAuthForm`, `auth` store, `useEvents`
**Files:** Modify `src/shared/composables/useAuthForm.ts`, `useAuthForm.test.ts`, `src/shared/stores/auth.ts`, `src/shared/composables/useEvents.ts`.
- [ ] **Testele `useAuthForm`** se schimbă întâi (să eșueze):
  - `homeFor('VOLUNTEER','m') === '/vol/actions'`;
  - `homeFor('BUSINESS','m') === '/panel'`;
  - `homeFor('VISITOR','m') === '/'`;
  - `homeFor('CITY_HALL','w') === '/city'`;
  - `homeFor('ADMIN','w') === '/admin'`;
  - `homeFor('VISITOR','w') === '/'`;
  - `safeNext('/tickets','m') === '/tickets'`;
  - `safeNext('/m/tickets','m') === '/tickets'` (prefix vechi);
  - `safeNext('https://evil','m') === null`;
  - `safeNext('/','m') === null` (pagina de start nu e destinație).
- [ ] **Implementare.** În `auth.ts` și `useEvents.ts`, `path.startsWith('/w')` devine `currentApp() === 'web'`, iar căile de login devin `/login`. Testele trec. Commit `refactor(auth): landing paths without prefixes`.

### Task 4: Linkurile din view-uri și componente
**Files:** toate fișierele `.vue` / `.ts` din `src/mobile`, `src/web`, `src/shared` cu `'/m…'`, `"/m…"`, `` `/m… ``, respectiv `/w` (în jur de 215 apariții, 48 de fișiere), plus testele cu linkuri (`EventCard.test.ts`, `PlaceCard.test.ts`).
- [ ] Un script (`scripts/strip-prefixes.mjs`, nu intră în repo) înlocuiește doar literalele de string / template care încep cu ghilimea + `/m/`, `/m'`, `/m"`, `` /m` ``, `/m?` (și echivalentul pentru `/w`), cu `/` corespunzător (`'/m'` → `'/'`, `'/m/x'` → `'/x'`). Nu atinge `/api`, `/img`, `/fonts`, URL-uri `http` (**Review Focus 4**).
- [ ] `grep` după rulare: zero literale care încep cu `/m/` sau `/w/` în `src/` (în afară de redirecturile din `router/`).
- [ ] Componentele comune folosite în ambele aplicații (`EventCardWeb`, `LoginForm`, `useBusiness`) le verifici de mână (**Review Focus 5**).
- [ ] `npm run test` și `npm run build` trec. Commit `refactor: links without /m and /w`.

### Task 5: Config, Confidențialitate, `CLAUDE.md`
**Files:** `src/web/views/legal/PrivacyView.vue` (nou; ce date colectează aplicația: cont, bilete, puncte, locația doar pe telefon pentru hartă și „lângă mine”, camera doar pentru scanarea QR, fără vânzarea datelor; contact; data actualizării), `capacitor.config.ts` (pornire `/`), `vite.config.ts` (`start_url: '/'`), `CLAUDE.md` (intro, structura `router/`, comenzile `npm run dev`, nota `?app=mobile`, tabelul de culoar: `/m/vol/*` → `/vol/*`, „paginile publice web nu mai sunt în router”).
- [ ] `npm run build` trece. Commit `chore: app entry points start at / ; claude.md`.

### Task 6: Verificare în browser
- [ ] `npm run dev` cu API-ul de producție (`VITE_API_URL=https://aradexperience.site/api/v1`).
  - **Web (1280):** `/` prezentarea; `/login`; `/city` → login cu `?next=/city`; `/events/1` → `/`; `/w/city` → `/city`.
  - **Mobil (`/?app=mobile`, 390×844):** `/` Acasă cu tab bar; `/places/1` ghidul; `/events/<id>`; `/tickets` → `/login?next=/tickets`; `/vol/actions` → `/vol/login`; `/m/places/1` → `/places/1`.
  - Fără erori în consolă.
- [ ] Notează rezultatul în PR.

### Task 7: Documentația din `AradEx-Plan`
**Files** (branch `feat/T20-no-prefix`):
- `docs/API.md` §Rute FE (două tabele, aplicația mobilă și web, fără prefixe);
- `docs/PLAN.md`: T02 (rutele), T20 (partea de rutare gata);
- `docs/FEATURES.md`, `docs/DEPLOY.md` (tabelul „Ce rulează unde”, `?app=mobile` pentru test), `docs/DEMO.md`;
- `docs/STATUS.md` (decizie + rândul T20 🟡);
- `CLAUDE.md`, `STRUCTURE.md`, `README.md`;
- `.claude/skills/fe-feature`, `task-workflow`.

Acceptanță: `grep` după `` `/m/ ``, `` `/w/ ``, `/m `, `/w ` în aceste fișiere → doar mențiuni istorice explicite.
- [ ] Commit `docs: routes without /m and /w (mobile app vs web)`.

### Task 8: PR-uri, merge, producție
- [ ] PR FE + PR Plan (descrieri cu ce s-a schimbat, verificarea, nota pentru colegi: „rutele noi se scriu fără prefix”).
- [ ] Merge FE (deploy), apoi Plan.
- [ ] **Pe `https://aradexperience.site`:** `/` prezentarea, `/login`, `/city` → login, `/?app=mobile` → Acasă mobil, `/places/1` (după `?app=mobile`) → ghidul.

### Task 9: Conținutul T20 (PR separat, branch `feat/T20-presentation`)
Secțiunea „Al doilea PR” din spec, pas cu pas:
- **Bara de sus** în `WebLayout`.
- **Prezentarea** în `LandingView` + `src/web/components/home/*`, iar linkurile de descărcare în `src/web/presentation.ts` (`DOWNLOAD_LINKS`).
- **Pagina `/community`.** Înainte, verifici în `AradEx-Plan/docs/STATUS.md` dacă T11 e gata (și cine o ține); dacă nu e, pagina arată „în curând”.
- **Testele:** randarea cardurilor de funcții și starea „în curând” la Comunitate.
- **Verificarea în browser** la 1280 și 390, apoi PR, merge și verificarea în producție.

### Task 10: Revizia 2, două build-uri separate (branch `feat/T20-separate-builds`)
- **Configurația:** `vite.config.ts` pe moduri (`web` implicit, `mobile`): alias `@app`, `define` `VITE_APP`, `outDir`, port, PWA doar pe web și doar ca `selfDestroying`.
- **Codul:**
  - `src/web/router.ts`, `src/mobile/router.ts`, `src/router/guard.ts`, `src/shared/app.ts` (`APP`, `UI`);
  - se șterg `src/router/app.ts`, `routes.ts` și `index.ts`;
  - `main.ts` folosește `@app/router`, fără Capacitor și fără înregistrarea PWA.
- **Testele:** `routes.test.ts` pe `webRoutes` și `mobileRoutes` (catch-all, `/w/…` pe web, fără `/m/…`); `app.test.ts` se șterge.
- **Panourile:** se scot butoanele de previzualizare (`CityPlacesView`, `CityEventsView`, `BizDashboardView`, `BizProfileView`).
- **Scripturile:** `dev:mobile`, `build:mobile`, `check:web` (`scripts/check-web-build.mjs`), `cap:sync` pe `build:mobile`; `capacitor.config.ts` cu `webDir: 'dist-mobile'`; `.gitignore`; `deploy.yml` rulează `npm run check:web` după build.
- **Docs:** FE `CLAUDE.md`, `README.md` și docs-urile din Plan.
