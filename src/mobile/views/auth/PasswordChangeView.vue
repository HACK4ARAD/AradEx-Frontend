<script setup lang="ts">
// „Parolă nouă” în aplicație (/password): cine a intrat cu o parolă temporară de la Admin e ținut aici de guard până își alege
// alta. Formularul (și codul de recuperare nou) e în PasswordChangeForm; după reușită, contul merge acasă la rolul lui.
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PasswordChangeForm from '@/shared/components/auth/PasswordChangeForm.vue'
import { homeFor } from '@/shared/composables/useAuthForm'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

async function done() {
  ui.toast(t('auth.password.changed'), 'success')
  await router.replace(auth.user ? homeFor(auth.user.role, 'm') : '/')
}
function logout() {
  auth.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="pt-4 pb-8">
    <div class="flex items-center gap-2 text-[15px] font-bold mb-4">
      <img src="@/shared/assets/logo-ax.png" alt="AradExperience" class="h-[18px] w-auto shrink-0" /> {{ t('app.name') }}
    </div>
    <PasswordChangeForm ui="m" forced @done="done" />
    <button type="button" class="block mx-auto mt-5 text-[14px] font-semibold text-muted underline underline-offset-[3px] py-1" data-test="logout" @click="logout">
      {{ t('nav.logout') }}
    </button>
  </div>
</template>
