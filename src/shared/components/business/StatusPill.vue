<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ContentStatus } from '@/shared/types/business'

/** Starea conținutului unei firme: Publicat (verde) / Ciornă (galben) / Ascuns (gri). */
defineProps<{ status: ContentStatus | string }>()
const { t } = useI18n()
const tone: Record<string, string> = {
  PUBLISHED: 'bg-ok-soft text-ok', DRAFT: 'bg-warn-soft text-warn', HIDDEN: 'bg-soft text-muted',
}
</script>

<template>
  <span class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[12px] font-semibold whitespace-nowrap" :class="tone[status] ?? tone.HIDDEN">
    <i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`business.status.${status}`) }}
  </span>
</template>
