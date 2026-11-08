<script setup lang="ts">
// W0 — Conectare pe web (design/final/web.html → /login): stânga panou de prezentare, dreapta două tab-uri:
// „Cont personal”: butonul „Intră ca vizitator” (un clic, contul demo de vizitator, oricâți deodată) sau telefon + cod OTP
// (Vizitator / Localnic, ca în aplicație); „Panouri” (Primărie, firme, Admin cu e-mail + parolă, + „Înregistrează-ți firma”).
// În „Panouri”, cardurile conturilor demo (Primărie, Firmă, Admin) completează formularul (dev / VITE_DEMO). Cu `?tab=panels` se deschide direct tab-ul panourilor (butonul „Intră în panou” din site).
// Pagina e în afara WebLayout (fără bara de sus), ca în design. Sub 1100px rămâne doar formularul.
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import LoginForm from '@/shared/components/auth/LoginForm.vue'
import PhoneLogin from '@/shared/components/auth/PhoneLogin.vue'
import { DEMO_ENABLED, initialLoginTab, landingFor } from '@/shared/composables/useAuthForm'
import { useVisitorLogin } from '@/shared/composables/usePhoneLogin'
import { useUiStore } from '@/shared/stores/ui'
import { routeRoles } from '@/router/guard'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tab = ref<'personal' | 'panels'>(initialLoginTab(route.query.tab, route.query.next, (p) => routeRoles(router, p)))
const ui = useUiStore()
const visitor = useVisitorLogin()
const panelsForm = ref<InstanceType<typeof LoginForm> | null>(null)
const panels = [
  { email: 'primaria@demo.ro', icon: 'account_balance', bg: 'bg-ink', title: 'auth.panels.cityTitle', desc: 'auth.panels.cityDesc' },
  { email: 'firma@demo.ro', icon: 'storefront', bg: 'bg-accent', title: 'auth.panels.businessTitle', desc: 'auth.panels.businessDesc' },
  { email: 'admin@demo.ro', icon: 'shield_person', bg: 'bg-[#2A2A30]', title: 'auth.panels.adminTitle', desc: 'auth.panels.adminDesc' },
]
function pick(email: string) {
  panelsForm.value?.useDemo(email)
}
const features = [
  { icon: 'event', label: 'auth.side.events' },
  { icon: 'headphones', label: 'auth.side.places' },
  { icon: 'volunteer_activism', label: 'auth.side.community' },
]

async function enterAsVisitor() {
  const u = await visitor.enter()
  if (!u) return
  ui.toast(t('auth.welcome', { name: u.displayName.split(' ')[0] }), 'success')
  await router.replace(landingFor(u.role, 'w', route.query.next, (p) => routeRoles(router, p)))
}
</script>

<template>
  <div class="min-h-dvh grid min-[1100px]:grid-cols-[1.05fr_1fr]">
    <aside class="hidden min-[1100px]:flex relative overflow-hidden bg-[#111114] text-white p-12 flex-col justify-between">
      <div class="absolute -right-[120px] -top-[120px] w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,90,54,.35),transparent_65%)]" />
      <router-link to="/" class="relative flex items-center gap-2.5 text-white no-underline font-bold text-[16px]">
        <span class="w-[30px] h-[30px] rounded-[9px] bg-accent inline-flex items-center justify-center"><AppIcon name="location_city" :size="18" /></span>
        {{ t('app.name') }}
      </router-link>
      <div class="relative">
        <h1 class="text-[40px] leading-[1.08] tracking-[-0.035em] font-semibold m-0 mb-3.5 max-w-[460px]">{{ t('auth.side.title') }}</h1>
        <p class="text-[#B9B9C0] leading-relaxed max-w-[440px] m-0">{{ t('auth.side.text') }}</p>
      </div>
      <div class="relative grid grid-cols-3 gap-3 max-w-[460px]">
        <div v-for="f in features" :key="f.icon" class="bg-[#1E1E23] rounded-[14px] p-3.5">
          <AppIcon :name="f.icon" :size="22" />
          <span class="block text-[12px] text-[#B9B9C0] mt-1.5">{{ t(f.label) }}</span>
        </div>
      </div>
    </aside>

    <main class="flex items-center justify-center px-4 py-10 sm:p-10 bg-bg">
      <div class="w-full max-w-[460px] flex flex-col gap-3.5">
        <router-link to="/" class="min-[1100px]:hidden flex items-center gap-2 font-bold text-[15px] no-underline text-ink mb-2">
          <img src="@/shared/assets/logo-ax.png" alt="AradExperience" class="h-[18px] w-auto shrink-0" /> {{ t('app.name') }}
        </router-link>

        <div class="self-start inline-flex p-1 rounded-[14px] bg-soft max-w-full" role="tablist">
          <button v-for="k in (['personal', 'panels'] as const)" :key="k" type="button" role="tab" :aria-selected="tab === k"
            class="h-9 px-3.5 rounded-[10px] text-[13.5px] text-left" :class="tab === k ? 'bg-white font-semibold shadow-sm' : 'text-muted'"
            @click="tab = k">{{ t(`auth.tabs.${k}`) }}</button>
        </div>

        <template v-if="tab === 'personal'">
          <button type="button" data-test="visitor" :disabled="visitor.busy.value"
            class="w-full rounded-2xl bg-ink text-white p-4 flex items-center gap-3.5 text-left hover:bg-[#222] transition-colors disabled:opacity-70" @click="enterAsVisitor">
            <span class="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0"><AppIcon name="luggage" /></span>
            <span class="min-w-0 flex-1">
              <b class="block text-[16px]">{{ t('auth.visitor.title') }}</b>
              <span class="block text-[13px] text-white/70 mt-0.5">{{ t('auth.visitor.sub') }}</span>
            </span>
            <AppIcon :name="visitor.busy.value ? 'progress_activity' : 'arrow_forward'" :class="visitor.busy.value ? 'animate-spin' : ''" />
          </button>
          <p v-if="visitor.error.value" class="text-[#B3261E] text-[13px] m-0" role="alert">{{ t(visitor.error.value) }}</p>
          <div class="flex items-center gap-3 text-muted text-[12.5px] my-1"><span class="flex-1 h-px bg-line" />{{ t('auth.visitor.or') }}<span class="flex-1 h-px bg-line" /></div>
          <PhoneLogin ui="w" />
          <p class="text-muted text-[12.5px] m-0 mt-1">{{ t('auth.personalWeb') }}</p>
        </template>

        <template v-else>
        <LoginForm ref="panelsForm" ui="w" />
        <div v-if="DEMO_ENABLED" class="text-[13px] text-muted mt-1">{{ t('auth.panels.pick') }}</div>
        <button v-for="p in (DEMO_ENABLED ? panels : [])" :key="p.email" type="button"
          class="bg-white border border-line rounded-2xl p-4 flex items-center gap-3 text-left w-full hover:border-ink transition-colors" @click="pick(p.email)">
          <span class="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0" :class="p.bg"><AppIcon :name="p.icon" /></span>
          <span class="min-w-0">
            <b class="block text-[15px]">{{ t(p.title) }}</b>
            <span class="block text-[13px] text-muted mt-0.5">{{ p.email }} · {{ t(p.desc) }}</span>
          </span>
        </button>
        <div class="flex gap-2.5 items-start px-3.5 py-3 rounded-xl bg-[#F1F1EC] text-muted text-[12.5px] leading-normal">
          <AppIcon name="badge" :size="18" /><span>{{ t('auth.panels.volunteers') }}</span>
        </div>
        </template>

        <router-link to="/" class="self-center inline-flex items-center gap-1 text-[13px] text-muted no-underline mt-2">
          <AppIcon name="arrow_back" :size="16" /> {{ t('auth.backToSite') }}
        </router-link>
      </div>
    </main>
  </div>
</template>
