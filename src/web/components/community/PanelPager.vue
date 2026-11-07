<script setup lang="ts">
/**
 * Paginarea unei liste din panou (stil `design/final/web`: butoane mici albe cu chenar): „13–24 din 31”, înapoi / înainte și
 * numerele paginilor (cu „…” când sunt multe). Nu apare dacă totul încape pe o pagină.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'

const props = defineProps<{ total: number; size: number }>()
const page = defineModel<number>({ required: true })
const { t } = useI18n()

const pages = computed(() => Math.max(1, Math.ceil(props.total / props.size)))
const from = computed(() => (page.value - 1) * props.size + 1)
const to = computed(() => Math.min(props.total, page.value * props.size))
/** 1 … 4 5 6 … 12: prima, ultima și vecinii paginii curente. */
const items = computed<(number | '…')[]>(() => {
  const n = pages.value
  const keep = new Set([1, n, page.value - 1, page.value, page.value + 1].filter((p) => p >= 1 && p <= n))
  const out: (number | '…')[] = []
  let last = 0
  for (const p of [...keep].sort((a, b) => a - b)) {
    if (p - last > 1) out.push('…')
    out.push(p)
    last = p
  }
  return out
})
const btn = 'h-8 min-w-8 px-2 rounded-[9px] border text-[13px] font-semibold inline-flex items-center justify-center disabled:opacity-40'
</script>

<template>
  <nav v-if="pages > 1" class="flex flex-wrap items-center justify-between gap-2.5 mt-3.5" :aria-label="t('common.pagination')" data-test="pager">
    <span class="text-[12.5px] text-muted">{{ t('common.pageRange', { from, to, total }) }}</span>
    <div class="flex items-center gap-1">
      <button type="button" :class="[btn, 'border-line bg-white text-ink']" :disabled="page <= 1" :aria-label="t('common.prevPage')" @click="page--">
        <AppIcon name="chevron_left" :size="18" />
      </button>
      <template v-for="(p, i) in items" :key="i">
        <span v-if="p === '…'" class="px-1 text-muted text-[13px]">…</span>
        <button v-else type="button" :class="[btn, p === page ? 'bg-ink text-white border-ink' : 'border-line bg-white text-ink']"
          :aria-current="p === page ? 'page' : undefined" @click="page = p">{{ p }}</button>
      </template>
      <button type="button" :class="[btn, 'border-line bg-white text-ink']" :disabled="page >= pages" :aria-label="t('common.nextPage')" @click="page++">
        <AppIcon name="chevron_right" :size="18" />
      </button>
    </div>
  </nav>
</template>
