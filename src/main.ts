import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
// `@app` = src/web sau src/mobile, după build (vite.config.ts): web-ul nu conține nimic din aplicația mobilă și invers
import { router } from '@app/router'
import { i18n } from './shared/i18n'
import './shared/styles/base.css'

createApp(App).use(createPinia()).use(router).use(i18n).mount('#app')
