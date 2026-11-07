# AradEx-Frontend

Frontend AradExperience (Hack4Arad 2026): Vue 3.5 + Vite 8 + TypeScript, două build-uri complet separate din același repo (același backend), fără prefix în URL: **aplicația mobilă** (iOS + Android, are tot) și **web-ul** (site-ul de prezentare al aplicației + panourile Primărie / firme / Admin). Repo frate cu `AradEx-Plan` (documentația în `../AradEx-Plan/docs/`, designul în `../AradEx-Plan/design/`), `AradEx-Backend`, `AradEx-Infrastructure` și `AradEx-Ops`.

```
npm install
npm run dev          # http://localhost:5173 → web (prezentarea + panourile)
npm run dev:mobile   # http://localhost:5174 → aplicația mobilă (doar local și nativ)
npm run build        # web → dist/ (deploy pe aradexperience.site); npm run check:web verifică să nu conțină nimic din aplicația mobilă
npm run build:mobile # aplicația → dist-mobile/ (Capacitor)
npm run test         # vitest
cp .env.example .env # VITE_API_URL, VITE_DEMO=true (arată butoanele „Conturi demo” pe login)
```

Scheletul (T02) e construit și verificat (`build` + `test` verzi):
- `src/shared/` — `types/<modul>.ts` (DTO-urile din `docs/API.md`, câte un fișier pe modul), `api/` (client cu Bearer + ProblemDetail → `ApiError` și câte un fișier per modul BE), `stores/` (auth, ui), `composables/` (useFormat, useAuthForm, useGeo, cu teste), `components/ui/` (AppIcon, AppButton, AppChip, AppCard, AppInput, AppSheet, EmptyState, Skeleton, AppToast, ApiStatus, PlaceholderScreen), `components/qr/` (QrCode, QrScanner), `components/auth/LoginForm`, `i18n/ro|en/<modul>.json`, `styles/base.css` (tokens Clean Ink, Tailwind 4).
- `src/mobile/` — `MobileLayout` (tab bar cu Hartă în centru; Firma/Primăria văd „Panou”), `views/home/HomeView`, `views/auth/LoginView`. `src/web/` — `WebLayout` (bară sus + sidebar pe `/business`, `/city`, `/admin`), `views/home/LandingView`, `views/auth/LoginView`.
- `src/router/` — `mobile.ts` și `web.ts` au rutele din `docs/API.md` §Rute FE, fiecare cu view-ul ei în `views/<feature>/`; cele neimplementate afișează `PlaceholderScreen`; `guard.ts` = guard-ul comun pe `meta.roles` (voluntarii → `/vol/login`). Routerul fiecărui build e în `src/web/router.ts` / `src/mobile/router.ts`, ales de alias-ul Vite `@app`. Linkurile vechi de panou `/w/…` duc la aceeași cale fără prefix.
- Web-ul nu e PWA (service worker-ul publicat se șterge singur, pentru browserele care aveau PWA-ul vechi); fonturi locale (Inter, Material Symbols în `public/fonts`), `public/_redirects` pentru Netlify.

## Aplicația Android (Capacitor 6, T15)
Build-ul mobil (`npm run build:mobile` → `dist-mobile/`), împachetat ca aplicație nativă (`android/`, `capacitor.config.ts`). Cere Android Studio (SDK 34) și JDK 21 (`JAVA_HOME`).
```
npm run cap:sync      # vite build + copiază dist în proiectul Android
npm run android:run   # build + instalează pe emulatorul/telefonul conectat (sau: npm run android:open → Android Studio)
adb reverse tcp:8081 tcp:8081   # emulator/telefon prin USB: localhost:8081 din aplicație = API-ul de pe PC
```
- API-ul folosit e `VITE_API_URL` de la build. Originea aplicației e `http://localhost`, deci trebuie în `CORS_ORIGINS` din BE.
- Live reload în aplicația instalată: `adb reverse tcp:5173 tcp:5173`, apoi `CAP_SERVER_URL=http://localhost:5173 npx cap run android`.
- iOS: `npx cap add ios` + build doar pe macOS cu Xcode.

Mod de lucru: `CLAUDE.md` de aici + `../AradEx-Plan/CLAUDE.md`; skill-urile (`fe-feature`, `task-workflow`, `review-pr`) sunt în `../AradEx-Plan/.claude/skills/`. Următorii pași: T05/T06 și apoi restul story-urilor — fiecare completează doar fișierele lui (tabelul din `CLAUDE.md` §Culoare).
