<script setup lang="ts">
// T20 · „Pentru cine”: rolurile (presentation.ts → ROLES).
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { ROLES } from '@/web/presentation'

const { t } = useI18n()
</script>

<template>
  <section>
    <h2 class="text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] m-0 mb-5">{{ t('site.roles.title') }}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <article v-for="r in ROLES" :key="r.key" class="bg-white border border-line rounded-[16px] p-4">
        <AppIcon :name="r.icon" :size="24" class="mb-2" />
        <h3 class="text-[16px] font-semibold m-0 mb-1">{{ t(`site.roles.${r.key}.title`) }}</h3>
        <p class="text-[13.5px] text-muted leading-relaxed m-0">{{ t(`site.roles.${r.key}.text`) }}</p>
      </article>
    </div>
  </section>
</template>
