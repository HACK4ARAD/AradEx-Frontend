<script setup lang="ts">
// T18 · Mesaje (design/final `/vol/messages`): conversația cu coordonatorul, răspunsurile rapide și câmpul de jos.
import { nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import VolAccountButton from '@/shared/components/volunteer/VolAccountButton.vue'
import MessageThread from '@/shared/components/volunteer/MessageThread.vue'
import { volunteerApi } from '@/shared/api/volunteer'
import { QUICK_REPLIES, useThread, useVolunteerHome, volunteerUnread } from '@/shared/composables/useVolunteer'

const { t } = useI18n()
const home = useVolunteerHome()
const thread = useThread(volunteerApi.messages, volunteerApi.send)
const text = ref('')

/** Până jos de tot (nu doar „în ecran”): ultimele mesaje și răspunsurile rapide trebuie să rămână deasupra câmpului și a barei. */
const scrollDown = () => nextTick(() => window.scrollTo({ top: document.documentElement.scrollHeight }))
onMounted(async () => {
  await Promise.all([home.load(), thread.reload()])
  volunteerUnread.value = 0
  scrollDown()
})
watch(() => thread.messages.value.length, scrollDown)

async function send(value = text.value) {
  if (await thread.send(value)) { if (value === text.value) text.value = '' }
}
</script>

<template>
  <div class="flex items-start justify-between gap-3 pt-2 mb-4">
    <div class="min-w-0">
      <h1 class="text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] m-0">{{ t('volunteer.messages.title') }}</h1>
      <p class="text-muted text-[15px] mt-1.5 mb-0">{{ home.me.value?.coordinatorName ? t('volunteer.messages.with', { name: home.me.value.coordinatorName }) : t('volunteer.messages.withCity') }}</p>
    </div>
    <VolAccountButton :coordinator="home.me.value?.coordinatorName" :one-time="home.me.value?.oneTime" />
  </div>

  <div class="pb-[110px]">
    <Skeleton v-if="thread.loading.value && !thread.messages.value.length" :rows="3" :height="64" />
    <p v-else-if="!thread.messages.value.length" class="text-muted text-[14px]">{{ t('volunteer.messages.empty') }}</p>
    <MessageThread v-else :messages="thread.messages.value" :mine="(m) => !m.fromCity" />
    <div class="flex flex-wrap gap-2 mt-2">
      <button v-for="q in QUICK_REPLIES" :key="q" type="button" class="h-9 px-3.5 rounded-full bg-white border border-line text-[14px] font-medium disabled:opacity-50"
        :disabled="thread.sending.value" @click="send(t(`volunteer.quick.${q}`))">{{ t(`volunteer.quick.${q}`) }}</button>
    </div>
  </div>

  <!-- câmpul de scris, deasupra barei de tab-uri (design `.composer`) -->
  <form class="fixed left-1/2 -translate-x-1/2 bottom-[calc(max(22px,env(safe-area-inset-bottom))+80px)] w-[calc(100%-40px)] max-w-[440px] z-30 flex items-center gap-2.5"
    @submit.prevent="send()">
    <input v-model="text" maxlength="1000" :placeholder="t('volunteer.messages.placeholder')" :aria-label="t('volunteer.messages.placeholder')" data-test="vol-message"
      class="flex-1 min-w-0 h-[52px] rounded-full bg-white border border-line px-5 text-[16px] outline-none focus:border-ink shadow-[0_6px_18px_rgba(17,17,17,.08)] placeholder:text-[#9A9A94]">
    <button type="submit" class="w-[52px] h-[52px] shrink-0 rounded-full bg-ink text-white flex items-center justify-center disabled:opacity-50"
      :disabled="!text.trim() || thread.sending.value" :aria-label="t('volunteer.messages.send')"><AppIcon name="arrow_upward" /></button>
  </form>
</template>
