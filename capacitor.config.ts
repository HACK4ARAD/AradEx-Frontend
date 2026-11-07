import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Aplicația Android (T15, Capacitor): build-ul mobil (`npm run build:mobile` → `dist-mobile`), separat de web; `npm run cap:sync` îl face și îl copiază.
 * - implicit: APK cu build-ul inclus (`npm run android:apk`) — API-ul e cel din VITE_API_URL de la build.
 * - live reload: `npm run dev:mobile` + `CAP_SERVER_URL=http://localhost:5174 npx cap run android` → aplicația instalată încarcă din Vite (în emulator: `adb reverse tcp:5174 tcp:5174`).
 * iOS (proiectul în `ios/`, doar pe macOS cu Xcode): `npm run ios:sync` (build cu VITE_API_URL de producție) + `npm run ios:open` → Xcode,
 * Team = Apple ID-ul tău, iPhone-ul prin cablu, ▶ Run. Originea aplicației iOS e `capacitor://localhost` → trebuie în CORS_ORIGINS din BE.
 */
const liveUrl = process.env.CAP_SERVER_URL

const config: CapacitorConfig = {
  appId: 'ro.aradexperience.app',
  appName: 'AradExperience',
  webDir: 'dist-mobile',
  server: {
    // http (nu https): API-ul local e pe http://localhost:8081, iar o pagină https nu are voie să-l apeleze (mixed content).
    // Originea aplicației devine http://localhost → trebuie în CORS_ORIGINS din BE.
    androidScheme: 'http',
    cleartext: true,
    ...(liveUrl ? { url: liveUrl } : {}),
  },
  android: {
    backgroundColor: '#F7F7F2',
  },
  ios: {
    backgroundColor: '#F7F7F2',
  },
}

export default config
