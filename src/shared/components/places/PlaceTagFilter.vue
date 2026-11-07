<script setup lang="ts">
/** Chips-urile de etichete din W7 / „Locuri din Arad” + „Lângă mine” (cere GPS-ul la tap). */
import { useI18n } from 'vue-i18n'
import { AppChip } from '@/shared/components'
import { PLACE_TAG_FILTERS } from '@/shared/composables/usePlaces'

defineProps<{ located?: boolean; locating?: boolean }>()
const tag = defineModel<string | null>({ default: null })
defineEmits<{ locate: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="flex gap-2 overflow-x-auto md:flex-wrap -mx-1 px-1 pb-1 [scrollbar-width:none]">
    <AppChip :active="tag === null" @click="tag = null">{{ t('places.list.all') }}</AppChip>
    <AppChip v-for="k in PLACE_TAG_FILTERS" :key="k" :active="tag === k" @click="tag = tag === k ? null : k">{{ t(`places.tag.${k}`) }}</AppChip>
    <AppChip :active="located" :icon="locating ? 'progress_activity' : 'near_me'" class="shrink-0" @click="$emit('locate')">
      {{ locating ? t('places.list.locating') : t('places.list.nearMe') }}
    </AppChip>
  </div>
</template>
