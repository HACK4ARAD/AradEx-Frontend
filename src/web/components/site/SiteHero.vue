<script setup lang="ts">
// T20 · hero-ul prezentării: titlul, butoanele de descărcare, trei capturi din aplicație (public/img/site/).
import { useI18n } from 'vue-i18n'
import DownloadButtons from './DownloadButtons.vue'

const { t } = useI18n()
const shots = ['/img/site/app-home.jpg', '/img/site/app-guide.jpg', '/img/site/app-offers.jpg']
</script>

<template>
  <section id="download" class="scroll-mt-24 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center pt-4 md:pt-10">
    <div>
      <div class="text-[13px] font-semibold text-muted mb-3">{{ t('site.hero.kicker') }}</div>
      <h1 class="text-[40px] md:text-[56px] font-semibold tracking-[-0.03em] leading-[1.05] m-0 mb-4">{{ t('site.hero.title') }}</h1>
      <p class="text-[17px] md:text-[18px] text-muted leading-relaxed m-0 mb-7 max-w-[560px]">{{ t('site.hero.text') }}</p>
      <DownloadButtons />
    </div>
    <div class="relative h-[440px] md:h-[520px]" role="img" :aria-label="t('site.hero.shots')">
      <img v-for="(src, i) in shots" :key="src" :src="src" alt="" loading="lazy"
        class="absolute top-0 w-[46%] max-w-[230px] rounded-[28px] border-[6px] border-ink shadow-[0_18px_40px_rgba(17,17,17,.18)] bg-white"
        :class="[i === 0 && 'left-[27%] z-20', i === 1 && 'left-0 top-[44px] z-10 rotate-[-4deg]', i === 2 && 'right-0 top-[44px] z-10 rotate-[4deg]']" />
    </div>
  </section>
</template>
