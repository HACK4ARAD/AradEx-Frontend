<script setup lang="ts">
// T07 · sheet-ul „Codul tău” — designul din „AradExperience information architecture” (sheetQR): titlu + „Închide”, oferta / acțiunea,
// sub-titlu (firma · valabilă până), eticheta de stare, cardul alb cu QR și nota „Arată codul la casă sau la intrare.”
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppSheet } from '@/shared/components'
import CodeCard from './CodeCard.vue'
import StatusPill from './StatusPill.vue'

/** `action` (T11): un buton sub notă, ex. „Renunț la înscriere” (prototipul IA, `canLeave`) la o acțiune comunitară în așteptare. */
export interface CodeView {
  title: string; sub: string; code: string; note?: string; pill?: { tone: 'off' | 'ok' | 'pending' | 'no' | 'new'; label: string }
  action?: { label: string; onClick: () => void; busy?: boolean }
}
const props = defineProps<{ item: CodeView | null }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const open = computed({ get: () => !!props.item, set: (v: boolean) => { if (!v) emit('close') } })
</script>

<template>
  <AppSheet v-model:open="open" :title="t('tickets.code.title')">
    <template #action>
      <button type="button" class="min-h-11 px-1 text-[15px] font-semibold underline underline-offset-[3px]" @click="emit('close')">{{ t('tickets.code.close') }}</button>
    </template>
    <div v-if="item" class="flex flex-col gap-3.5 pt-1.5">
      <div>
        <div class="text-[18px] font-semibold leading-[1.25]">{{ item.title }}</div>
        <div class="text-[14px] text-muted leading-[1.45] mt-1">{{ item.sub }}</div>
      </div>
      <StatusPill v-if="item.pill" :tone="item.pill.tone" :label="item.pill.label" />
      <CodeCard :code="item.code" />
      <div class="flex gap-2.5 text-[14px] leading-[1.45] text-muted"><AppIcon name="info" :size="20" />{{ item.note ?? t('tickets.code.note') }}</div>
      <button v-if="item.action" type="button" class="min-h-[52px] rounded-[16px] border border-line bg-white text-[16px] font-semibold disabled:opacity-50" :disabled="item.action.busy" @click="item.action.onClick">{{ item.action.label }}</button>
    </div>
  </AppSheet>
</template>
