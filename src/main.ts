import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
// `@app` = src/web sau src/mobile, după build (vite.config.ts): web-ul nu conține nimic din aplicația mobilă și invers
import { router } from '@app/router'
import { i18n } from './shared/i18n'
import './shared/styles/base.css'
import { warmUpLocation } from './shared/composables/useGeo'
import { APP } from './shared/app'

createApp(App).use(createPinia()).use(router).use(i18n).mount('#app')
// locația, dacă e deja permisă, se caută în fundal: harta se deschide direct pe tine
void warmUpLocation()
// aplicația: rețeaua CTP (stații + linii, păstrate pe telefon) se pregătește în fundal, ca Transport să se deschidă direct
if (APP === 'mobile') setTimeout(() => { void import('./shared/composables/useTransport').then((m) => m.warmUpTransit()) }, 1200)
