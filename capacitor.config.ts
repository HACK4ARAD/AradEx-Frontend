import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Aplicația Android (T15, Capacitor): același build Vue (`dist`), împachetat ca aplicație nativă; deschide direct interfața mobilă (/m).
 * - implicit: APK cu build-ul inclus (`npm run android:apk`) — API-ul e cel din VITE_API_URL de la build.
 * - live reload: `CAP_SERVER_URL=http://localhost:5173 npx cap run android` → aplicația instalată încarcă din Vite (în emulator: `adb reverse tcp:5173 tcp:5173`).
 * iOS: `npx cap add ios` + build doar pe macOS cu Xcode.
 */
const liveUrl = process.env.CAP_SERVER_URL

const config: CapacitorConfig = {
  appId: 'ro.aradexperience.app',
  appName: 'AradExperience',
  webDir: 'dist',
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
