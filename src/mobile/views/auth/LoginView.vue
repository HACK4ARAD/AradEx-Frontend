<script setup lang="ts">
// S12 — Conectare pe mobil: un singur formular e-mail + parolă pentru toate conturile (Vizitator, Localnic, firme, Primărie,
// Admin), cu „Cont nou” (Vizitator / Localnic) și „Am uitat parola” (codul de recuperare). Voluntarii au login-ul lor (/vol/login).
// Cât timp aplicația nu e live (`demoOnly`): nota de sus, conturile demo dintr-un clic pentru fiecare rol și doar conectarea.
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import LoginForm from '@/shared/components/auth/LoginForm.vue'
import DemoAccountCard from '@/shared/components/auth/DemoAccountCard.vue'
import DemoOnlyNotice from '@/shared/components/auth/DemoOnlyNotice.vue'
import { useBack } from '@/shared/composables/useBack'
import { landingFor } from '@/shared/composables/useAuthForm'
import { useAuthMode } from '@/shared/composables/useAuthMode'
import { DEMO_ACCOUNTS, useDemoLogin } from '@/shared/composables/useDemoLogin'
import { useUiStore } from '@/shared/stores/ui'
import { routeRoles } from '@/router/guard'

const { t } = useI18n()
const back = useBack('/')
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const { demoOnly } = useAuthMode()
const demoLogin = useDemoLogin()

/** scurtăturile care completează formularul (dev / VITE_DEMO), când aplicația e live */
const demo = DEMO_ACCOUNTS.map((a) => ({ label: t(`auth.role.${a.role}`), email: a.email }))

async function enterDemo(email: string) {
  const u = await demoLogin.enter(email)
  if (!u) return
  ui.toast(t('auth.welcome', { name: u.displayName.split(' ')[0] }), 'success')
  await router.replace(landingFor(u.role, 'm', route.query.next, (p) => routeRoles(router, p)))
}
</script>

<template>
  <div class="pt-1 pb-8">
    <button class="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center" :aria-label="t('common.back')" @click="back">
      <AppIcon name="arrow_back" />
    </button>
    <div class="flex items-center gap-2 text-[15px] font-bold mt-3 mb-4">
      <img src="@/shared/assets/logo-ax.png" alt="AradExperience" class="h-[18px] w-auto shrink-0" /> {{ t('app.name') }}
    </div>

    <template v-if="demoOnly">
      <DemoOnlyNotice />
      <div class="flex flex-col gap-2.5 mt-3.5" data-test="demo-accounts">
        <DemoAccountCard v-for="a in DEMO_ACCOUNTS" :key="a.email" :account="a" :busy="demoLogin.busy.value === a.email"
          :disabled="!!demoLogin.busy.value" @click="enterDemo(a.email)" />
      </div>
      <p v-if="demoLogin.error.value" class="text-[#B3261E] text-[13px] mt-2.5 mb-0" role="alert">{{ t(demoLogin.error.value) }}</p>
      <div class="flex items-center gap-3 text-muted text-[12.5px] mt-5 mb-4"><span class="flex-1 h-px bg-line" />{{ t('auth.visitor.or') }}<span class="flex-1 h-px bg-line" /></div>
    </template>

    <LoginForm ui="m" :demo-accounts="demoOnly ? [] : demo" />

    <p v-if="!demoOnly" class="text-muted text-[12.5px] text-center mt-5 mb-0">{{ t('auth.firmNote') }}</p>
    <p class="text-muted text-[12.5px] text-center mt-4 mb-0">
      {{ t('auth.volunteerNote') }}
      <router-link to="/vol/login" class="block mt-1 text-ink font-semibold underline underline-offset-[3px]" data-test="vol-login-link">{{ t('auth.volunteerLink') }}</router-link>
    </p>
  </div>
</template>
