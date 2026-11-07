<script setup lang="ts">
/**
 * Scanner QR cu camera din spate (html5-qrcode, încărcat doar când e nevoie). Emite `scanned(code)` o singură dată și se oprește;
 * pentru încă un cod, părintele îl montează din nou (ex. `:key`). Pe eroare de cameră emite `error` și arată mesajul — ecranul
 * care îl folosește oferă și introducerea manuală a codului. Folosit de T10 (firmă), T11 (Primărie pe teren), T18 (voluntar).
 */
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{ scanned: [code: string]; error: [message: string] }>()
const { t } = useI18n()
const elId = 'qr-' + useId().replace(/[^a-zA-Z0-9-]/g, '')
const failed = ref(false)
let scanner: { stop: () => Promise<void>; isScanning: boolean } | null = null
let done = false

async function stop() {
  if (scanner?.isScanning) { try { await scanner.stop() } catch { /* deja oprit */ } }
}

onMounted(async () => {
  try {
    const { Html5Qrcode } = await import('html5-qrcode')
    const s = new Html5Qrcode(elId, { verbose: false })
    scanner = s
    await s.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, (text) => {
      if (done) return
      done = true
      emit('scanned', text.trim())
      void stop()
    }, () => { /* niciun cod în cadru: normal */ })
  } catch (e) {
    failed.value = true
    emit('error', e instanceof Error ? e.message : String(e))
  }
})
onBeforeUnmount(() => { void stop() })
</script>

<template>
  <div class="w-full">
    <div v-show="!failed" :id="elId" class="w-full aspect-square rounded-[20px] overflow-hidden bg-black" />
    <p v-if="!failed" class="text-center text-muted text-[13px] mt-2">{{ t('common.scanHint') }}</p>
    <div v-else role="alert" class="rounded-[16px] bg-white border border-line p-4 text-[14px] text-muted">{{ t('common.cameraError') }}</div>
  </div>
</template>
