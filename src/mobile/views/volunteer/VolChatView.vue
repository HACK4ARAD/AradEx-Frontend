<script setup lang="ts">
// T18 · Chatul de grup al voluntarilor unei acțiuni: antetul (acțiunea, voluntarii), mesajele (text și poze) și câmpul de jos
// cu „Trimite o poză”. Se reîmprospătează singur cât e deschis. Primăria nu e în chat.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import ChatThread from '@/shared/components/volunteer/ChatThread.vue'
import { useBack } from '@/shared/composables/useBack'
import { refreshVolunteerUnread, useActionChat } from '@/shared/composables/useVolunteer'

const { t } = useI18n()
const route = useRoute()
const back = useBack('/vol/messages')
const actionId = computed(() => Number(route.params.actionId))
const c = useActionChat(actionId)
const text = ref('')
const picker = ref<HTMLInputElement | null>(null)

const memberNames = computed(() => (c.chat.value?.members ?? []).map((m) => m.name.split(' ')[0]).join(', '))
/** Până jos de tot: ultimul mesaj trebuie să rămână deasupra câmpului de scris (care e fix peste pagină). */
const scrollDown = () => nextTick(() => window.scrollTo({ top: document.documentElement.scrollHeight }))
onMounted(c.start)
// mesaje noi (ale mele sau venite la reîmprospătare) → jos; deschiderea chatului îl marchează citit, deci punctul se recalculează
watch(() => c.chat.value?.messages.length, (n, old) => { if (n !== old) { scrollDown(); void refreshVolunteerUnread() } })

async function send() {
  if (await c.send(text.value)) text.value = ''
}
async function onPhoto(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (await c.sendPhoto(file, text.value)) text.value = ''
}
</script>

<template>
  <!-- antetul, fix sus -->
  <div class="sticky top-0 z-20 -mx-5 px-5 pt-[max(8px,env(safe-area-inset-top))] pb-3 bg-bg border-b border-line flex items-center gap-3">
    <button type="button" class="w-11 h-11 shrink-0 rounded-full bg-white border border-line flex items-center justify-center" :aria-label="t('volunteer.messages.back')" @click="back">
      <AppIcon name="arrow_back" />
    </button>
    <div class="min-w-0 flex-1">
      <b class="block text-[17px] leading-tight truncate">{{ c.chat.value?.title ?? t('volunteer.messages.title') }}</b>
      <span v-if="c.chat.value" class="block text-[13px] text-muted truncate">{{ memberNames }} · {{ t('volunteer.messages.members', { n: c.chat.value.members.length }, c.chat.value.members.length) }}</span>
    </div>
  </div>

  <div class="pt-2 pb-[120px]">
    <Skeleton v-if="c.loading.value && !c.chat.value" :rows="4" :height="56" />
    <EmptyState v-else-if="c.failed.value && !c.chat.value" icon="forum" :title="t('volunteer.messages.loadError')" :text="t(c.failed.value)" />
    <p v-else-if="c.chat.value && !c.chat.value.messages.length" class="text-muted text-[14px] text-center mt-10">{{ t('volunteer.messages.noMessages') }}</p>
    <ChatThread v-else-if="c.chat.value" :messages="c.chat.value.messages" />
  </div>

  <!-- câmpul de scris, fix jos (fără tab bar în chat) -->
  <form v-if="c.chat.value" class="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[480px] z-30 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] bg-bg border-t border-line flex items-center gap-2"
    @submit.prevent="send">
    <button type="button" class="w-12 h-12 shrink-0 rounded-full bg-white border border-line flex items-center justify-center disabled:opacity-50"
      :disabled="c.sending.value" :aria-label="t('volunteer.messages.addPhoto')" data-test="chat-add-photo" @click="picker?.click()">
      <AppIcon :name="c.sending.value ? 'progress_activity' : 'add_photo_alternate'" :class="c.sending.value && 'animate-spin'" />
    </button>
    <input ref="picker" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" data-test="chat-photo-input" @change="onPhoto">
    <input v-model="text" maxlength="1000" :placeholder="t('volunteer.messages.placeholder')" :aria-label="t('volunteer.messages.placeholder')" data-test="chat-input"
      class="flex-1 min-w-0 h-12 rounded-full bg-white border border-line px-4 text-[16px] outline-none focus:border-ink">
    <button type="submit" class="w-12 h-12 shrink-0 rounded-full bg-ink text-white flex items-center justify-center disabled:opacity-40"
      :disabled="!text.trim() || c.sending.value" :aria-label="t('volunteer.messages.send')" data-test="chat-send"><AppIcon name="arrow_upward" /></button>
  </form>
</template>
