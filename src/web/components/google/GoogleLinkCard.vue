<script setup lang="ts">
// T17 · cardul „Pagina de pe Google” din panouri: Primăria (la un obiectiv, în „Obiective & ghiduri”) și firma (în „Recenzii”).
// Arată dacă e legat, ratingul de pe Google și un câmp pentru Place ID (gol = dezleagă). Doar citire spre Google.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { googleApi } from '@/shared/api/google'
import { useUiStore } from '@/shared/stores/ui'
import { GOOGLE_PLACE_ID, PLACE_ID_FINDER, formatCount, formatRating } from '@/shared/composables/useGoogle'
import type { GoogleLinkDto } from '@/shared/types/google'
import { BTN_SM, BTN_SM_SEC, CARD, CH, CH_TITLE, HINT, INPUT, LABEL, PILL } from '@/web/components/community/panel'

const props = defineProps<{ kind: 'place' | 'business'; placeId?: number }>()
const emit = defineEmits<{ change: [link: GoogleLinkDto] }>()
const { t } = useI18n()
const ui = useUiStore()

const link = ref<GoogleLinkDto | null>(null)
const value = ref('')
const saving = ref(false)
const valid = computed(() => GOOGLE_PLACE_ID.test(value.value.trim()))
const dirty = computed(() => value.value.trim() !== (link.value?.googlePlaceId ?? ''))

async function load() {
  link.value = null
  try {
    link.value = props.kind === 'place' ? (props.placeId ? await googleApi.placeLink(props.placeId) : null) : await googleApi.myLink()
    value.value = link.value?.googlePlaceId ?? ''
    if (link.value) emit('change', link.value)
  } catch (err) {
    ui.error(err)
  }
}

async function save(id: string | null) {
  if (id && !GOOGLE_PLACE_ID.test(id)) return
  saving.value = true
  try {
    const res = props.kind === 'place' ? await googleApi.setPlaceLink(props.placeId as number, id) : await googleApi.setMyLink(id)
    link.value = res
    value.value = res.googlePlaceId ?? ''
    emit('change', res)
    ui.toast(t(id ? 'google.link.saved' : 'google.link.unlinked'), 'success')
  } catch (err) {
    ui.error(err)
  } finally {
    saving.value = false
  }
}

watch(() => props.placeId, load, { immediate: true })
</script>

<template>
  <div :class="CARD" data-test="google-link">
    <div :class="CH">
      <div class="min-w-0">
        <h3 :class="CH_TITLE">{{ t('google.link.title') }}</h3>
        <div :class="HINT">{{ t('google.link.sub') }}<template v-if="kind === 'place'"> {{ t('google.link.subPlace') }}</template></div>
      </div>
      <span v-if="link?.info?.rating != null" :class="[PILL, 'bg-ok-soft text-ok']">
        <AppIcon name="star" :size="14" fill /> {{ formatRating(link.info.rating) }} · {{ t('google.ratings', { n: formatCount(link.info.userRatingCount) }, link.info.userRatingCount ?? 0) }}
      </span>
      <span v-else-if="link && !link.googlePlaceId" :class="[PILL, 'bg-soft text-muted']">{{ t('google.link.notLinked') }}</span>
    </div>

    <p v-if="link && !link.configured" class="m-0 mb-3 text-[12.5px] text-warn bg-warn-soft rounded-[10px] px-3 py-2">{{ t('google.link.notConfigured') }}</p>
    <p v-else-if="link?.googlePlaceId && !link.info" class="m-0 mb-3 text-[12.5px] text-muted bg-soft rounded-[10px] px-3 py-2">{{ t('google.link.unavailable') }}</p>

    <label :class="LABEL" :for="`gpid-${kind}`">{{ t('google.link.label') }}</label>
    <div class="flex flex-wrap gap-2 mt-1.5">
      <input :id="`gpid-${kind}`" v-model="value" :class="[INPUT, 'flex-1 min-w-[200px] font-mono text-[13px]']" :placeholder="t('google.link.placeholder')"
        autocomplete="off" spellcheck="false" @keyup.enter="dirty && valid && save(value.trim() || null)">
      <button type="button" :class="BTN_SM" class="h-10" :disabled="saving || !dirty || !valid" @click="save(value.trim() || null)">{{ t('google.link.save') }}</button>
      <button v-if="link?.googlePlaceId" type="button" :class="BTN_SM_SEC" class="h-10" :disabled="saving" @click="save(null)">{{ t('google.link.unlink') }}</button>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-2 mt-1.5">
      <span v-if="!valid" class="text-[12px] text-bad">{{ t('google.link.invalid') }}</span>
      <a :href="PLACE_ID_FINDER" target="_blank" rel="noopener" class="text-[12.5px] text-muted ml-auto">{{ t('google.link.help') }}</a>
    </div>
    <a v-if="link?.info" :href="link.info.mapsUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-1 mt-2 text-[13px] font-semibold text-ink">
      <AppIcon name="open_in_new" :size="16" /> {{ t('google.openMaps') }}
    </a>
  </div>
</template>
