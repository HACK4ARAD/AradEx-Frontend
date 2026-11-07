<script setup lang="ts">
// T10 · S1b · /offers: aceeași listă ca tab-ul Oferte din Acasă (HomeOffersTab), cu titlu și „înapoi”.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import HomeOffersTab from '@/mobile/components/home/HomeOffersTab.vue'
import { useBack } from '@/shared/composables/useBack'

const { t } = useI18n()
const back = useBack('/')
</script>

<template>
  <div class="pt-1">
    <button class="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center mb-2" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <h1 class="text-[30px] font-semibold tracking-[-0.025em] m-0">{{ t('offers.title') }}</h1>
    <HomeOffersTab />
  </div>
</template>
