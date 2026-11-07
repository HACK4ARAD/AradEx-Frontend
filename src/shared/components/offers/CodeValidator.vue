<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon } from '@/shared/components'
import QrScanner from '@/shared/components/qr/QrScanner.vue'
import { normalizeCode } from '@/shared/composables/useOfferForm'
import type { useCodeValidator } from '@/shared/composables/useOffers'

/**
 * Validarea unui cod de ofertă la casă (W19, cardul din panou, panoul mobil): text sau scanare QR (camera din spate).
 * Rezultatul: verde „Cod valid” sau mesajul erorii (necunoscut / deja folosit / al altei firme).
 */
const props = defineProps<{ validator: ReturnType<typeof useCodeValidator>; compact?: boolean }>()
const emit = defineEmits<{ validated: [] }>()
const { t } = useI18n()
const code = ref('')
const scanning = ref(false)
const scanKey = ref(0)
const v = props.validator

async function submit(raw = code.value) {
  const c = normalizeCode(raw)
  if (!c) { v.lastError.value = t('offers.codes.required'); return }
  code.value = c
  if (await v.validate(c, t('offers.codes.err404'), t)) { code.value = ''; emit('validated') }
}
function onScanned(c: string) { scanning.value = false; submit(c) }
function toggleScan() { scanning.value = !scanning.value; scanKey.value++ }
</script>

<template>
  <div class="flex flex-col gap-3">
    <form class="flex gap-2" @submit.prevent="submit()">
      <input v-model="code" :placeholder="t('offers.codes.placeholder')" autocomplete="off" autocapitalize="characters" spellcheck="false" :aria-label="t('offers.codes.colCode')"
        class="flex-1 min-w-0 h-12 px-3.5 bg-white border border-line rounded-[14px] font-mono text-[16px] uppercase outline-none focus:border-ink" />
      <AppButton type="submit" :loading="v.checking.value" class="whitespace-nowrap">{{ t('offers.codes.validate') }}</AppButton>
    </form>
    <AppButton variant="ghost" :size="compact ? 'sm' : 'md'" :icon="scanning ? 'close' : 'qr_code_scanner'" @click="toggleScan">
      {{ scanning ? t('offers.codes.stopScan') : t('offers.codes.scan') }}
    </AppButton>
    <QrScanner v-if="scanning" :key="scanKey" @scanned="onScanned" />

    <div v-if="v.last.value" class="rounded-[14px] bg-ok-soft text-ok p-3.5 flex items-start gap-2.5" role="status">
      <AppIcon name="check_circle" />
      <span class="text-[14px]"><b class="block">{{ t('offers.codes.ok', { offer: v.last.value.offerTitle }) }}</b><span class="font-mono">{{ v.last.value.code }}</span> · {{ t('offers.codes.okSub') }}</span>
    </div>
    <div v-else-if="v.lastError.value" class="rounded-[14px] bg-bad-soft text-bad p-3.5 flex items-start gap-2.5 text-[14px]" role="alert">
      <AppIcon name="error" /><span>{{ v.lastError.value }}</span>
    </div>
  </div>
</template>
