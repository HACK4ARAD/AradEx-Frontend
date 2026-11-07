<script setup lang="ts">
// T11 · Detaliul unei acțiuni comunitare (design/final mobile „Acțiune comunitară”): +puncte, ore, loc + Indicații, locuri,
// cine merge, despre, „Cum primești punctele”, apoi Mă înscriu → QR-ul meu (sheet). Vizitatorul se înscrie direct („Sunt din Arad”).
// Logica (useActionDetail) și corpul / butonul (ActionDetailInfo, ActionCta, RegistrationSheet) sunt comune cu web-ul (T23).
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import ActionCta from '@/shared/components/community/ActionCta.vue'
import ActionDetailInfo from '@/shared/components/community/ActionDetailInfo.vue'
import RegistrationSheet from '@/shared/components/community/RegistrationSheet.vue'
import { useActionDetail } from '@/shared/composables/useActionDetail'
import { useBack } from '@/shared/composables/useBack'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const back = useBack('/community')
const id = computed(() => Number(route.params.id))
const { action: a, loading, notFound, saving, load, reg, qrOpen, onRegister, onCancel, share } = useActionDetail(id)

onMounted(load)
</script>

<template>
  <div class="-mx-5 -mt-3">
    <div class="relative h-[260px] bg-green-deep bg-cover bg-center" :style="a?.imageUrl ? { backgroundImage: `url('${a.imageUrl}')` } : undefined">
      <button class="absolute left-4 top-[max(14px,env(safe-area-inset-top))] w-11 h-11 rounded-full bg-white/90 flex items-center justify-center" :aria-label="t('common.back')" @click="back">
        <AppIcon name="arrow_back" />
      </button>
      <button v-if="a" class="absolute right-4 top-[max(14px,env(safe-area-inset-top))] w-11 h-11 rounded-full bg-white/90 flex items-center justify-center" :aria-label="t('community.action.share')" @click="share">
        <AppIcon name="ios_share" />
      </button>
      <span v-if="a?.imageCredit" class="absolute right-2 bottom-1.5 text-[10px] text-white/85 bg-black/30 rounded px-1.5 py-0.5 max-w-[80%] truncate">{{ a.imageCredit }}</span>
    </div>
  </div>

  <div class="pt-4 pb-32">
    <Skeleton v-if="loading" :rows="4" />
    <EmptyState v-else-if="notFound" icon="volunteer_activism" :title="t('community.action.notFound')" :action="t('community.action.backToList')" @action="router.push('/community')" />
    <EmptyState v-else-if="!a" icon="cloud_off" :title="t('community.loadError')" :action="t('common.retry')" @action="load" />
    <template v-else>
      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded-full bg-green-soft text-green-deep text-[12.5px] font-semibold px-2.5 py-1">{{ t('community.action.badge', { cat: t(`community.category.${a.category}`) }) }}</span>
        <span class="text-muted text-[13.5px]">{{ t('community.action.organizedBy') }}</span>
      </div>
      <h1 class="text-[28px] font-semibold tracking-[-0.025em] leading-tight m-0 mt-2.5">{{ a.title }}</h1>
      <ActionDetailInfo :action="a" />
    </template>
  </div>

  <!-- bara de jos din design (`bottombar`), peste tab bar, ca la detaliul evenimentului (T06) și al ofertei (T10) -->
  <div v-if="a" class="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[480px] z-40 px-5 pt-3 pb-[max(30px,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-line">
    <ActionCta :action="a" :registration="reg" :saving="saving" @register="onRegister" @qr="qrOpen = true" @staff="router.push('/panel')" />
  </div>

  <RegistrationSheet v-model:open="qrOpen" :registration="reg" :saving="saving" @cancel="onCancel" />
</template>
