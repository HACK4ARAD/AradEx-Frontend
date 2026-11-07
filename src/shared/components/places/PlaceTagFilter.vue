<script setup lang="ts">
/** Chips-urile de etichete din „Locuri din Arad” (design: `.chips` cu `.chip.sm`, rândul trece de marginile ecranului). */
import { useI18n } from 'vue-i18n'
import { PLACE_TAG_FILTERS } from '@/shared/composables/usePlaces'

const tag = defineModel<string | null>({ default: null })
const { t } = useI18n()
const chip = 'shrink-0 min-h-9 px-3 rounded-full border text-[13px] whitespace-nowrap transition-colors'
const on = 'bg-ink text-white border-ink font-semibold'
const off = 'bg-white text-ink border-line font-medium'
</script>

<template>
  <div class="flex gap-2 overflow-x-auto -mx-5 px-5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <button type="button" :class="[chip, tag === null ? on : off]" @click="tag = null">{{ t('places.list.all') }}</button>
    <button v-for="k in PLACE_TAG_FILTERS" :key="k" type="button" :class="[chip, tag === k ? on : off]" @click="tag = k">{{ t(`places.tag.${k}`) }}</button>
  </div>
</template>
