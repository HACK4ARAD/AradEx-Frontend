<script setup lang="ts">
/**
 * „Voluntar nou” — design/final web `#/city/volunteers/new` (`.form` = `.fcard` + previzualizarea pe telefon `volPreview()`):
 * Persoana (nume, telefon pentru SMS, e-mail opțional, coordonator), Acțiuni alocate, „Cont de unică folosință”. În dreapta,
 * cardul negru din aplicație și SMS-ul (simulat) cu codul; codul real îl generează BE la creare.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import ActionChecks from '@/web/components/volunteer/ActionChecks.vue'
import * as P from '@/web/components/community/panel'
import { initials } from '@/shared/composables/useCommunity'
import { emptyVolunteerForm, validateVolunteerForm, type VolunteerForm } from '@/shared/composables/useVolunteer'
import type { ActionDto } from '@/shared/types/community'
import type { CoordinatorDto } from '@/shared/types/volunteer'

const props = defineProps<{ actions: ActionDto[]; coordinators: CoordinatorDto[]; defaultCoordinator?: number; saving?: boolean }>()
const emit = defineEmits<{ submit: [form: VolunteerForm]; cancel: [] }>()
const { t } = useI18n()
const form = reactive<VolunteerForm>({ ...emptyVolunteerForm(), coordinatorId: props.defaultCoordinator ?? props.coordinators[0]?.id ?? null })
const errors = ref<Record<string, string>>({})
const tried = ref(false)

const err = (k: string) => (errors.value[k] ? t(`volunteer.form.errors.${errors.value[k]}`) : '')
const invalid = (k: string) => (errors.value[k] ? '!border-accent' : '')
const coordName = computed(() => props.coordinators.find((c) => c.id === form.coordinatorId)?.name ?? '')
const firstName = computed(() => form.name.trim().split(/\s+/)[0] || t('volunteer.role').toLowerCase())

function submit() {
  tried.value = true
  errors.value = validateVolunteerForm(form)
  if (Object.keys(errors.value).length) return
  emit('submit', { ...form })
}
function revalidate() { if (tried.value) errors.value = validateVolunteerForm(form) }
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-5 items-start">
    <form :class="P.FCARD" novalidate data-test="volunteer-form" @submit.prevent="submit" @input="revalidate">
      <div :class="P.FSEC">{{ t('volunteer.form.person') }}</div>
      <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('volunteer.form.name') }}</span>
        <input v-model="form.name" :class="[P.INPUT, invalid('name')]" :placeholder="t('volunteer.form.namePh')" maxlength="120" autocomplete="off" data-test="vf-name">
        <span v-if="err('name')" class="text-[12.5px] text-accent">{{ err('name') }}</span></label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('volunteer.form.phone') }}</span>
          <input v-model="form.phone" type="tel" inputmode="tel" :class="[P.INPUT, invalid('phone')]" :placeholder="t('volunteer.form.phonePh')" maxlength="30" data-test="vf-phone">
          <span v-if="err('phone')" class="text-[12.5px] text-accent">{{ err('phone') }}</span></label>
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('volunteer.form.email') }}</span>
          <input v-model="form.email" type="email" :class="[P.INPUT, invalid('email')]" maxlength="190">
          <span v-if="err('email')" class="text-[12.5px] text-accent">{{ err('email') }}</span></label>
      </div>
      <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('volunteer.form.coordinator') }}</span>
        <select v-model="form.coordinatorId" :class="P.INPUT"><option v-for="c in coordinators" :key="c.id" :value="c.id">{{ c.name }}</option></select></label>

      <div :class="P.FSEC">{{ t('volunteer.form.allocated') }}</div>
      <div class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('volunteer.form.participates') }}</span>
        <ActionChecks v-model="form.actionIds" :actions="actions" /></div>
      <button type="button" role="switch" :aria-checked="form.oneTime" class="flex items-center justify-between gap-3 px-3.5 py-3 border border-line rounded-[10px] bg-white text-left w-full"
        data-test="vf-onetime" @click="form.oneTime = !form.oneTime">
        <span><b class="block text-[13.5px]">{{ t('volunteer.form.oneTime') }}</b><span class="block text-[12.5px] text-muted mt-0.5">{{ t('volunteer.form.oneTimeHint') }}</span></span>
        <span class="relative w-[38px] h-[22px] shrink-0 rounded-full transition-colors" :class="form.oneTime ? 'bg-ok' : 'bg-[#D7D6D0]'">
          <span class="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-[left]" :class="form.oneTime ? 'left-[19px]' : 'left-[3px]'" /></span>
      </button>

      <div class="flex flex-wrap gap-2.5 justify-end pt-4 border-t border-line">
        <button type="button" :class="P.BTN_SEC" :disabled="saving" @click="emit('cancel')">{{ t('volunteer.form.cancel') }}</button>
        <button type="submit" :class="P.BTN" :disabled="saving" data-test="vf-submit"><AppIcon name="sms" :size="16" />{{ t('volunteer.form.create') }}</button>
      </div>
    </form>

    <!-- previzualizare pe telefon: cardul din „Acțiunile tale” + SMS-ul (simulat) -->
    <div class="xl:sticky xl:top-[84px] bg-[#0A0A0A] rounded-[38px] p-[9px] shadow-[0_24px_60px_rgba(0,0,0,.18)]">
      <div class="bg-bg rounded-[30px] px-3.5 pt-[18px] pb-[22px] min-h-[440px] flex flex-col gap-3">
        <div class="text-[11px] font-bold text-[#6E6E73] tracking-[.07em] uppercase text-center">{{ t('volunteer.form.preview') }}</div>
        <div class="rounded-[20px] bg-ink text-white p-3.5 flex flex-col gap-3">
          <div class="flex items-center gap-2.5">
            <span class="w-10 h-10 shrink-0 rounded-full bg-white text-ink text-[14px] font-bold flex items-center justify-center">{{ initials(form.name || 'V N') }}</span>
            <div class="min-w-0 flex-1"><b class="block text-[15px] leading-tight" :class="form.name ? '' : 'opacity-60'">{{ form.name || t('volunteer.form.previewName') }}</b>
              <span v-if="coordName" class="block text-[12px] opacity-70">{{ t('volunteer.account.coordinator', { name: coordName }) }}</span></div>
            <span class="shrink-0 h-6 px-2.5 rounded-full bg-accent text-white text-[12px] font-bold inline-flex items-center">{{ t('volunteer.role') }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="[n, l] in [[form.actionIds.length, t('volunteer.actions.statAssigned')], [0, t('volunteer.form.statScanned')], ['—', t('volunteer.actions.statToScan')]]" :key="String(l)"
              class="rounded-[10px] bg-white/10 px-2 py-2"><b class="block text-[18px] leading-tight">{{ n }}</b><span class="block text-[11px] opacity-70 leading-snug">{{ l }}</span></div>
          </div>
          <span class="text-[12px] opacity-70">{{ t('volunteer.account.createdBy') }}<template v-if="form.oneTime"> · {{ t('volunteer.account.oneTime') }}</template></span>
        </div>
        <div class="rounded-[16px] bg-white shadow-[0_2px_10px_rgba(0,0,0,.08)] p-3.5">
          <div class="text-[11px] font-bold tracking-[.06em] text-[#6E6E73] uppercase">{{ t('volunteer.form.sms') }}</div>
          <p class="text-[13px] mt-1.5 mb-0 leading-relaxed">{{ t('volunteer.form.smsText', { name: firstName, code: '••••••' }) }}</p>
          <p class="text-[11.5px] text-muted mt-1.5 mb-0">{{ t('volunteer.form.smsCode') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
