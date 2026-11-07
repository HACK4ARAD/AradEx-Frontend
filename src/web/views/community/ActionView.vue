<script setup lang="ts">
// T23 · /community/actions/:id pe web (public): poza, +puncte, ore + Calendar, loc + Indicații (→ /map?to=action:ID), locuri, despre,
// „Cum primești punctele”; în dreapta butonul principal (Mă înscriu / QR-ul meu / Confirmat), ca bara de jos din aplicație.
// Logica și corpul sunt comune cu aplicația: useActionDetail, ActionDetailInfo, ActionCta, RegistrationSheet.
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import ActionCta from '@/shared/components/community/ActionCta.vue'
import ActionDetailInfo from '@/shared/components/community/ActionDetailInfo.vue'
import RegistrationSheet from '@/shared/components/community/RegistrationSheet.vue'
import { useActionDetail } from '@/shared/composables/useActionDetail'
import { useFormat } from '@/shared/composables/useFormat'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const f = useFormat()
const id = computed(() => Number(route.params.id))
const { action: a, loading, notFound, saving, load, reg, qrOpen, onRegister, onCancel, share } = useActionDetail(id)

onMounted(load)
</script>

<template>
  <div class="max-w-[1080px] mx-auto">
    <router-link to="/community" class="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted no-underline hover:text-ink mb-4">
      <AppIcon name="arrow_back" :size="18" />{{ t('community.web.backToCommunity') }}
    </router-link>

    <Skeleton v-if="loading" :rows="3" :height="160" />
    <EmptyState v-else-if="notFound" icon="volunteer_activism" :title="t('community.action.notFound')" :action="t('community.action.backToList')" @action="router.push('/community')" />
    <EmptyState v-else-if="!a" icon="cloud_off" :title="t('community.loadError')" :action="t('common.retry')" @action="load" />
    <div v-else class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8 items-start">
      <article class="min-w-0">
        <div class="relative h-[220px] md:h-[320px] rounded-[20px] overflow-hidden bg-green-deep bg-cover bg-center flex items-center justify-center text-white/70"
          :style="a.imageUrl ? { backgroundImage: `url('${a.imageUrl}')` } : undefined">
          <AppIcon v-if="!a.imageUrl" name="volunteer_activism" :size="56" />
          <span class="absolute left-4 top-4 bg-green-soft text-green-deep font-bold text-[13px] px-3 py-1.5 rounded-full">{{ t('community.card.points', { n: a.pointsReward }) }}</span>
          <span v-if="a.imageCredit" class="absolute right-2 bottom-1.5 text-[10px] text-white/85 bg-black/30 rounded px-1.5 py-0.5 max-w-[80%] truncate">{{ a.imageCredit }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2 mt-4">
          <span class="rounded-full bg-green-soft text-green-deep text-[12.5px] font-semibold px-2.5 py-1">{{ t('community.action.badge', { cat: t(`community.category.${a.category}`) }) }}</span>
          <span class="text-muted text-[13.5px]">{{ t('community.action.organizedBy') }}</span>
        </div>
        <h1 class="text-[30px] md:text-[36px] font-semibold tracking-[-0.025em] leading-tight m-0 mt-2.5">{{ a.title }}</h1>
        <ActionDetailInfo :action="a" />
      </article>

      <aside class="lg:sticky lg:top-24 bg-white border border-line rounded-[16px] p-4 flex flex-col gap-3">
        <div>
          <b class="block text-[22px] tracking-[-0.02em] text-green-deep">{{ t('community.card.points', { n: a.pointsReward }) }}</b>
          <span class="text-muted text-[14px]">{{ f.dateTime(a.startAt, false) }} · {{ f.timeRange(a.startAt, a.endAt) }}</span>
        </div>
        <ActionCta :action="a" :registration="reg" :saving="saving" @register="onRegister" @qr="qrOpen = true" @staff="router.push('/city/validate')" />
        <button type="button" class="h-10 rounded-[12px] border border-line bg-white text-[14px] font-semibold text-ink inline-flex items-center justify-center gap-1.5" @click="share">
          <AppIcon name="ios_share" :size="18" />{{ t('community.action.share') }}
        </button>
      </aside>
    </div>

    <RegistrationSheet v-model:open="qrOpen" :registration="reg" :saving="saving" @cancel="onCancel" />
  </div>
</template>
