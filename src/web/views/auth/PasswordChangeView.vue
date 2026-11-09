<script setup lang="ts">
// „Parolă nouă” pe web (/password): cine a intrat cu o parolă temporară de la Admin e ținut aici de guard până își alege alta.
// Formularul (și codul de recuperare nou) e în PasswordChangeForm; după reușită, contul merge acasă la rolul lui.
// Pagină întreagă, ca login-ul (fără bara site-ului, ale cărei linkuri ar duce tot aici).
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import PasswordChangeForm from '@/shared/components/auth/PasswordChangeForm.vue'
import { homeFor } from '@/shared/composables/useAuthForm'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

async function done() {
  ui.toast(t('auth.passwordChange.changed'), 'success')
  await router.replace(auth.user ? homeFor(auth.user.role, 'w') : '/')
}
function logout() {
  auth.logout()
  router.replace('/login')
}
</script>

<template>
  <main class="min-h-dvh flex items-center justify-center px-4 py-10 sm:p-10 bg-bg">
    <div class="w-full max-w-[460px] flex flex-col gap-3.5">
      <div class="flex items-center gap-2 font-bold text-[15px] text-ink mb-2">
        <img src="@/shared/assets/logo-ax.png" alt="AradExperience" class="h-[18px] w-auto shrink-0" /> {{ t('app.name') }}
      </div>
      <PasswordChangeForm ui="w" forced @done="done" />
      <button type="button" class="self-center inline-flex items-center gap-1 text-[13px] text-muted mt-2" data-test="logout" @click="logout">
        <AppIcon name="logout" :size="16" /> {{ t('nav.logout') }}
      </button>
    </div>
  </main>
</template>
