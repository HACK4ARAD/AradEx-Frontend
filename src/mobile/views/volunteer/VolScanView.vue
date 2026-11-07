<script setup lang="ts">
// T18 · Scanează (design/final `/vol/scan`): acțiunea aleasă, scannerul (închis cu lacăt până cu 30 de minute înainte de start),
// „Introdu codul”, rezultatul (confirmat +puncte / deja scanat / cod necunoscut) și scanările recente.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppInput, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import QrScanner from '@/shared/components/qr/QrScanner.vue'
import VolAccountButton from '@/shared/components/volunteer/VolAccountButton.vue'
import VolScanResult from '@/shared/components/volunteer/VolScanResult.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { useVolunteerHome, useVolunteerScan } from '@/shared/composables/useVolunteer'
import type { ActionCategory } from '@/shared/types/community'

const { t } = useI18n()
const f = useFormat()
const route = useRoute()
const router = useRouter()
const home = useVolunteerHome()
const s = useVolunteerScan(home.actions, Number(route.query.a) || undefined)
const ICON: Record<ActionCategory, string> = { ENVIRONMENT: 'park', HEALTH: 'bloodtype', SOCIAL: 'handshake', CULTURE: 'theater_comedy' }

const camera = ref(false)
const cameraKey = ref(0)
const sheet = ref(false)
const manual = ref('')
const cur = computed(() => s.selected.value)

onMounted(async () => {
  await home.load()
  void s.loadRecent()
})
watch(() => cur.value?.id, (id) => {
  camera.value = false
  s.result.value = null
  if (id && Number(route.query.a) !== id) router.replace({ query: { a: id } })
})

function startCamera() {
  s.result.value = null
  cameraKey.value++
  camera.value = true
}
async function onScanned(code: string) {
  camera.value = false
  await s.scan(code)
}
async function submitManual() {
  if (!manual.value.trim()) return
  sheet.value = false
  await s.scan(manual.value)
  manual.value = ''
}
const time = (iso?: string) => (iso ? f.timeRange(iso) : '')
</script>

<template>
  <div class="flex items-center justify-between gap-3 pt-2 mb-4">
    <h1 class="text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] m-0">{{ t('volunteer.scan.title') }}</h1>
    <VolAccountButton :coordinator="home.me.value?.coordinatorName" :one-time="home.me.value?.oneTime" />
  </div>

  <Skeleton v-if="home.loading.value && !home.actions.value.length" :rows="2" :height="200" />
  <EmptyState v-else-if="!home.actions.value.length" icon="event_busy" :title="t('volunteer.scan.noActions')" :text="t('volunteer.actions.emptyText')" />
  <template v-else-if="cur">
    <!-- acțiunile alocate: chip-uri (fără emoji, iconița categoriei) -->
    <div class="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 mb-3 [scrollbar-width:none]" role="tablist" :aria-label="t('volunteer.scan.pickAction')">
      <button v-for="a in home.actions.value" :key="a.id" type="button" role="tab" :aria-selected="a.id === cur.id"
        class="h-10 shrink-0 max-w-[240px] px-3.5 rounded-full border text-[14px] font-semibold inline-flex items-center gap-1.5"
        :class="a.id === cur.id ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line'" @click="s.selectedId.value = a.id">
        <AppIcon :name="a.state === 'LOCKED' ? 'lock' : ICON[a.category]" :size="18" class="shrink-0" /><span class="truncate">{{ a.title }}</span>
      </button>
    </div>

    <!-- scannerul: chenar negru (design `.scanner`) -->
    <div class="relative rounded-[24px] bg-[#070707] overflow-hidden" :class="camera ? 'p-3' : 'h-[300px]'" data-test="vol-scanner">
      <QrScanner v-if="camera && cur.state === 'OPEN'" :key="cameraKey" @scanned="onScanned" @error="camera = false" />
      <template v-else>
        <div class="absolute inset-0 m-auto w-[200px] h-[200px] pointer-events-none">
          <i v-for="c in ['top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-[14px]', 'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-[14px]', 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-[14px]', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-[14px]']"
            :key="c" class="absolute w-10 h-10 border-white/35" :class="c" />
        </div>
        <div v-if="cur.state === 'LOCKED'" class="absolute inset-0 flex flex-col items-center justify-center text-center text-white gap-1 px-8" data-test="vol-scan-locked">
          <AppIcon name="lock" :size="26" />
          <b class="text-[17px] mt-1">{{ t('volunteer.scan.lockedTitle', { day: f.dateTime(cur.startAt, false).toLowerCase() }) }}</b>
          <span class="text-[13px] opacity-85">{{ t('volunteer.scan.lockedSub', { time: f.timeRange(cur.opensAt) }) }}</span>
        </div>
        <div v-else-if="cur.state === 'ENDED'" class="absolute inset-0 flex flex-col items-center justify-center text-center text-white gap-1 px-8">
          <AppIcon name="event_available" :size="26" />
          <b class="text-[17px] mt-1">{{ t('volunteer.scan.endedTitle') }}</b>
          <span class="text-[13px] opacity-85">{{ t('volunteer.scan.endedSub') }}</span>
        </div>
        <p class="absolute bottom-3.5 inset-x-0 text-center text-[13px] text-white/45 m-0 px-4">{{ t('volunteer.scan.aim') }}</p>
      </template>
    </div>

    <div class="flex gap-2 mt-3">
      <AppButton class="flex-1 whitespace-nowrap" :disabled="cur.state !== 'OPEN' || camera" data-test="vol-camera" @click="startCamera">
        {{ s.result.value ? t('volunteer.scan.next') : t('volunteer.scan.camera') }}
      </AppButton>
      <AppButton variant="secondary" class="whitespace-nowrap" :disabled="cur.state !== 'OPEN'" data-test="vol-enter-code" @click="sheet = true">{{ t('volunteer.scan.enterCode') }}</AppButton>
    </div>

    <VolScanResult v-if="s.result.value" :result="s.result.value" class="mt-3" />

    <h3 class="text-[17px] font-semibold mt-6 mb-2">{{ t('volunteer.scan.recent') }}</h3>
    <p v-if="!s.recent.value.length" class="text-muted text-[14px] m-0">{{ t('volunteer.scan.recentEmpty') }}</p>
    <div v-else class="bg-white border border-line rounded-[18px] px-3.5">
      <div v-for="r in s.recent.value.slice(0, 6)" :key="r.id" class="flex items-center gap-3 py-3 border-b border-line last:border-b-0">
        <AppIcon name="check_circle" :size="20" class="text-green shrink-0" fill />
        <div class="min-w-0 flex-1"><div class="text-[14.5px] font-semibold truncate">{{ r.user?.displayName }}</div><div class="font-mono text-[12px] text-muted">{{ r.code }}</div></div>
        <span class="h-6 px-2 rounded-full bg-green-soft text-green-deep text-[12px] font-semibold inline-flex items-center whitespace-nowrap">+{{ r.pointsReward }} · {{ time(r.confirmedAt) }}</span>
      </div>
    </div>
  </template>

  <AppSheet v-model:open="sheet" :title="t('volunteer.scan.codeTitle')">
    <form @submit.prevent="submitManual">
      <AppInput v-model="manual" placeholder="AX-C1-…" autocomplete="off" :label="t('volunteer.scan.codeHint')" />
      <AppButton type="submit" block class="mt-3" :loading="s.busy.value" :disabled="!manual.trim()">{{ t('volunteer.scan.confirm') }}</AppButton>
    </form>
  </AppSheet>
</template>
