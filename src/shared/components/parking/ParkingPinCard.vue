<script setup lang="ts">
// Cardul unui pin „P” din stratul „Parcări” (S7 / W9): zona, locurile, tariful pe oră, durata maximă și programul,
// cu nota că locația e strada de referință din OSM, nu locul exact. Datele: Recons Arad (prin arad-parking-data).
// „Plătește prin SMS”: alegi durata (variantele zonei), scrii numărul de înmatriculare (ținut minte pe telefon) și se deschide
// aplicația de mesaje cu numărul și textul completate (ex. „101AR01ABC” către 7420) — omul doar apasă Trimite.
import { computed, ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { intlLocale, useFormat } from '@/shared/composables/useFormat'
import {
  PARKING_SMS_NUMBER, ZONE_COLORS, hourlyTariff, isPlate, normalizePlate, smsBody, smsHref, smsOptions, tariffText,
  type ParkingData, type ParkingSpot,
} from '@/shared/data/parking/parking'
import { parkingPaidNow } from '@/shared/composables/useTripPlanner'

const props = defineProps<{ spot: ParkingSpot; data: Pick<ParkingData, 'tariffs'> }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const f = useFormat()

const color = computed(() => ZONE_COLORS[props.spot.zone])
const tariff = computed(() => {
  const h = hourlyTariff(props.data, props.spot.zone)
  if (!h) return t('parking.card.noTariff')
  return tariffText(h, t, f.money, (n) => new Intl.NumberFormat(intlLocale(), { minimumFractionDigits: 2 }).format(n))
})
/* ---------- plata prin SMS ---------- */
const PLATE_KEY = 'ax.plate'
const options = computed(() => smsOptions(props.data, props.spot.zone))
const smsOpen = ref(false)
const pick = ref<string | null>(null)
const chosen = computed(() => options.value.find((o) => o.smsCode === pick.value) ?? options.value.find((o) => o.minutes === 60) ?? options.value[0] ?? null)
function readPlate() { try { return localStorage.getItem(PLATE_KEY) ?? '' } catch { return '' } }
const plate = ref(readPlate())
const plateOk = computed(() => isPlate(plate.value))
watch(plate, (v) => { if (isPlate(v)) { try { localStorage.setItem(PLATE_KEY, normalizePlate(v)) } catch { /* fără memorie: se scrie din nou data viitoare */ } } })
const body = computed(() => (chosen.value && plateOk.value ? smsBody(chosen.value.smsCode, plate.value) : ''))
const ios = (() => { try { return Capacitor.getPlatform() === 'ios' || /iPhone|iPad|iPod/.test(navigator.userAgent) } catch { return false } })()
const href = computed(() => (body.value ? smsHref(PARKING_SMS_NUMBER, body.value, ios) : undefined))
const price = (o: { amount: number; currency: string; vat: boolean | null }) => {
  const n = new Intl.NumberFormat(intlLocale(), { minimumFractionDigits: 2 }).format(o.amount)
  const amount = o.currency === 'RON' ? f.money(o.amount) : `${n} ${o.currency}`
  return o.vat === false ? t('parking.card.plusVat', { amount }) : amount
}
const paidNow = computed(() => parkingPaidNow(props.spot))
// alt pin de parcare: formularul se închide și durata revine la cea implicită (o oră)
watch(() => props.spot.id, () => { smsOpen.value = false; pick.value = null })

const rows = computed(() => [
  { label: t('parking.card.zone'), value: t('parking.card.zoneName', { n: props.spot.zone, color: t(`parking.color.${props.spot.zone}`) }) },
  { label: t('parking.card.spaces'), value: props.spot.capacity != null ? String(props.spot.capacity) : '—' },
  { label: t('parking.card.tariff'), value: tariff.value },
  { label: t('parking.card.maxStay'), value: props.spot.maxStayMin ? f.minutes(props.spot.maxStayMin) : t('parking.card.noMaxStay') },
])
</script>

<template>
  <div class="bg-white rounded-[20px] p-4 shadow-[0_10px_30px_rgba(17,17,17,.18)]" data-test="parking-card">
    <div class="flex gap-3 items-start">
      <span class="w-11 h-11 rounded-[12px] border-[3px] bg-white text-ink font-bold text-[18px] flex items-center justify-center shrink-0" :style="{ borderColor: color }">P</span>
      <div class="flex-1 min-w-0">
        <div class="text-[12px] uppercase tracking-[.05em] font-semibold text-muted">{{ t('parking.card.kicker') }}</div>
        <b class="block text-[16px] leading-tight">{{ spot.name }}</b>
        <span v-if="smsOpen" class="block text-[13px] text-muted">{{ t('parking.card.zoneName', { n: spot.zone, color: t(`parking.color.${spot.zone}`) }) }}</span>
        <span v-else-if="spot.detail" class="block text-[13px] text-muted line-clamp-2">{{ spot.detail }}</span>
      </div>
      <button type="button" class="w-9 h-9 -mt-1 -mr-1 rounded-full flex items-center justify-center" :aria-label="t('map.close')" @click="emit('close')"><AppIcon name="close" /></button>
    </div>
    <dl v-if="!smsOpen" class="m-0 mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13.5px]">
      <template v-for="r in rows" :key="r.label">
        <dt class="text-muted">{{ r.label }}</dt>
        <dd class="m-0 font-semibold">{{ r.value }}</dd>
      </template>
      <dt class="text-muted">{{ t('parking.card.schedule') }}</dt>
      <dd class="m-0">
        <span class="block">{{ t('parking.card.weekdays') }}</span>
        <span v-if="spot.sundayObor" class="block">{{ t('parking.card.sundayObor') }}</span>
      </dd>
    </dl>
    <!-- plata prin SMS: se deschide aplicația de mesaje cu numărul și textul gata scrise -->
    <button v-if="options.length && !smsOpen" type="button" class="w-full mt-3 h-11 rounded-[14px] bg-ink text-white text-[14.5px] font-semibold flex items-center justify-center gap-2"
      data-test="parking-sms-open" @click="smsOpen = true"><AppIcon name="sms" :size="18" />{{ t('parking.sms.open') }}</button>
    <div v-else-if="smsOpen" class="mt-3 pt-3 border-t border-line flex flex-col gap-2.5" data-test="parking-sms">
      <div class="flex items-center justify-between gap-2">
        <b class="text-[14.5px]">{{ t('parking.sms.title') }}</b>
        <button type="button" class="w-8 h-8 -mr-1 rounded-full flex items-center justify-center" :aria-label="t('map.close')" @click="smsOpen = false"><AppIcon name="expand_less" /></button>
      </div>
      <div class="flex flex-wrap gap-1.5" role="radiogroup" :aria-label="t('parking.sms.duration')">
        <button v-for="o in options" :key="o.smsCode" type="button" role="radio" :aria-checked="chosen?.smsCode === o.smsCode"
          class="min-h-9 px-3 rounded-full border text-[13px] inline-flex items-center gap-1.5"
          :class="chosen?.smsCode === o.smsCode ? 'bg-ink border-ink text-white font-semibold' : 'bg-white border-line text-ink'" @click="pick = o.smsCode">
          {{ f.minutes(o.minutes) }}<span :class="chosen?.smsCode === o.smsCode ? 'opacity-75' : 'text-muted'">· {{ price(o) }}</span>
        </button>
      </div>
      <label class="flex flex-col gap-1">
        <span class="text-[12.5px] font-semibold text-muted">{{ t('parking.sms.plate') }}</span>
        <input v-model="plate" type="text" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="12" :placeholder="t('parking.sms.platePh')"
          class="h-11 px-3.5 rounded-[12px] border bg-white text-[16px] font-semibold tracking-[.04em] uppercase outline-none placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
          :class="plate && !plateOk ? 'border-accent' : 'border-line focus:border-ink'">
        <span v-if="plate && !plateOk" class="text-[12px] text-accent">{{ t('parking.sms.plateInvalid') }}</span>
      </label>
      <p class="m-0 text-[13px]">
        <template v-if="body">{{ t('parking.sms.preview') }} <b class="font-mono">{{ body }}</b> {{ t('parking.sms.to') }} <b>{{ PARKING_SMS_NUMBER }}</b></template>
        <span v-else class="text-muted">{{ t('parking.sms.needPlate') }}</span>
      </p>
      <a v-if="href" :href="href" class="h-11 rounded-[14px] bg-ink text-white text-[14.5px] font-semibold flex items-center justify-center gap-2 no-underline" data-test="parking-sms-send">
        <AppIcon name="send" :size="18" />{{ t('parking.sms.send') }}</a>
      <button v-else type="button" disabled class="h-11 rounded-[14px] bg-ink/40 text-white text-[14.5px] font-semibold flex items-center justify-center gap-2"><AppIcon name="send" :size="18" />{{ t('parking.sms.send') }}</button>
      <p v-if="!paidNow" class="m-0 text-[12px] text-green-deep bg-green-soft rounded-[10px] px-2.5 py-1.5">{{ t('parking.sms.freeNow') }}</p>
      <p class="m-0 text-[12px] text-muted leading-snug">{{ t('parking.sms.note', { number: PARKING_SMS_NUMBER }) }}</p>
    </div>
    <p v-if="!smsOpen" class="text-[12px] text-muted mt-2.5 mb-0 flex items-center gap-1"><AppIcon name="info" :size="14" />{{ t('parking.card.approximate') }}</p>
    <p class="text-[11px] text-muted mt-1 mb-0">{{ t('parking.attribution') }}</p>
  </div>
</template>
