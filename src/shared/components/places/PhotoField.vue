<script setup lang="ts">
/**
 * Poza unui obiectiv în panou (W25): URL-ul (editabil), o miniatură și „Încarcă poză” → `POST /city/media` (S3 în producție).
 * După încărcare URL-ul nostru intră în câmp; se salvează odată cu obiectivul („Salvează”).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { isExternalImage, mediaApi } from '@/shared/api/media'
import { useUiStore } from '@/shared/stores/ui'

defineProps<{ label: string; placeholder?: string }>()
const model = defineModel<string>({ default: '' })
const { t } = useI18n()
const ui = useUiStore()
const input = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const broken = ref(false)

const status = computed(() => {
  if (!model.value) return null
  if (isExternalImage(model.value)) return { icon: 'public', text: t('places.form.external') }
  if (model.value.includes('/api/v1/media/')) return { icon: 'cloud_done', text: t('places.form.stored') }
  return null
})

async function onPick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
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
</script>

<template>
  <div class="min-w-0">
    <span class="block text-[14px] font-semibold mb-2">{{ label }}</span>
    <div class="flex items-center gap-2">
      <span class="w-12 h-12 shrink-0 rounded-[12px] border border-line bg-soft bg-cover bg-center flex items-center justify-center text-muted overflow-hidden"
        :style="model && !broken ? { backgroundImage: `url('${model}')` } : undefined" data-test="photo-thumb">
        <AppIcon v-if="!model || broken" name="image" :size="20" />
        <img v-if="model" :src="model" alt="" class="hidden" @error="broken = true" @load="broken = false" />
      </span>
      <span class="flex-1 min-w-0 flex items-center h-12 px-3.5 bg-white border border-line rounded-[14px]">
        <input v-model="model" type="text" :placeholder="placeholder" :aria-label="label"
          class="flex-1 min-w-0 bg-transparent outline-none text-[16px] placeholder:text-muted" />
      </span>
      <button type="button" class="h-12 shrink-0 px-3.5 rounded-[14px] bg-ink text-white text-[14px] font-semibold flex items-center gap-1.5 disabled:opacity-60"
        :disabled="uploading" :title="t('places.form.uploadHint')" data-test="photo-upload" @click="input?.click()">
        <AppIcon :name="uploading ? 'progress_activity' : 'upload'" :size="20" :class="uploading && 'animate-spin'" />
        <span class="hidden sm:inline">{{ uploading ? t('places.form.uploading') : t('places.form.upload') }}</span>
      </button>
      <input ref="input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" data-test="photo-input" @change="onPick" />
    </div>
    <span class="flex items-center gap-1 text-[12.5px] text-muted mt-1.5">
      <template v-if="status"><AppIcon :name="status.icon" :size="15" />{{ status.text }} · </template>{{ t('places.form.uploadHint') }}
    </span>
  </div>
</template>
