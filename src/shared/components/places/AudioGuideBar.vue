<script setup lang="ts">
/** Bara audio a ghidului (E3/W8): play/pauză, punctul curent, progres, viteză. Logica e în `useAudioGuide`. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { clock } from '@/shared/composables/useAudioGuide'

const props = defineProps<{
  index: number; title: string; playing: boolean; elapsed: number; total: number; rate: number; supported: boolean; hasVoice: boolean
}>()
defineEmits<{ toggle: []; rate: [] }>()
const { t, n } = useI18n()
const pct = computed(() => (props.total ? Math.min(100, Math.round((props.elapsed / props.total) * 100)) : 0))
const rateLabel = computed(() => n(props.rate, { maximumFractionDigits: 2 }))
</script>

<template>
  <div>
    <div class="flex items-center gap-3 px-3.5 py-3 rounded-[18px] bg-ink text-white" data-test="audio-bar">
      <button type="button" class="w-11 h-11 rounded-full bg-white text-ink flex items-center justify-center shrink-0 disabled:opacity-40"
        :aria-label="playing ? t('places.audio.pause') : t('places.audio.play')" :disabled="!supported" @click="$emit('toggle')">
        <AppIcon :name="playing ? 'pause' : 'play_arrow'" fill :size="26" />
      </button>
      <div class="flex-1 min-w-0">
        <b class="block text-[14px] truncate">{{ index + 1 }} · {{ title }}</b>
        <div class="h-1 bg-white/25 rounded-full my-2 overflow-hidden"><i class="block h-full bg-white transition-[width] duration-300" :style="{ width: (playing ? Math.max(pct, 3) : 0) + '%' }" /></div>
        <span class="block text-[12px] opacity-80 truncate">{{ playing ? t('places.audio.playing') : clock(elapsed) }} / {{ clock(total) }} · {{ t('places.audio.voice') }}</span>
      </div>
      <button type="button" class="text-[12px] font-bold px-2 py-1 rounded-lg border border-white/35 shrink-0" :aria-label="t('places.audio.speed', { r: rateLabel })" @click="$emit('rate')">
        {{ rateLabel }}×
      </button>
    </div>
    <p v-if="!supported" class="text-[13px] text-muted mt-2 mb-0">{{ t('places.audio.unsupported') }}</p>
    <p v-else-if="!hasVoice" class="text-[12.5px] text-muted mt-2 mb-0">{{ t('places.audio.noVoice') }}</p>
  </div>
</template>
