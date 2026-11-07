<script setup lang="ts">
// Formularul cu e-mail + parolă, comun mobil + web: conectarea firmelor, a Primăriei și a Adminului și, pe web, înregistrarea
// unei firme (contul rămâne neverificat până la Primărie/Admin). T21: conturile personale (Vizitator, Localnic) nu mai trec
// pe aici: intră cu telefon + cod OTP în aplicația mobilă (mobile/components/auth/PhoneLogin). View-urile adaugă doar rama.
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppInput } from '@/shared/components'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import {
  BUSINESS_CATEGORIES, DEMO_ENABLED, DEMO_PASSWORD, authErrorMessage, emptyAuthForm, landingFor, validateAuthForm,
  type AuthMode, type Ui,
} from '@/shared/composables/useAuthForm'
import type { RegisterRequest } from '@/shared/types/auth'

const props = withDefaults(defineProps<{
  ui: Ui
  /** conturile demo afișate ca scurtături (doar în dev / VITE_DEMO) */
  demoAccounts?: { label: string; email: string }[]
  /** fără „Creează cont” (tab-ul de panouri de pe web) */
  loginOnly?: boolean
}>(), { demoAccounts: () => [], loginOnly: false })

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const mode = ref<AuthMode>('login')
const form = reactive(emptyAuthForm())
const error = ref('')
const busy = ref(false)
const isWeb = props.ui === 'w'
const showDemo = DEMO_ENABLED

const title = computed(() => t(mode.value === 'business' ? 'auth.businessTitle' : 'auth.loginTitle'))
const subtitle = computed(() => {
  if (mode.value === 'business') return t('auth.businessSub')
  return t(isWeb ? 'auth.loginSubPanels' : 'auth.loginSubFirm')
})
const submitLabel = computed(() => t(mode.value === 'business' ? 'auth.submitBusiness' : 'auth.submitLogin'))

function setMode(m: AuthMode) { mode.value = m; error.value = '' }
/** Completează un cont demo; apelat și din exterior prin ref (cardurile de panouri de pe web). */
function useDemo(mail: string) { form.email = mail; form.password = DEMO_PASSWORD; setMode('login') }

function buildRegister(): RegisterRequest {
  const base = { email: form.email.trim(), password: form.password, displayName: form.displayName.trim() }
  if (mode.value === 'business') {
    return { ...base, role: 'BUSINESS', business: { name: form.businessName.trim(), category: form.businessCategory, address: form.businessAddress.trim() } }
  }
  return { ...base, role: form.role }
}

async function submit() {
  const invalid = validateAuthForm(form, mode.value)
  if (invalid) { error.value = t(invalid); return }
  error.value = ''
  busy.value = true
  try {
    const u = mode.value === 'login' ? await auth.login(form.email.trim(), form.password) : await auth.register(buildRegister())
    ui.toast(t(mode.value === 'business' ? 'auth.businessCreated' : 'auth.welcome', { name: u.displayName.split(' ')[0] }), 'success')
    await router.replace(landingFor(u.role, props.ui, route.query.next, (p) => { const r = router.resolve(p); return r.name ? r.meta.roles : null }))
  } catch (e) {
    const m = authErrorMessage(e, mode.value)
    error.value = 'key' in m ? t(m.key) : m.text
  } finally {
    busy.value = false
  }
}

defineExpose({ useDemo })
</script>

<template>
  <div>
    <h1 class="m-0 font-semibold tracking-[-0.025em] leading-tight" :class="isWeb ? 'text-[24px]' : 'text-[30px]'">{{ title }}</h1>
    <p class="text-muted mt-2.5 mb-0 leading-relaxed" :class="isWeb ? 'text-[14px]' : 'text-[15px]'">{{ subtitle }}</p>

    <form class="flex flex-col gap-3.5 mt-5" novalidate @submit.prevent="submit">
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

      <div v-if="error" role="alert" class="flex gap-2.5 items-start px-3.5 py-3 rounded-[14px] bg-[#FCE8E6] text-[#B3261E] text-[13.5px] leading-snug">
        <AppIcon name="error" :size="18" /><span>{{ error }}</span>
      </div>

      <AppButton type="submit" block :loading="busy" class="mt-1" :icon="mode === 'business' ? 'add_business' : undefined">{{ submitLabel }}</AppButton>

      <button v-if="mode === 'business'" type="button" class="self-center text-[14px] font-semibold underline underline-offset-[3px] py-1"
        @click="setMode('login')">
        {{ t('auth.toLogin') }}
      </button>
    </form>

    <div v-if="isWeb && !loginOnly && mode !== 'business'" class="flex gap-2.5 items-start px-3.5 py-3 rounded-xl bg-[#F1F1EC] text-muted text-[12.5px] leading-normal mt-3.5">
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
  </div>
</template>
