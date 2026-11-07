<script setup lang="ts">
// T07 · S9 Biletele mele — design/final `/tickets`: Viitoare / Trecute, biletele și înscrierile cu QR mic, „funcționează și offline”.
// (Înscrierile la acțiuni și ofertele revendicate apar aici când vin T11 / T10.)
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import TicketListItem from '@/shared/components/tickets/TicketListItem.vue'
import { useMyTickets } from '@/shared/composables/useTickets'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const tab = ref<'up' | 'past'>('up')
const { upcoming, past, loading, offline, error, load } = useMyTickets()
const list = computed(() => (tab.value === 'up' ? upcoming.value : past.value))
const initials = computed(() => (auth.user?.displayName ?? '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase())
onMounted(async () => { await load(); if (error.value) ui.toast(error.value, 'error') })
</script>

<template>
  <div class="flex items-center justify-between gap-3 pt-2 mb-3.5">
    <h1 class="text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] m-0">{{ t('tickets.mine.title') }}</h1>
    <router-link to="/m/profile" class="w-11 h-11 shrink-0 rounded-full bg-ink text-white text-[17px] font-bold flex items-center justify-center no-underline" :aria-label="t('nav.profile')">{{ initials }}</router-link>
  </div>
  <div class="flex gap-1 p-1 rounded-[16px] bg-soft mb-[18px]" role="tablist">
    <button v-for="k in (['up', 'past'] as const)" :key="k" type="button" role="tab" :aria-selected="tab === k" class="flex-1 min-h-11 rounded-xl text-[15px]"
      :class="tab === k ? 'bg-white text-ink font-semibold shadow-[0_1px_3px_rgba(0,0,0,.08)]' : 'text-muted font-medium'" @click="tab = k">{{ k === 'up' ? t('tickets.mine.upcoming') : t('tickets.mine.past') }}</button>
  </div>
  <div v-if="offline" class="flex gap-2.5 mb-3 px-3.5 py-3 rounded-[14px] bg-soft text-muted text-[13.5px]"><AppIcon name="cloud_off" :size="18" /><span>{{ t('tickets.mine.offlineShown') }}</span></div>

  <Skeleton v-if="loading" :rows="3" :height="88" />
  <template v-else-if="list.length">
    <h3 class="text-[16px] font-semibold mt-0 mb-2">{{ t('tickets.mine.section') }}</h3>
    <TicketListItem v-for="tk in list" :key="tk.code" :ticket="tk" :to="`/m/tickets/${tk.code}`" />
  </template>
  <EmptyState v-else :icon="'confirmation_number'" :title="tab === 'up' ? t('tickets.mine.emptyUp') : t('tickets.mine.emptyPast')" :text="t('tickets.mine.emptyText')"
    :action="tab === 'up' ? t('tickets.mine.find') : undefined" @action="router.push('/m')" />
  <p class="text-muted text-[12.5px] mt-3.5 text-center flex items-center justify-center gap-1"><AppIcon name="cloud_off" :size="16" />{{ t('tickets.mine.offline') }}</p>
</template>
