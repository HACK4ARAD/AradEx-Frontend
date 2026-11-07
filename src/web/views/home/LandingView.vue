<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import ApiStatus from '@/shared/components/ui/ApiStatus.vue'
import { useFormat } from '@/shared/composables/useFormat'
// Cochilie (T02): secțiunile sunt ale story-urilor — T06 evenimente, T08 harta.
import LandingEvents from '@/web/components/home/LandingEvents.vue'
import LandingMap from '@/web/components/home/LandingMap.vue'

const { t } = useI18n()
const router = useRouter()
const f = useFormat()
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-7">
    <div class="flex-[1.4] min-w-0">
      <div class="text-[13px] text-muted">{{ f.longDate(new Date().toISOString()) }}</div>
      <h1 class="text-[40px] font-semibold tracking-[-0.025em] leading-tight m-0 mb-4">{{ t('home.title') }}</h1>
      <button class="w-full max-w-[560px] h-[52px] bg-white border border-line rounded-[14px] flex items-center gap-2 px-3 text-muted text-[15px]" @click="router.push('/events')">
        <AppIcon name="search" :size="20" /> {{ t('common.search') }}
      </button>
      <LandingEvents />
      <div class="mt-2"><ApiStatus /></div>
    </div>
    <div class="flex-1 min-w-0 flex flex-col gap-4">
      <button class="bg-ink text-white rounded-[16px] p-4 flex items-center gap-3 text-left" @click="router.push('/plan')">
        <AppIcon name="auto_awesome" :size="28" class="text-yellow" />
        <span class="flex-1"><b class="block text-[15px]">{{ t('home.planCta') }}</b><small class="text-white/75 text-[12px]">{{ t('home.planCtaSub') }}</small></span>
      </button>
      <LandingMap />
    </div>
  </div>
</template>
