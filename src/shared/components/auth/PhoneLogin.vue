<script setup lang="ts">
// T21 · S12 (mobil) și W0 „Cont personal” (web, T23) pentru conturile personale: telefon → cod OTP → (număr nou) nume + Vizitator / Localnic.
// Logica e în usePhoneLogin; aici doar ecranul. Numerele de demo 0799000xxx primesc codul pe ecran, fără SMS.
import { computed, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppInput } from '@/shared/components'
import { useUiStore } from '@/shared/stores/ui'
import { DEMO_ENABLED, landingFor } from '@/shared/composables/useAuthForm'
import { usePhoneLogin } from '@/shared/composables/usePhoneLogin'
import type { UserDto } from '@/shared/types/auth'

const props = withDefaults(defineProps<{
  /** numerele demo afișate ca scurtături (doar în dev / VITE_DEMO) */
  demoPhones?: { label: string; phone: string }[]
  /** aplicația: după login, fiecare rol merge acasă la el în aplicația curentă */
  ui?: 'm' | 'w'
}>(), { demoPhones: () => [], ui: 'm' })

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const ui = useUiStore()
const f = usePhoneLogin()
const codeInput = ref<HTMLInputElement | null>(null)

const shownPhone = computed(() => f.phone.value.trim())
const errorText = computed(() => (f.error.value ? t(f.error.value) : ''))

async function done(u: UserDto | null) {
  if (!u) return
  ui.toast(t('auth.welcome', { name: u.displayName.split(' ')[0] }), 'success')
  await router.replace(landingFor(u.role, props.ui, route.query.next, (p) => { const r = router.resolve(p); return r.name ? r.meta.roles : null }))
}

async function send() {
  await f.send()
  if (f.step.value === 'code') { await nextTick(); codeInput.value?.focus() }
}
function useDemo(phone: string) {
  f.restart()
  f.phone.value = phone
}
</script>

<template>
  <div>
    <!-- 1 · numărul -->
    <template v-if="f.step.value === 'phone'">
      <h1 class="m-0 font-semibold tracking-[-0.025em] leading-tight text-[30px]">{{ t('auth.phone.title') }}</h1>
      <p class="text-muted mt-2.5 mb-0 leading-relaxed text-[15px]">{{ t('auth.phone.sub') }}</p>
      <form class="flex flex-col gap-3.5 mt-5" novalidate @submit.prevent="send">
        <AppInput v-model="f.phone.value" :label="t('auth.phone.label')" type="tel" icon="call" :placeholder="t('auth.phone.placeholder')"
          autocomplete="tel" />
        <AppButton type="submit" block :loading="f.busy.value" class="mt-1">{{ t('auth.phone.send') }}</AppButton>
      </form>
    </template>

    <!-- 2 · codul -->
    <template v-else-if="f.step.value === 'code'">
      <h1 class="m-0 font-semibold tracking-[-0.025em] leading-tight text-[30px]">{{ t('auth.phone.codeTitle') }}</h1>
      <p class="text-muted mt-2.5 mb-0 leading-relaxed text-[15px]">{{ t('auth.phone.codeSub', { phone: shownPhone }) }}</p>
      <div v-if="f.info.value" class="flex gap-2.5 items-center px-3.5 py-3 rounded-[14px] bg-soft text-ink text-[14px] mt-4" role="status">
        <AppIcon name="sms" :size="18" /><span>{{ t(f.info.value) }}</span>
      </div>
      <div v-if="f.demoCode.value" class="flex gap-2.5 items-center px-3.5 py-3 rounded-[14px] bg-[#FFF4D6] text-[#5C4300] text-[14px] mt-4" role="status">
        <AppIcon name="sms" :size="18" /><span>{{ t('auth.phone.demoCode', { code: f.demoCode.value }) }}</span>
      </div>
      <form class="flex flex-col gap-3.5 mt-5" novalidate @submit.prevent="f.verify().then(done)">
        <label class="block">
          <span class="block text-[14px] font-semibold mb-2">{{ t('auth.phone.codeLabel') }}</span>
          <input ref="codeInput" v-model="f.code.value" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••"
            class="w-full h-14 px-4 bg-white border border-line rounded-[14px] text-[24px] tracking-[0.4em] font-semibold text-center outline-none focus:border-ink" />
        </label>
        <AppButton type="submit" block :loading="f.busy.value" class="mt-1">{{ t('auth.phone.verify') }}</AppButton>
        <div class="flex items-center justify-between text-[14px]">
          <button type="button" class="font-semibold underline underline-offset-[3px] py-1" @click="f.restart()">{{ t('auth.phone.changeNumber') }}</button>
          <span v-if="f.cooldown.value > 0" class="text-muted">{{ t('auth.phone.resendIn', { s: f.cooldown.value }) }}</span>
          <button v-else type="button" class="font-semibold underline underline-offset-[3px] py-1" :disabled="f.busy.value" @click="send">{{ t('auth.phone.resend') }}</button>
        </div>
      </form>
    </template>

    <!-- 3 · cont nou -->
    <template v-else>
      <h1 class="m-0 font-semibold tracking-[-0.025em] leading-tight text-[30px]">{{ t('auth.phone.profileTitle') }}</h1>
      <p class="text-muted mt-2.5 mb-0 leading-relaxed text-[15px]">{{ t('auth.phone.profileSub') }}</p>
      <form class="flex flex-col gap-3.5 mt-5" novalidate @submit.prevent="f.register().then(done)">
        <AppInput v-model="f.displayName.value" :label="t('auth.name')" icon="person" :placeholder="t('auth.namePh')" autocomplete="name" />
        <div>
          <span class="block text-[14px] font-semibold mb-2">{{ t('auth.useAs') }}</span>
          <div class="flex gap-2">
            <button v-for="r in (['VISITOR', 'LOCAL'] as const)" :key="r" type="button" :aria-pressed="f.role.value === r"
              class="flex-1 min-w-0 rounded-2xl bg-white flex flex-col items-center gap-0.5 text-center"
              :class="f.role.value === r ? 'border-2 border-ink p-[11px]' : 'border border-line p-3'" @click="f.role.value = r">
              <b class="text-[14px]">{{ t(`auth.role.${r}`) }}</b>
              <span class="text-[11.5px] text-muted leading-tight">{{ t(`auth.roleHint.${r}`) }}</span>
            </button>
          </div>
        </div>
        <AppButton type="submit" block :loading="f.busy.value" class="mt-1">{{ t('auth.phone.submitProfile') }}</AppButton>
      </form>
    </template>

    <div v-if="errorText" role="alert" class="flex gap-2.5 items-start px-3.5 py-3 rounded-[14px] bg-[#FCE8E6] text-[#B3261E] text-[13.5px] leading-snug mt-3.5">
      <AppIcon name="error" :size="18" /><span>{{ errorText }}</span>
    </div>

    <template v-if="DEMO_ENABLED && demoPhones?.length && f.step.value === 'phone'">
      <div class="h-px bg-line my-5" />
      <div class="text-[13px] text-muted mb-2">{{ t('auth.phone.demoPhones') }}</div>
      <div class="flex flex-wrap gap-2">
        <button v-for="d in demoPhones" :key="d.phone" type="button" class="h-9 px-3 rounded-full bg-white border border-line text-[13px] font-medium"
          @click="useDemo(d.phone)">{{ d.label }} · {{ d.phone }}</button>
      </div>
    </template>
  </div>
</template>
