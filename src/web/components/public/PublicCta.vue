<script setup lang="ts">
// Îndemnul de pe paginile publice (evenimente, obiective): biletele, indicațiile și ghidurile sunt în aplicație; pe web
// se intră ca vizitator, fără cont (același drum ca „Încearcă pe web” din fereastra „Descarcă aplicația”).
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'

const { t } = useI18n()
</script>

<template>
  <aside class="rounded-[18px] bg-ink text-white p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4" data-test="public-cta">
    <span class="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0"><AppIcon name="smartphone" /></span>
    <div class="flex-1 min-w-0">
      <b class="block text-[17px] leading-snug">{{ t('site.public.cta.title') }}</b>
      <span class="block text-[14px] text-white/75 mt-1 leading-snug">{{ t('site.public.cta.text') }}</span>
    </div>
    <router-link to="/login" class="h-11 px-4 rounded-[12px] bg-white text-ink text-[14.5px] font-semibold no-underline inline-flex items-center justify-center gap-1.5 shrink-0">
      {{ t('site.public.cta.button') }}<AppIcon name="arrow_forward" :size="18" />
    </router-link>
  </aside>
</template>
