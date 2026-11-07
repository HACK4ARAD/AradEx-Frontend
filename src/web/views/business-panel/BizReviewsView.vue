<script setup lang="ts">
// T17 · Panou firmă › Recenzii (design/final web.html `/business/reviews`, W4): recenziile și ratingul de pe Google al firmei
// (prin backend, cache 24 h) + legătura firmei cu pagina ei de pe Google. Recenziile lăsate în aplicație vin cu recenziile
// la evenimente (T07 partea 2), deci aici e doar partea Google.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import GoogleReviewList from '@/shared/components/google/GoogleReviewList.vue'
import GoogleLinkCard from '@/web/components/google/GoogleLinkCard.vue'
import { formatCount, formatRating, starsOf } from '@/shared/composables/useGoogle'
import type { GoogleLinkDto } from '@/shared/types/google'
import { CARD, EMPTY, H1, HEAD, SUB } from '@/web/components/community/panel'

const { t } = useI18n()
const link = ref<GoogleLinkDto | null>(null)
</script>

<template>
  <div>
    <div :class="HEAD">
      <div>
        <h1 :class="H1">{{ t('google.panel.title') }}</h1>
        <div :class="SUB">{{ t('google.panel.sub') }}</div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
      <div :class="CARD">
        <GoogleReviewList v-if="link?.info" :info="link.info" />
        <div v-else :class="EMPTY" data-test="reviews-empty">
          <AppIcon name="reviews" :size="32" class="text-muted" />
          <div class="font-semibold text-ink mt-2">{{ t('google.panel.emptyTitle') }}</div>
          <div class="text-[13px] mt-1">{{ t('google.panel.empty') }}</div>
        </div>
      </div>

      <div class="flex flex-col gap-4 min-w-0">
        <div v-if="link?.info?.rating != null" :class="CARD">
          <b class="text-[34px] tracking-[-0.03em] leading-none">{{ formatRating(link.info.rating) }}</b>
          <div class="flex text-[#F4B400] mt-1">
            <AppIcon v-for="(on, i) in starsOf(link.info.rating)" :key="i" name="star" :size="20" :fill="on" :class="on ? '' : 'text-line'" />
          </div>
          <div class="text-[12.5px] text-muted mt-1">
            {{ t('google.title') }} · {{ t('google.ratings', { n: formatCount(link.info.userRatingCount) }, link.info.userRatingCount ?? 0) }}
          </div>
        </div>
        <GoogleLinkCard kind="business" @change="link = $event" />
      </div>
    </div>
  </div>
</template>
