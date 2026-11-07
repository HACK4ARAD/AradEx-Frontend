<script setup lang="ts">
/** Rezultatul unei confirmări (QR sau cod tastat): Confirmat +puncte / Deja confirmat / Cod necunoscut / eroare. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import type { ScanResult } from '@/shared/composables/useCommunity'

const props = defineProps<{ result: ScanResult }>()
const { t } = useI18n()

const view = computed(() => {
  const r = props.result
  if (r.kind === 'ok') return { tone: 'bg-green-soft text-green-deep', icon: 'check_circle', title: t('community.scan.okTitle', { name: r.result.user?.displayName ?? '', n: r.result.pointsAwarded }), sub: r.result.actionTitle }
  if (r.kind === 'already') return { tone: 'bg-warn-soft text-warn', icon: 'info', title: t('community.scan.alreadyTitle', { name: r.result.user?.displayName ?? '' }), sub: t('community.scan.alreadySub') }
  if (r.status === 404) return { tone: 'bg-bad-soft text-bad', icon: 'cancel', title: t('community.scan.unknownTitle'), sub: t('community.scan.unknownSub') }
  if (r.status === 400) return { tone: 'bg-bad-soft text-bad', icon: 'cancel', title: t('community.scan.invalidTitle'), sub: t('community.scan.unknownSub') }
  return { tone: 'bg-bad-soft text-bad', icon: 'error', title: t('community.scan.errorTitle'), sub: r.message }
})
</script>

<template>
  <div class="rounded-[16px] p-3.5 flex items-start gap-3" :class="view.tone" role="status">
    <AppIcon :name="view.icon" :size="26" class="shrink-0" />
    <div class="min-w-0"><b class="block text-[15px] leading-snug">{{ view.title }}</b><span class="text-[13px] opacity-90">{{ view.sub }}</span></div>
  </div>
</template>
