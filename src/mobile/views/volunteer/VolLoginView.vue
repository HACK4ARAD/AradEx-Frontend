<script setup lang="ts">
// T18 · Conectare voluntar (design/final `/vol/login`): codul de 6 cifre primit „prin SMS” când Primăria i-a creat contul.
// Conturile demo (seed V13_1) apar doar în dev / VITE_DEMO.
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon } from '@/shared/components'
import { volunteerApi } from '@/shared/api/volunteer'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import { useBack } from '@/shared/composables/useBack'
import { DEMO_ENABLED, landingFor } from '@/shared/composables/useAuthForm'
import { routeRoles } from '@/router/guard'
import { volunteerErrorKey } from '@/shared/composables/useVolunteer'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const back = useBack('/login')
const code = ref('')
const error = ref<string | null>(null)
const busy = ref(false)
const DEMO = [{ code: '482913', name: 'Andrei Popa' }, { code: '731508', name: 'Maria Ionescu' }]

function onInput(e: Event) {
  code.value = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6)
  ;(e.target as HTMLInputElement).value = code.value
  error.value = null
}

async function login(c = code.value) {
  if (c.length !== 6 || busy.value) { error.value = t('volunteer.errors.wrongCode'); return }
  busy.value = true
  error.value = null
  try {
    const user = auth.acceptSession(await volunteerApi.login(c))
    ui.toast(t('volunteer.login.welcome', { name: user.displayName.split(' ')[0] }), 'success')
    router.replace(landingFor(user.role, 'm', route.query.next, (p) => routeRoles(router, p)))
  } catch (e) {
    error.value = t(volunteerErrorKey(e) ?? 'volunteer.errors.generic')
  } finally {
    busy.value = false
  }
}
function pick(c: string) { code.value = c; void login(c) }
</script>

<template>
  <div class="pt-1 pb-8">
    <button type="button" class="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center" :aria-label="t('common.back')" @click="back">
      <AppIcon name="arrow_back" />
    </button>
    <AppIcon name="badge" :size="44" class="block mt-6" />
    <h1 class="text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] mt-3 mb-0">{{ t('volunteer.login.title') }}</h1>
    <p class="text-muted text-[15px] mt-2.5 mb-0">{{ t('volunteer.login.text') }}</p>

    <form class="mt-6" @submit.prevent="login()">
      <label for="vol-code" class="block text-[14px] font-semibold mb-2">{{ t('volunteer.login.label') }}</label>
      <input id="vol-code" :value="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" data-test="vol-code"
        class="w-full h-16 rounded-[18px] bg-white border text-center font-mono text-[24px] tracking-[.3em] outline-none focus:border-ink placeholder:text-[#B8B7B1]"
        :class="error ? 'border-accent' : 'border-line'" :aria-invalid="!!error" @input="onInput">
      <div v-if="error" role="alert" class="flex items-start gap-2 mt-2.5 rounded-[14px] bg-bad-soft text-bad px-3 py-2.5 text-[13.5px]">
        <AppIcon name="error" :size="18" class="shrink-0 mt-px" />{{ error }}
      </div>
      <AppButton type="submit" block class="mt-3.5" :loading="busy" :disabled="code.length !== 6">{{ t('volunteer.login.submit') }}</AppButton>
    </form>

    <template v-if="DEMO_ENABLED">
      <p class="text-muted text-[13px] mt-6 mb-2">{{ t('volunteer.login.demo') }}</p>
      <div class="flex flex-wrap gap-2">
        <button v-for="d in DEMO" :key="d.code" type="button" class="h-9 px-3.5 rounded-full bg-white border border-line text-[14px] font-medium" @click="pick(d.code)">
          <span class="font-mono">{{ d.code }}</span> · {{ d.name }}
        </button>
      </div>
    </template>
  </div>
</template>
