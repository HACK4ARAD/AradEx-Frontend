<script setup lang="ts">
// T11 · /m/community — același conținut ca tab-ul Comunitate din Acasă (S1d), ca pagină separată (link-uri din hartă, profil, notificări).
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import HomeCommunityTab from '@/mobile/components/home/HomeCommunityTab.vue'
import { useBack } from '@/shared/composables/useBack'

const { t } = useI18n()
const back = useBack('/m')
</script>

<template>
  <div class="flex items-center gap-2 pt-1">
    <button class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <h1 class="text-[28px] font-semibold tracking-[-0.025em] m-0">{{ t('community.title') }}</h1>
  </div>
  <HomeCommunityTab />
</template>
