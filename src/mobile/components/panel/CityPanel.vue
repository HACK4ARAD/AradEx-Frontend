<script setup lang="ts">
// T11 · Panoul Primăriei pe teren (E7, design/final mobile „Primărie · validare pe teren”): alegi acțiunea (de azi / care urmează),
// Scanează un cod QR (sau cod tastat) → rezultat, lista înscrișilor cu Confirmă. Restul panoului e doar pe web.
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppChip, AppIcon, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import QrScanner from '@/shared/components/qr/QrScanner.vue'
import ManualCodeForm from '@/shared/components/community/ManualCodeForm.vue'
import ScanResultCard from '@/shared/components/community/ScanResultCard.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { aradTodayStart, initials, useActionRegistrations, useCityCommunity, type ScanResult } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const { t } = useI18n()
const f = useFormat()
const ui = useUiStore()
const auth = useAuthStore()
const city = useCityCommunity()
const selected = ref<number | null>(null)
const regs = useActionRegistrations(selected)
const scanOpen = ref(false)
const scanKey = ref(0)
const busy = ref(false)
const result = ref<ScanResult | null>(null)
const busyId = ref<number | null>(null)

/** Acțiunile publicate care nu s-au încheiat înainte de azi, cea mai apropiată prima. */
const field = computed(() => {
  const todayStart = aradTodayStart(f.todayIso())
  return city.actions.value
    .filter((a) => a.status === 'PUBLISHED' && new Date(a.endAt).getTime() >= todayStart)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
})
const current = computed(() => field.value.find((a) => a.id === selected.value))

onMounted(async () => {
  await city.loadActions()
  selected.value = field.value[0]?.id ?? null
})

function openScanner() {
  result.value = null
  scanKey.value++
  scanOpen.value = true
}

async function check(code: string) {
  busy.value = true
  result.value = await city.confirmCode(code)
  busy.value = false
  const r = result.value
  if (r.kind !== 'error') {
    if (r.result.actionId === selected.value) regs.replace(r.result)
    else if (field.value.some((a) => a.id === r.result.actionId)) selected.value = r.result.actionId
  }
}

async function onScanned(code: string) {
  await check(code)
}

async function confirmOne(id: number) {
  busyId.value = id
  const r = await city.confirm(id)
  busyId.value = null
  if (r) {
    regs.replace(r)
    ui.toast(r.alreadyConfirmed ? t('community.scan.alreadyTitle', { name: r.user?.displayName ?? '' }) : t('community.scan.okTitle', { name: r.user?.displayName ?? '', n: r.pointsAwarded }), 'success')
  }
}
</script>

<template>
  <div class="pt-1">
    <h1 class="text-[30px] font-semibold tracking-[-0.025em] m-0">{{ t('community.field.title') }}</h1>

    <div class="bg-white rounded-[20px] p-4 flex items-center gap-3 mt-4">
      <span class="w-12 h-12 rounded-[12px] bg-ink text-white flex items-center justify-center shrink-0"><AppIcon name="account_balance" /></span>
      <div class="min-w-0 flex-1"><b class="block text-[16px] truncate">{{ auth.user?.displayName }}</b><span class="text-muted text-[13px]">{{ t('community.field.coordinator') }}</span></div>
    </div>

    <Skeleton v-if="city.loading.value" :rows="3" class="mt-4" />
    <EmptyState v-else-if="!field.length" icon="event_busy" :title="t('community.field.noActions')" :text="t('community.field.noActionsText')" />
    <template v-else>
      <div class="flex gap-2 overflow-x-auto -mx-5 px-5 mt-4 pb-1 [scrollbar-width:none]">
        <AppChip v-for="a in field" :key="a.id" :active="a.id === selected" class="shrink-0" @click="selected = a.id">{{ a.title.split(' ').slice(0, 2).join(' ') }}</AppChip>
      </div>
      <div v-if="current" class="mt-3">
        <b class="block text-[16px]">{{ current.title }}</b>
        <span class="text-muted text-[13.5px]">{{ f.dateTime(current.startAt, false) }} · {{ f.timeRange(current.startAt, current.endAt) }} · {{ current.locationName }}</span>
      </div>

      <AppButton block icon="qr_code_scanner" class="mt-4" @click="openScanner">{{ t('community.field.scan') }}</AppButton>

      <div class="flex items-center justify-between mt-5 mb-2">
        <b class="text-[15px]">{{ t('community.field.registered', { n: regs.items.value.filter((r) => r.status !== 'CANCELLED').length }) }}</b>
        <span class="rounded-full bg-green-soft text-green-deep text-[12px] font-semibold px-2.5 py-1">{{ t('community.field.confirmed', { n: regs.counts.value.confirmed }) }}</span>
      </div>
      <Skeleton v-if="regs.loading.value" :rows="3" :height="60" />
      <EmptyState v-else-if="!regs.items.value.length" icon="group" :title="t('community.validate.empty')" />
      <div v-else class="flex flex-col gap-2">
        <div v-for="r in regs.items.value.filter((x) => x.status !== 'CANCELLED')" :key="r.id" class="bg-white rounded-[16px] p-3 flex items-center gap-3">
          <span class="w-10 h-10 rounded-full bg-soft font-bold text-[13px] flex items-center justify-center shrink-0">{{ initials(r.user?.displayName) }}</span>
          <div class="min-w-0 flex-1"><b class="block text-[15px] truncate">{{ r.user?.displayName }}</b><code class="text-muted text-[12px]">{{ r.code }}</code></div>
          <span v-if="r.status === 'CONFIRMED'" class="text-green-deep text-[12.5px] font-semibold whitespace-nowrap">{{ t('community.field.awarded', { n: r.pointsReward }) }}</span>
          <span v-else-if="r.status === 'NO_SHOW'" class="text-bad text-[12.5px] font-semibold">{{ t('community.status.NO_SHOW') }}</span>
          <AppButton v-else size="sm" icon="check" class="!bg-green" :loading="busyId === r.id" @click="confirmOne(r.id)">{{ t('community.scan.confirm') }}</AppButton>
        </div>
      </div>
    </template>

    <AppSheet v-model:open="scanOpen" :title="t('community.field.scan')">
      <div class="flex flex-col gap-3">
        <QrScanner v-if="!result" :key="scanKey" @scanned="onScanned" />
        <ScanResultCard v-if="result" :result="result" />
        <AppButton v-if="result" block icon="qr_code_scanner" @click="openScanner">{{ t('community.field.scanNext') }}</AppButton>
        <ManualCodeForm :loading="busy" :label="t('community.scan.manualLabel')" @submit="check" />
      </div>
    </AppSheet>
  </div>
</template>
