import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Două build-uri din același cod, complet separate (backend-ul e același):
 * - web (implicit: `npm run dev`, `npm run build` → dist/): site-ul de prezentare + panourile, pe aradexperience.site;
 * - mobile (`npm run dev:mobile`, `npm run build:mobile` → dist-mobile/): aplicația, împachetată cu Capacitor (iOS + Android).
 * `@app` arată spre src/web sau src/mobile, deci fiecare build conține doar codul lui (+ src/shared).
 */
/** La build-ul web, orice import din src/mobile oprește build-ul (web-ul nu are voie să conțină nimic din aplicație). */
function webWithoutMobile(): Plugin {
  const mobileDir = fileURLToPath(new URL('./src/mobile/', import.meta.url))
  return {
    name: 'web-without-mobile',
    apply: 'build',
    load(id) {
      if (id.startsWith(mobileDir)) this.error(`Build-ul web nu are voie să importe din src/mobile: ${id.slice(mobileDir.length - 'src/mobile/'.length)}`)
      return null
    },
  }
}

export default defineConfig(({ mode }) => {
  const app = mode === 'mobile' ? 'mobile' : 'web'
  const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url))
  return {
    plugins: [
      ...(app === 'web' ? [webWithoutMobile()] : []),
      vue(),
      tailwindcss(),
      // Web-ul nu mai e PWA (e un site de prezentare). Service worker-ul publicat se șterge singur, ca browserele care au
      // versiunea veche (PWA-ul de dinainte de separare) să treacă pe site-ul nou fără cache vechi.
      ...(app === 'web' ? [VitePWA({ selfDestroying: true, injectRegister: false, manifest: false })] : []),
    ],
    define: { 'import.meta.env.VITE_APP': JSON.stringify(app) },
    resolve: { alias: { '@app': src(app), '@': src('') } },
    build: { outDir: app === 'mobile' ? 'dist-mobile' : 'dist' },
    server: { port: app === 'mobile' ? 5174 : 5173 },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.ts'],
    },
  }
})
