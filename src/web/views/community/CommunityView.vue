<script setup lang="ts">
// W12 · Comunitate pe web, doar de citit (T20, decizia din 7 nov): cum funcționează + descarcă aplicația.
// T11: când există GET /community/actions?upcoming=true și GET /community/leaderboard, înlocuiește blocul „în curând”
// cu lista acțiunilor (fără „Mă înscriu”: înscrierea e doar în aplicație) și clasamentul lunii.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import DownloadButtons from '@/web/components/site/DownloadButtons.vue'

const { t } = useI18n()
const steps = ['1', '2', '3'] as const
</script>

<template>
  <div class="max-w-[960px] mx-auto flex flex-col gap-8">
    <header>
      <h1 class="text-[36px] md:text-[44px] font-semibold tracking-[-0.025em] m-0 mb-3">{{ t('site.community.pageTitle') }}</h1>
      <p class="text-[17px] text-muted leading-relaxed m-0 max-w-[680px]">{{ t('site.community.pageText') }}</p>
    </header>
    <ol class="grid grid-cols-1 md:grid-cols-3 gap-3 list-none p-0 m-0">
      <li v-for="s in steps" :key="s" class="bg-white border border-line rounded-[16px] p-4 flex gap-3">
        <span class="w-8 h-8 shrink-0 rounded-full bg-green-deep text-white font-bold flex items-center justify-center">{{ s }}</span>
        <span class="text-[15px] leading-relaxed">{{ t(`site.community.steps.${s}`) }}</span>
      </li>
    </ol>
    <section class="bg-green-deep text-white rounded-[24px] p-6 md:p-8 flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <AppIcon name="volunteer_activism" :size="28" />
        <div>
          <h2 class="text-[20px] font-semibold m-0 mb-1">{{ t('site.community.soonTitle') }}</h2>
          <p class="text-[15px] text-white/80 m-0">{{ t('site.community.soonText') }}</p>
        </div>
      </div>
      <DownloadButtons dark />
    </section>
  </div>
</template>
