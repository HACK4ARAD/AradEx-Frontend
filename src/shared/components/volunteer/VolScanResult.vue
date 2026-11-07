<script setup lang="ts">
/** Rezultatul unei scanări de voluntar (design/final `/vol/scan` `.note`): verde confirmat, neutru deja scanat, roșu eroare. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import type { VolScanResult } from '@/shared/composables/useVolunteer'

const props = defineProps<{ result: VolScanResult }>()
const { t, te } = useI18n()
const time = (iso?: string) => (iso ? new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '')

const view = computed(() => {
  const r = props.result
  if (r.kind !== 'error') {
    const name = r.result.user?.displayName ?? ''
    return r.kind === 'ok'
      ? { tone: 'bg-green-soft text-green-deep', icon: 'check_circle', title: t('volunteer.scan.okTitle', { name }), sub: t('volunteer.scan.okSub', { code: r.result.code, n: r.result.pointsAwarded }) }
      : { tone: 'bg-soft text-ink', icon: 'info', title: t('volunteer.scan.alreadyTitle', { name }),
          sub: t('volunteer.scan.alreadySub', { by: r.result.confirmedBy ?? '—', at: r.result.confirmedAt ? t('volunteer.scan.alreadyAt', { time: time(r.result.confirmedAt) }) : '' }) }
  }
  const short = r.key.split('.').pop() ?? 'generic'
  const title = t(te(`volunteer.errorTitles.${short}`) ? `volunteer.errorTitles.${short}` : 'volunteer.errorTitles.generic')
  return { tone: 'bg-bad-soft text-bad', icon: short === 'locked' ? 'lock' : 'error', title, sub: short === 'generic' && r.message ? r.message : t(r.key, r.params ?? {}) }
})
</script>

<template>
  <div class="rounded-[16px] p-3.5 flex items-start gap-3" :class="view.tone" role="status" data-test="vol-scan-result">
    <AppIcon :name="view.icon" :size="24" class="shrink-0 mt-px" />
    <div class="min-w-0"><b class="block text-[15px] leading-snug">{{ view.title }}</b><span class="text-[13px] opacity-90">{{ view.sub }}</span></div>
  </div>
</template>
