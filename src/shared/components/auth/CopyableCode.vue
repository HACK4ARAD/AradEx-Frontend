<script setup lang="ts">
// Un cod de arătat o singură dată (codul de recuperare, parola temporară de la Admin): mare, monospace, selectabil, cu „Copiază”.
// Copierea: clipboard-ul browserului sau varianta veche (useCopy); dacă nu merge, codul rămâne afișat și se poate selecta.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useUiStore } from '@/shared/stores/ui'
import { copyText } from '@/shared/composables/useCopy'

const props = defineProps<{ code: string; copiedText?: string }>()
const emit = defineEmits<{ copied: [] }>()
const { t } = useI18n()
const ui = useUiStore()

async function copy() {
  if (await copyText(props.code)) {
    ui.toast(props.copiedText ?? t('auth.recoveryCode.copied'), 'success')
    emit('copied')
  } else ui.toast(t('auth.recoveryCode.copyFailed'), 'error')
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <code class="block w-full font-mono font-bold text-[clamp(18px,5.6vw,24px)] tracking-[.08em] text-center whitespace-nowrap bg-soft rounded-[14px] px-3 py-3.5 select-all"
      data-test="secret-code">{{ code }}</code>
    <button type="button" class="h-11 px-4 rounded-[14px] border-[1.5px] border-ink bg-white text-ink font-semibold text-[15px] inline-flex items-center justify-center gap-1.5"
      data-test="copy-code" @click="copy">
      <AppIcon name="content_copy" :size="18" />{{ t('auth.recoveryCode.copy') }}
    </button>
  </div>
</template>
