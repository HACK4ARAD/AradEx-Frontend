<script setup lang="ts">
// T20 · banda Comunitate de pe prezentare: ce înseamnă acțiunile comunitare + link spre /community.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'

const { t } = useI18n()
const photos = [
  { src: '/img/actiune-plantare-copaci.jpg', key: 'plant' },
  { src: '/img/actiune-curatenie.jpg', key: 'clean' },
  { src: '/img/actiune-donare-sange.jpg', key: 'blood' },
] as const
</script>

<template>
  <section class="bg-green-deep text-white rounded-[24px] p-6 md:p-9 grid lg:grid-cols-[1fr_1.1fr] gap-7 items-center">
    <div>
      <div class="text-[13px] font-semibold text-white/70 mb-2">{{ t('site.community.kicker') }}</div>
      <h2 class="text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] leading-tight m-0 mb-3">{{ t('site.community.title') }}</h2>
      <p class="text-[15.5px] text-white/80 leading-relaxed m-0 mb-5">{{ t('site.community.text') }}</p>
      <router-link to="/community" class="h-12 px-5 rounded-[14px] bg-white text-ink font-semibold text-[15px] inline-flex items-center gap-2 no-underline">
        {{ t('site.community.cta') }} <AppIcon name="arrow_forward" :size="20" />
      </router-link>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <figure v-for="p in photos" :key="p.key" class="m-0">
        <img :src="p.src" :alt="t(`site.community.photos.${p.key}`)" loading="lazy" class="w-full h-[150px] md:h-[200px] object-cover rounded-[16px]" />
        <figcaption class="text-[12.5px] text-white/75 mt-1.5">{{ t(`site.community.photos.${p.key}`) }}</figcaption>
      </figure>
    </div>
  </section>
</template>
