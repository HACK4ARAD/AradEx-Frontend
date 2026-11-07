<script setup lang="ts">
// W0 — Conectare pe web (design/final/web.html → /login): stânga panou de prezentare, dreapta login-ul panourilor (Primărie,
// firme, Admin) + „Înregistrează-ți firma”. T21: conturile personale intră doar în aplicația mobilă, cu telefon + cod OTP.
// Pagina e în afara WebLayout (fără bara de sus), ca în design. Sub 1100px rămâne doar formularul.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import LoginForm from '@/shared/components/auth/LoginForm.vue'
import { DEMO_ENABLED } from '@/shared/composables/useAuthForm'

const { t } = useI18n()
const panelsForm = ref<InstanceType<typeof LoginForm> | null>(null)

const panels = [
  { email: 'primaria@demo.ro', icon: 'account_balance', bg: 'bg-ink', title: 'auth.panels.cityTitle', desc: 'auth.panels.cityDesc' },
  { email: 'firma@demo.ro', icon: 'storefront', bg: 'bg-accent', title: 'auth.panels.businessTitle', desc: 'auth.panels.businessDesc' },
  { email: 'admin@demo.ro', icon: 'shield_person', bg: 'bg-[#2A2A30]', title: 'auth.panels.adminTitle', desc: 'auth.panels.adminDesc' },
]
const features = [
  { icon: 'event', label: 'auth.side.events' },
  { icon: 'headphones', label: 'auth.side.places' },
  { icon: 'volunteer_activism', label: 'auth.side.community' },
]

function pick(email: string) {
  panelsForm.value?.useDemo(email)
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
          <span class="w-2.5 h-2.5 rounded-full bg-accent" /> {{ t('app.name') }}
        </router-link>

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
          <AppIcon name="smartphone" :size="18" /><span>{{ t('auth.panels.personal') }}</span>
        </div>

        <router-link to="/" class="self-center inline-flex items-center gap-1 text-[13px] text-muted no-underline mt-2">
          <AppIcon name="arrow_back" :size="16" /> {{ t('auth.backToSite') }}
        </router-link>
      </div>
    </main>
  </div>
</template>
