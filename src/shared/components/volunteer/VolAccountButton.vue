<script setup lang="ts">
/**
 * Avatarul din colțul ecranelor de voluntar (design/final `/vol/*`): inițialele pe cerc negru; deschide un sheet cu numele,
 * coordonatorul și „Deconectează-te” (voluntarul nu are Profil).
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppSheet } from '@/shared/components'
import { initials } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'

defineProps<{ coordinator?: string; oneTime?: boolean }>()
const auth = useAuthStore()
const router = useRouter()
const { t } = useI18n()
const open = ref(false)

function logout() {
  open.value = false
  auth.logout()
  router.replace('/vol/login')
}
</script>

<template>
  <button type="button" class="w-11 h-11 shrink-0 rounded-full bg-ink text-white text-[17px] font-bold flex items-center justify-center"
    :aria-label="t('volunteer.account.aria')" data-test="vol-account" @click="open = true">{{ initials(auth.user?.displayName) }}</button>
  <AppSheet v-model:open="open" :title="auth.user?.displayName">
    <p class="text-muted text-[14px] m-0">{{ t('volunteer.role') }}<template v-if="coordinator"> · {{ t('volunteer.account.coordinator', { name: coordinator }) }}</template></p>
    <p class="text-muted text-[13px] mt-1 mb-0">{{ t('volunteer.account.createdBy') }}<template v-if="oneTime"> · {{ t('volunteer.account.oneTime') }}</template></p>
    <AppButton block variant="secondary" icon="logout" class="mt-5" @click="logout">{{ t('volunteer.account.logout') }}</AppButton>
  </AppSheet>
</template>
