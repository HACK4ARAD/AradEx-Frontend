<script setup lang="ts">
/** Comutatorul Română / English din Profil (mobil, T03) și din Contul meu · Setări (web, T23); salvează limba în cont (`auth.changeLocale`). */
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { Locale } from '@/shared/i18n'

const { t, locale } = useI18n()
const auth = useAuthStore()
const ui = useUiStore()

function changeLocale(l: Locale) {
  if (l !== locale.value) auth.changeLocale(l).catch((e) => ui.error(e))
}
</script>

<template>
  <div class="inline-flex gap-0.5 p-[3px] rounded-[10px] bg-bg" role="radiogroup" :aria-label="t('profile.language')">
    <button v-for="l in (['ro', 'en'] as const)" :key="l" type="button" role="radio" :aria-checked="locale === l"
      class="h-8 px-3 rounded-lg text-[13px] font-semibold" :class="locale === l ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]' : 'text-muted'"
      @click="changeLocale(l)">{{ l === 'ro' ? 'Română' : 'English' }}</button>
  </div>
</template>
