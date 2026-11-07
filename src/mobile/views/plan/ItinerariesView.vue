<script setup lang="ts">
// T13 · Itinerariile tale (design/final mobile `/itineraries`): cardul negru cu AradBot, „Creează un plan” / „Din chat” și
// lista din GET /me/itineraries (copertă, „AradBot · când”, titlu, zile · opriri, inelul de progres din bife).
// Fără cont: invitația de conectare. Logica: shared/composables/useItinerary (useMyItineraries).
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import { useItineraryFormat, useMyItineraries } from '@/shared/composables/useItinerary'
import { useBack } from '@/shared/composables/useBack'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const back = useBack('/profile')
const fmt = useItineraryFormat()
const { items, loading, failed, load, progress, coverOf, loggedIn } = useMyItineraries()
</script>

<template>
  <div class="pb-6">
    <div class="flex items-center gap-1 pt-2 mb-3.5">
      <button type="button" class="w-11 h-11 -ml-2.5 rounded-full flex items-center justify-center shrink-0" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
      <h1 class="flex-1 m-0 text-[28px] font-semibold tracking-[-0.025em] leading-tight">{{ t('plan.list.title') }}</h1>
    </div>

    <div class="flex items-center gap-3 p-4 rounded-[20px] bg-ink text-white">
      <span class="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0"><AppIcon name="auto_awesome" /></span>
      <div class="flex-1 min-w-0">
        <b class="block">{{ t('plan.list.introTitle') }}</b>
        <p class="text-[13px] opacity-80 mt-0.5 mb-0">{{ t('plan.list.introText') }}</p>
      </div>
    </div>
    <div class="flex gap-2 mt-3 mb-5">
      <router-link to="/plan" class="flex-1 min-h-11 px-4 rounded-[14px] bg-ink text-white text-[15px] font-semibold flex items-center justify-center gap-1.5 no-underline">
        <AppIcon name="auto_awesome" :size="18" />{{ t('plan.list.create') }}</router-link>
      <router-link to="/chat" class="flex-1 min-h-11 px-4 rounded-[14px] bg-white border border-line text-ink text-[15px] font-semibold flex items-center justify-center gap-1.5 no-underline">
        <AppIcon name="chat_bubble" :size="18" />{{ t('plan.list.fromChat') }}</router-link>
    </div>

    <EmptyState v-if="!loggedIn" icon="lock" :title="t('plan.list.signInTitle')" :text="t('plan.list.signInText')" :action="t('plan.list.signIn')"
      @action="router.push({ path: '/login', query: { next: route.fullPath } })" />
    <Skeleton v-else-if="loading && !items.length" :rows="3" :height="110" />
    <EmptyState v-else-if="failed && !items.length" icon="cloud_off" :title="t('plan.list.error')" :action="t('plan.list.retry')" @action="load" />
    <EmptyState v-else-if="!items.length" icon="route" :title="t('plan.list.emptyTitle')" :text="t('plan.list.emptyText')" :action="t('plan.list.create')" @action="router.push('/plan')" />
    <template v-else>
      <router-link v-for="it in items" :key="it.shareCode ?? it.id" :to="`/itinerary/${it.shareCode}`"
        class="flex items-center w-full mb-3 overflow-hidden rounded-[20px] bg-white border border-line text-ink no-underline">
        <div class="w-[110px] h-[110px] shrink-0 bg-soft bg-cover bg-center flex items-center justify-center text-muted" :style="coverOf(it) ? { backgroundImage: `url('${coverOf(it)}')` } : undefined">
          <AppIcon v-if="!coverOf(it)" name="route" :size="36" />
        </div>
        <div class="flex-1 min-w-0 px-3.5 py-3">
          <div class="flex items-center gap-1.5 text-[12px] text-muted"><AppIcon name="auto_awesome" :size="14" /><span class="truncate">{{ t('plan.list.by', { when: fmt.when(it) }) }}</span></div>
          <b class="block text-[16px] leading-[1.25] my-1">{{ it.title }}</b>
          <span class="text-muted text-[13px]">{{ it.days === 2 ? t('plan.list.twoDays') : t('plan.list.oneDay') }} · {{ t('plan.stops', { n: it.stops.length }) }}</span>
        </div>
        <div class="w-14 h-14 mr-3.5 rounded-full flex items-center justify-center shrink-0"
          :style="{ background: `conic-gradient(var(--color-green, #3B6D11) ${progress(it).pct}%, var(--color-line, #E8E8E3) 0)` }">
          <b class="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-[12px]">{{ progress(it).done }}/{{ progress(it).total }}</b>
        </div>
      </router-link>
      <p class="text-muted text-[12.5px] text-center">{{ t('plan.list.footnote') }}</p>
    </template>
  </div>
</template>
