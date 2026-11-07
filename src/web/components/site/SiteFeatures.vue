<script setup lang="ts">
// T20 · „Ce poți face cu aplicația”: cele 6 funcții (presentation.ts → FEATURES).
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { FEATURES } from '@/web/presentation'

const { t } = useI18n()
</script>

<template>
  <section id="features" class="scroll-mt-24">
    <h2 class="text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] m-0 mb-5">{{ t('site.features.title') }}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <article v-for="f in FEATURES" :key="f.key" data-feature class="bg-white border border-line rounded-[20px] p-5">
        <span class="w-11 h-11 rounded-[12px] bg-soft flex items-center justify-center mb-3"><AppIcon :name="f.icon" :size="24" /></span>
        <h3 class="text-[17px] font-semibold m-0 mb-1">{{ t(`site.features.${f.key}.title`) }}</h3>
        <p class="text-[14.5px] text-muted leading-relaxed m-0">{{ t(`site.features.${f.key}.text`) }}</p>
      </article>
    </div>
  </section>
</template>
