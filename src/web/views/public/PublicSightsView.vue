<script setup lang="ts">
// SEO · /obiective: obiectivele turistice din Arad (atracții, muzee, natură, parcuri), publice și doar de citit; întâi cele cu
// ghid audio, cu filtru pe tip (chips). Fiecare card duce la pagina obiectivului. JSON-LD `ItemList`; pre-generată la build.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, Skeleton } from '@/shared/components'
import SightCard from '@/web/components/public/SightCard.vue'
import PublicCta from '@/web/components/public/PublicCta.vue'
import { SIGHT_TYPES, useSights, type SightType } from '@/shared/composables/usePublicPages'
import { SEO_PAGES, setJsonLd } from '@/web/seo'
import { itemListJsonLd, placePath } from '@/web/seoPages'

const { t } = useI18n()
const { items, loading, failed, reload } = useSights()
const type = ref<SightType | ''>('')
const shown = computed(() => (type.value ? items.value.filter((p) => p.type === type.value) : items.value))
const count = (k: SightType | '') => (k ? items.value.filter((p) => p.type === k).length : items.value.length)

watch(items, (list) => {
  if (list.length) setJsonLd(itemListJsonLd(SEO_PAGES['w-pub-sights'].title, list.map((p) => ({ path: placePath(p), name: p.name }))))
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="max-w-[760px]">
      <h1 class="text-[30px] md:text-[38px] font-semibold tracking-[-0.025em] leading-tight m-0">{{ t('site.public.sights.title') }}</h1>
      <p class="text-muted text-[15px] md:text-[16px] leading-relaxed mt-2.5 mb-0">{{ t('site.public.sights.intro') }}</p>
    </header>

    <div v-if="items.length" class="flex flex-wrap gap-2" role="group" :aria-label="t('site.public.sights.title')">
      <button v-for="k in (['', ...SIGHT_TYPES] as const)" :key="k || 'all'" type="button" :aria-pressed="type === k" :data-test="`chip-${k || 'all'}`"
        class="h-9 px-3.5 rounded-full border text-[13.5px] font-semibold whitespace-nowrap"
        :class="type === k ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line'" @click="type = k">
        {{ k ? t(`places.type.${k}`) : t('site.public.sights.all') }} <span class="opacity-60 font-medium">{{ count(k) }}</span>
      </button>
    </div>

    <Skeleton v-if="loading && !items.length" :rows="2" :height="230" />
    <div v-else-if="failed" class="bg-white border border-line rounded-[16px] p-5 flex flex-wrap items-center gap-3" role="alert">
      <span class="flex-1 min-w-[200px] text-[15px]">{{ t('site.public.sights.loadError') }}</span>
      <AppButton size="sm" variant="ghost" @click="reload">{{ t('common.retry') }}</AppButton>
    </div>
    <p v-else-if="!shown.length" class="text-[15px] text-muted bg-white border border-line rounded-[16px] p-5 m-0">{{ t('site.public.sights.empty') }}</p>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <SightCard v-for="p in shown" :key="p.id" :place="p" />
    </div>

    <PublicCta />
  </div>
</template>
