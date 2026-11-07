<script setup lang="ts">
// S12 — Conectare pe mobil. T21: conturile personale (Vizitator, Localnic) intră doar cu telefon + cod OTP; firmele și
// Primăria (care au „Panou” în aplicație) intră cu e-mail + parolă, din linkul de sub formular.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import LoginForm from '@/shared/components/auth/LoginForm.vue'
import PhoneLogin from '@/shared/components/auth/PhoneLogin.vue'
import { useBack } from '@/shared/composables/useBack'

const { t } = useI18n()
const back = useBack('/')
const mode = ref<'phone' | 'firm'>('phone')

const demoPhones = [
  { label: t('auth.role.VISITOR'), phone: '0799 000 001' },
  { label: t('auth.role.LOCAL'), phone: '0799 000 002' },
]
const firmDemo = [
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
      <span class="w-2.5 h-2.5 rounded-full bg-accent" /> {{ t('app.name') }}
    </div>

    <PhoneLogin v-if="mode === 'phone'" :demo-phones="demoPhones" />
    <LoginForm v-else ui="m" login-only :demo-accounts="firmDemo" />

    <button type="button" class="block mx-auto mt-5 text-[14px] font-semibold underline underline-offset-[3px] py-1"
      @click="mode = mode === 'phone' ? 'firm' : 'phone'">
      {{ mode === 'phone' ? t('auth.phone.firmLink') : t('auth.phone.personalLink') }}
    </button>
    <p class="text-muted text-[12.5px] text-center mt-4 mb-0">
      {{ t('auth.volunteerNote') }}
      <router-link to="/vol/login" class="block mt-1 text-ink font-semibold underline underline-offset-[3px]" data-test="vol-login-link">{{ t('auth.volunteerLink') }}</router-link>
    </p>
  </div>
</template>
