<script setup lang="ts">
// T18 · Panou Primărie · Mesaje — design/final web `#/city/messages`: conversațiile cu voluntarii (stânga: ultimul mesaj, ora,
// punct pentru mesajele noi) și firul selectat (dreapta: antetul cu acțiunile alocate și coordonatorul, mesajele, răspunsurile
// rapide, „Trimite”). Voluntarii scriu din aplicație, Primăria răspunde de aici. `?v=<id>` deschide o conversație.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import MessageThread from '@/shared/components/volunteer/MessageThread.vue'
import * as P from '@/web/components/community/panel'
import { cityVolunteersApi } from '@/shared/api/volunteer'
import { initials } from '@/shared/composables/useCommunity'
import { cityUnread, messageTime, QUICK_REPLIES, useCityVolunteers, useThread } from '@/shared/composables/useVolunteer'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const vols = useCityVolunteers()
const text = ref('')
const box = ref<HTMLElement | null>(null)

/** Conversațiile: întâi cele cu mesaje noi, apoi după ultimul mesaj, apoi voluntarii fără mesaje. */
const list = computed(() => [...vols.items.value].sort((a, b) =>
  (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0) || (b.lastMessage?.createdAt ?? '').localeCompare(a.lastMessage?.createdAt ?? '')))
const selectedId = computed(() => Number(route.query.v) || null)
const cur = computed(() => vols.items.value.find((v) => v.id === selectedId.value) ?? null)
const thread = useThread(() => cityVolunteersApi.messages(selectedId.value!), (txt) => cityVolunteersApi.send(selectedId.value!, txt))
const STATUS_PILL: Record<string, string> = { ACTIVE: 'bg-ok-soft text-ok', SUSPENDED: 'bg-bad-soft text-bad', EXPIRED: 'bg-soft text-muted' }
const statusOf = computed(() => (!cur.value ? 'ACTIVE' : cur.value.status === 'SUSPENDED' ? 'SUSPENDED' : cur.value.expired ? 'EXPIRED' : 'ACTIVE'))

const scrollDown = () => nextTick(() => { if (box.value) box.value.scrollTop = box.value.scrollHeight })
async function open() {
  if (!selectedId.value) return
  await thread.reload()
  // deschiderea marchează mesajele voluntarului ca citite (BE); punctul și numărul din meniu dispar
  const v = vols.items.value.find((x) => x.id === selectedId.value)
  if (v?.unread) { vols.put({ ...v, unread: 0 }); cityUnread.value = vols.items.value.reduce((s, x) => s + x.unread, 0) }
  scrollDown()
}
onMounted(async () => {
  await vols.load()
  // conversația aleasă stă în adresă: altfel, după ce o citești, lista se reordonează și „prima” ar deveni alta (și s-ar marca citită)
  if (!route.query.v && list.value[0]) await router.replace({ query: { v: list.value[0].id } })
  await open()
})
watch(() => route.query.v, (v, old) => { if (v && old && v !== old) void open() })
watch(() => thread.messages.value.length, scrollDown)

async function send(value = text.value) {
  if (!cur.value) return
  const quick = value !== text.value
  if (await thread.send(value)) {
    if (!quick) text.value = ''
    const last = thread.messages.value[thread.messages.value.length - 1]
    vols.put({ ...cur.value, lastMessage: last })
  }
}
const pick = (id: number) => router.replace({ query: { v: id } })
</script>

<template>
  <div :class="P.HEAD"><div><h1 :class="P.H1">{{ t('volunteer.inbox.title') }}</h1><div :class="P.SUB">{{ t('volunteer.inbox.subtitle') }}</div></div></div>

  <Skeleton v-if="vols.loading.value && !vols.items.value.length" :rows="3" :height="72" />
  <div v-else-if="!vols.items.value.length" :class="[P.CARD, P.EMPTY]">
    <AppIcon name="forum" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" /><b class="text-ink">{{ t('volunteer.inbox.empty') }}</b>
    <p class="text-[13px] mt-1.5 mb-3">{{ t('volunteer.inbox.emptyText') }}</p>
    <router-link to="/city/volunteers/new" :class="P.BTN_SM"><AppIcon name="person_add" :size="16" />{{ t('volunteer.panel.add') }}</router-link>
  </div>
  <div v-else :class="[P.CARD_FLUSH, 'grid grid-cols-1 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] lg:h-[calc(100dvh-210px)] lg:min-h-[520px]']">
    <!-- conversațiile -->
    <div class="border-b lg:border-b-0 lg:border-r border-line overflow-y-auto max-h-[260px] lg:max-h-none">
      <button v-for="v in list" :key="v.id" type="button" class="w-full flex items-center gap-3 px-3.5 py-3 text-left border-b border-line last:border-b-0"
        :class="v.id === selectedId ? 'bg-soft' : 'hover:bg-[#FBFBFA]'" :aria-current="v.id === selectedId || undefined" data-test="conversation" @click="pick(v.id)">
        <span class="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center font-bold text-[12.5px] shrink-0">{{ initials(v.name) }}</span>
        <span class="min-w-0 flex-1">
          <span class="flex items-baseline justify-between gap-2"><b class="text-[13.5px] truncate">{{ v.name }}</b>
            <span class="text-[11.5px] text-muted shrink-0">{{ v.lastMessage ? messageTime(v.lastMessage.createdAt) : '' }}</span></span>
          <span class="block text-[12.5px] truncate" :class="v.unread ? 'text-ink font-semibold' : 'text-muted'">
            {{ v.lastMessage ? (v.lastMessage.fromCity ? t('volunteer.inbox.you') : '') + v.lastMessage.text : t('volunteer.inbox.noMessages') }}</span>
        </span>
        <span v-if="v.unread" class="w-2.5 h-2.5 rounded-full bg-accent shrink-0" :aria-label="t('volunteer.messages.newMessages')" />
      </button>
    </div>

    <!-- firul -->
    <div v-if="cur" class="flex flex-col min-h-[420px] lg:min-h-0">
      <div class="flex items-center gap-3 px-4 py-3 border-b border-line">
        <span class="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center font-bold text-[12.5px] shrink-0">{{ initials(cur.name) }}</span>
        <div class="min-w-0 flex-1"><b class="block text-[14.5px]">{{ cur.name }}</b>
          <span class="block text-[12.5px] text-muted truncate">{{ t('volunteer.inbox.meta', { n: cur.actionIds.length, name: cur.coordinatorName ?? '—' }, cur.actionIds.length) }}</span></div>
        <span :class="[P.PILL, STATUS_PILL[statusOf]]"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`volunteer.panel.status.${statusOf}`) }}</span>
      </div>
      <div ref="box" class="flex-1 overflow-y-auto px-4 py-4 bg-[#FBFBFA] max-h-[60dvh] lg:max-h-none">
        <Skeleton v-if="thread.loading.value && !thread.messages.value.length" :rows="3" :height="48" />
        <p v-else-if="!thread.messages.value.length" class="text-muted text-[13.5px] text-center my-8">{{ t('volunteer.inbox.emptyThread') }}</p>
        <MessageThread v-else :messages="thread.messages.value" :mine="(m) => m.fromCity" variant="panel" />
      </div>
      <div class="border-t border-line px-4 py-3 flex flex-col gap-2.5">
        <p v-if="cur.status === 'SUSPENDED'" class="text-[12.5px] text-bad m-0 flex items-center gap-1.5"><AppIcon name="pause_circle" :size="16" />{{ t('volunteer.inbox.suspendedNote') }}</p>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="q in QUICK_REPLIES" :key="q" type="button" :class="P.chip(false)" :disabled="thread.sending.value" @click="send(t(`volunteer.quick.${q}`))">{{ t(`volunteer.quick.${q}`) }}</button>
        </div>
        <form class="flex gap-2" @submit.prevent="send()">
          <input v-model="text" :class="P.INPUT" :placeholder="t('volunteer.inbox.placeholder')" maxlength="1000" :aria-label="t('volunteer.inbox.placeholder')" data-test="city-message">
          <button type="submit" :class="P.BTN" :disabled="!text.trim() || thread.sending.value"><AppIcon name="send" :size="16" />{{ t('volunteer.inbox.send') }}</button>
        </form>
      </div>
    </div>
  </div>
</template>
