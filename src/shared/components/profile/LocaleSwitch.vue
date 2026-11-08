<script setup lang="ts">
/**
 * Alegerea limbii (Română / English / Magyar) ca listă derulantă: în Profil (mobil, T03), în Contul meu · Setări (web, T23)
 * și, compact („RO ▾”), în bara de sus a web-ului. Salvează limba în cont (`auth.changeLocale`; fără cont, doar pe dispozitiv).
 * Meniul se închide la alegere, la o atingere în afara lui și la Esc; săgețile sus / jos mută selecția.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { LOCALES, type Locale } from '@/shared/i18n'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const props = withDefaults(defineProps<{
  /** `compact` = pastila „RO ▾” din bara de sus a web-ului; implicit, butonul cu numele limbii */
  compact?: boolean
  /** încotro se deschide meniul (în bara de sus a panourilor e loc doar în jos, la dreapta) */
  align?: 'right' | 'left'
}>(), { compact: false, align: 'right' })

const { t, locale } = useI18n()
const auth = useAuthStore()
const ui = useUiStore()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const items = ref<HTMLButtonElement[]>([])
const current = computed(() => LOCALES.find((l) => l.id === locale.value) ?? LOCALES[0])

function choose(l: Locale) {
  open.value = false
  if (l !== locale.value) auth.changeLocale(l).catch((e) => ui.error(e))
}

function onOutside(e: Event) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
watch(open, async (v) => {
  if (v) {
    document.addEventListener('pointerdown', onOutside, true)
    await nextTick()
    items.value[Math.max(0, LOCALES.findIndex((l) => l.id === locale.value))]?.focus()
  } else document.removeEventListener('pointerdown', onOutside, true)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside, true))

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') { open.value = false; return }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  const i = items.value.indexOf(document.activeElement as HTMLButtonElement)
  const next = (i + (e.key === 'ArrowDown' ? 1 : -1) + items.value.length) % items.value.length
  items.value[next]?.focus()
}
</script>

<template>
  <div ref="root" class="relative inline-block shrink-0" @keydown="onKey">
    <button type="button" aria-haspopup="listbox" :aria-expanded="open" :aria-label="t('profile.language')" :title="t('profile.language')"
      class="inline-flex items-center gap-1 font-semibold border border-line bg-white text-ink transition-colors hover:bg-soft"
      :class="compact ? 'h-8 pl-2.5 pr-1.5 rounded-full text-[12px]' : 'h-9 pl-3 pr-2 rounded-[10px] text-[13.5px]'"
      data-test="locale-switch" @click="open = !open">
      <span>{{ compact ? current.short : current.name }}</span>
      <AppIcon name="expand_more" :size="compact ? 16 : 18" class="text-muted transition-transform" :class="open && 'rotate-180'" />
    </button>
    <ul v-if="open" role="listbox" :aria-label="t('profile.language')"
      class="absolute top-full mt-1.5 z-[60] min-w-[168px] m-0 p-1 list-none bg-white border border-line rounded-[14px] shadow-[0_12px_32px_rgba(17,17,17,.14)]"
      :class="align === 'right' ? 'right-0' : 'left-0'">
      <li v-for="l in LOCALES" :key="l.id" role="presentation">
        <button ref="items" type="button" role="option" :aria-selected="l.id === locale" :lang="l.id"
          class="w-full h-10 px-3 rounded-[10px] flex items-center gap-2.5 text-left text-[14px] text-ink hover:bg-soft focus:bg-soft focus:outline-none"
          :class="l.id === locale && 'font-semibold'" @click="choose(l.id)">
          <span class="w-7 text-[11.5px] font-bold text-muted tracking-[.04em]">{{ l.short }}</span>
          <span class="flex-1">{{ l.name }}</span>
          <AppIcon v-if="l.id === locale" name="check" :size="18" />
        </button>
      </li>
    </ul>
  </div>
</template>
