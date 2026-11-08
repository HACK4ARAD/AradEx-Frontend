<script setup lang="ts">
// T17 · recenziile Google de pe pagina unui eveniment (aplicație S3 + web): întâi locul (`placeId`: sala, obiectivul),
// cu titlul „Locul pe Google”; dacă evenimentul n-are loc legat sau locul nu e pe Google, firma organizatoare (dacă e
// legată de Google), cu titlul „Organizatorul pe Google”. Dacă nu e niciuna, nu apare nimic.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoogleInfo } from '@/shared/composables/useGoogle'
import GoogleReviewList from './GoogleReviewList.vue'

const props = defineProps<{ placeId?: number | null; organizerBusinessId?: number | null }>()
const { t } = useI18n()

const venue = useGoogleInfo('place', computed(() => props.placeId ?? null))
/** Organizatorul se întreabă doar după ce s-a văzut că locul nu are recenzii Google. */
const organizerId = computed(() => {
  const venueDone = !props.placeId || (!venue.loading.value && !venue.info.value)
  return venueDone ? props.organizerBusinessId ?? null : null
})
const organizer = useGoogleInfo('business', organizerId)

const shown = computed(() =>
  venue.info.value ? { info: venue.info.value, title: t('google.venueTitle') }
    : organizer.info.value ? { info: organizer.info.value, title: t('google.organizerTitle') }
      : null)
</script>

<template>
  <section v-if="shown" class="bg-white rounded-[16px] border border-line p-4 mt-4" data-test="event-google">
    <GoogleReviewList :info="shown.info" :title="shown.title" />
  </section>
</template>
