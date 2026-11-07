<script setup lang="ts">
/**
 * Poza unui obiectiv în panou (W25), după câmpul „drop” din design/final/web (`.drop`): chenar punctat, previzualizare
 * 80×56, „Poză aleasă” / „Adaugă o poză”, „Alege fișier” (sau poza trasă peste chenar) → `POST /city/media` (S3).
 * Linkul (de ex. o poză de pe alt site) se vede și se editează doar la cerere. Se salvează odată cu obiectivul.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon } from '@/shared/components'
import { isExternalImage, mediaApi } from '@/shared/api/media'
import { useUiStore } from '@/shared/stores/ui'

defineProps<{ label: string }>()
const model = defineModel<string>({ default: '' })
const { t } = useI18n()
const ui = useUiStore()
const input = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const broken = ref(false)
const showLink = ref(false)
const dragging = ref(false)

const source = computed(() => {
  const url = model.value
  if (!url) return null
  if (isExternalImage(url)) {
    let host = url
    try { host = new URL(url).host } catch { /* link nevalid: îl arătăm întreg */ }
    return { icon: 'public', text: t('places.form.onSite', { host }) }
  }
  if (url.includes('/api/v1/media/')) return { icon: 'cloud_done', text: t('places.form.stored') }
  return { icon: 'image', text: t('places.form.inApp') }
})

async function upload(file: File | undefined) {
  if (!file) return
  uploading.value = true
  try {
    const res = await mediaApi.upload(file)
    model.value = res.url
    broken.value = false
    ui.toast(t('places.form.uploaded'), 'success')
  } catch (err) {
    ui.error(err)
  } finally {
    uploading.value = false
    if (input.value) input.value.value = ''
  }
}

const onPick = (e: Event) => upload((e.target as HTMLInputElement).files?.[0])
function onDrop(e: DragEvent) {
  dragging.value = false
  upload(e.dataTransfer?.files?.[0])
}
</script>

<template>
  <div class="min-w-0">
    <span class="block text-[14px] font-semibold mb-2">{{ label }}</span>
    <div class="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 p-3 rounded-[12px] border-[1.5px] border-dashed transition-colors"
      :class="dragging ? 'border-ink bg-soft' : 'border-[#D3D2CC] bg-[#FBFBFA]'"
      data-test="photo-drop" @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop">
      <span class="w-20 h-14 shrink-0 rounded-[9px] bg-[#E8E7E2] bg-cover bg-center flex items-center justify-center text-[#A8A7A1]"
        :style="model && !broken ? { backgroundImage: `url('${model}')` } : undefined" data-test="photo-thumb">
        <AppIcon v-if="!model || broken" name="image" />
        <img v-if="model" :src="model" alt="" class="hidden" @error="broken = true" @load="broken = false" />
      </span>
      <div class="flex-1 min-w-[160px]">
        <b class="block text-[13.5px]">{{ model ? t('places.form.photoChosen') : t('places.form.photoAdd') }}</b>
        <span v-if="source" class="flex items-center gap-1 text-[12.5px] text-muted mt-0.5 min-w-0" data-test="photo-source">
          <AppIcon :name="source.icon" :size="15" class="shrink-0" /><span class="truncate">{{ source.text }}</span>
        </span>
        <span class="block text-[12.5px] text-muted mt-0.5">{{ t('places.form.photoHint') }}</span>
      </div>
      <div class="flex items-center justify-end gap-1.5 ml-auto">
        <button type="button" class="h-10 px-3 rounded-[12px] text-[13.5px] font-medium text-muted hover:bg-soft hover:text-ink"
          :aria-expanded="showLink" data-test="photo-link-toggle" @click="showLink = !showLink">
          {{ showLink ? t('places.form.hideLink') : t('places.form.editLink') }}
        </button>
        <AppButton variant="secondary" size="sm" :icon="uploading ? undefined : 'upload'" :loading="uploading" data-test="photo-upload" @click="input?.click()">
          {{ uploading ? t('places.form.uploading') : t('places.form.pickFile') }}
        </AppButton>
      </div>
      <input ref="input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" data-test="photo-input" @change="onPick" />
    </div>
    <div v-if="showLink" class="flex items-center gap-2 mt-2">
      <span class="flex-1 min-w-0 flex items-center h-11 px-3.5 bg-white border border-line rounded-[12px]">
        <input v-model="model" type="url" placeholder="https://…" :aria-label="label" data-test="photo-url"
          class="flex-1 min-w-0 bg-transparent outline-none text-[14px] placeholder:text-muted" />
      </span>
      <button v-if="model" type="button" class="h-11 px-3 rounded-[12px] text-[13.5px] font-medium text-bad hover:bg-soft" @click="model = ''">
        {{ t('places.form.remove') }}
      </button>
    </div>
  </div>
</template>
