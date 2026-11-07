<script setup lang="ts">
/** Punctele ghidului (design: `.gp`): tap = îl alegi (dacă se citea, continuă cu el). Punctul curent are textul întreg; celelalte, un rând. */
import { AppIcon } from '@/shared/components'
import { pointSeconds } from '@/shared/composables/useAudioGuide'
import type { GuidePointDto } from '@/shared/types/places'

defineProps<{ points: GuidePointDto[]; current: number }>()
defineEmits<{ pick: [index: number] }>()
const minutes = (p: GuidePointDto) => Math.max(1, Math.round(pointSeconds(p) / 60))
</script>

<template>
  <div>
    <button v-for="(p, i) in points" :key="p.id" type="button" class="w-full text-left flex gap-3 py-3.5 border-b border-line"
      :aria-current="i === current ? 'step' : undefined" data-test="guide-point" @click="$emit('pick', i)">
      <span class="w-7 h-7 rounded-full border-[1.5px] border-ink flex items-center justify-center text-[13px] font-bold shrink-0"
        :class="i === current ? 'bg-ink text-bg' : ''">{{ i + 1 }}</span>
      <span class="flex-1 min-w-0">
        <span class="flex justify-between items-center gap-2">
          <b class="text-[16px] font-bold">{{ p.title }}</b>
          <span class="text-muted text-[12.5px] shrink-0 flex items-center gap-1"><AppIcon name="play_circle" :size="16" /> {{ minutes(p) }} min</span>
        </span>
        <span class="block text-[14px] mt-0.5" :class="i === current ? 'text-ink' : 'text-muted truncate'">{{ p.text }}</span>
      </span>
    </button>
  </div>
</template>
