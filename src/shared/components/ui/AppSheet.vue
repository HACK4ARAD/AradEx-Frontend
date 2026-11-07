<script setup lang="ts">
/**
 * Sheet Clean Ink: de jos pe telefon, dialog centrat de la 768px. Folosit de formulare, filtre, „Revendică” etc.
 * <AppSheet v-model:open="show" :title="t('…')"> conținut <template #footer>butoane</template> </AppSheet>
 * Slotul `action` pune o acțiune în dreapta titlului (ex. „Șterge tot”) în locul butonului de închidere.
 */
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ title?: string; wide?: boolean }>()
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const panel = ref<HTMLElement | null>(null)
const titleId = useId()
let lastFocus: Element | null = null

function close() { open.value = false }
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }

watch(open, async (v) => {
  if (v) {
    lastFocus = document.activeElement
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    await nextTick()
    panel.value?.focus()
  } else {
    document.removeEventListener('keydown', onKey)
    document.body.style.overflow = ''
    if (lastFocus instanceof HTMLElement) lastFocus.focus()
  }
}, { immediate: true })
onBeforeUnmount(() => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' })
</script>

<template>
  <Teleport to="body">
    <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-150">
      <div v-if="open" class="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40" @click.self="close">
        <div ref="panel" role="dialog" aria-modal="true" :aria-labelledby="props.title ? titleId : undefined" tabindex="-1"
          class="bg-white w-full max-h-[88dvh] overflow-y-auto rounded-t-[28px] md:rounded-[20px] px-5 pt-2.5 md:pt-5 pb-[max(34px,env(safe-area-inset-bottom))] md:pb-6 outline-none shadow-[0_-10px_40px_rgba(0,0,0,.18)]"
          :class="props.wide ? 'md:max-w-[720px]' : 'md:max-w-[480px]'">
          <div class="md:hidden w-11 h-[5px] rounded-[3px] bg-line mx-auto mb-3.5" />
          <div class="flex items-center gap-3 mb-3">
            <h2 v-if="props.title" :id="titleId" class="flex-1 text-[22px] font-semibold tracking-[-0.02em] m-0">{{ props.title }}</h2>
            <span v-else class="flex-1" />
            <slot name="action" />
            <button v-if="!$slots.action" type="button" class="w-9 h-9 rounded-full bg-soft flex items-center justify-center" :aria-label="t('common.close')" @click="close">
              <AppIcon name="close" :size="20" />
            </button>
          </div>
          <slot />
          <div v-if="$slots.footer" class="mt-4 flex gap-2"><slot name="footer" /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
