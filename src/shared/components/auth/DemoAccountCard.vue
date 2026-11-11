<script setup lang="ts">
// Cardul unui cont demo pe ecranul de login (același aspect ca cardurile panourilor de pe web): icon colorat, titlu,
// „adresă · ce poate face”. Doar butonul; ce face clicul (login dintr-un clic sau completarea formularului) decide ecranul.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import type { DemoAccount } from '@/shared/composables/useDemoLogin'

defineProps<{ account: DemoAccount; busy?: boolean; disabled?: boolean }>()
const { t } = useI18n()
</script>

<template>
  <button type="button" :data-test="`demo-${account.role}`" :disabled="disabled || busy"
    class="bg-white border border-line rounded-2xl p-4 flex items-center gap-3 text-left w-full hover:border-ink transition-colors disabled:opacity-70">
    <span class="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0" :class="account.bg"><AppIcon :name="account.icon" /></span>
    <span class="min-w-0 flex-1">
      <b class="block text-[15px]">{{ t(account.title) }}</b>
      <span class="block text-[13px] text-muted mt-0.5 break-words">{{ account.email }} · {{ t(account.desc) }}</span>
    </span>
    <AppIcon v-if="busy" name="progress_activity" class="animate-spin text-muted shrink-0" />
  </button>
</template>
