<script setup lang="ts">
/**
 * Cardul unei acțiuni pe pagina „Validare” (panou Primărie / Admin): poza, categoria, starea (azi / urmează / încheiată),
 * titlul, ziua și ora, locul, gradul de ocupare și câți participanți mai sunt de validat. Tot cardul duce la validarea acțiunii.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import type { ActionCategory, ActionDto } from '@/shared/types/community'

const props = defineProps<{ action: ActionDto; to: string | object }>()
const { t } = useI18n()
const f = useFormat()

const ICON: Record<ActionCategory, string> = { ENVIRONMENT: 'park', HEALTH: 'bloodtype', SOCIAL: 'handshake', CULTURE: 'theater_comedy' }

const when = computed<'today' | 'soon' | 'ended'>(() => {
  const now = Date.now()
  const start = new Date(props.action.startAt)
  const end = new Date(props.action.endAt).getTime()
  if (end < now || props.action.status === 'DONE') return 'ended'
  return start.toDateString() === new Date().toDateString() || start.getTime() <= now ? 'today' : 'soon'
})
const pending = computed(() => Math.max(0, props.action.registeredCount - props.action.confirmedCount))
const fill = computed(() => (props.action.capacity ? Math.min(100, Math.round((props.action.registeredCount / props.action.capacity) * 100)) : 0))
const tone = { today: 'bg-accent text-white', soon: 'bg-white text-ink', ended: 'bg-ink/75 text-white' }
</script>

<template>
  <router-link :to="to" :aria-label="t('community.validate.open', { title: action.title })" data-test="validate-card"
    class="group flex flex-col bg-white border border-line rounded-[14px] overflow-hidden no-underline text-ink min-w-0 transition-shadow hover:shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.08)] hover:border-[#D8D7D1]">
    <div class="relative h-[136px] bg-green-deep bg-cover bg-center shrink-0 flex items-center justify-center text-white/70"
      :style="action.imageUrl ? { backgroundImage: `url('${action.imageUrl}')` } : undefined">
      <AppIcon v-if="!action.imageUrl" :name="ICON[action.category]" :size="40" />
      <span class="absolute top-2.5 left-2.5 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white/95 text-ink text-[12px] font-semibold">
        <AppIcon :name="ICON[action.category]" :size="14" />{{ t(`community.category.${action.category}`) }}
      </span>
      <span class="absolute top-2.5 right-2.5 h-6 px-2 rounded-full text-[12px] font-semibold inline-flex items-center" :class="tone[when]">
        {{ t(`community.validate.${when}`) }}
      </span>
    </div>
    <div class="flex flex-col gap-1.5 p-3.5 flex-1">
      <b class="text-[15px] leading-snug tracking-[-0.01em] line-clamp-2">{{ action.title }}</b>
      <span class="flex items-center gap-1.5 text-[13px] text-muted"><AppIcon name="calendar_today" :size="15" class="shrink-0" />{{ f.dateTime(action.startAt, false) }} · {{ f.timeRange(action.startAt, action.endAt) }}</span>
      <span class="flex items-center gap-1.5 text-[13px] text-muted min-w-0"><AppIcon name="location_on" :size="15" class="shrink-0" /><span class="truncate">{{ action.locationName }}</span></span>
      <div class="mt-auto pt-2.5">
        <div class="flex items-center justify-between text-[12.5px] mb-1.5">
          <span class="text-muted">{{ t('community.validate.registeredOf', { n: action.registeredCount, cap: action.capacity }) }}</span>
          <span class="font-semibold text-ok">{{ t('community.validate.pointsShort', { n: action.pointsReward }) }}</span>
        </div>
        <div class="h-1.5 rounded-[3px] bg-soft overflow-hidden"><div class="h-full rounded-[3px] bg-ink" :style="{ width: `${fill}%` }" /></div>
        <div class="flex items-center justify-between mt-3">
          <span v-if="pending" class="inline-flex items-center gap-[5px] text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-warn-soft text-warn">
            <i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t('community.validate.toValidate', pending) }}
          </span>
          <span v-else-if="action.registeredCount" class="inline-flex items-center gap-[5px] text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-ok-soft text-ok">
            <AppIcon name="check" :size="14" />{{ t('community.validate.allValidated') }}
          </span>
          <span v-else class="text-[12.5px] text-muted">{{ t('community.validate.noRegs') }}</span>
          <AppIcon name="arrow_forward" :size="18" class="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
        </div>
      </div>
    </div>
  </router-link>
</template>
