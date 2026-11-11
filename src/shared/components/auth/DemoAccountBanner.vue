<script setup lang="ts">
// Banda subțire pentru conturile demo publice (`@demo.ro`), sub bara de sus (web: WebLayout; aplicația: MobileLayout):
// oricine le folosește, deci fără date personale reale. Se închide pentru sesiunea curentă (sessionStorage; fără acces
// la storage rămâne închisă doar până la reîncărcare).
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useAuthStore } from '@/shared/stores/auth'
import { isDemoAccount } from '@/shared/composables/useAuthForm'

const KEY = 'ax.demoBanner.dismissed'
const { t } = useI18n()
const auth = useAuthStore()

function stored(): boolean {
  try { return sessionStorage.getItem(KEY) === '1' } catch { return false }
}
const dismissed = ref(stored())
const shown = computed(() => isDemoAccount(auth.user) && !dismissed.value)

function dismiss() {
  dismissed.value = true
  try { sessionStorage.setItem(KEY, '1') } catch { /* privat / blocat: doar până la reîncărcare */ }
}
</script>

<template>
  <div v-if="shown" class="flex items-start gap-2 px-3.5 py-2 bg-[#FFF4D6] text-[#5C4300] text-[12.5px] leading-snug border-b border-[#F3E2B0]"
    role="note" data-test="demo-banner">
    <AppIcon name="info" :size="16" class="shrink-0 mt-px" />
    <span class="flex-1 min-w-0">{{ t('auth.demoBanner.text') }}</span>
    <button type="button" class="shrink-0 -my-1 -mr-1.5 w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5"
      :aria-label="t('auth.demoBanner.dismiss')" data-test="demo-banner-close" @click="dismiss">
      <AppIcon name="close" :size="16" />
    </button>
  </div>
</template>
