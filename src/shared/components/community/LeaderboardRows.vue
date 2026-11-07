<script setup lang="ts">
/** Rândurile clasamentului (medalii pentru primii 3), cu rândul meu evidențiat; dacă nu sunt în listă, apare la final după „···”. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/shared/composables/useFormat'
import type { LeaderboardDto } from '@/shared/types/community'

const props = withDefaults(defineProps<{ board: LeaderboardDto; meId?: number; meName?: string; limit?: number }>(), { limit: 10 })
const { t } = useI18n()
const f = useFormat()
const rows = computed(() => props.board.entries.slice(0, props.limit))
const meVisible = computed(() => !!props.meId && rows.value.some((r) => r.userId === props.meId))
const medal = (rank: number) => (rank === 1 ? 'bg-[#FFE08A]' : rank === 2 ? 'bg-[#E6E6E6]' : rank === 3 ? 'bg-[#F0C9A8]' : 'bg-soft')
</script>

<template>
  <div>
    <div v-for="r in rows" :key="r.userId" class="flex items-center gap-3 py-[11px] border-b border-line last:border-b-0">
      <span class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0" :class="r.userId === meId ? 'bg-green-soft' : medal(r.rank)">{{ r.rank }}</span>
      <b class="flex-1 min-w-0 truncate" :class="r.rank <= 3 ? 'font-bold' : 'font-medium'">
        {{ r.displayName }}<span v-if="r.userId === meId" class="ml-1.5 rounded-full bg-green-soft text-green-deep text-[11px] font-semibold px-2 py-0.5">{{ t('community.leaderboard.you') }}</span>
      </b>
      <span class="text-muted text-[14px] whitespace-nowrap">{{ f.points(r.points) }}</span>
    </div>
    <template v-if="board.me && meId && !meVisible">
      <div class="text-muted text-center py-2">···</div>
      <div class="flex items-center gap-3 py-[11px]">
        <span class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[13px] bg-green-soft shrink-0">{{ board.me.rank }}</span>
        <b class="flex-1 min-w-0 truncate">{{ meName ?? t('community.leaderboard.you') }}<span class="ml-1.5 rounded-full bg-green-soft text-green-deep text-[11px] font-semibold px-2 py-0.5">{{ t('community.leaderboard.you') }}</span></b>
        <span class="text-muted text-[14px] whitespace-nowrap">{{ f.points(board.me.points) }}</span>
      </div>
    </template>
  </div>
</template>
