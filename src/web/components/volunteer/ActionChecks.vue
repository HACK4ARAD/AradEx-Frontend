<script setup lang="ts">
/** Acțiunile la care scanează un voluntar (design/final web `field(…, 'checks')`): carduri cu bifă, titlul și ziua · ora. */
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import type { ActionDto } from '@/shared/types/community'

defineProps<{ actions: ActionDto[] }>()
const model = defineModel<number[]>({ required: true })
const { t } = useI18n()
const f = useFormat()
function toggle(id: number) {
  model.value = model.value.includes(id) ? model.value.filter((x) => x !== id) : [...model.value, id]
}
</script>

<template>
  <p v-if="!actions.length" class="text-muted text-[13.5px] m-0">{{ t('volunteer.panel.noPublished') }}</p>
  <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="group">
    <button v-for="a in actions" :key="a.id" type="button" role="checkbox" :aria-checked="model.includes(a.id)" data-test="action-check"
      class="flex items-start gap-3 text-left p-3.5 rounded-[12px] border bg-white transition-colors"
      :class="model.includes(a.id) ? 'border-ink shadow-[0_0_0_1px_#111]' : 'border-line hover:border-[#D3D2CC]'" @click="toggle(a.id)">
      <span class="w-[18px] h-[18px] mt-0.5 shrink-0 rounded-[5px] border-[1.5px] flex items-center justify-center text-white"
        :class="model.includes(a.id) ? 'bg-ink border-ink' : 'border-[#C9C8C2]'"><AppIcon v-if="model.includes(a.id)" name="check" :size="14" /></span>
      <span class="min-w-0"><b class="block text-[13.5px] leading-snug">{{ a.title }}</b>
        <span class="block text-[12.5px] text-muted mt-0.5">{{ f.dateTime(a.startAt, false) }} · {{ f.timeRange(a.startAt) }}</span></span>
    </button>
  </div>
</template>
