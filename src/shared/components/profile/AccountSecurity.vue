<script setup lang="ts">
// Securitatea contului (web: Contul meu › Setări; aplicație: Profil): „Schimbă parola” și „Cod de recuperare nou”, fiecare
// într-un sheet; codul nou se arată o singură dată (RecoveryCodeNotice). Avertisment dacă contul n-are încă un cod de recuperare.
// Conturile demo (`@demo.ro`) nu-și pot schimba parola: doar o notă.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppInput, AppSheet } from '@/shared/components'
import PasswordChangeForm from '@/shared/components/auth/PasswordChangeForm.vue'
import RecoveryCodeNotice from '@/shared/components/auth/RecoveryCodeNotice.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import { isDemoAccount, type Ui } from '@/shared/composables/useAuthForm'
import { useNewRecoveryCode } from '@/shared/composables/useAccountSecurity'

const props = defineProps<{ ui: Ui }>()
const { t } = useI18n()
const auth = useAuthStore()
const toasts = useUiStore()

const demo = computed(() => isDemoAccount(auth.user))
const sheet = ref<'password' | 'code' | null>(null)
const open = computed({ get: () => sheet.value !== null, set: (v) => { if (!v) close() } })
const card = computed(() => (props.ui === 'w' ? 'bg-white border border-line rounded-[16px] px-4' : 'bg-white rounded-[20px] px-4'))

const rc = useNewRecoveryCode()
const newCode = ref<string | null>(null)
const rcError = computed(() => (rc.error.value ? t(rc.error.value) : ''))

function show(kind: 'password' | 'code') {
  rc.password.value = ''
  rc.error.value = ''
  newCode.value = null
  sheet.value = kind
}
function close() {
  sheet.value = null
  newCode.value = null
}
function passwordDone() {
  toasts.toast(t('auth.passwordChange.changed'), 'success')
  close()
}
async function generate() {
  newCode.value = await rc.submit()
}
</script>

<template>
  <section data-test="account-security">
    <h3 class="text-[13px] font-semibold text-muted uppercase tracking-[.04em] m-0 mt-5 mb-2 px-1">{{ t('auth.security.title') }}</h3>
    <div :class="card">
      <div v-if="demo" class="flex items-start gap-3 py-3.5 text-[14px] text-muted" data-test="security-demo">
        <AppIcon name="lock" class="shrink-0" /><span>{{ t('auth.security.demo') }}</span>
      </div>
      <template v-else>
        <div v-if="auth.user?.hasRecoveryCode === false" class="flex items-start gap-2.5 my-3 px-3.5 py-3 rounded-[14px] bg-[#FBF0D9] text-[#8A5A00] text-[13.5px] leading-snug"
          role="status" data-test="security-no-code">
          <AppIcon name="warning" :size="18" class="shrink-0" /><span>{{ t('auth.security.noCode') }}</span>
        </div>
        <button type="button" class="w-full flex items-center gap-3 py-3.5 border-b border-line text-left" data-test="security-password" @click="show('password')">
          <AppIcon name="password" class="text-muted" />
          <span class="flex-1 min-w-0"><b class="block text-[15px] font-semibold">{{ t('auth.security.change') }}</b>
            <small class="text-muted text-[13px]">{{ t('auth.security.changeText') }}</small></span>
          <AppIcon name="chevron_right" class="text-muted" />
        </button>
        <button type="button" class="w-full flex items-center gap-3 py-3.5 text-left" data-test="security-code" @click="show('code')">
          <AppIcon name="key" class="text-muted" />
          <span class="flex-1 min-w-0"><b class="block text-[15px] font-semibold">{{ t('auth.security.newCode') }}</b>
            <small class="text-muted text-[13px]">{{ t('auth.security.newCodeText') }}</small></span>
          <AppIcon name="chevron_right" class="text-muted" />
        </button>
      </template>
    </div>

    <AppSheet v-model:open="open" :title="sheet === 'code' ? t('auth.security.newCode') : t('auth.security.change')">
      <PasswordChangeForm v-if="sheet === 'password'" :ui="ui" :show-title="false" @done="passwordDone" />
      <template v-else-if="sheet === 'code'">
        <RecoveryCodeNotice v-if="newCode" :code="newCode" :ui="ui" @continue="close" />
        <form v-else class="flex flex-col gap-3.5" novalidate data-test="recovery-form" @submit.prevent="generate">
          <p class="text-muted text-[14px] leading-relaxed m-0">{{ t('auth.security.newCodeSub') }}</p>
          <AppInput v-model="rc.password.value" :label="t('auth.passwordChange.current')" type="password" icon="lock" autocomplete="current-password" />
          <div v-if="rcError" role="alert" class="flex gap-2.5 items-start px-3.5 py-3 rounded-[14px] bg-[#FCE8E6] text-[#B3261E] text-[13.5px] leading-snug">
            <AppIcon name="error" :size="18" /><span>{{ rcError }}</span>
          </div>
          <AppButton type="submit" block :loading="rc.busy.value">{{ t('auth.security.generate') }}</AppButton>
        </form>
      </template>
    </AppSheet>
  </section>
</template>
