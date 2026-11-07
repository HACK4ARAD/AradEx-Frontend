<script setup lang="ts">
/**
 * Firul de mesaje voluntar ↔ Primărie. `mine(m)` spune ce mesaje sunt ale celui care citește (dreapta, negru); celelalte sunt
 * în stânga (alb cu chenar în aplicație, design/final `.bubble`; gri deschis în panou, `.bub`). Sub fiecare: autorul și ora.
 */
import { useI18n } from 'vue-i18n'
import { messageTime } from '@/shared/composables/useVolunteer'
import type { VolunteerMessageDto } from '@/shared/types/volunteer'

const props = defineProps<{ messages: VolunteerMessageDto[]; mine: (m: VolunteerMessageDto) => boolean; variant?: 'app' | 'panel'; youLabel?: string }>()
const { t } = useI18n()
const who = (m: VolunteerMessageDto) => (props.mine(m) ? (props.youLabel ?? t('volunteer.messages.you')) : m.authorName ?? '')
</script>

<template>
  <div class="flex flex-col gap-1.5" data-test="thread">
    <template v-for="m in messages" :key="m.id">
      <div class="max-w-[82%] whitespace-pre-wrap break-words"
        :class="[
          mine(m) ? 'self-end bg-ink text-white' : variant === 'panel' ? 'self-start bg-white border border-line text-ink' : 'self-start bg-white border border-line text-ink',
          variant === 'panel' ? 'rounded-[14px] px-4 py-2.5 text-[14.5px] leading-relaxed' : 'rounded-[22px] px-4 py-3 text-[16px] leading-[1.45]',
        ]">{{ m.text }}</div>
      <span class="text-[11.5px] text-muted mb-2" :class="mine(m) ? 'self-end' : 'self-start'">
        <template v-if="variant !== 'panel'">{{ who(m) }} · </template>{{ messageTime(m.createdAt) }}
      </span>
    </template>
  </div>
</template>
