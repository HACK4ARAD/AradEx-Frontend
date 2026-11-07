<script setup lang="ts">
// T11 · Detaliul unei acțiuni comunitare (design/final mobile „Acțiune comunitară”): +puncte, ore, loc + Indicații, locuri,
// cine merge, despre, „Cum primești punctele”, apoi Mă înscriu → QR-ul meu (sheet). Vizitatorul se înscrie direct („Sunt din Arad”).
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import RegistrationTicket from '@/shared/components/community/RegistrationTicket.vue'
import { useBack } from '@/shared/composables/useBack'
import { useFormat } from '@/shared/composables/useFormat'
import { directionsUrl, isActiveRegistration, isEnded, spotsLeft, useAction } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const f = useFormat()
const ui = useUiStore()
const auth = useAuthStore()
const back = useBack('/m/community')
const id = computed(() => Number(route.params.id))
const { action, loading, notFound, saving, load, register, cancel } = useAction(id)
const qrOpen = ref(false)

onMounted(load)

const a = computed(() => action.value)
const reg = computed(() => (isActiveRegistration(a.value?.myRegistration) ? a.value?.myRegistration : undefined))
const free = computed(() => (a.value ? spotsLeft(a.value) : 0))
const ended = computed(() => (a.value ? isEnded(a.value) : false))
const fill = computed(() => (a.value ? Math.min(100, Math.round((a.value.registeredCount / a.value.capacity) * 100)) : 0))
const more = computed(() => (a.value ? Math.max(0, a.value.registeredCount - a.value.goingPreview.length) : 0))
const isStaff = computed(() => auth.hasRole('CITY_HALL'))
const canRegister = computed(() => auth.role === 'LOCAL' || auth.role === 'VISITOR')

const mapsUrl = computed(() => (a.value ? directionsUrl(a.value) : ''))
/** Link Google Calendar fără login (FEATURES §2): ore în UTC, format YYYYMMDDTHHMMSSZ. */
const calendarUrl = computed(() => {
  if (!a.value) return ''
  const z = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const q = new URLSearchParams({ action: 'TEMPLATE', text: a.value.title, dates: `${z(a.value.startAt)}/${z(a.value.endAt)}`, location: a.value.locationName, details: a.value.description })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
})

async function onRegister() {
  if (!auth.isLoggedIn) { router.push({ path: '/m/login', query: { next: route.fullPath } }); return }
  const r = await register()
  if (r) { ui.toast(t('community.action.registeredToast'), 'success'); qrOpen.value = true }
}

async function onCancel() {
  if (!window.confirm(t('community.action.cancelConfirm'))) return
  if (await cancel()) { qrOpen.value = false; ui.toast(t('community.action.cancelledToast'), 'success') }
}

async function share() {
  if (!a.value) return
  const data = { title: a.value.title, text: `${a.value.title} · ${f.dateTime(a.value.startAt)}`, url: window.location.href }
  if (navigator.share) {
    try { await navigator.share(data) } catch { /* închis de utilizator */ }
    return
  }
  try {
    await navigator.clipboard.writeText(data.url)
    ui.toast(t('community.action.linkCopied'), 'success')
  } catch {
    ui.toast(t('community.action.shareUnavailable'))   // ex. WebView-ul Android fără Web Share / clipboard
  }
}
</script>

<template>
  <div class="-mx-5 -mt-3">
    <div class="relative h-[260px] bg-green-deep bg-cover bg-center" :style="a?.imageUrl ? { backgroundImage: `url('${a.imageUrl}')` } : undefined">
      <button class="absolute left-4 top-[max(14px,env(safe-area-inset-top))] w-11 h-11 rounded-full bg-white/90 flex items-center justify-center" :aria-label="t('common.back')" @click="back">
        <AppIcon name="arrow_back" />
      </button>
      <button v-if="a" class="absolute right-4 top-[max(14px,env(safe-area-inset-top))] w-11 h-11 rounded-full bg-white/90 flex items-center justify-center" :aria-label="t('community.action.share')" @click="share">
        <AppIcon name="ios_share" />
      </button>
      <span v-if="a?.imageCredit" class="absolute right-2 bottom-1.5 text-[10px] text-white/85 bg-black/30 rounded px-1.5 py-0.5 max-w-[80%] truncate">{{ a.imageCredit }}</span>
    </div>
  </div>

  <div class="pt-4 pb-36">
    <Skeleton v-if="loading" :rows="4" />
    <EmptyState v-else-if="notFound" icon="volunteer_activism" :title="t('community.action.notFound')" :action="t('community.action.backToList')" @action="router.push('/m/community')" />
    <EmptyState v-else-if="!a" icon="cloud_off" :title="t('community.loadError')" :action="t('common.retry')" @action="load" />
    <template v-else>
      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded-full bg-green-soft text-green-deep text-[12.5px] font-semibold px-2.5 py-1">{{ t('community.action.badge', { cat: t(`community.category.${a.category}`) }) }}</span>
        <span class="text-muted text-[13.5px]">{{ t('community.action.organizedBy') }}</span>
      </div>
      <h1 class="text-[28px] font-semibold tracking-[-0.025em] leading-tight m-0 mt-2.5">{{ a.title }}</h1>

      <div class="mt-4 rounded-[16px] bg-green-soft text-green-deep p-3.5 flex gap-3">
        <AppIcon name="volunteer_activism" class="shrink-0" />
        <span class="text-[14px]"><b class="text-[16px]">{{ t('community.card.points', { n: a.pointsReward }) }}</b><br>{{ t('community.action.pointsNote') }}</span>
      </div>

      <div class="flex items-center gap-3 py-3.5 border-b border-line">
        <AppIcon name="schedule" class="text-muted" />
        <span class="flex-1 font-medium text-[15px]">{{ f.dateTime(a.startAt, false) }} · {{ f.timeRange(a.startAt, a.endAt) }}</span>
        <a :href="calendarUrl" target="_blank" rel="noopener" class="h-8 px-3 rounded-full border border-line text-[13px] font-semibold flex items-center gap-1 no-underline text-ink"><AppIcon name="event_available" :size="16" />{{ t('community.action.calendar') }}</a>
      </div>
      <div class="flex items-center gap-3 py-3.5 border-b border-line">
        <AppIcon name="location_on" class="text-muted" />
        <span class="flex-1 font-medium text-[15px] min-w-0">{{ a.locationName }}<small v-if="a.address" class="block text-muted text-[13px] font-normal">{{ a.address }}</small></span>
        <a :href="mapsUrl" target="_blank" rel="noopener" class="h-8 px-3 rounded-full border border-line text-[13px] font-semibold flex items-center gap-1 no-underline text-ink shrink-0"><AppIcon name="directions" :size="16" />{{ t('community.action.directions') }}</a>
      </div>
      <div class="flex items-start gap-3 py-3.5">
        <AppIcon name="group" class="text-muted" />
        <div class="flex-1">
          <span class="font-medium text-[15px]">{{ t('community.action.spots', { taken: a.registeredCount, total: a.capacity, free }) }}</span>
          <div class="h-2 rounded bg-soft mt-2 overflow-hidden"><i class="block h-full bg-green rounded" :style="{ width: `${fill}%` }" /></div>
        </div>
      </div>
      <div v-if="a.goingPreview.length" class="flex items-center gap-2 text-[13px] text-muted">
        <span class="flex"><i v-for="(g, i) in a.goingPreview" :key="i" class="not-italic w-6 h-6 rounded-full bg-soft border-2 border-white text-[10px] font-bold text-ink flex items-center justify-center" :class="i > 0 && '-ml-1.5'">{{ g.charAt(0) }}</i></span>
        <span>{{ more ? t('community.card.goingMore', { names: a.goingPreview.join(', '), n: more }) : t('community.card.going', { names: a.goingPreview.join(', ') }) }}</span>
      </div>

      <h3 class="text-[17px] font-semibold m-0 mt-5 mb-1.5">{{ t('community.action.about') }}</h3>
      <p class="text-muted text-[15px] m-0 whitespace-pre-line">{{ a.description }}</p>
      <p v-if="a.organizer" class="text-muted text-[13.5px] m-0 mt-2">{{ t('community.action.partner', { name: a.organizer }) }}</p>

      <h3 class="text-[17px] font-semibold m-0 mt-5 mb-2.5">{{ t('community.action.howTitle') }}</h3>
      <div v-for="n in 3" :key="n" class="flex gap-3 mb-3">
        <span class="w-7 h-7 rounded-full border-2 border-green text-green-deep font-bold text-[13px] flex items-center justify-center shrink-0">{{ n }}</span>
        <div><b class="text-[15px]">{{ t(`community.action.how${n}Title`) }}</b><p class="text-muted text-[13.5px] m-0">{{ t(`community.action.how${n}Text`, { n: a.pointsReward }) }}</p></div>
      </div>
    </template>
  </div>

  <!-- butonul principal, fix deasupra tab bar-ului -->
  <div v-if="a" class="fixed bottom-20 inset-x-4 z-20 max-w-[480px] mx-auto">
    <AppButton v-if="isStaff" block variant="secondary" icon="qr_code_scanner" @click="router.push('/m/panel')">{{ t('community.action.staffCta') }}</AppButton>
    <AppButton v-else-if="reg" block icon="qr_code_2" :class="reg.status === 'CONFIRMED' ? '!bg-green' : ''" @click="qrOpen = true">
      {{ reg.status === 'CONFIRMED' ? t('community.action.confirmedCta', { n: a.pointsReward }) : t('community.action.myQrCta') }}
    </AppButton>
    <AppButton v-else-if="ended" block disabled>{{ t('community.action.endedCta') }}</AppButton>
    <AppButton v-else-if="free <= 0" block disabled>{{ t('community.action.fullCta') }}</AppButton>
    <div v-else-if="auth.role === 'VISITOR'" class="flex flex-col gap-1.5">
      <AppButton block icon="how_to_reg" class="!bg-green" :loading="saving" @click="onRegister">{{ t('community.action.visitorCta') }}</AppButton>
      <span class="text-muted text-[12px] text-center bg-bg/90 rounded">{{ t('community.action.visitorNote') }}</span>
    </div>
    <AppButton v-else-if="!auth.isLoggedIn || canRegister" block icon="how_to_reg" class="!bg-green" :loading="saving" @click="onRegister">
      {{ t('community.action.registerCta', { n: a.pointsReward }) }}
    </AppButton>
    <AppButton v-else block disabled>{{ t('community.action.notForRole') }}</AppButton>
  </div>

  <AppSheet v-model:open="qrOpen" :title="t('community.ticket.title')">
    <RegistrationTicket v-if="reg" :registration="reg" />
    <template v-if="reg && reg.status === 'REGISTERED'" #footer>
      <AppButton block variant="ghost" :loading="saving" @click="onCancel">{{ t('community.action.cancel') }}</AppButton>
    </template>
  </AppSheet>
</template>
