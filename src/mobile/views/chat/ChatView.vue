<script setup lang="ts">
// T12 · S8 — Chat (design/final mobile.html `/chat`): antet cu „Chat nou” + avatar, salutul cu întrebările de început,
// baloanele (eu în dreapta, asistentul în stânga), chips de răspuns rapid, evenimentele recomandate, „…” cât așteaptă
// și câmpul fix de jos deasupra tab bar-ului. Logica: shared/composables/useChat.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import ChatEventRow from '@/shared/components/chat/ChatEventRow.vue'
import { useChat, type ChatItem } from '@/shared/composables/useChat'
import { useAuthStore } from '@/shared/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const chat = useChat()
const text = ref('')
const initials = computed(() => (auth.user?.displayName ?? '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase())
const started = computed(() => chat.items.value.length > 1)

function label(i: ChatItem) {
  return i.starter || i.error ? t(i.text) : i.text
}

async function submit() {
  const q = text.value
  if (!q.trim()) return
  text.value = ''
  await chat.send(q)
}

function scrollDown() {
  void nextTick(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }))
}
watch(() => [chat.items.value.length, chat.typing.value], scrollDown)
onMounted(() => { if (started.value) void nextTick(() => window.scrollTo({ top: document.documentElement.scrollHeight })) })
</script>

<template>
  <div class="pb-[190px]">
    <div class="flex items-center justify-between gap-3 pt-2 mb-3.5">
      <div class="min-w-0">
        <h1 class="m-0 text-[30px] font-semibold tracking-[-0.025em] leading-tight">{{ t('chat.title') }}</h1>
        <p class="text-muted text-[14px] mt-1 mb-0">{{ t('chat.sub') }}</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button v-if="started" type="button" class="min-h-9 px-3 rounded-full border border-line bg-white text-[13px] font-medium inline-flex items-center gap-1.5"
          @click="chat.reset()"><AppIcon name="edit_square" :size="18" />{{ t('chat.newChat') }}</button>
        <router-link to="/profile" class="w-11 h-11 rounded-full flex items-center justify-center no-underline font-bold text-[17px]"
          :class="auth.user ? 'bg-ink text-white' : 'bg-white border border-line text-ink'" :aria-label="t('nav.profile')">
          <template v-if="auth.user">{{ initials }}</template><AppIcon v-else name="person" />
        </router-link>
      </div>
    </div>

    <div class="flex flex-col gap-2.5" aria-live="polite">
      <template v-for="(m, idx) in chat.items.value" :key="idx">
        <div class="max-w-[82%] px-4 py-3 rounded-[20px] text-[15px] leading-[1.4] whitespace-pre-line"
          :class="m.from === 'me' ? 'self-end bg-ink text-white rounded-br-[6px]' : 'self-start bg-white border border-line rounded-bl-[6px]'">
          {{ label(m) }}
        </div>
        <div v-if="m.offline" class="self-start max-w-[82%] flex items-center gap-1.5 text-[12.5px] text-muted -mt-1">
          <AppIcon name="cloud_off" :size="15" />{{ t('chat.offline') }}
        </div>
        <button v-if="m.error" type="button" class="self-start min-h-9 px-3 rounded-full border border-line bg-white text-[13px] font-medium inline-flex items-center gap-1.5"
          :disabled="chat.typing.value" @click="chat.retry(m)"><AppIcon name="refresh" :size="16" />{{ t('chat.retry') }}</button>
        <template v-if="m.eventIds?.length">
          <template v-for="id in m.eventIds" :key="id">
            <ChatEventRow v-if="chat.event(id)" :event="chat.event(id)!" />
          </template>
        </template>
        <div v-if="m.chips?.length && idx === chat.items.value.length - 1" class="flex flex-wrap gap-2 max-w-[88%]">
          <button v-for="c in m.chips" :key="c" type="button" :disabled="chat.typing.value"
            class="min-h-9 px-3 py-1.5 rounded-full border border-line bg-white text-[13px] font-medium inline-flex items-center gap-1.5 text-left"
            @click="chat.send(c)"><AppIcon v-if="m.starter" name="north_east" :size="16" />{{ c }}</button>
        </div>
      </template>
      <div v-if="chat.typing.value" class="self-start px-4 py-3 rounded-[20px] rounded-bl-[6px] bg-white border border-line" role="status" :aria-label="t('chat.typing')">
        <i class="ax-dot" /><i class="ax-dot" /><i class="ax-dot" />
      </div>
    </div>

    <!-- design/final `.composer`: deasupra tab bar-ului, cu fundal care se estompează în sus -->
    <form class="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] bottom-[calc(max(22px,env(safe-area-inset-bottom))+78px)] z-[34] px-5 py-2.5 flex gap-2.5 items-center bg-gradient-to-t from-bg from-70% to-transparent"
      @submit.prevent="submit">
      <input id="chat-input" v-model="text" type="text" enterkeyhint="send" autocomplete="off" maxlength="1000" :placeholder="t('chat.placeholder')"
        class="flex-1 min-w-0 h-[52px] px-4 rounded-full border border-line bg-white outline-none text-[16px] focus:border-ink" />
      <button type="submit" class="w-[52px] h-[52px] rounded-full bg-ink text-white flex items-center justify-center shrink-0 disabled:opacity-50"
        :disabled="!text.trim() || chat.typing.value" :aria-label="t('chat.send')"><AppIcon name="arrow_upward" /></button>
    </form>
  </div>
</template>

<style scoped>
.ax-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--color-muted, #5C5C5C); margin-right: 3px; animation: ax-blink 1s infinite; }
.ax-dot:nth-child(2) { animation-delay: .2s; }
.ax-dot:nth-child(3) { animation-delay: .4s; }
@keyframes ax-blink { 0%, 80%, 100% { opacity: .3; } 40% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .ax-dot { animation: none; opacity: .6; } }
</style>
