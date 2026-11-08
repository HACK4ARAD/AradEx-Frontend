<script setup lang="ts">
// T17 · blocul „Pe Google” din aplicație: pe detaliul obiectivului (E3) și pe pagina firmei. Datele vin prin backend
// (cheia Google nu e în aplicație), în limba aplicației, cu cache 24 h pe server. Dacă locul nu e pe Google, firma nu
// e legată, serverul n-are cheie sau Google nu răspunde, blocul nu apare deloc (e ajutător, fără toast).
// Pe pagina unui eveniment se folosește `EventGoogleReviews` (locul, apoi organizatorul).
import { computed } from 'vue'
import { useGoogleInfo } from '@/shared/composables/useGoogle'
import GoogleReviewList from './GoogleReviewList.vue'

const props = defineProps<{ kind: 'place' | 'business'; id: number }>()
const { info } = useGoogleInfo(props.kind, computed(() => props.id))
</script>

<template>
  <section v-if="info" class="bg-white rounded-[16px] border border-line p-4 mt-4">
    <GoogleReviewList :info="info" />
  </section>
</template>
