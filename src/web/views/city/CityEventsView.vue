<script setup lang="ts">
// T06 · Panou Primărie › Evenimente — design/final `#/city/events` (tabel cu filtre) și `#/city/events/new` (formular + previzualizare
// pe telefon). `/city/events` = listă, `/city/events/new` = eveniment nou, `/city/events/:id` = editare. POST/PUT/DELETE /events.
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import EventImage from '@/shared/components/events/EventImage.vue'
import { eventsApi } from '@/shared/api/events'
import { useEventFormat } from '@/shared/composables/useEvents'
import { bucharestIso, splitBucharest } from '@/shared/composables/useEventForm'
import { intlLocale, useFormat } from '@/shared/composables/useFormat'
import { useUiStore } from '@/shared/stores/ui'
import { EVENT_CATEGORIES, type EventCategory, type EventCreate, type EventDto, type EventSummary, type TicketType } from '@/shared/types/events'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const ui = useUiStore()
const fmt = useEventFormat()
const { todayIso } = useFormat()

/** Locurile din seed (V3_1) unde Primăria organizează de obicei — id-urile obiectivelor (T05). */
const VENUES: { id: number; name: string; img: string }[] = [
  { id: 2, name: 'Palatul Cultural', img: '/img/loc-pc.jpg' }, { id: 3, name: 'Teatrul Clasic „Ioan Slavici”', img: '/img/loc-tc.jpg' },
  { id: 6, name: 'Catedrala Ortodoxă „Sfânta Treime” (Piața Catedralei)', img: '/img/loc-cs.jpg' }, { id: 9, name: 'Faleza Mureșului', img: '/img/loc-fm.jpg' },
  { id: 1, name: 'Cetatea Aradului (exterior)', img: '/img/loc-ca.jpg' }, { id: 4, name: 'Palatul Administrativ (Primăria)', img: '/img/loc-pa.jpg' },
  { id: 10, name: 'Lunca Mureșului – Pădurea Ceala', img: '/img/loc-ce.jpg' },
]

const sub = computed(() => String(route.params.sub ?? ''))
const formMode = computed(() => sub.value !== '')

/* ---------------- listă ---------------- */
type F = 'all' | 'mine' | 'biz' | 'free' | 'draft'
const filter = ref<F>('all')
type Row = EventSummary & { status: 'PUBLISHED' | 'DRAFT' }
const rows = shallowRef<Row[]>([])
const loading = ref(true)
/** Publicate + ciornele Primăriei (GET /events?status=DRAFT e permis doar Primăriei și Adminului). */
async function load() {
  loading.value = true
  try {
    const [pub, drafts] = await Promise.all([eventsApi.list({ size: 100 }), eventsApi.list({ status: 'DRAFT', size: 100 })])
    rows.value = [...pub.content.map((e) => ({ ...e, status: 'PUBLISHED' as const })), ...drafts.content.map((e) => ({ ...e, status: 'DRAFT' as const }))]
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
  } catch (err) { ui.error(err) } finally { loading.value = false }
}
const statusOf = (e: Row) => e.status
const shown = computed(() => rows.value.filter((e) => filter.value === 'all' ? true
  : filter.value === 'mine' ? e.organizerType === 'CITY'
  : filter.value === 'biz' ? e.organizerType === 'BUSINESS'
  : filter.value === 'free' ? e.ticketType === 'FREE' : e.status === 'DRAFT'))
async function hide(e: Row) {
  if (!window.confirm(`${t('events.city.hide')}: ${e.title}?`)) return
  try { await eventsApi.remove(e.id); ui.toast(t('events.city.hidden'), 'success'); await load() } catch (err) { ui.error(err) }
}

/* ---------------- formular ---------------- */
interface Form {
  title: string; category: EventCategory; venue: number; date: string; time: string; dur: string; ticketType: TicketType
  priceAdult: string; priceChild: string; capacity: string; url: string; priceFrom: string; description: string; imageUrl: string
}
const empty = (): Form => ({ title: '', category: 'CONCERT', venue: 2, date: todayIso(), time: '19:00', dur: '', ticketType: 'FREE', priceAdult: '40', priceChild: '25', capacity: '', url: '', priceFrom: '', description: '', imageUrl: '' })
const form = reactive<Form>(empty())
const editing = shallowRef<EventDto | null>(null)
const saving = ref(false)
const num = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(',', '.')))

watch(sub, async (s) => {
  editing.value = null
  Object.assign(form, empty())
  if (s && s !== 'new') {
    try {
      const e = await eventsApi.get(Number(s))
      editing.value = e
      const start = splitBucharest(e.startAt)
      Object.assign(form, {
        title: e.title, category: e.category, venue: e.placeId ?? 2, date: start.date, time: start.time,
        dur: e.endAt ? String(Math.round((new Date(e.endAt).getTime() - new Date(e.startAt).getTime()) / 60000)) : '',
        ticketType: e.ticketType, priceAdult: e.priceAdult != null ? String(e.priceAdult) : '', priceChild: e.priceChild != null ? String(e.priceChild) : '',
        capacity: e.capacity != null ? String(e.capacity) : '', url: e.externalUrl ?? '', priceFrom: e.priceFrom != null ? String(e.priceFrom) : '',
        description: e.description, imageUrl: e.imageUrl ?? '',
      } satisfies Form)
    } catch (err) { ui.error(err) }
  }
  if (!s) await load()
}, { immediate: true })

function request(status: 'DRAFT' | 'PUBLISHED'): EventCreate {
  const startAt = bucharestIso(form.date, form.time)
  const dur = num(form.dur)
  const req: EventCreate = {
    title: form.title.trim(), description: form.description.trim(), category: form.category, placeId: form.venue, startAt,
    endAt: dur ? new Date(new Date(startAt).getTime() + dur * 60000).toISOString() : undefined, ticketType: form.ticketType, status,
  }
  if (form.ticketType === 'IN_APP') { req.priceAdult = num(form.priceAdult); req.priceChild = num(form.priceChild) }
  if (form.ticketType === 'EXTERNAL') { req.externalUrl = form.url.trim() || undefined; req.priceFrom = num(form.priceFrom) }
  const cap = num(form.capacity)
  if (cap && form.ticketType !== 'EXTERNAL') req.capacity = cap
  if (form.imageUrl.trim()) req.imageUrl = form.imageUrl.trim()
  return req
}
async function save(status: 'DRAFT' | 'PUBLISHED') {
  if (!form.title.trim() || !form.description.trim()) { ui.toast(t('events.city.form.required'), 'error'); return }
  saving.value = true
  try {
    if (editing.value) { await eventsApi.update(editing.value.id, request(status)); ui.toast(t('events.city.form.updated'), 'success') }
    else { await eventsApi.create(request(status)); ui.toast(status === 'PUBLISHED' ? t('events.city.form.created') : t('events.city.form.draftSaved'), 'success') }
    await router.push('/city/events')
  } catch (err) { ui.error(err) } finally { saving.value = false }
}
const venue = computed(() => VENUES.find((v) => v.id === form.venue) ?? VENUES[0])
const previewWhen = computed(() => fmt.when({ startAt: bucharestIso(form.date || todayIso(), form.time || '19:00') }))

const pill = (s: string) => s === 'PUBLISHED' ? 'bg-ok-soft text-ok' : s === 'DRAFT' ? 'bg-soft text-muted' : 'bg-warn-soft text-warn'
const input = 'h-10 rounded-[10px] border border-line bg-white px-3 outline-none w-full text-[14px] focus:border-ink focus:shadow-[0_0_0_3px_rgba(17,17,19,.08)]'
const label = 'font-semibold text-[13px]'
</script>

<template>
  <!-- ======== formular ======== -->
  <template v-if="formMode">
    <div class="flex items-end justify-between gap-4 mb-5">
      <div>
        <h1 class="m-0 text-[24px] tracking-[-0.025em] font-semibold">{{ editing ? t('events.city.form.editTitle') : t('events.city.form.title') }}</h1>
        <div class="text-muted text-[13.5px] mt-1">{{ t('events.city.form.sub') }}</div>
      </div>
    </div>
    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-5 items-start">
      <form class="bg-white border border-line rounded-[14px] p-[22px] flex flex-col gap-[18px]" novalidate @submit.prevent="save('PUBLISHED')">
        <div class="text-[11.5px] font-bold tracking-[.07em] uppercase text-muted pt-1">{{ t('events.city.form.details') }}</div>
        <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.name') }}</span><input v-model="form.title" :class="input" :placeholder="t('events.city.form.namePh')" maxlength="200" required></label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.category') }}</span>
            <select v-model="form.category" :class="input"><option v-for="c in EVENT_CATEGORIES" :key="c" :value="c">{{ t(`events.category.${c}`) }}</option></select></label>
          <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.venue') }}</span>
            <select v-model.number="form.venue" :class="input"><option v-for="v in VENUES" :key="v.id" :value="v.id">{{ v.name }}</option></select></label>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.date') }}</span><input v-model="form.date" type="date" :class="input" required></label>
          <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.time') }}</span><input v-model="form.time" type="time" :class="input" required></label>
          <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.duration') }}</span><input v-model="form.dur" type="number" min="0" placeholder="90" :class="input"></label>
        </div>
        <div class="text-[11.5px] font-bold tracking-[.07em] uppercase text-muted pt-1">{{ t('events.city.form.entry') }}</div>
        <div class="flex flex-col gap-1.5">
          <span :class="label">{{ t('events.city.form.tickets') }}</span>
          <div class="flex gap-1 p-[3px] rounded-[10px] bg-soft" role="radiogroup">
            <button v-for="tt in (['FREE', 'IN_APP', 'EXTERNAL'] as const)" :key="tt" type="button" role="radio" :aria-checked="form.ticketType === tt"
              class="flex-1 h-8 rounded-lg font-semibold text-[13px]" :class="form.ticketType === tt ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,.1)]' : 'text-muted'" @click="form.ticketType = tt">{{ t(`events.city.form.ticketType.${tt}`) }}</button>
          </div>
        </div>
        <div v-if="form.ticketType === 'IN_APP'" class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.priceAdult') }}</span><input v-model="form.priceAdult" type="number" min="0" :class="input"></label>
          <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.priceChild') }}</span><input v-model="form.priceChild" type="number" min="0" :class="input"></label>
          <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.capacity') }}</span><input v-model="form.capacity" type="number" min="1" :class="input"></label>
        </div>
        <div v-else-if="form.ticketType === 'EXTERNAL'" class="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3.5">
          <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.url') }}</span><input v-model="form.url" type="url" placeholder="https://…" :class="input"></label>
          <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.priceFrom') }}</span><input v-model="form.priceFrom" type="number" min="0" :class="input"></label>
        </div>
        <label v-else class="flex flex-col gap-1.5 sm:max-w-[240px]"><span :class="label">{{ t('events.city.form.freeCapacity') }}</span><input v-model="form.capacity" type="number" min="1" :class="input"></label>
        <label class="flex flex-col gap-1.5"><span :class="label">{{ t('events.city.form.description') }}</span>
          <textarea v-model="form.description" rows="4" :class="input" class="h-auto py-2.5" :placeholder="t('events.city.form.descriptionPh')" maxlength="5000" /></label>
        <div class="text-[11.5px] font-bold tracking-[.07em] uppercase text-muted pt-1">{{ t('events.city.form.photo') }}</div>
        <div class="flex items-center gap-3.5 p-3 border-[1.5px] border-dashed border-[#D3D2CC] rounded-xl bg-[#FBFBFA]">
          <div class="w-20 h-14 rounded-[9px] bg-[#E8E7E2] bg-center bg-cover shrink-0" :style="{ backgroundImage: `url('${form.imageUrl || venue.img}')` }" />
          <div class="flex-1 text-[12.5px] text-muted">{{ t('events.city.form.photoHint') }}</div>
        </div>
        <div class="flex gap-2.5 justify-end pt-4 border-t border-line">
          <button type="button" class="h-10 px-4 rounded-xl border border-line bg-white font-semibold text-[14px]" :disabled="saving" @click="router.push('/city/events')">{{ t('common.cancel') }}</button>
          <button type="button" class="h-10 px-4 rounded-xl border border-line bg-white font-semibold text-[14px]" :disabled="saving" @click="save('DRAFT')">{{ t('events.city.form.saveDraft') }}</button>
          <button type="submit" class="h-10 px-4 rounded-xl bg-ink text-white font-semibold text-[14px] inline-flex items-center gap-1.5" :disabled="saving"><AppIcon name="publish" :size="16" />{{ t('events.city.form.publish') }}</button>
        </div>
      </form>

      <!-- previzualizare pe telefon (design `.phone-pv`) -->
      <div class="xl:sticky xl:top-[84px] bg-[#0A0A0A] rounded-[38px] p-[9px] shadow-[0_24px_60px_rgba(0,0,0,.18)]">
        <div class="bg-bg rounded-[30px] px-3.5 pt-[18px] pb-[22px] min-h-[440px] flex flex-col gap-3">
          <div class="text-[11px] font-bold text-[#6E6E73] tracking-[.07em] uppercase text-center">{{ t('events.city.form.preview') }}</div>
          <div class="rounded-[18px] overflow-hidden bg-white border border-line">
            <EventImage :src="form.imageUrl || venue.img" :category="form.category" :emoji-size="50" class="h-[150px]" />
            <div class="px-3.5 pt-3 pb-3.5 flex flex-col gap-1">
              <span class="text-[12px] text-muted">{{ previewWhen }}</span>
              <b class="text-[16px]" :class="form.title ? 'text-ink' : 'text-[#9a9a9a]'">{{ form.title || t('events.city.form.namePh') }}</b>
              <span class="text-[12.5px] text-muted">{{ venue.name }}</span>
              <div class="mt-1.5"><span class="text-[12px] font-extrabold px-2.5 py-[5px] rounded-full" :class="form.ticketType === 'FREE' ? 'bg-ok-soft text-ok' : 'bg-ink text-white'">
                {{ form.ticketType === 'FREE' ? t('events.badge.freeNoTicket') : form.ticketType === 'IN_APP' ? `${form.priceAdult || 40} lei · ${t('events.badge.inApp').toLowerCase()}` : t('events.badge.external') }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- ======== listă ======== -->
  <template v-else>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-5">
      <div>
        <h1 class="m-0 text-[24px] tracking-[-0.025em] font-semibold">{{ t('events.city.title') }}</h1>
        <div class="text-muted text-[13.5px] mt-1">{{ t('events.city.sub') }}</div>
      </div>
      <router-link to="/city/events/new" class="h-10 px-4 rounded-xl bg-ink text-white font-semibold text-[14px] inline-flex items-center gap-1.5 no-underline"><AppIcon name="add" :size="16" />{{ t('events.city.new') }}</router-link>
    </div>
    <div class="bg-white border border-line rounded-[14px] overflow-hidden">
      <div class="flex flex-wrap items-center gap-2.5 px-3.5 py-3 border-b border-line">
        <div class="inline-flex flex-wrap gap-0.5 p-[3px] rounded-[10px] bg-soft">
          <button v-for="k in (['all', 'mine', 'biz', 'free', 'draft'] as const)" :key="k" type="button" class="h-[30px] px-3 rounded-lg font-semibold text-[13px]"
            :class="filter === k ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]' : 'text-muted'" @click="filter = k">{{ t(`events.city.filter.${k}`) }}</button>
        </div>
        <span class="ml-auto text-muted text-[12.5px]">{{ t('events.city.count', shown.length) }}</span>
      </div>
      <Skeleton v-if="loading" :rows="4" :height="56" class="p-3.5" />
      <EmptyState v-else-if="!shown.length" icon="event_busy" :title="t('events.empty.title')" class="m-3.5" />
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse min-w-[860px]">
          <thead><tr>
            <th v-for="c in ['event', 'organizer', 'when', 'where', 'price', 'going', 'status']" :key="c" class="text-left text-[11.5px] font-semibold text-muted px-3.5 py-2.5 border-b border-line whitespace-nowrap bg-[#FBFBFA] uppercase tracking-[.04em]">{{ t(`events.city.cols.${c}`) }}</th>
            <th class="border-b border-line bg-[#FBFBFA]" />
          </tr></thead>
          <tbody>
            <tr v-for="e in shown" :key="e.id" class="text-[13.5px]">
              <td class="px-3.5 py-3 border-b border-line"><div class="flex items-center gap-3 min-w-0">
                <EventImage :src="e.imageUrl" :category="e.category" :emoji-size="18" class="w-10 h-10 rounded-[10px] shrink-0 overflow-hidden" />
                <div class="min-w-0"><div class="font-semibold">{{ e.title }}</div><div class="text-[12.5px] text-muted mt-0.5">{{ t(`events.category.${e.category}`) }}<template v-if="e.isDemo"> · {{ t('events.demo') }}</template></div></div>
              </div></td>
              <td class="px-3.5 py-3 border-b border-line">{{ e.organizerName }}</td>
              <td class="px-3.5 py-3 border-b border-line">{{ fmt.when(e) }}</td>
              <td class="px-3.5 py-3 border-b border-line">{{ e.locationName }}</td>
              <td class="px-3.5 py-3 border-b border-line">{{ fmt.price(e) }}</td>
              <td class="px-3.5 py-3 border-b border-line">{{ e.participantsCount ? e.participantsCount.toLocaleString(intlLocale()) + (e.isHot ? ' 🔥' : '') : '—' }}</td>
              <td class="px-3.5 py-3 border-b border-line"><span class="inline-flex items-center gap-[5px] text-[12px] font-semibold px-[9px] py-[3px] rounded-full whitespace-nowrap" :class="pill(statusOf(e))"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`events.city.status.${statusOf(e)}`) }}</span></td>
              <td class="px-3.5 py-3 border-b border-line"><div class="flex gap-1.5 justify-end">
                <template v-if="e.organizerType === 'CITY' || e.organizerType === 'ADMIN'">
                  <router-link :to="`/city/events/${e.id}`" class="h-8 px-[11px] rounded-[9px] border border-line bg-white text-[13px] font-semibold inline-flex items-center no-underline text-ink">{{ t('events.city.edit') }}</router-link>
                  <button type="button" class="h-8 px-[11px] rounded-[9px] border border-line bg-white text-[13px] font-semibold" @click="hide(e)">{{ t('events.city.hide') }}</button>
                </template>
              </div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
</template>
