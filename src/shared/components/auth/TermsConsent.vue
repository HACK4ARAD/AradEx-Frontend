<script setup lang="ts">
// GDPR · bifa de la crearea contului (cont personal cu telefon și cont de firmă): „Am citit și accept Termenii și condițiile și
// Politica de confidențialitate”. Linkurile deschid textul într-o fereastră peste formular (nu pleci de pe pagină și nu pierzi
// ce ai completat). Fără bifă contul nu se creează: formularul arată `auth.consent.required`, BE refuză cu 400.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppSheet } from '@/shared/components'
import LegalDoc, { type LegalDocId } from '@/shared/components/legal/LegalDoc.vue'

const accepted = defineModel<boolean>({ default: false })
defineProps<{ invalid?: boolean }>()
const { t } = useI18n()
const shown = ref<LegalDocId | null>(null)
const open = ref(false)
function show(doc: LegalDocId) { shown.value = doc; open.value = true }
</script>

<template>
  <div>
    <label class="flex items-start gap-3 cursor-pointer select-none" data-test="terms-consent">
      <input v-model="accepted" type="checkbox" class="peer sr-only" :aria-invalid="invalid || undefined" />
      <span class="mt-px w-[22px] h-[22px] shrink-0 rounded-[7px] border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30"
        :class="accepted ? 'bg-ink border-ink text-white' : invalid ? 'border-[#B3261E] bg-white' : 'border-[#C9C9C2] bg-white'" aria-hidden="true">
        <AppIcon v-if="accepted" name="check" :size="16" />
      </span>
      <span class="text-[14px] leading-snug text-ink/85">
        <i18n-t keypath="auth.consent.text" scope="global">
          <template #terms><button type="button" class="font-semibold text-ink underline underline-offset-2" @click.prevent="show('terms')">{{ t('auth.consent.terms') }}</button></template>
          <template #privacy><button type="button" class="font-semibold text-ink underline underline-offset-2" @click.prevent="show('privacy')">{{ t('auth.consent.privacy') }}</button></template>
        </i18n-t>
      </span>
    </label>
    <AppSheet v-model:open="open" :title="shown ? t(`legal.${shown}.title`) : ''" wide>
      <div class="max-h-[60vh] overflow-y-auto -mx-1 px-1">
        <LegalDoc v-if="shown" :doc="shown" in-sheet />
      </div>
      <template #footer>
        <AppButton block @click="open = false">{{ t('auth.consent.close') }}</AppButton>
      </template>
    </AppSheet>
  </div>
</template>
