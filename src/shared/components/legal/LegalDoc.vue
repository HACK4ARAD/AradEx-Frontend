<script setup lang="ts">
// Textul unei pagini legale (Confidențialitate, Termeni și condiții), din `legal.<doc>` în i18n. Folosit de paginile web
// (/privacy, /terms) și de fereastra din bifa de la crearea contului (`TermsConsent`), unde titlul e în antetul ferestrei.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type LegalDocId = 'privacy' | 'terms'
const SECTIONS: Record<LegalDocId, readonly string[]> = {
  privacy: ['account', 'activity', 'location', 'camera', 'ai', 'storage', 'rights'],
  terms: ['about', 'account', 'use', 'tickets', 'points', 'info', 'data', 'changes', 'law'],
}

const props = withDefaults(defineProps<{ doc: LegalDocId; contact?: string; inSheet?: boolean }>(), { contact: '', inSheet: false })
const { t } = useI18n()
const sections = computed(() => SECTIONS[props.doc])
</script>

<template>
  <article :class="inSheet ? '' : 'max-w-[720px] mx-auto'" :data-test="`legal-${doc}`">
    <h1 v-if="!inSheet" class="text-[32px] font-semibold tracking-[-0.02em] m-0">{{ t(`legal.${doc}.title`) }}</h1>
    <p class="text-[13px] text-muted m-0" :class="inSheet ? 'mb-3' : 'mt-1 mb-5'">{{ t(`legal.${doc}.updated`) }}</p>
    <p class="leading-relaxed m-0" :class="inSheet ? 'text-[15px] mb-4' : 'text-[16px] mb-6'">{{ t(`legal.${doc}.intro`) }}</p>
    <section v-for="s in sections" :key="s" :class="inSheet ? 'mb-4' : 'mb-5'">
      <h2 class="font-semibold m-0 mb-1.5" :class="inSheet ? 'text-[16px]' : 'text-[18px]'">{{ t(`legal.${doc}.sections.${s}.title`) }}</h2>
      <p class="text-[15px] leading-relaxed text-ink/85 m-0">{{ t(`legal.${doc}.sections.${s}.text`) }}</p>
    </section>
    <p v-if="contact" class="text-[15px] mt-6">
      {{ t('legal.privacy.contact', { email: '' }) }}<a :href="`mailto:${contact}`" class="text-ink font-semibold">{{ contact }}</a>
    </p>
  </article>
</template>
