<script setup lang="ts">
// T18 · Mesaje: câte un chat de grup pentru fiecare acțiune alocată, cu toți voluntarii ei (Primăria nu e în chat).
// Fiecare rând: data acțiunii, titlul, câți voluntari, ultimul mesaj și punctul pentru mesaje noi.
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import VolAccountButton from '@/shared/components/volunteer/VolAccountButton.vue'
import { dayParts } from '@/shared/composables/useCommunity'
import { messageTime, useVolunteerChats } from '@/shared/composables/useVolunteer'
import type { ChatSummaryDto } from '@/shared/types/volunteer'

const { t } = useI18n()
const chats = useVolunteerChats()
onMounted(chats.load)

function preview(c: ChatSummaryDto): string {
  const m = c.lastMessage
  if (!m) return t('volunteer.messages.noMessages')
  const who = m.mine ? t('volunteer.messages.you') : (m.authorName ?? '').split(' ')[0]
  return `${who}: ${m.text ?? t('volunteer.messages.photo')}`
}
</script>

<template>
  <div class="flex items-start justify-between gap-3 pt-2 mb-4">
    <div class="min-w-0">
      <h1 class="text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] m-0">{{ t('volunteer.messages.title') }}</h1>
      <p class="text-muted text-[15px] mt-1.5 mb-0">{{ t('volunteer.messages.subtitle') }}</p>
    </div>
    <VolAccountButton />
  </div>

  <Skeleton v-if="chats.loading.value && !chats.items.value.length" :rows="3" :height="84" />
  <EmptyState v-else-if="!chats.items.value.length" icon="forum" :title="t('volunteer.messages.empty')" :text="t('volunteer.messages.emptyText')" />
  <div v-else class="bg-white border border-line rounded-[20px] overflow-hidden">
    <router-link v-for="c in chats.items.value" :key="c.actionId" :to="`/vol/messages/${c.actionId}`" data-test="chat-row"
      class="flex items-center gap-3 px-4 py-3.5 border-b border-line last:border-b-0 no-underline text-ink active:bg-soft">
      <div class="w-[50px] shrink-0 py-1 rounded-[12px] border border-line flex flex-col items-center leading-[1.05]">
        <span class="text-[9.5px] font-extrabold text-muted">{{ dayParts(c.startAt).dow }}</span>
        <b class="text-[18px]">{{ dayParts(c.startAt).day }}</b>
        <span class="text-[9.5px] font-extrabold text-muted">{{ dayParts(c.startAt).mon }}</span>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-baseline justify-between gap-2">
          <b class="text-[15.5px] leading-snug truncate">{{ c.title }}</b>
          <span v-if="c.lastMessage" class="text-[12px] text-muted shrink-0">{{ messageTime(c.lastMessage.createdAt) }}</span>
        </div>
        <span class="flex items-center gap-1 text-[12.5px] text-muted"><AppIcon name="group" :size="15" />{{ t('volunteer.messages.members', { n: c.members }, c.members) }}</span>
        <span class="flex items-center gap-1 text-[14px] mt-0.5 min-w-0" :class="c.unread ? 'text-ink font-semibold' : 'text-muted'">
          <AppIcon v-if="c.lastMessage?.imageUrl && !c.lastMessage.text" name="image" :size="16" class="shrink-0" />
          <span class="truncate">{{ preview(c) }}</span>
        </span>
      </div>
      <span v-if="c.unread" class="min-w-[22px] h-[22px] px-1.5 rounded-full bg-accent text-white text-[12px] font-bold flex items-center justify-center shrink-0"
        :aria-label="t('volunteer.messages.newMessages')">{{ c.unread }}</span>
      <AppIcon v-else name="chevron_right" class="text-muted shrink-0" />
    </router-link>
  </div>
</template>
