import { computed, ref, watch, type Ref } from 'vue'
import type { GuidePointDto } from '@/shared/types/places'
import { useTts } from './useTts'

/** „1:20” din secunde. */
export function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Durata unui punct; fără `durationSec` (texte vechi) o estimăm: ~140 de cuvinte pe minut, ca în BE. */
export function pointSeconds(p: GuidePointDto): number {
  if (p.durationSec) return p.durationSec
  const words = p.text.trim() ? p.text.trim().split(/\s+/).length : 0
  return Math.max(20, Math.round((words * 60) / 140))
}

/**
 * Ghidul virtual (E3 / W8): punctul curent, play/pauză, următorul punct, viteză. Citește „titlu. text” cu `useTts`.
 * `lang` = limba aplicației (`ro` → ro-RO, `en` → en-US; textele sunt deocamdată doar în română).
 */
export function useAudioGuide(points: Ref<GuidePointDto[]>, lang: Ref<string>) {
  const tts = useTts()
  const index = ref(0)
  const voiceLang = computed(() => (lang.value === 'en' ? 'en-US' : 'ro-RO'))
  const current = computed<GuidePointDto | undefined>(() => points.value[index.value])
  const playing = computed(() => tts.speaking.value)
  const total = computed(() => (current.value ? pointSeconds(current.value) : 0))
  const elapsed = computed(() => (playing.value ? tts.progress.value * total.value : 0))
  const hasVoice = tts.hasVoice('ro-RO')

  // alt obiectiv (altă listă de puncte) → de la început, fără sunet
  watch(() => points.value.map((p) => p.id).join(','), () => { tts.stop(); index.value = 0 })

  function play() {
    const p = current.value
    if (!p) return false
    return tts.speak(`${p.title}. ${p.text}`, voiceLang.value)
  }
  function toggle() {
    if (playing.value) { tts.stop(); return true }
    return play()
  }
  function pick(i: number) {
    if (i < 0 || i >= points.value.length) return
    const wasPlaying = playing.value
    index.value = i
    if (wasPlaying) play()
    else tts.stop()
  }
  /** Următorul punct (după ultimul revine la primul); dacă se citea, continuă cu el. */
  function next() {
    if (!points.value.length) return
    pick((index.value + 1) % points.value.length)
  }

  return {
    index, current, playing, total, elapsed, hasVoice,
    supported: tts.supported, rate: tts.rate, cycleRate: tts.cycleRate, stop: tts.stop,
    toggle, pick, next,
  }
}
