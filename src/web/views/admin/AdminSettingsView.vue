<script setup lang="ts">
// T14 · Administrare › Setări — design/final web `#/admin/settings`: praguri, integrări, limbi. Doar de citit: valorile vin din
// configurarea serverului (`application.yml`: `app.events.hot-*`, `app.jwt.expiration-hours`; raza „Ești aici” din T05) și se schimbă
// la deploy; nu există un API de setări.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import * as P from '@/web/components/community/panel'

const { t } = useI18n()
const thresholds = [
  { label: 'popularParticipants', value: 50 }, { label: 'popularSaves', value: 20 },
  { label: 'jwt', value: 24 }, { label: 'hereRadius', value: 150 },
]
const integrations = [
  { icon: 'smart_toy', label: 'ai', state: 'on' }, { icon: 'map', label: 'maps', state: 'on' },
  { icon: 'directions_bus', label: 'transit', state: 'on' }, { icon: 'sms', label: 'sms', state: 'on' },
  { icon: 'photo_library', label: 'media', state: 'on' }, { icon: 'rate_review', label: 'places', state: 'optional' },
]
const languages = [{ label: 'ro', state: 'complete' }, { label: 'en', state: 'partial' }, { label: 'hu', state: 'planned' }]
const tone: Record<string, string> = { on: 'bg-ok-soft text-ok', complete: 'bg-ok-soft text-ok', partial: 'bg-warn-soft text-warn', optional: 'bg-soft text-muted', planned: 'bg-soft text-muted' }
</script>

<template>
  <div :class="P.HEAD">
    <div class="max-w-[720px]"><h1 :class="P.H1">{{ t('admin.settings.title') }}</h1><div :class="P.SUB">{{ t('admin.settings.sub') }}</div></div>
  </div>
  <div class="grid gap-3.5 grid-cols-1 xl:grid-cols-2 items-start">
    <div :class="P.CARD">
      <div :class="P.FSEC">{{ t('admin.settings.thresholds') }}</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <label v-for="x in thresholds" :key="x.label" class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t(`admin.settings.${x.label}`) }}</span>
          <input :class="[P.INPUT, 'bg-soft']" :value="x.value" readonly></label>
      </div>
      <div :class="[P.FSEC, 'mt-5']">{{ t('admin.settings.integrations') }}</div>
      <div class="flex flex-col mt-1">
        <div v-for="x in integrations" :key="x.label" :class="P.LROW">
          <AppIcon :name="x.icon" :size="18" class="text-muted" /><span class="flex-1 min-w-0">{{ t(`admin.settings.${x.label}`) }}</span>
          <span :class="[P.PILL, tone[x.state]]">{{ t(`admin.settings.${x.state}`) }}</span>
        </div>
      </div>
    </div>
    <div :class="P.CARD">
      <div :class="P.FSEC">{{ t('admin.settings.languages') }}</div>
      <div class="flex flex-col mt-1">
        <div v-for="x in languages" :key="x.label" :class="P.LROW">
          <AppIcon name="language" :size="18" class="text-muted" /><span class="flex-1">{{ t(`admin.settings.${x.label}`) }}</span>
          <span :class="[P.PILL, tone[x.state]]">{{ t(`admin.settings.${x.state}`) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
