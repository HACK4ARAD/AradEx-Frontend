<script setup lang="ts">
// T23 · W14 Contul meu · Setări (design/final web `accountPage('settings')`, ca Profilul din aplicație, S11): numele, telefonul,
// rolul (vine din cont), limba (RO / EN, salvată în cont), securitatea (parola, codul de recuperare) și deconectarea.
// Fără rândurile doar din aplicație (Salvate are tab-ul lui).
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import LocaleSwitch from '@/shared/components/profile/LocaleSwitch.vue'
import AccountSecurity from '@/shared/components/profile/AccountSecurity.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

function logout() {
  auth.logout()
  ui.toast(t('profile.loggedOut'))
  router.push('/')
}
</script>

<template>
  <div class="max-w-[640px]">
    <h2 class="text-[24px] font-semibold tracking-[-0.02em] m-0">{{ t('profile.settings.title') }}</h2>

    <div v-if="auth.user" class="bg-white border border-line rounded-[16px] px-4 mt-4">
      <div class="flex items-center gap-3 py-3.5 border-b border-line">
        <AppIcon name="person" class="text-muted" />
        <span class="flex-1 text-[15px]">{{ t('profile.settings.name') }}</span>
        <b class="text-[15px] font-semibold text-right min-w-0 truncate">{{ auth.user.displayName }}</b>
      </div>
      <div v-if="auth.user.phone" class="flex items-center gap-3 py-3.5 border-b border-line">
        <AppIcon name="call" class="text-muted" />
        <span class="flex-1 text-[15px]">{{ t('profile.settings.phone') }}</span>
        <span class="text-[15px] text-muted">{{ auth.user.phone }}</span>
      </div>
      <div v-if="auth.user.email" class="flex items-center gap-3 py-3.5 border-b border-line">
        <AppIcon name="mail" class="text-muted" />
        <span class="flex-1 text-[15px]">{{ t('profile.settings.email') }}</span>
        <span class="text-[15px] text-muted min-w-0 truncate">{{ auth.user.email }}</span>
      </div>
      <div class="flex items-center gap-3 py-3.5 border-b border-line">
        <AppIcon name="shield_person" class="text-muted" />
        <span class="flex-1 text-[15px]">{{ t('profile.settings.role') }}</span>
        <span class="rounded-full bg-soft text-[13px] font-semibold px-2.5 py-1">{{ t(`auth.role.${auth.user.role}`) }}</span>
      </div>
      <div class="flex flex-wrap items-center gap-3 py-3.5">
        <AppIcon name="language" class="text-muted" />
        <span class="flex-1 text-[15px]">{{ t('profile.settings.language') }}</span>
        <LocaleSwitch />
      </div>
    </div>
    <p class="text-muted text-[12.5px] mt-2 px-1">{{ t('profile.roleHint') }}</p>

    <AccountSecurity v-if="auth.user" ui="w" />

    <div class="bg-white border border-line rounded-[16px] px-4 mt-4">
      <button type="button" class="w-full flex items-center gap-3 py-3.5 text-left text-bad" @click="logout">
        <AppIcon name="logout" />
        <span class="flex-1"><b class="block text-[15px] font-semibold">{{ t('profile.settings.logout') }}</b><small class="text-muted text-[13px]">{{ t('profile.settings.logoutText') }}</small></span>
      </button>
    </div>
  </div>
</template>
