<script setup lang="ts">
// Nota calmă de pe ecranele AI (chat, planificator) cât timp aplicația e în modul demo (`demoOnly`, useAuthMode):
// asistentul și planificatorul se deschid la lansare; până atunci totul e doar de vizualizare.
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'

const { t } = useI18n()
</script>

<template>
  <div class="flex gap-3 items-start px-4 py-3.5 rounded-2xl bg-white border border-line text-ink" role="status" data-test="demo-paused">
    <span class="w-9 h-9 rounded-xl bg-peach text-accent flex items-center justify-center shrink-0"><AppIcon name="auto_awesome" :size="20" /></span>
    <span class="text-[14px] leading-snug text-ink/85 pt-0.5">{{ t('common.demoAiPaused') }}</span>
  </div>
</template>
