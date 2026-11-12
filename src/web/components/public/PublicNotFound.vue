<script setup lang="ts">
// Starea „nu există” a paginilor publice (eveniment demo / inexistent, loc care nu e obiectiv): prietenoasă, cu drumul spre
// listă; pagina primește `noindex` (setNoindex, din view).
import { AppIcon } from '@/shared/components'

defineProps<{ title: string; text: string; to: string; link: string }>()
</script>

<template>
  <div class="max-w-[560px] mx-auto text-center py-12 md:py-16" data-test="public-not-found">
    <span class="w-14 h-14 rounded-2xl bg-soft flex items-center justify-center mx-auto"><AppIcon name="travel_explore" :size="28" /></span>
    <h1 class="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] mt-4 mb-2">{{ title }}</h1>
    <p class="text-muted text-[15px] leading-relaxed m-0">{{ text }}</p>
    <router-link :to="to" class="mt-5 h-11 px-4 rounded-[12px] bg-ink text-white text-[14.5px] font-semibold no-underline inline-flex items-center gap-1.5">
      {{ link }}<AppIcon name="arrow_forward" :size="18" />
    </router-link>
  </div>
</template>
