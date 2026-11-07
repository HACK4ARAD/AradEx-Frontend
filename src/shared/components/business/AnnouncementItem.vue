<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import StatusPill from './StatusPill.vue'
import type { AnnouncementDto } from '@/shared/types/business'

/** Un anunț: pe pagina publică (fără acțiuni) și în panou (cu stare + Șterge). */
defineProps<{ announcement: AnnouncementDto; actions?: boolean }>()
defineEmits<{ remove: [] }>()
const { t } = useI18n()
const f = useFormat()
</script>

<template>
  <div class="bg-white rounded-[16px] p-4 flex items-start gap-3">
    <div class="min-w-0 flex-1">
      <b class="block text-[15px]">{{ announcement.title }}</b>
      <p class="text-[14px] text-muted m-0 mt-0.5 leading-relaxed">{{ announcement.body }} <span class="text-[12px]">· {{ f.dateTime(announcement.createdAt, false) }}</span></p>
    </div>
    <div v-if="actions" class="flex flex-col items-end gap-2 shrink-0">
      <StatusPill :status="announcement.status" />
      <button type="button" class="w-9 h-9 rounded-full border border-line flex items-center justify-center text-bad" :aria-label="t('business.delete')" :title="t('business.delete')" @click="$emit('remove')"><AppIcon name="delete" :size="18" /></button>
    </div>
  </div>
</template>
