# Fără `/m` și `/w`: aplicația mobilă și aplicația web, fiecare cu routerul ei

**Data:** 7 nov 2026 · **Owner:** Zoltan (P1) · **Story:** T20 (partea de rutare) · **Stare:** design aprobat în discuție.

## Ce vrem
Două produse diferite din același cod Vue, **fără prefixe în URL**:
- **Aplicația mobilă** (iOS + Android, Capacitor) are **toate** ecranele pentru vizitator, localnic și voluntar, plus operațiunile de teren ale firmei și ale Primăriei (`/panel`).
- **Aplicația web** (`https://aradexperience.site`) e **site-ul de prezentare al aplicației mobile**: prezentarea, Comunitate (doar de citit), Confidențialitate, login-ul și panourile Primăriei, firmelor și Adminului.

Ce nu se schimbă: decizia din `AradEx-Plan` #10 (produsul e aplicația mobilă), API-ul, infrastructura (nginx face fallback SPA pe orice cale) și conținutul ecranelor.

## Cum (varianta A, aprobată): un build, două routere alese la pornire
`src/router/app.ts` decide o singură dată, la pornire, ce aplicație rulează:
1. aplicație nativă (`Capacitor.isNativePlatform()`) → **mobile**;
2. altfel, `?app=mobile` / `?app=web` în URL câștigă și se ține minte în `localStorage` (`ax.app`), pentru test în browser (de exemplu audio-ul T05 pe Chrome Android) și pentru dev;
3. altfel, valoarea ținută minte;
4. altfel → **web**.

Înlocuiește `?ui=m|w`, cheia `ax.ui` și alegerea după lățimea ecranului.

`src/router/mobile.ts` și `src/router/web.ts` exportă câte o listă de rute fără prefix, sub layout-ul aplicației. `src/router/index.ts` creează routerul din lista aplicației alese și aplică același guard: login, roluri, titlu.

| Mobil (`MobileLayout`) | Web |
|---|---|
| `/` Acasă · `/login` · `/search` · `/events/:id` · `/events/:id/tickets` · `/checkout` · `/confirm/:code` · `/map` · `/chat` · `/tickets` · `/tickets/:code` · `/saved` · `/profile` · `/offers` · `/offers/:id` · `/community` · `/community/actions/:id` · `/community/leaderboard` · `/places` · `/places/:id` · `/plan` · `/itineraries` · `/itinerary/:id` · `/itinerary/:id/map` · `/businesses/:id` · `/panel` · `/transport` · `/transport/lines/:id/:dir` · `/transport/trip/:to` · `/vol/login` · `/vol/actions` · `/vol/scan` · `/vol/messages` | `/` prezentarea (`LandingView`, în `WebLayout`) · `/community` Comunitate, doar de citit (`w-community`, view-ul T11) · `/privacy` Confidențialitate (`w-privacy`, pagină nouă, cerută de magazine pentru cameră și locație) · `/login` (W0, pagină întreagă) · `/business/*` (panoul firmei, 7 secțiuni) · `/city/*` (panoul Primăriei, 9 secțiuni) · `/admin/*` (4 secțiuni) |

Numele rutelor rămân (`m-*`, `w-*`), ca `router.push({ name })` să nu se strice.

**Ies din routerul web** paginile publice care nu se mai fac (Plan #10): evenimente, eveniment, locuri, loc, hartă, plan, oferte, chat, „Contul meu” (W14, cu tab-urile) și pagina publică a firmei (W15). Fișierele lor rămân în repo, nelegate de router, pentru că sunt ale story-urilor. Ștergerea lor e o decizie separată. Orice cale necunoscută duce la `/` în aplicația respectivă.

## Codul care depindea de prefix
- `shared/composables/useAuthForm.ts` (`homeFor`, `safeNext`, `landingFor`): același contract (`ui: 'm' | 'w'` rămâne ca tip, „care aplicație”), dar căi fără prefix:
  - mobil: `VOLUNTEER` → `/vol/actions`, `BUSINESS` / `CITY_HALL` → `/panel`, restul → `/`;
  - web: `/business`, `/city`, `/admin`, restul → `/`.
- `shared/stores/auth.ts` și `shared/composables/useEvents.ts` află aplicația din `currentApp()`, nu din `path.startsWith('/w')`.
- **Linkurile din view-uri și componente** (în jur de 215, în aproximativ 48 de fișiere): `'/m/…'` și `'/w/…'` devin `'/…'`, iar `'/m'` și `'/w'` devin `'/'`. Linkurile din web spre pagini publice scoase ajung, prin catch-all, pe `/`. Conținutul nou al prezentării e restul T20.
- **Configurația:** `capacitor.config.ts` și manifestul PWA (`start_url`) pornesc pe `/`.

## Erori și cazuri limită
- Un link vechi `/m/...` sau `/w/...` (de exemplu un bookmark) e redirecționat pe același drum fără prefix, ca nimic să nu ducă în gol.
- **Web, rută cu rol, fără cont:** `/login?next=…`. **Mobil:** `/login`, iar pentru rutele de voluntar `/vol/login`.
- **Rol greșit:** `/` al aplicației.
- `?app=` cu altă valoare decât `mobile` / `web` se ignoră.

## Verificare
- **Teste:**
  - `app.test.ts`: nativ → mobile; `?app=` câștigă și se ține minte; valoarea ținută minte; implicit web; valoare invalidă ignorată;
  - `router.test.ts`: rezolvarea rutelor în fiecare aplicație (mobil `/events/1` → `m-event`; web `/city` → `w-city` cu rol; web `/events/1` → nu e rută); redirectul `/m/x` → `/x`;
  - `useAuthForm.test.ts` (actualizat);
  - testele existente care aveau linkuri.
- `npm run build` (vue-tsc) și `npm run test` verzi.
- **În browser** (390×844 și 1280): web `/` → prezentarea, `/login`, `/city` → login → panou; mobil (`?app=mobile`) `/`, `/places/1`, `/events/…`, `/tickets` → login, tab bar-ul. Fără `/m` / `/w` în niciun URL.
- **În producție, după merge:** aceleași verificări pe `https://aradexperience.site`.

## Documentație (PR în `AradEx-Plan`, același branch)
- `docs/API.md` §Rute FE: două tabele, fără prefixe.
- `docs/PLAN.md` (T02, T20), `docs/FEATURES.md`, `docs/DEPLOY.md`, `docs/DEMO.md`, `docs/STATUS.md` (decizie + T20).
- `CLAUDE.md`, `STRUCTURE.md`, `README.md`; skill-urile `fe-feature` și `task-workflow`.
- Plus `AradEx-Frontend/CLAUDE.md`, inclusiv tabelul de culoare, în PR-ul FE.

## Al doilea PR: conținutul T20 (aprobat 7 nov)
După PR-ul de rutare, un PR separat cu conținutul site-ului:
- **Bara de sus** (`WebLayout`, în afara panourilor): Funcții · Comunitate · Pentru firme & Primărie · **Descarcă aplicația** · Intră în panou.
- **`/` prezentarea**, în ordine:
  1. hero „Tot Aradul într-o aplicație”, cu butoanele Android / iOS și capturi din aplicație;
  2. „Ce poți face”: 6 carduri (evenimente și bilete, ghid virtual audio, oferte locale, comunitate și puncte, transport în comun, asistent AI și plan de vizită);
  3. „Acum în Arad”: 3 evenimente reale din API, doar de privit, cu „Vezi în aplicație”;
  4. o bandă Comunitate (următoarea acțiune și top 3) cu link spre `/community`;
  5. „Pentru cine” (vizitator, localnic, firmă, Primărie, voluntar);
  6. „Ești Primărie sau firmă? Intră în panou” → `/login`;
  7. subsol cu contact, Confidențialitate și Hack4Arad 2026.
- **`/community`**: acțiunile care urmează (dată, loc, +puncte, locuri libere) și clasamentul lunii. „Mă înscriu” → „Descarcă aplicația”. Dacă API-ul T11 nu e gata, pagina arată „în curând”.
- **Linkurile de descărcare** stau într-o singură constantă, completată când există APK-ul sau linkurile din magazine (T15).

## În afara scopului
Ștergerea fișierelor view nefolosite, build-uri separate (varianta B).

## Revizia 2 (7 nov, după #16/#17): web și mobil complet separate
Decizia lui Zoltan: web-ul e doar un site de prezentare despre aplicația mobilă (care e produsul principal). Web-ul nu are funcționalitățile aplicației și **nu conține nimic din ea**; backend-ul e același. Înlocuiește alegerea aplicației la pornire.
- **Două build-uri din același repo.**
  - `npm run build` (web → `dist/`, deploy pe aradexperience.site) și `npm run build:mobile` (→ `dist-mobile/`, doar pentru Capacitor).
  - Local: `npm run dev` (web, :5173) și `npm run dev:mobile` (:5174).
  - Alias-ul Vite `@app` arată spre `src/web/` sau `src/mobile/`, după mod; fiecare are `router.ts`. `import.meta.env.VITE_APP` = `web` | `mobile`.
- **Rutele** stau în `src/router/web.ts` și `src/router/mobile.ts` (fiecare cu catch-all-ul lui; web-ul păstrează redirectul `/w/…`). Guard-ul comun e în `src/router/guard.ts`.
- **Dispar:**
  - `src/router/app.ts`, `?app=`, `?preview=mobile` și redirectul `/m/…`;
  - butoanele din panouri care deschideau ecrane din aplicație;
  - PWA-ul de pe web: se publică un service worker care se șterge singur, iar manifestul dispare.
- **Verificare:** `npm run check:web` caută urme din aplicația mobilă în `dist/` (numele rutelor `m-*`, `MobileLayout`) și pică dacă le găsește; rulează și în `deploy.yml`.
- **Consecință:** aplicația mobilă nu se mai poate deschide de pe site. Se testează nativ (emulator, telefon) sau local cu `npm run dev:mobile`.
