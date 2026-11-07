import { computed, getCurrentInstance, onBeforeUnmount, ref } from 'vue'

/**
 * Text-to-speech din browser (`speechSynthesis`), pentru ghidul virtual (T05). Pornește doar dintr-un tap (iOS nu permite autoplay).
 * Vocea: prima voce a limbii cerute (`ro-RO`, altfel `en-US` pentru EN); vocile se încarcă asincron pe iOS/Android (`voiceschanged`).
 * `progress` (0..1) vine din evenimentele `boundary` (unde le dă browserul); fără ele rămâne 0 până la final.
 */
export function useTts() {
  const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
  const supported = !!synth && typeof SpeechSynthesisUtterance !== 'undefined'
  const speaking = ref(false)
  const progress = ref(0)
  const rate = ref(1)
  /** Codul ultimei erori de citire (`SpeechSynthesisErrorEvent.error`, ex. `synthesis-failed`), null dacă a mers. */
  const error = ref<string | null>(null)
  const voices = ref<SpeechSynthesisVoice[]>(supported ? synth!.getVoices() : [])
  let current: SpeechSynthesisUtterance | null = null
  let onEnd: (() => void) | null = null

  const loadVoices = () => { voices.value = synth?.getVoices() ?? [] }
  synth?.addEventListener?.('voiceschanged', loadVoices)

  function voiceFor(lang: string): SpeechSynthesisVoice | undefined {
    const prefix = lang.slice(0, 2).toLowerCase()
    return voices.value.find((v) => v.lang.toLowerCase().replace('_', '-') === lang.toLowerCase())
      ?? voices.value.find((v) => v.lang.toLowerCase().startsWith(prefix))
  }
  /** Are dispozitivul o voce pentru limba asta? (fără voce, browserul citește cu vocea implicită — de obicei engleză) */
  const hasVoice = (lang: string) => computed(() => !!voiceFor(lang))

  /** Citește `text`; `done` se apelează când s-a terminat singur (nu la stop). */
  function speak(text: string, lang = 'ro-RO', done?: () => void) {
    if (!supported) return false
    stop()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    const v = voiceFor(lang)
    if (v) u.voice = v
    u.rate = rate.value
    u.onboundary = (e) => { if (text.length) progress.value = Math.min(1, (e.charIndex + (e.charLength || 0)) / text.length) }
    u.onend = () => {
      if (current !== u) return
      current = null
      speaking.value = false
      progress.value = 1
      const cb = onEnd
      onEnd = null
      cb?.()
    }
    u.onerror = (e) => {
      if (current !== u) return
      current = null
      speaking.value = false
      const code = (e as SpeechSynthesisErrorEvent).error
      if (code !== 'interrupted' && code !== 'canceled') error.value = code || 'unknown'
    }
    current = u
    onEnd = done ?? null
    progress.value = 0
    error.value = null
    speaking.value = true
    synth!.speak(u)
    return true
  }

  function stop() {
    if (!supported) return
    current = null
    onEnd = null
    speaking.value = false
    synth!.cancel()
  }

  /** 1× → 1,25× → 1,5× → 1× (se aplică de la următoarea citire). */
  function cycleRate() {
    rate.value = rate.value === 1 ? 1.25 : rate.value === 1.25 ? 1.5 : 1
  }

  onBeforeUnmountSafe(() => { stop(); synth?.removeEventListener?.('voiceschanged', loadVoices) })

  return { supported, speaking, progress, rate, voices, error, hasVoice, speak, stop, cycleRate }
}

/** onBeforeUnmount doar dacă suntem într-un component (testele apelează composable-ul și direct). */
function onBeforeUnmountSafe(fn: () => void) {
  if (getCurrentInstance()) onBeforeUnmount(fn)
}
