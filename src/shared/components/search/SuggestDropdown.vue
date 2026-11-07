<script setup lang="ts">
// Lista derulantă de sub câmpul de căutare (Căutare S2 și „Unde vrei să ajungi?” din Transport, T19): „Populare” cu câmpul
// gol, „Se potrivesc” după primele litere (partea potrivită îngroșată), fiecare rând cu insignele liniilor CTP din apropiere.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import LineBadge from '@/shared/components/transit/LineBadge.vue'
import { fold, type Suggestion } from '@/shared/composables/useSuggest'

const props = withDefaults(defineProps<{ items: Suggestion[]; query: string; maxLines?: number }>(), { maxLines: 5 })
const emit = defineEmits<{ pick: [s: Suggestion] }>()
const { t } = useI18n()

const typed = computed(() => props.query.trim())
/** numele împărțit în [înainte, potrivit, după], ca literele scrise să apară îngroșate */
function parts(name: string): [string, string, string] {
  const k = fold(typed.value)
  if (!k) return [name, '', '']
  const n = fold(name)
  let i = n.startsWith(k) ? 0 : -1
  if (i < 0) { const m = new RegExp(`(^|[\\s\\-–„”"'.,()/])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).exec(n); if (m) i = m.index + m[1].length }
  if (i < 0) i = n.indexOf(k)
  if (i < 0) return [name, '', '']
  return [name.slice(0, i), name.slice(i, i + k.length), name.slice(i + k.length)]
}
</script>

<template>
  <div class="bg-white border border-line rounded-[16px] shadow-[0_12px_32px_rgba(17,17,17,.12)] overflow-hidden" role="listbox" data-test="suggest-dropdown">
    <div class="px-4 pt-3 pb-1 text-[12px] uppercase tracking-[.06em] font-semibold text-muted">{{ typed ? t('suggest.results') : t('suggest.popular') }}</div>
    <p v-if="!items.length" class="m-0 px-4 pb-3.5 pt-1 text-[13.5px] text-muted">{{ t('suggest.empty', { q: typed }) }}</p>
    <button v-for="s in items" :key="s.key" type="button" role="option" class="w-full flex items-center gap-3 px-4 py-2.5 border-t border-line first-of-type:border-t-0 text-left active:bg-soft"
      @mousedown.prevent @click="emit('pick', s)">
      <span class="w-10 h-10 rounded-[12px] shrink-0 bg-soft bg-cover bg-center flex items-center justify-center text-muted" :style="s.imageUrl ? { backgroundImage: `url('${s.imageUrl}')` } : undefined">
        <AppIcon v-if="!s.imageUrl" :name="s.icon" :size="20" />
      </span>
      <span class="flex-1 min-w-0">
        <span class="block truncate text-[15px] text-ink">{{ parts(s.name)[0] }}<b class="font-bold">{{ parts(s.name)[1] }}</b>{{ parts(s.name)[2] }}</span>
        <span class="block truncate text-[12.5px] text-muted">{{ s.sub }}</span>
        <span v-if="s.lines.length" class="flex items-center gap-1 mt-1 overflow-hidden" :aria-label="t('suggest.linesNear')">
          <LineBadge v-for="l in s.lines.slice(0, maxLines)" :key="l.id" :name="l.shortName" :color="l.color" :text-color="l.textColor" :mode="l.mode" size="xs" :icon="false" />
          <span v-if="s.lines.length > maxLines" class="text-[11.5px] text-muted font-semibold">{{ t('suggest.more', { n: s.lines.length - maxLines }) }}</span>
        </span>
      </span>
      <AppIcon name="chevron_right" :size="18" class="text-muted shrink-0" />
    </button>
  </div>
</template>
