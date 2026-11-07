<script setup lang="ts">
// S12 — Conectare / cont nou pe mobil (design/final/mobile.html → /login).
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
      <span class="w-2.5 h-2.5 rounded-full bg-accent" /> {{ t('app.name') }}
    </div>

    <LoginForm ui="m" :demo-accounts="demo" />

    <p class="text-muted text-[12.5px] text-center mt-5 mb-0">{{ t('auth.volunteerNote') }}</p>
  </div>
</template>
