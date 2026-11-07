<script setup lang="ts">
// T20 · Confidențialitate: linkul cerut de Google Play și App Store (aplicația folosește camera și locația).
import { useI18n } from 'vue-i18n'
import { CONTACT_EMAIL } from '@/web/presentation'

const { t } = useI18n()
const sections = ['account', 'activity', 'location', 'camera', 'ai', 'storage', 'rights'] as const
</script>

<template>
  <article class="max-w-[720px] mx-auto">
    <h1 class="text-[32px] font-semibold tracking-[-0.02em] m-0">{{ t('legal.privacy.title') }}</h1>
    <p class="text-[13px] text-muted mt-1 mb-5">{{ t('legal.privacy.updated') }}</p>
    <p class="text-[16px] leading-relaxed m-0 mb-6">{{ t('legal.privacy.intro') }}</p>
    <section v-for="s in sections" :key="s" class="mb-5">
      <h2 class="text-[18px] font-semibold m-0 mb-1.5">{{ t(`legal.privacy.sections.${s}.title`) }}</h2>
      <p class="text-[15px] leading-relaxed text-ink/85 m-0">{{ t(`legal.privacy.sections.${s}.text`) }}</p>
    </section>
    <p v-if="CONTACT_EMAIL" class="text-[15px] mt-6">
      {{ t('legal.privacy.contact', { email: '' }) }}<a :href="`mailto:${CONTACT_EMAIL}`" class="text-ink font-semibold">{{ CONTACT_EMAIL }}</a>
    </p>
  </article>
</template>
