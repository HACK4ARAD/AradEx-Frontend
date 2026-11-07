import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Capacitor } from '@capacitor/core'
import App from './App.vue'
import { router } from './router'
import { i18n } from './shared/i18n'
import './shared/styles/base.css'

createApp(App).use(createPinia()).use(router).use(i18n).mount('#app')

// PWA (offline, „Add to Home Screen”) doar în browser; aplicația Android/iOS are deja fișierele în pachet.
if (!Capacitor.isNativePlatform()) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}
