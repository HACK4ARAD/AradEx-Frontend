<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'

/** Bannerul galben „Doar în AradExperience” din tab-ul Oferte; butonul alege categoria Cafenele. */
defineEmits<{ pick: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="relative overflow-hidden rounded-[20px] bg-yellow p-4 pr-24">
    <div class="text-[12px] font-bold uppercase tracking-wide">{{ t('offers.banner.kicker') }}</div>
    <h2 class="text-[21px] font-semibold tracking-[-0.02em] leading-tight m-0 mt-1">{{ t('offers.banner.title') }}</h2>
    <button type="button" class="mt-3 h-9 px-3.5 rounded-full bg-ink text-white text-[13px] font-semibold inline-flex items-center gap-1" @click="$emit('pick')">
      {{ t('offers.banner.cta') }} <AppIcon name="arrow_forward" :size="16" />
    </button>
    <span class="absolute -right-2 -bottom-3 text-[86px] leading-none select-none" aria-hidden="true">☕</span>
  </div>
</template>
