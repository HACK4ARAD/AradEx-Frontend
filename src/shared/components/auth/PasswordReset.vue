<script setup lang="ts">
// „Am uitat parola” (din LoginForm, mobil + web): 1 · adresa de e-mail → mesaj neutru („dacă există un cont…”);
// 2 · codul de 6 cifre din e-mail + parola nouă → utilizatorul e conectat (LoginForm îl duce acasă). Logica e în usePasswordReset.
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppInput } from '@/shared/components'
import { useUiStore } from '@/shared/stores/ui'
import { usePasswordReset } from '@/shared/composables/usePasswordReset'
import type { Ui } from '@/shared/composables/useAuthForm'
import type { UserDto } from '@/shared/types/auth'

const props = defineProps<{ ui: Ui; email?: string }>()
const emit = defineEmits<{ done: [user: UserDto]; back: [] }>()

const { t } = useI18n()
const toasts = useUiStore()
const f = usePasswordReset(props.email ?? '')
const codeInput = ref<HTMLInputElement | null>(null)
const isWeb = props.ui === 'w'
const errorText = computed(() => (f.error.value ? t(f.error.value) : ''))

async function send() {
  const resend = f.step.value === 'code'
  if (!(await f.send())) return
  if (resend) toasts.toast(t('auth.forgot.resent'), 'success')
  else { await nextTick(); codeInput.value?.focus() }
}
async function reset() {
  const u = await f.reset()
  if (u) emit('done', u)
}
</script>

<template>
  <div>
    <h1 class="m-0 font-semibold tracking-[-0.025em] leading-tight" :class="isWeb ? 'text-[24px]' : 'text-[30px]'">
      {{ t(f.step.value === 'email' ? 'auth.forgot.title' : 'auth.forgot.codeTitle') }}
    </h1>

    <!-- 1 · adresa -->
    <template v-if="f.step.value === 'email'">
      <p class="text-muted mt-2.5 mb-0 leading-relaxed" :class="isWeb ? 'text-[14px]' : 'text-[15px]'">{{ t('auth.forgot.sub') }}</p>
      <form class="flex flex-col gap-3.5 mt-5" novalidate data-test="forgot-email" @submit.prevent="send">
        <AppInput v-model="f.email.value" :label="t('auth.email')" type="email" icon="mail" placeholder="nume@exemplu.ro" autocomplete="email" />
        <AppButton type="submit" block :loading="f.busy.value" class="mt-1">{{ t('auth.forgot.send') }}</AppButton>
      </form>
    </template>

    <!-- 2 · codul + parola nouă -->
    <template v-else>
      <div class="flex gap-2.5 items-start px-3.5 py-3 rounded-[14px] bg-soft text-ink text-[14px] leading-snug mt-4" role="status" data-test="forgot-sent">
        <AppIcon name="mark_email_read" :size="18" class="shrink-0" /><span>{{ t('auth.forgot.sent') }}</span>
      </div>
      <form class="flex flex-col gap-3.5 mt-5" novalidate data-test="forgot-code" @submit.prevent="reset">
        <label class="block">
          <span class="block text-[14px] font-semibold mb-2">{{ t('auth.forgot.codeLabel') }}</span>
          <input ref="codeInput" v-model="f.code.value" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" placeholder="••••••"
            class="w-full h-14 px-4 bg-white border border-line rounded-[14px] text-[24px] tracking-[0.4em] font-semibold text-center outline-none focus:border-ink" />
        </label>
        <AppInput v-model="f.password.value" :label="t('auth.forgot.newPassword')" type="password" icon="lock" :placeholder="t('auth.passwordPh')"
          autocomplete="new-password" />
        <AppButton type="submit" block :loading="f.busy.value" class="mt-1">{{ t('auth.forgot.submit') }}</AppButton>
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[14px]">
          <button type="button" class="font-semibold underline underline-offset-[3px] py-1" @click="f.restart()">{{ t('auth.forgot.otherEmail') }}</button>
          <span v-if="f.cooldown.value > 0" class="text-muted">{{ t('auth.forgot.resendIn', { s: f.cooldown.value }) }}</span>
          <button v-else type="button" class="font-semibold underline underline-offset-[3px] py-1" :disabled="f.busy.value" @click="send">{{ t('auth.forgot.resend') }}</button>
        </div>
      </form>
    </template>

    <div v-if="errorText" role="alert" class="flex gap-2.5 items-start px-3.5 py-3 rounded-[14px] bg-[#FCE8E6] text-[#B3261E] text-[13.5px] leading-snug mt-3.5">
      <AppIcon name="error" :size="18" /><span>{{ errorText }}</span>
    </div>

    <button type="button" class="flex mx-auto items-center gap-1 mt-4 text-[14px] font-semibold underline underline-offset-[3px] py-1" @click="emit('back')">
      {{ t('auth.forgot.back') }}
    </button>
  </div>
</template>
