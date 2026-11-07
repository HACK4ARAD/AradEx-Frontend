<script setup lang="ts">
/**
 * Mesajele unui chat de grup al voluntarilor (stilul bulelor din design/final `/vol/messages`): ale mele în dreapta, negre;
 * ale celorlalți în stânga, albe cu chenar, cu numele deasupra primului mesaj dintr-un șir; pozele rotunjite, care se deschid
 * pe tot ecranul. Sub fiecare șir: ora.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { messageTime } from '@/shared/composables/useVolunteer'
import type { ChatMessageDto } from '@/shared/types/volunteer'

const props = defineProps<{ messages: ChatMessageDto[] }>()
const { t } = useI18n()
const open = ref<string | null>(null)

/** Un mesaj începe un șir nou dacă autorul diferă de cel dinainte sau au trecut peste 5 minute. */
const rows = computed(() => props.messages.map((m, i) => {
  const prev = props.messages[i - 1]
  const next = props.messages[i + 1]
  const gap = (a?: ChatMessageDto, b?: ChatMessageDto) => !a || !b || a.authorId !== b.authorId || Math.abs(Date.parse(b.createdAt) - Date.parse(a.createdAt)) > 5 * 60_000
  return { m, first: gap(prev, m), last: gap(m, next) }
}))
</script>

<template>
  <div class="flex flex-col" data-test="chat-thread">
    <template v-for="{ m, first, last } in rows" :key="m.id">
      <span v-if="first && !m.mine" class="text-[12.5px] font-semibold text-muted ml-1 mt-3 mb-1" data-test="chat-author">{{ m.authorName }}</span>
      <div class="max-w-[82%] flex flex-col gap-1" :class="[m.mine ? 'self-end items-end' : 'self-start items-start', first && m.mine ? 'mt-3' : 'mt-1']">
        <button v-if="m.imageUrl" type="button" class="block rounded-[18px] overflow-hidden border border-line bg-soft" :aria-label="t('volunteer.messages.openPhoto')"
          data-test="chat-photo" @click="open = m.imageUrl!">
          <img :src="m.imageUrl" alt="" loading="lazy" class="block w-[240px] max-w-full h-[180px] object-cover">
        </button>
        <div v-if="m.text" class="whitespace-pre-wrap break-words rounded-[22px] px-4 py-2.5 text-[16px] leading-[1.45]"
          :class="m.mine ? 'bg-ink text-white' : 'bg-white border border-line text-ink'">{{ m.text }}</div>
      </div>
      <span v-if="last" class="text-[11.5px] text-muted mt-1 mb-1" :class="m.mine ? 'self-end mr-1' : 'self-start ml-1'">{{ messageTime(m.createdAt) }}</span>
    </template>

    <!-- poza pe tot ecranul -->
    <div v-if="open" class="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" role="dialog" aria-modal="true" @click="open = null">
      <img :src="open" alt="" class="max-w-full max-h-full object-contain rounded-[12px]">
      <button type="button" class="absolute top-[max(16px,env(safe-area-inset-top))] right-4 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center"
        :aria-label="t('volunteer.messages.close')" @click.stop="open = null"><AppIcon name="close" /></button>
    </div>
  </div>
</template>
