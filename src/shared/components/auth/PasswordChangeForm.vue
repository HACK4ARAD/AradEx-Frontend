<script setup lang="ts">
// Schimbarea parolei, comună mobil + web: ecranul „Parolă nouă” (după o parolă temporară de la Admin, `forced`) și
// „Schimbă parola” din cont. Parola actuală + cea nouă → POST /me/password; dacă vine un cod de recuperare nou, se arată
// (RecoveryCodeNotice) înainte de `done`. Logica e în useChangePassword.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppInput } from '@/shared/components'
import RecoveryCodeNotice from '@/shared/components/auth/RecoveryCodeNotice.vue'
import { useChangePassword } from '@/shared/composables/useAccountSecurity'
import type { Ui } from '@/shared/composables/useAuthForm'

const props = withDefaults(defineProps<{ ui: Ui; forced?: boolean; showTitle?: boolean }>(), { forced: false, showTitle: true })
const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()
const f = useChangePassword()
const code = ref<string | null>(null)
const isWeb = props.ui === 'w'
const errorText = computed(() => (f.error.value ? t(f.error.value) : ''))

async function submit() {
  const res = await f.submit()
  if (!res) return
  if (res.recoveryCode) code.value = res.recoveryCode
  else emit('done')
}
</script>

<template>
  <RecoveryCodeNotice v-if="code" :code="code" :ui="ui" @continue="emit('done')" />
  <div v-else>
    <template v-if="showTitle">
      <h1 class="m-0 font-semibold tracking-[-0.025em] leading-tight" :class="isWeb ? 'text-[24px]' : 'text-[30px]'">
        {{ t(forced ? 'auth.password.forcedTitle' : 'auth.password.title') }}
      </h1>
      <p v-if="forced" class="text-muted mt-2.5 mb-0 leading-relaxed" :class="isWeb ? 'text-[14px]' : 'text-[15px]'">{{ t('auth.password.forcedSub') }}</p>
    </template>
    <form class="flex flex-col gap-3.5" :class="showTitle ? 'mt-5' : ''" novalidate data-test="password-form" @submit.prevent="submit">
      <AppInput v-model="f.currentPassword.value" :label="t(forced ? 'auth.password.currentTemporary' : 'auth.password.current')" type="password" icon="lock"
        autocomplete="current-password" />
      <AppInput v-model="f.newPassword.value" :label="t('auth.password.new')" type="password" icon="lock_reset" :placeholder="t('auth.passwordPh')"
        autocomplete="new-password" />
      <div v-if="errorText" role="alert" class="flex gap-2.5 items-start px-3.5 py-3 rounded-[14px] bg-[#FCE8E6] text-[#B3261E] text-[13.5px] leading-snug">
        <AppIcon name="error" :size="18" /><span>{{ errorText }}</span>
      </div>
      <AppButton type="submit" block :loading="f.busy.value" class="mt-1">{{ t('auth.password.submit') }}</AppButton>
    </form>
  </div>
</template>
