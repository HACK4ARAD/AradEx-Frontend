<script setup lang="ts">
// „Am uitat parola” (din LoginForm, mobil + web): e-mailul + codul de recuperare + parola nouă. La reușită utilizatorul e
// conectat; LoginForm îi arată codul de recuperare NOU și apoi îl duce acasă. Fără cod: o notă cu „scrie-ne” (parolă temporară
// de la Admin). Logica e în usePasswordRecovery.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppInput } from '@/shared/components'
import { usePasswordRecovery } from '@/shared/composables/usePasswordRecovery'
import type { Ui } from '@/shared/composables/useAuthForm'
import type { UserDto } from '@/shared/types/auth'

const props = defineProps<{
  ui: Ui
  email?: string
  /** adresa de contact a site-ului (web: `CONTACT_EMAIL`); goală → nota apare fără adresă */
  contactEmail?: string
}>()
const emit = defineEmits<{ done: [user: UserDto, recoveryCode: string | null]; back: [] }>()

const { t } = useI18n()
const f = usePasswordRecovery(props.email ?? '')
const isWeb = props.ui === 'w'
const errorText = computed(() => (f.error.value ? t(f.error.value) : ''))

async function submit() {
  const res = await f.recover()
  if (res) emit('done', res.user, res.recoveryCode)
}
</script>

<template>
  <div>
    <h1 class="m-0 font-semibold tracking-[-0.025em] leading-tight" :class="isWeb ? 'text-[24px]' : 'text-[30px]'">{{ t('auth.recover.title') }}</h1>
    <p class="text-muted mt-2.5 mb-0 leading-relaxed" :class="isWeb ? 'text-[14px]' : 'text-[15px]'">{{ t('auth.recover.sub') }}</p>

    <form class="flex flex-col gap-3.5 mt-5" novalidate data-test="recover-form" @submit.prevent="submit">
      <AppInput v-model="f.email.value" :label="t('auth.email')" type="email" icon="mail" placeholder="nume@exemplu.ro" autocomplete="username" />
      <label class="block">
        <span class="block text-[14px] font-semibold mb-2">{{ t('auth.recover.code') }}</span>
        <input v-model="f.recoveryCode.value" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" placeholder="K7QM-4XPT-9DWA"
          data-test="recover-code"
          class="w-full h-14 px-4 bg-white border border-line rounded-[14px] text-[20px] tracking-[0.12em] font-mono font-semibold text-center uppercase outline-none focus:border-ink placeholder:text-[#C9C9C2]" />
      </label>
      <AppInput v-model="f.password.value" :label="t('auth.recover.newPassword')" type="password" icon="lock" :placeholder="t('auth.passwordPh')"
        autocomplete="new-password" />

      <div v-if="errorText" role="alert" class="flex gap-2.5 items-start px-3.5 py-3 rounded-[14px] bg-[#FCE8E6] text-[#B3261E] text-[13.5px] leading-snug">
        <AppIcon name="error" :size="18" /><span>{{ errorText }}</span>
      </div>

      <AppButton type="submit" block :loading="f.busy.value" class="mt-1">{{ t('auth.recover.submit') }}</AppButton>
    </form>

    <div class="flex gap-2.5 items-start px-3.5 py-3 rounded-xl bg-[#F1F1EC] text-muted text-[12.5px] leading-normal mt-3.5" data-test="recover-lost">
      <AppIcon name="support_agent" :size="18" class="shrink-0" />
      <span>{{ t('auth.recover.lost') }}
        <a v-if="contactEmail" :href="`mailto:${contactEmail}`" class="font-semibold text-ink underline underline-offset-2 break-all">{{ contactEmail }}</a></span>
    </div>

    <button type="button" class="flex mx-auto items-center gap-1 mt-4 text-[14px] font-semibold underline underline-offset-[3px] py-1" @click="emit('back')">
      {{ t('auth.recover.back') }}
    </button>
  </div>
</template>
