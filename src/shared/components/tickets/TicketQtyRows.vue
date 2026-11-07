<script setup lang="ts">
// T23 · rândurile „Adult · 40 lei  − 1 +” din caseta de bilete web (design/final W6 `.kv` + `.stepper`), folosite în detaliul
// evenimentului și în pagina „Alege biletele” de pe web. Logica (cantități, limite) e în `useTicketPick`.
import { useI18n } from 'vue-i18n'
import AppIcon from '@/shared/components/ui/AppIcon.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { MAX_QTY, type TicketKind } from '@/shared/composables/useTicketOrder'

defineProps<{ kinds: { key: TicketKind; price?: number }[]; qty: Record<TicketKind, number> }>()
const emit = defineEmits<{ step: [kind: TicketKind, delta: number] }>()
const { t } = useI18n()
const f = useFormat()
const label = (k: TicketKind) => (k === 'adult' ? t('tickets.adult') : t('tickets.child'))
const btn = 'w-9 h-9 rounded-full border border-line bg-white inline-flex items-center justify-center disabled:opacity-40'
</script>

<template>
  <div v-for="k in kinds" :key="k.key" class="flex items-center justify-between gap-3 py-2 border-b border-line text-[14px]">
    <span class="min-w-0">{{ label(k.key) }} · {{ f.money(k.price ?? 0) }}</span>
    <span class="inline-flex items-center gap-2.5 shrink-0">
      <button type="button" :class="btn" :aria-label="`${t('tickets.less')} · ${label(k.key)}`" :disabled="qty[k.key] === 0" @click="emit('step', k.key, -1)"><AppIcon name="remove" :size="16" /></button>
      <b class="min-w-3.5 text-center" aria-live="polite">{{ qty[k.key] }}</b>
      <button type="button" :class="btn" :aria-label="`${t('tickets.more')} · ${label(k.key)}`" :disabled="qty[k.key] === MAX_QTY" @click="emit('step', k.key, 1)"><AppIcon name="add" :size="16" /></button>
    </span>
  </div>
</template>
