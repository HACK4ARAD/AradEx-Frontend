<script setup lang="ts">
// T06 · cutia de bilete din W6 (design/final `.ticketbox`): în aplicație (data, loc, Adult/Copil, total), gratuit (cu sau fără înscriere)
// sau extern (link spre organizator). Plata și înscrierea vin în T07.
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useEventFormat } from '@/shared/composables/useEvents'
import type { EventDto } from '@/shared/types/events'

const props = defineProps<{ event: EventDto }>()
defineEmits<{ changed: [] }>()
const { t } = useI18n()
const fmt = useEventFormat()
const order = reactive({ adult: 1, child: props.event.priceChild != null ? 1 : 0 })
const total = computed(() => order.adult * (props.event.priceAdult ?? 0) + order.child * (props.event.priceChild ?? 0))
const ended = computed(() => new Date(props.event.endAt ?? props.event.startAt).getTime() < Date.now())
const step = (k: 'adult' | 'child', d: number) => { order[k] = Math.max(0, Math.min(10, order[k] + d)) }
const kv = 'flex items-center gap-2.5 py-[9px] border-b border-line text-[13.5px]'
const stepBtn = 'w-[30px] h-[30px] rounded-full border border-line bg-white inline-flex items-center justify-center disabled:opacity-40'
</script>

<template>
  <div class="bg-white border border-line rounded-[16px] p-[18px]">
    <template v-if="event.ticketType === 'IN_APP'">
      <div class="flex items-center justify-between gap-2"><b>{{ t('events.badge.inApp') }}</b><span class="text-[11px] font-semibold px-[9px] py-[3px] rounded-full bg-ink text-white">{{ t('tickets.onlyHere') }}</span></div>
      <div :class="kv" class="mt-2"><AppIcon name="schedule" :size="18" class="text-muted" /><span>{{ fmt.when(event) }}</span></div>
      <div :class="kv"><AppIcon name="location_on" :size="18" class="text-muted" /><span class="flex-1">{{ event.locationName }}</span><span v-if="event.spotsLeft != null" class="text-muted text-[12px]">{{ t('events.detail.spotsLeft', { n: event.spotsLeft }) }}</span></div>
      <div :class="kv" class="justify-between mt-1.5">
        <span>{{ t('tickets.adult') }} · {{ fmt.money(event.priceAdult) }}</span>
        <span class="inline-flex items-center gap-2.5"><button type="button" :class="stepBtn" :aria-label="t('tickets.less')" :disabled="order.adult === 0" @click="step('adult', -1)"><AppIcon name="remove" :size="16" /></button><b class="min-w-3.5 text-center">{{ order.adult }}</b><button type="button" :class="stepBtn" :aria-label="t('tickets.more')" @click="step('adult', 1)"><AppIcon name="add" :size="16" /></button></span>
      </div>
      <div v-if="event.priceChild != null" :class="kv" class="justify-between">
        <span>{{ t('tickets.child') }} · {{ fmt.money(event.priceChild) }}</span>
        <span class="inline-flex items-center gap-2.5"><button type="button" :class="stepBtn" :aria-label="t('tickets.less')" :disabled="order.child === 0" @click="step('child', -1)"><AppIcon name="remove" :size="16" /></button><b class="min-w-3.5 text-center">{{ order.child }}</b><button type="button" :class="stepBtn" :aria-label="t('tickets.more')" @click="step('child', 1)"><AppIcon name="add" :size="16" /></button></span>
      </div>
      <div class="flex justify-between my-3 text-[16px]"><b>{{ t('tickets.total') }}</b><b>{{ fmt.money(total) }}</b></div>
      <slot name="buy" :order="order" :total="total" :ended="ended">
        <button type="button" disabled class="w-full h-12 rounded-[14px] bg-ink text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 opacity-45"><AppIcon name="lock" :size="18" />{{ t('tickets.continueToPay') }}</button>
      </slot>
      <div class="text-muted text-[12px] mt-2 text-center">{{ t('tickets.webPayNote') }}</div>
    </template>
    <template v-else-if="event.ticketType === 'FREE'">
      <b>{{ event.capacity ? t('events.detail.freeRegTitle') : t('tickets.freeEntry') }}</b>
      <div :class="kv" class="mt-2"><AppIcon name="schedule" :size="18" class="text-muted" /><span>{{ fmt.when(event) }}</span></div>
      <div :class="kv"><AppIcon name="location_on" :size="18" class="text-muted" /><span>{{ event.locationName }}</span></div>
      <div v-if="event.capacity" :class="kv"><AppIcon name="group" :size="18" class="text-muted" /><span>{{ t('events.detail.spotsLeft', { n: event.spotsLeft ?? 0 }) }}</span></div>
      <slot name="register" :ended="ended" />
    </template>
    <template v-else>
      <b>{{ t('events.detail.extTitle') }}</b>
      <div class="text-muted text-[14.5px] mt-1.5">{{ event.organizerName }} · {{ fmt.price(event) }}</div>
      <div :class="kv" class="mt-2"><AppIcon name="schedule" :size="18" class="text-muted" /><span>{{ fmt.when(event) }}</span></div>
      <div :class="kv"><AppIcon name="location_on" :size="18" class="text-muted" /><span>{{ event.locationName }}</span></div>
      <a v-if="event.externalUrl" :href="event.externalUrl" target="_blank" rel="noopener" class="w-full h-12 mt-2.5 rounded-[14px] bg-ink text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 no-underline">
        <AppIcon name="open_in_new" :size="18" />{{ event.externalUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') }}
      </a>
      <div class="text-muted text-[12px] mt-2 text-center">{{ t('tickets.externalNote') }}</div>
    </template>
  </div>
</template>
