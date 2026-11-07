<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'

/** Banda galbenă din panoul web: firma neverificată poate pregăti conținut, care rămâne ciornă până la verificare. */
const { t } = useI18n()
</script>

<template>
  <div class="mb-5 rounded-[14px] border border-[#EAD9A8] bg-warn-soft text-warn px-4 py-3 text-[14px] flex items-center gap-2.5">
    <AppIcon name="hourglass_top" /><span><b>{{ t('business.panel.unverified') }}</b> {{ t('business.panel.unverifiedText') }}</span>
  </div>
</template>
