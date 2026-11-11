<script setup lang="ts">
// Nota de pe ecranele de login cât timp AradExperience nu e încă live (`demoOnly` din GET /auth/config): doar conturile demo.
// Informativă (stilul casei, piersică), nu o eroare.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'

const { t } = useI18n()
</script>

<template>
  <div class="flex gap-3 items-start px-4 py-3.5 rounded-2xl bg-peach text-ink" role="status" data-test="demo-only-notice">
    <span class="w-9 h-9 rounded-xl bg-white text-accent flex items-center justify-center shrink-0"><AppIcon name="rocket_launch" :size="20" /></span>
    <span class="min-w-0">
      <b class="block text-[15px] leading-snug">{{ t('auth.demoOnly.title') }}</b>
      <span class="block text-[13.5px] leading-snug text-ink/80 mt-0.5">{{ t('auth.demoOnly.text') }}</span>
    </span>
  </div>
</template>
