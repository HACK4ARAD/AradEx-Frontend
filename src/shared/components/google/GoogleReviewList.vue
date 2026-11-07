<script setup lang="ts">
// T17 · rezumatul Google („Pe Google · ★ 4,6 · 1.240 de păreri”) + recenziile, cu atribuirea cerută de Google:
// numele autorului (cu link spre profil când există), poza lui, „Powered by Google” și linkul spre locul de pe Google Maps.
// Folosit de blocul din aplicație (GoogleReviews) și de panoul firmei (Recenzii).
import { nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useResizeObserver } from '@vueuse/core'
import { AppIcon } from '@/shared/components'
import { formatRating, ratingsText, starsOf } from '@/shared/composables/useGoogle'
import type { GoogleInfoDto } from '@/shared/types/google'

const props = withDefaults(defineProps<{ info: GoogleInfoDto; limit?: number; heading?: boolean }>(), { limit: 5, heading: true })
const { t } = useI18n()
const open = ref<Set<number>>(new Set())
const toggle = (i: number) => {
  const next = new Set(open.value)
  if (next.has(i)) next.delete(i); else next.add(i)
  open.value = next
}
const initial = (name: string) => name.trim().charAt(0).toUpperCase() || 'G'

/* „Mai mult” apare doar la recenziile tăiate efectiv la 4 rânduri (depinde de lățimea ecranului, nu de numărul de caractere). */
const root = ref<HTMLElement | null>(null)
const texts = ref<(HTMLElement | null)[]>([])
const clamped = ref<Set<number>>(new Set())
function measure() {
  const next = new Set<number>()
  texts.value.forEach((el, i) => {
    if (!el) return
    // fără layout (teste, ecran ascuns) nu putem măsura: rămâne regula după lungime
    const cut = el.clientHeight > 0 ? el.scrollHeight > el.clientHeight + 1 : (props.info.reviews[i]?.text.length ?? 0) > 220
    if (cut) next.add(i)
  })
  clamped.value = next
}
onMounted(measure)
watch(() => props.info, () => { open.value = new Set(); nextTick(measure) })
useResizeObserver(root, () => measure())
</script>

<template>
  <div ref="root" data-test="google-reviews">
    <div>
      <div class="min-w-0">
        <div v-if="heading" class="text-[12px] font-semibold uppercase tracking-[0.04em] text-muted">{{ t('google.title') }}</div>
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
          <b v-if="props.info.rating != null" class="text-[26px] leading-none tracking-[-0.03em]">{{ formatRating(props.info.rating) }}</b>
          <span v-if="props.info.rating != null" class="flex text-[#F4B400]" :aria-label="t('google.stars', { n: formatRating(props.info.rating) })">
            <AppIcon v-for="(on, i) in starsOf(props.info.rating)" :key="i" name="star" :size="18" :fill="on" :class="on ? '' : 'text-line'" />
          </span>
          <span v-if="props.info.userRatingCount != null" class="text-[13px] text-muted">
            {{ ratingsText(t, props.info.userRatingCount) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="props.info.reviews.length" class="flex flex-col mt-3">
      <article v-for="(r, i) in props.info.reviews.slice(0, props.limit)" :key="i" class="py-3 border-t border-line">
        <div class="flex items-center gap-2.5">
          <img v-if="r.authorPhotoUrl" :src="r.authorPhotoUrl" alt="" referrerpolicy="no-referrer" class="w-8 h-8 rounded-full object-cover bg-soft shrink-0" loading="lazy">
          <span v-else class="w-8 h-8 rounded-full bg-soft text-muted flex items-center justify-center text-[13px] font-semibold shrink-0">{{ initial(r.author) }}</span>
          <div class="flex-1 min-w-0">
            <a v-if="r.authorUrl" :href="r.authorUrl" target="_blank" rel="noopener" class="text-[14px] font-semibold text-ink no-underline truncate block">{{ r.author }}</a>
            <b v-else class="text-[14px] truncate block">{{ r.author }}</b>
            <div class="flex items-center gap-1.5 text-[12px] text-muted">
              <span class="flex text-[#F4B400]" :aria-label="t('google.stars', { n: r.rating })">
                <AppIcon v-for="(on, s) in starsOf(r.rating)" :key="s" name="star" :size="13" :fill="on" :class="on ? '' : 'text-line'" />
              </span>
              <span v-if="r.relativeTime">{{ r.relativeTime }}</span>
            </div>
          </div>
        </div>
        <p :ref="(el) => { texts[i] = el as HTMLElement | null }" class="text-[14px] leading-[1.45] mt-1.5 mb-0 whitespace-pre-line" :class="open.has(i) ? '' : 'line-clamp-4'">{{ r.text }}</p>
        <button v-if="clamped.has(i) || open.has(i)" type="button" class="text-[13px] font-semibold text-ink mt-1 p-0 bg-transparent border-0 underline" @click="toggle(i)">
          {{ open.has(i) ? t('google.less') : t('google.more') }}
        </button>
      </article>
    </div>
    <p v-else class="text-[13px] text-muted mt-2 mb-0">{{ t('google.noReviews') }}</p>

    <div class="flex items-center justify-between gap-2 pt-2.5 border-t border-line mt-1">
      <a :href="props.info.mapsUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-[13px] font-semibold text-ink">
        <AppIcon name="open_in_new" :size="15" /> {{ t('google.allReviews') }}
      </a>
      <span class="text-[11px] text-muted" data-test="google-attribution">{{ props.info.attribution }}</span>
    </div>
  </div>
</template>
