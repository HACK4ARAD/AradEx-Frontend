<script setup lang="ts">
// Formularul cu e-mail + parolă, comun mobil + web, pentru toate conturile (Vizitator, Localnic, firme, Primărie, Admin):
// conectarea, „Cont nou” (cont personal: Vizitator / Localnic), „Am uitat parola” (PasswordReset) și, pe web, în tab-ul de
// panouri, înregistrarea unei firme (contul rămâne neverificat până la Primărie/Admin). View-urile adaugă doar rama.
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PasswordReset from '@/shared/components/auth/PasswordReset.vue'
import TermsConsent from '@/shared/components/auth/TermsConsent.vue'
import { AppButton, AppIcon, AppInput } from '@/shared/components'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import {
  BUSINESS_CATEGORIES, DEMO_ENABLED, DEMO_PASSWORD, authErrorMessage, buildRegisterRequest, emptyAuthForm, landingFor, validateAuthForm,
  type AuthMode, type Ui,
} from '@/shared/composables/useAuthForm'
import type { UserDto } from '@/shared/types/auth'

const props = withDefaults(defineProps<{
  ui: Ui
  /** 'personal': cu „Cont nou” (Vizitator / Localnic); 'panels' (tab-ul de panouri de pe web): cu „Înregistrează-ți firma” */
  audience?: 'personal' | 'panels'
  /** conturile demo afișate ca scurtături (doar în dev / VITE_DEMO) */
  demoAccounts?: { label: string; email: string }[]
}>(), { audience: 'personal', demoAccounts: () => [] })

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const mode = ref<AuthMode | 'forgot'>('login')
const form = reactive(emptyAuthForm())
const error = ref('')
const busy = ref(false)
const isWeb = props.ui === 'w'
const showDemo = DEMO_ENABLED

const title = computed(() => t(mode.value === 'business' ? 'auth.businessTitle' : mode.value === 'register' ? 'auth.registerTitle' : 'auth.loginTitle'))
const subtitle = computed(() => {
  if (mode.value === 'business') return t('auth.businessSub')
  if (mode.value === 'register') return t(isWeb ? 'auth.registerSubWeb' : 'auth.registerSub')
  if (props.audience === 'panels') return t('auth.loginSubPanels')
  return t(isWeb ? 'auth.loginSubWeb' : 'auth.loginSub')
})
const submitLabel = computed(() => t(mode.value === 'business' ? 'auth.submitBusiness' : mode.value === 'register' ? 'auth.submitRegister' : 'auth.submitLogin'))

function setMode(m: AuthMode | 'forgot') { mode.value = m; error.value = '' }
/** Completează un cont demo; apelat și din exterior prin ref (cardurile de panouri de pe web). */
function useDemo(mail: string) { form.email = mail; form.password = DEMO_PASSWORD; setMode('login') }

/** După login, cont nou sau parolă nouă: salutul și pagina rolului (sau `?next=`). */
async function finish(u: UserDto, toastKey: string) {
  ui.toast(t(toastKey, { name: u.displayName.split(' ')[0] }), 'success')
  await router.replace(landingFor(u.role, props.ui, route.query.next, (p) => { const r = router.resolve(p); return r.name ? r.meta.roles : null }))
}

async function submit() {
  const m = mode.value
  if (m === 'forgot') return
  const invalid = validateAuthForm(form, m)
  if (invalid) { error.value = t(invalid); return }
  error.value = ''
  busy.value = true
  try {
    const u = m === 'login' ? await auth.login(form.email.trim(), form.password) : await auth.register(buildRegisterRequest(form, m))
    await finish(u, m === 'business' ? 'auth.businessCreated' : 'auth.welcome')
  } catch (e) {
    const msg = authErrorMessage(e, m)
    error.value = 'key' in msg ? t(msg.key) : msg.text
  } finally {
    busy.value = false
  }
}

defineExpose({ useDemo })
</script>

<template>
  <div>
    <PasswordReset v-if="mode === 'forgot'" :ui="props.ui" :email="form.email.trim()" @back="setMode('login')" @done="(u) => finish(u, 'auth.forgot.done')" />

    <template v-else>
      <h1 class="m-0 font-semibold tracking-[-0.025em] leading-tight" :class="isWeb ? 'text-[24px]' : 'text-[30px]'">{{ title }}</h1>
      <p class="text-muted mt-2.5 mb-0 leading-relaxed" :class="isWeb ? 'text-[14px]' : 'text-[15px]'">{{ subtitle }}</p>

      <form class="flex flex-col gap-3.5 mt-5" novalidate :data-test="`auth-${mode}`" @submit.prevent="submit">
        <template v-if="mode === 'business'">
          <AppInput v-model="form.businessName" :label="t('auth.businessName')" icon="storefront" :placeholder="t('auth.businessNamePh')" />
          <label class="block">
            <span class="block text-[14px] font-semibold mb-2">{{ t('auth.businessCategory') }}</span>
            <span class="flex items-center gap-2 h-12 px-3.5 bg-white border border-line rounded-[14px]">
              <AppIcon name="category" :size="20" class="text-muted" />
              <select v-model="form.businessCategory" class="flex-1 min-w-0 bg-transparent outline-none text-[16px]">
                <option v-for="c in BUSINESS_CATEGORIES" :key="c" :value="c">{{ t(`auth.category.${c}`) }}</option>
              </select>
            </span>
          </label>
          <AppInput v-model="form.businessAddress" :label="t('auth.businessAddress')" icon="location_on" :placeholder="t('auth.businessAddressPh')" />
        </template>

        <AppInput v-if="mode !== 'login'" v-model="form.displayName" :label="t(mode === 'business' ? 'auth.contactName' : 'auth.name')"
          icon="person" :placeholder="t('auth.namePh')" autocomplete="name" />
        <AppInput v-model="form.email" :label="t('auth.email')" type="email" icon="mail" placeholder="nume@exemplu.ro" autocomplete="email" />
        <AppInput v-model="form.password" :label="t('auth.password')" type="password" icon="lock" :placeholder="t('auth.passwordPh')"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" />

        <!-- cont nou personal: cum folosești aplicația -->
        <div v-if="mode === 'register'">
          <span class="block text-[14px] font-semibold mb-2">{{ t('auth.useAs') }}</span>
          <div class="flex gap-2">
            <button v-for="r in (['VISITOR', 'LOCAL'] as const)" :key="r" type="button" :aria-pressed="form.role === r" :data-test="`role-${r}`"
              class="flex-1 min-w-0 rounded-2xl bg-white flex flex-col items-center gap-0.5 text-center"
              :class="form.role === r ? 'border-2 border-ink p-[11px]' : 'border border-line p-3'" @click="form.role = r">
              <b class="text-[14px]">{{ t(`auth.role.${r}`) }}</b>
              <span class="text-[11.5px] text-muted leading-tight">{{ t(`auth.roleHint.${r}`) }}</span>
            </button>
          </div>
        </div>

        <div v-if="error" role="alert" class="flex gap-2.5 items-start px-3.5 py-3 rounded-[14px] bg-[#FCE8E6] text-[#B3261E] text-[13.5px] leading-snug">
          <AppIcon name="error" :size="18" /><span>{{ error }}</span>
        </div>

        <TermsConsent v-if="mode !== 'login'" v-model="form.acceptTerms" :invalid="error === t('auth.consent.required')" />
        <AppButton type="submit" block :loading="busy" class="mt-1" :icon="mode === 'business' ? 'add_business' : undefined">{{ submitLabel }}</AppButton>

        <div v-if="mode === 'login'" class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[14px]">
          <button type="button" class="font-semibold underline underline-offset-[3px] py-1" data-test="to-forgot" @click="setMode('forgot')">{{ t('auth.forgot.link') }}</button>
          <button v-if="audience === 'personal'" type="button" class="font-semibold underline underline-offset-[3px] py-1" data-test="to-register"
            @click="setMode('register')">{{ t('auth.newAccount') }}</button>
        </div>
        <button v-else type="button" class="self-center text-[14px] font-semibold underline underline-offset-[3px] py-1" @click="setMode('login')">
          {{ t('auth.toLogin') }}
        </button>
      </form>

      <div v-if="isWeb && audience === 'panels' && mode === 'login'" class="flex gap-2.5 items-start px-3.5 py-3 rounded-xl bg-[#F1F1EC] text-muted text-[12.5px] leading-normal mt-3.5">
        <AppIcon name="storefront" :size="18" />
        <span>{{ t('auth.businessPrompt') }}
          <button type="button" class="font-semibold text-ink underline underline-offset-2" @click="setMode('business')">{{ t('auth.businessCta') }}</button>
          {{ t('auth.businessPromptEnd') }}</span>
      </div>

      <template v-if="showDemo && demoAccounts.length">
        <div class="h-px bg-line my-5" />
        <div class="text-[13px] text-muted mb-2">{{ t('auth.demoAccounts') }}</div>
        <div class="flex flex-wrap gap-2">
          <button v-for="d in demoAccounts" :key="d.email" type="button"
            class="h-9 px-3 rounded-full bg-white border border-line text-[13px] font-medium"
            :class="form.email === d.email ? 'bg-ink! text-white border-ink' : ''" @click="useDemo(d.email)">{{ d.label }}</button>
        </div>
      </template>
    </template>
  </div>
</template>
