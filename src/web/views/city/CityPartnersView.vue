<script setup lang="ts">
// T14 · Panou Primărie › Firme partenere — design/final web `#/city/partners` (filtre Toate / De verificat / Active, tabel cu
// Verifică / Respinge / Suspendă) și `#/city/partners/new` (formular + previzualizarea cardului și a invitației). Primăria și Adminul.
// Lipsesc față de design: „Intră în cont” (fără API de impersonare), zona, „Făcut în Arad” și culoarea logo-ului (fără câmpuri în BE).
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppSheet, Skeleton } from '@/shared/components'
import * as P from '@/web/components/community/panel'
import { useFormat } from '@/shared/composables/useFormat'
import {
  BUSINESS_CATEGORIES, emptyPartnerForm, partnerFilter, toPartnerCreate, usePartners, validatePartnerForm,
  type PartnerFilter, type PartnerForm, type PartnerFormErrors,
} from '@/shared/composables/useAdmin'
import { useUiStore } from '@/shared/stores/ui'
import type { CityBusinessCreated, CityBusinessDto } from '@/shared/types/admin'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const f = useFormat()
const ui = useUiStore()
const partners = usePartners()
const filter = ref<PartnerFilter>(route.query.f === 'verify' ? 'verify' : 'all')
const isNew = computed(() => route.params.sub === 'new')

onMounted(() => partners.load())
watch(isNew, (v) => { window.scrollTo(0, 0); if (!v) partners.load() })

const rows = computed(() => partnerFilter(partners.list.value, filter.value))
const toVerifyCount = computed(() => partnerFilter(partners.list.value, 'verify').length)

/* ---- verifică / respinge / suspendă ---- */
const rejecting = ref<CityBusinessDto | null>(null)
const reason = ref('')
const rejectOpen = computed({ get: () => !!rejecting.value, set: (v) => { if (!v) rejecting.value = null } })
function askReject(b: CityBusinessDto) { rejecting.value = b; reason.value = '' }
async function confirmReject() {
  const b = rejecting.value
  if (!b) return
  const wasVerified = b.verified
  if (await partners.reject(b.id, reason.value.trim() || undefined)) {
    ui.toast(t(wasVerified ? 'admin.partners.suspended' : 'admin.partners.rejected'), 'info')
    rejecting.value = null
  }
}
async function verify(b: CityBusinessDto) {
  if (await partners.verify(b.id)) ui.toast(t('admin.partners.verified'), 'success')
}
function state(b: CityBusinessDto) {
  return b.verified ? { key: 'verified', tone: 'bg-ok-soft text-ok' } : b.rejectedAt ? { key: 'rejected', tone: 'bg-bad-soft text-bad' } : { key: 'toVerify', tone: 'bg-warn-soft text-warn' }
}

/* ---- firmă nouă ---- */
const form = reactive<PartnerForm>(emptyPartnerForm())
const errors = ref<PartnerFormErrors>({})
const err = (k: keyof PartnerForm) => (errors.value[k] ? t(errors.value[k] as string) : undefined)
const invalid = (k: keyof PartnerForm) => (errors.value[k] ? '!border-accent' : '')
// după prima încercare, erorile se recalculează pe măsură ce scrii (dispar când câmpul e corect)
watch(form, () => { if (Object.keys(errors.value).length) errors.value = validatePartnerForm(form) })
const created = ref<CityBusinessCreated | null>(null)
const createdOpen = computed({ get: () => !!created.value, set: (v) => { if (!v) closeCreated() } })

async function submit() {
  errors.value = validatePartnerForm(form)
  if (Object.keys(errors.value).length) return
  const res = await partners.create(toPartnerCreate(form))
  if (res) created.value = res
}
async function copyPassword() {
  if (!created.value) return
  try { await navigator.clipboard.writeText(created.value.invitePassword); ui.toast(t('admin.partners.created.copied'), 'success') } catch { /* fără clipboard: parola rămâne afișată */ }
}
function closeCreated() {
  created.value = null
  Object.assign(form, emptyPartnerForm())
  errors.value = {}
  router.push('/city/partners')
}
</script>

<template>
  <!-- ======== firmă nouă ======== -->
  <template v-if="isNew">
    <div :class="P.HEAD">
      <div><h1 :class="P.H1">{{ t('admin.partners.form.title') }}</h1><div :class="P.SUB">{{ t('admin.partners.form.sub') }}</div></div>
    </div>
    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-5 items-start">
      <form :class="P.FCARD" novalidate @submit.prevent="submit">
        <div :class="P.FSEC">{{ t('admin.partners.form.firm') }}</div>
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('admin.partners.form.name') }}</span>
          <input v-model="form.name" :class="[P.INPUT, invalid('name')]" :placeholder="t('admin.partners.form.namePh')" maxlength="160">
          <span v-if="err('name')" class="text-[12.5px] text-accent">{{ err('name') }}</span></label>
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('admin.partners.form.category') }}</span>
          <select v-model="form.category" :class="P.INPUT"><option v-for="c in BUSINESS_CATEGORIES" :key="c" :value="c">{{ t(`business.category.${c}`) }}</option></select></label>
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('admin.partners.form.address') }}</span>
          <input v-model="form.address" :class="[P.INPUT, invalid('address')]" :placeholder="t('admin.partners.form.addressPh')" maxlength="250">
          <span v-if="err('address')" class="text-[12.5px] text-accent">{{ err('address') }}</span>
          <span v-else :class="P.TS">{{ t('admin.partners.form.addressHint') }}</span></label>

        <div :class="P.FSEC">{{ t('admin.partners.form.contact') }}</div>
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('admin.partners.form.contactName') }}</span>
          <input v-model="form.contactName" :class="[P.INPUT, invalid('contactName')]" :placeholder="t('admin.partners.form.contactPh')" maxlength="120">
          <span v-if="err('contactName')" class="text-[12.5px] text-accent">{{ err('contactName') }}</span></label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('admin.partners.form.email') }}</span>
            <input v-model="form.email" type="email" autocomplete="off" :class="[P.INPUT, invalid('email')]" :placeholder="t('admin.partners.form.emailPh')" maxlength="190">
            <span v-if="err('email')" class="text-[12.5px] text-accent">{{ err('email') }}</span></label>
          <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('admin.partners.form.phone') }}</span>
            <input v-model="form.phone" type="tel" :class="P.INPUT" :placeholder="t('admin.partners.form.phonePh')" maxlength="40"></label>
        </div>
        <div class="flex flex-wrap justify-end gap-2 pt-1">
          <router-link to="/city/partners" :class="P.BTN_SEC">{{ t('admin.partners.cancel') }}</router-link>
          <button type="submit" :class="P.BTN" :disabled="partners.saving.value"><AppIcon name="add_business" :size="16" />{{ t('admin.partners.form.submit') }}</button>
        </div>
      </form>

      <!-- previzualizarea (design `firmPreview()`): cardul firmei în aplicație + invitația -->
      <div class="flex flex-col gap-2.5 xl:sticky xl:top-4">
        <div class="text-[11px] font-bold text-[#6E6E73] tracking-[.07em] uppercase text-center">{{ t('admin.partners.form.preview') }}</div>
        <div class="bg-[#F4F3EF] rounded-[28px] p-3.5 flex flex-col gap-3">
          <div class="bg-white rounded-2xl overflow-hidden border border-line">
            <div class="h-[110px] bg-[#8A6A4F] relative flex items-center justify-center text-white/80">
              <span class="absolute left-3 top-3 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFC244] text-ink">{{ t('admin.partners.form.previewOffer') }}</span>
              <AppIcon name="storefront" :size="34" />
            </div>
            <div class="p-3 flex flex-col gap-1">
              <div class="flex items-center justify-between gap-2">
                <b class="text-[16px] truncate" :class="form.name ? 'text-ink' : 'text-[#9a9a9a]'">{{ form.name || t('admin.partners.form.previewName') }}</b>
                <span :class="[P.PILL, 'bg-soft text-muted']">{{ t('admin.partners.form.previewNew') }}</span>
              </div>
              <span class="text-[12.5px] text-[#5C5C5C] truncate">{{ t(`business.category.${form.category}`) }}<template v-if="form.address"> · {{ form.address }}</template></span>
            </div>
          </div>
          <div class="bg-white rounded-2xl border border-line p-3.5">
            <div class="flex items-center gap-2"><AppIcon name="mail" :size="18" /><b class="text-[13.5px]">{{ t('admin.partners.form.invite') }}</b></div>
            <div class="text-[12.5px] text-[#5C5C5C] mt-1.5 break-words">{{ t('admin.partners.form.inviteTo', { email: form.email || t('admin.partners.form.inviteToEmpty') }) }}<br>{{ t('admin.partners.form.inviteText') }}</div>
          </div>
        </div>
      </div>
    </div>

    <AppSheet v-model:open="createdOpen" :title="t('admin.partners.created.title')" :closable="false">
      <div v-if="created" class="flex flex-col gap-3 text-[14px]">
        <p class="m-0">{{ t('admin.partners.created.text', { email: created.business.email }) }}</p>
        <div class="flex items-center gap-2">
          <code class="flex-1 font-mono font-bold text-[18px] tracking-[.06em] bg-soft rounded-xl px-3.5 py-3 select-all">{{ created.invitePassword }}</code>
          <button type="button" :class="P.BTN_SEC" @click="copyPassword"><AppIcon name="content_copy" :size="16" />{{ t('admin.partners.created.copy') }}</button>
        </div>
        <p :class="[P.TS, 'm-0']">{{ t('admin.partners.created.note') }}</p>
      </div>
      <template #footer>
        <button type="button" :class="[P.BTN, 'w-full']" @click="closeCreated">{{ t('admin.partners.created.done') }}</button>
      </template>
    </AppSheet>
  </template>

  <!-- ======== listă ======== -->
  <template v-else>
    <div :class="P.HEAD">
      <div class="max-w-[600px]"><h1 :class="P.H1">{{ t('admin.partners.title') }}</h1><div :class="P.SUB">{{ t('admin.partners.sub') }}</div></div>
      <router-link to="/city/partners/new" :class="P.BTN"><AppIcon name="add_business" :size="16" />{{ t('admin.partners.add') }}</router-link>
    </div>

    <div :class="P.CARD_FLUSH">
      <div :class="P.TOOLBAR">
        <div :class="P.SEG">
          <button v-for="k in (['all', 'verify', 'active', 'rejected'] as const)" :key="k" type="button" :class="P.segBtn(filter === k)" @click="filter = k">
            {{ t(`admin.partners.filter.${k}`, { n: toVerifyCount }) }}</button>
        </div>
        <span :class="P.COUNT">{{ t('admin.partners.count', { n: rows.length }) }}</span>
      </div>
      <Skeleton v-if="partners.loading.value" :rows="4" :height="56" class="p-3.5" />
      <div v-else-if="!rows.length" :class="P.EMPTY">
        <AppIcon name="storefront" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" />
        <b class="text-ink">{{ t('admin.partners.empty') }}</b><div class="text-[13px] mt-1">{{ t('admin.partners.emptyHint') }}</div>
      </div>
      <template v-else>
        <!-- telefon: carduri -->
        <div class="md:hidden flex flex-col">
          <div v-for="b in rows" :key="b.id" :class="P.MROW">
            <div class="flex items-start gap-3 min-w-0">
              <span :class="P.THUMB" :style="b.imageUrl ? { backgroundImage: `url('${b.imageUrl}')` } : undefined"><AppIcon v-if="!b.imageUrl" name="storefront" :size="18" /></span>
              <div class="min-w-0 flex-1">
                <div :class="P.TT">{{ b.name }}</div>
                <div :class="P.TS">{{ t(`business.category.${b.category}`) }} · {{ b.address ?? '—' }}</div>
                <div :class="[P.TS, 'break-all']">{{ b.contactName }} · {{ b.email }}</div>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 mt-2.5">
              <span :class="[P.PILL, state(b).tone]"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`admin.partners.state.${state(b).key}`) }}</span>
              <span :class="P.TS">{{ t('admin.partners.offers', { n: b.activeOffers }) }}<template v-if="b.draftOffers"> · {{ t('admin.partners.drafts', { n: b.draftOffers }) }}</template> · {{ b.codesUsed }} {{ t('admin.partners.cols.codes').toLowerCase() }}</span>
            </div>
            <div v-if="b.rejectReason" :class="[P.TS, 'mt-1.5']">„{{ b.rejectReason }}”</div>
            <div class="flex gap-1.5 mt-2.5">
              <template v-if="b.verified">
                <button type="button" :class="[P.BTN_SM_SEC, 'flex-1']" :disabled="partners.busy.value === b.id" @click="askReject(b)"><AppIcon name="pause_circle" :size="16" />{{ t('admin.partners.suspend') }}</button>
              </template>
              <template v-else>
                <button v-if="!b.rejectedAt" type="button" :class="[P.BTN_SM_SEC, 'flex-1']" :disabled="partners.busy.value === b.id" @click="askReject(b)">{{ t('admin.partners.reject') }}</button>
                <button type="button" :class="[P.BTN_SM_OK, 'flex-1']" :disabled="partners.busy.value === b.id" @click="verify(b)"><AppIcon name="verified" :size="16" />{{ t('admin.partners.verify') }}</button>
              </template>
            </div>
          </div>
        </div>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full border-collapse min-w-[1100px]">
            <thead><tr>
              <th v-for="c in ['firm', 'category', 'contact', 'offers', 'codes', 'registered', 'status']" :key="c" :class="P.TH">{{ t(`admin.partners.cols.${c}`) }}</th>
              <th :class="P.TH" />
            </tr></thead>
            <tbody>
              <tr v-for="b in rows" :key="b.id" :class="P.TR">
                <td :class="[P.TD, 'min-w-[240px]']"><div class="flex items-center gap-3 min-w-0">
                  <span :class="P.THUMB" :style="b.imageUrl ? { backgroundImage: `url('${b.imageUrl}')` } : undefined"><AppIcon v-if="!b.imageUrl" name="storefront" :size="18" /></span>
                  <div class="min-w-0"><div :class="[P.TT, 'whitespace-nowrap']">{{ b.name }}</div><div :class="[P.TS, 'max-w-[220px] truncate']" :title="b.address">{{ b.address ?? '—' }}</div></div>
                </div></td>
                <td :class="[P.TD, 'whitespace-nowrap']">{{ t(`business.category.${b.category}`) }}</td>
                <td :class="[P.TD, 'whitespace-nowrap']">{{ b.contactName ?? '—' }}<div :class="P.TS">{{ b.email }}</div></td>
                <td :class="[P.TD, 'whitespace-nowrap']">{{ t('admin.partners.offers', { n: b.activeOffers }) }}<template v-if="b.draftOffers"> · {{ t('admin.partners.drafts', { n: b.draftOffers }) }}</template></td>
                <td :class="P.TD">{{ b.codesUsed }}</td>
                <td :class="[P.TD, 'whitespace-nowrap']">{{ f.dateTime(b.createdAt, false) }}</td>
                <td :class="P.TD">
                  <span :class="[P.PILL, state(b).tone]"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`admin.partners.state.${state(b).key}`) }}</span>
                  <div v-if="b.rejectReason" :class="[P.TS, 'max-w-[180px] truncate']" :title="b.rejectReason">„{{ b.rejectReason }}”</div>
                </td>
                <td :class="P.TD"><div class="flex gap-1.5 justify-end">
                  <button v-if="b.verified" type="button" :class="P.BTN_SM_SEC" :title="t('admin.partners.suspend')" :aria-label="t('admin.partners.suspend')"
                    :disabled="partners.busy.value === b.id" @click="askReject(b)"><AppIcon name="pause_circle" :size="16" /></button>
                  <template v-else>
                    <button v-if="!b.rejectedAt" type="button" :class="P.BTN_SM_SEC" :disabled="partners.busy.value === b.id" @click="askReject(b)">{{ t('admin.partners.reject') }}</button>
                    <button type="button" :class="P.BTN_SM_OK" :disabled="partners.busy.value === b.id" @click="verify(b)"><AppIcon name="verified" :size="16" />{{ t('admin.partners.verify') }}</button>
                  </template>
                </div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <AppSheet v-model:open="rejectOpen" :title="rejecting ? t(rejecting.verified ? 'admin.partners.suspendTitle' : 'admin.partners.rejectTitle', { name: rejecting.name }) : ''">
      <div v-if="rejecting" class="flex flex-col gap-3">
        <p class="m-0 text-[14px] text-muted">{{ t(rejecting.verified ? 'admin.partners.suspendHint' : 'admin.partners.rejectHint') }}</p>
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('admin.partners.reason') }}</span>
          <input v-model="reason" :class="P.INPUT" :placeholder="t('admin.partners.reasonPh')" maxlength="300"></label>
      </div>
      <template #footer>
        <div class="flex gap-2 w-full">
          <button type="button" :class="[P.BTN_SEC, 'flex-1']" @click="rejecting = null">{{ t('admin.partners.cancel') }}</button>
          <button type="button" :class="[P.BTN, 'flex-1 !bg-bad']" :disabled="partners.busy.value !== null" @click="confirmReject">
            {{ t(rejecting?.verified ? 'admin.partners.suspend' : 'admin.partners.reject') }}</button>
        </div>
      </template>
    </AppSheet>
  </template>
</template>
