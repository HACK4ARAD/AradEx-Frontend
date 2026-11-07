<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { directionsUrl } from '@/shared/composables/useBusiness'
import type { BusinessDto } from '@/shared/types/business'

/** Despre + contact pe pagina publică a firmei (mobil + web): descriere, adresă, telefon, site. */
const props = defineProps<{ business: BusinessDto }>()
const { t } = useI18n()
const maps = computed(() => directionsUrl(props.business.lat, props.business.lng, props.business.address))
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-if="business.description" class="bg-white rounded-[16px] p-4">
      <b class="block text-[15px] mb-1">{{ t('business.public.about') }}</b>
      <p class="text-[14.5px] text-muted m-0 leading-relaxed">{{ business.description }}</p>
    </div>
    <div class="bg-white rounded-[16px] p-4 flex flex-col gap-2.5 text-[14px]">
      <b class="block text-[15px]">{{ t('business.public.contact') }}</b>
      <a v-if="business.address" :href="maps ?? undefined" target="_blank" rel="noopener" class="flex items-start gap-2.5 no-underline text-ink">
        <AppIcon name="location_on" :size="20" class="text-muted" /><span>{{ business.address }}</span>
      </a>
      <a v-if="business.phone" :href="`tel:${business.phone}`" class="flex items-center gap-2.5 no-underline text-ink">
        <AppIcon name="call" :size="20" class="text-muted" /><span>{{ business.phone }}</span>
      </a>
      <a v-if="business.website" :href="business.website" target="_blank" rel="noopener" class="flex items-center gap-2.5 no-underline text-ink">
        <AppIcon name="language" :size="20" class="text-muted" /><span class="truncate">{{ business.website }}</span>
      </a>
    </div>
  </div>
</template>
