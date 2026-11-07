import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Aplicația Android (T15, Capacitor): build-ul mobil (`npm run build:mobile` → `dist-mobile`), separat de web; `npm run cap:sync` îl face și îl copiază.
 * - implicit: APK cu build-ul inclus (`npm run android:apk`) — API-ul e cel din VITE_API_URL de la build.
 * - live reload: `npm run dev:mobile` + `CAP_SERVER_URL=http://localhost:5174 npx cap run android` → aplicația instalată încarcă din Vite (în emulator: `adb reverse tcp:5174 tcp:5174`).
 * iOS: `npx cap add ios` + build doar pe macOS cu Xcode.
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
}

export default config
