# AradEx-Frontend

Frontend AradExperience (Hack4Arad 2026): Vue 3.5 + Vite 8 + TypeScript, o aplicație cu două interfețe — mobil (`/m`, PWA) și web (`/w`). Repo frate cu `AradEx-Plan` (documentația în `../AradEx-Plan/docs/`, designul în `../AradEx-Plan/design/`), `AradEx-Backend`, `AradEx-Infrastructure` și `AradEx-Ops`.

```
npm install
npm run dev          # http://localhost:5173 → /m (mobil) sau /w (web); forțează cu ?ui=m sau ?ui=w
npm run build        # vue-tsc + vite build + PWA (service worker, manifest)
npm run test         # vitest
cp .env.example .env # VITE_API_URL, VITE_DEMO=true (arată butoanele „Conturi demo” pe login)
```

Scheletul (T02) e construit și verificat (`build` + `test` verzi):
- `src/shared/` — `types/api.ts` (toate DTO-urile din `docs/API.md`), `api/` (client cu Bearer + ProblemDetail → `ApiError`, `auth.ts`, `health.ts`), `stores/` (auth, ui), `composables/useFormat` (+ test), `components/ui/` (AppIcon, AppButton, AppChip, AppCard, AppInput, EmptyState, Skeleton, AppToast, ApiStatus, PlaceholderScreen), `components/auth/LoginForm`, `i18n/` (RO/EN), `styles/base.css` (tokens Clean Ink, Tailwind 4).
- `src/mobile/` — `MobileLayout` (tab bar cu Hartă în centru; Firma/Primăria văd „Panou”), `views/home/HomeView`, `views/auth/LoginView`. `src/web/` — `WebLayout` (bară sus + sidebar pe `/w/business`, `/w/city`, `/w/admin`), `views/home/LandingView`, `views/auth/LoginView`.
- `src/router/index.ts` — toate rutele din `docs/API.md` §Rute FE; cele neimplementate afișează `PlaceholderView` cu codul ecranului și task-ul; guard pe `meta.roles`.
- PWA (`vite-plugin-pwa`), fonturi locale (Inter, Material Symbols în `public/fonts`), `public/_redirects` pentru Netlify.

Mod de lucru: `CLAUDE.md` de aici + `../AradEx-Plan/CLAUDE.md`; skill-urile (`fe-feature`, `task-workflow`, `review-pr`) sunt în `../AradEx-Plan/.claude/skills/`. Următorul pas: T03 (login real pe API), apoi T05/T06 — înlocuiești `PlaceholderView` rută cu rută.
