<script setup lang="ts">
// S12 — Conectare pe mobil: un singur formular e-mail + parolă pentru toate conturile (Vizitator, Localnic, firme, Primărie,
// Admin), cu „Cont nou” (Vizitator / Localnic) și „Am uitat parola” (cod pe e-mail). Voluntarii au login-ul lor (/vol/login).
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import LoginForm from '@/shared/components/auth/LoginForm.vue'
import { useBack } from '@/shared/composables/useBack'

const { t } = useI18n()
const back = useBack('/')

const demo = [
  { label: t('auth.role.VISITOR'), email: 'visitor@demo.ro' },
  { label: t('auth.role.LOCAL'), email: 'local@demo.ro' },
  { label: t('auth.role.BUSINESS'), email: 'firma@demo.ro' },
  { label: t('auth.role.CITY_HALL'), email: 'primaria@demo.ro' },
  { label: t('auth.role.ADMIN'), email: 'admin@demo.ro' },
]
</script>

<template>
  <div class="pt-1 pb-8">
    <button class="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center" :aria-label="t('common.back')" @click="back">
      <AppIcon name="arrow_back" />
    </button>
    <div class="flex items-center gap-2 text-[15px] font-bold mt-3 mb-4">
      <img src="@/shared/assets/logo-ax.png" alt="AradExperience" class="h-[18px] w-auto shrink-0" /> {{ t('app.name') }}
    </div>

    <LoginForm ui="m" :demo-accounts="demo" />

    <p class="text-muted text-[12.5px] text-center mt-5 mb-0">{{ t('auth.firmNote') }}</p>
    <p class="text-muted text-[12.5px] text-center mt-4 mb-0">
      {{ t('auth.volunteerNote') }}
      <router-link to="/vol/login" class="block mt-1 text-ink font-semibold underline underline-offset-[3px]" data-test="vol-login-link">{{ t('auth.volunteerLink') }}</router-link>
    </p>
  </div>
</template>
