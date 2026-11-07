<script setup lang="ts">
// T20 · butoanele „Descarcă pentru Android / iPhone”. Fără link (încă nu e în magazine) → „În curând”, fără să ducă nicăieri.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { DOWNLOAD_LINKS, type DownloadLinks } from '@/web/presentation'

withDefaults(defineProps<{ links?: DownloadLinks; dark?: boolean }>(), { links: () => DOWNLOAD_LINKS, dark: false })
const { t } = useI18n()
const stores = [
  { key: 'android', icon: 'android' },
  { key: 'ios', icon: 'phone_iphone' },
] as const
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <template v-for="s in stores" :key="s.key">
      <a v-if="links[s.key]" :href="links[s.key]!" target="_blank" rel="noopener"
        class="h-14 pl-4 pr-5 rounded-[14px] inline-flex items-center gap-3 no-underline"
        :class="dark ? 'bg-white text-ink' : 'bg-ink text-white'">
        <AppIcon :name="s.icon" :size="26" />
        <span class="flex flex-col leading-tight text-left"><small class="text-[11.5px] opacity-75">{{ t('site.download.getOn') }}</small><b class="text-[16px]">{{ t(`site.download.${s.key}`) }}</b></span>
      </a>
      <span v-else aria-disabled="true"
        class="h-14 pl-4 pr-5 rounded-[14px] inline-flex items-center gap-3 border"
        :class="dark ? 'border-white/30 text-white/80' : 'border-line bg-white text-muted'">
        <AppIcon :name="s.icon" :size="26" />
        <span class="flex flex-col leading-tight text-left"><small class="text-[11.5px]">{{ t('site.download.soon') }}</small><b class="text-[16px]" :class="dark ? 'text-white' : 'text-ink'">{{ t(`site.download.${s.key}`) }}</b></span>
      </span>
    </template>
  </div>
</template>
