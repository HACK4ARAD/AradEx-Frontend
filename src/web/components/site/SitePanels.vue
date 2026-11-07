<script setup lang="ts">
// T20 · „Ești Primărie sau firmă?” → login-ul panourilor (W0); conectat → direct în panoul tău.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useAuthStore } from '@/shared/stores/auth'
import { homeFor } from '@/shared/composables/useAuthForm'

const { t } = useI18n()
const auth = useAuthStore()
const target = computed(() => (auth.user ? homeFor(auth.user.role, 'w') : '/login'))
</script>

<template>
  <section id="panels" class="scroll-mt-24 bg-ink text-white rounded-[24px] p-6 md:p-9 flex flex-col md:flex-row md:items-center gap-5">
    <div class="flex-1">
      <h2 class="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] m-0 mb-2">{{ t('site.panels.title') }}</h2>
      <p class="text-[15.5px] text-white/75 leading-relaxed m-0 max-w-[620px]">{{ t('site.panels.text') }}</p>
    </div>
    <router-link :to="target === '/' ? '/login' : target" class="h-12 px-5 rounded-[14px] bg-white text-ink font-semibold text-[15px] inline-flex items-center gap-2 no-underline shrink-0">
      {{ t('site.panels.cta') }} <AppIcon name="arrow_forward" :size="20" />
    </router-link>
  </section>
</template>
