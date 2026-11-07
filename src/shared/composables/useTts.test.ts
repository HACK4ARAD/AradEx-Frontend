import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useTts } from './useTts'
import { clock, pointSeconds, useAudioGuide } from './useAudioGuide'
import type { GuidePointDto } from '@/shared/types/places'

/** jsdom nu are speechSynthesis: un fals care ține minte ce s-a citit și ne lasă să terminăm citirea. */
class FakeUtterance {
  text: string; lang = ''; rate = 1; voice: unknown = null
  onend: (() => void) | null = null; onerror: (() => void) | null = null
  onboundary: ((e: { charIndex: number; charLength?: number }) => void) | null = null
  constructor(text: string) { this.text = text }
}
const spoken: FakeUtterance[] = []
const synth = {
  speak: vi.fn((u: FakeUtterance) => spoken.push(u)),
  cancel: vi.fn(),
  getVoices: vi.fn(() => [{ lang: 'en-US', name: 'Samantha' }, { lang: 'ro-RO', name: 'Ioana' }]),
  addEventListener: vi.fn(), removeEventListener: vi.fn(),
}

beforeEach(() => {
  spoken.length = 0
  vi.clearAllMocks()
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
})
afterEach(() => {
  Reflect.deleteProperty(window, 'speechSynthesis')
  vi.unstubAllGlobals()
})

describe('useTts', () => {
  it('speaks in Romanian with the Romanian voice and the chosen rate', () => {
    const tts = useTts()
    tts.cycleRate()
    expect(tts.speak('Bun venit', 'ro-RO')).toBe(true)
    expect(spoken[0].lang).toBe('ro-RO')
    expect((spoken[0].voice as { name: string }).name).toBe('Ioana')
    expect(spoken[0].rate).toBe(1.25)
    expect(tts.speaking.value).toBe(true)
  })

  it('tracks progress and calls done only when reading ends by itself', () => {
    const tts = useTts()
    const done = vi.fn()
    tts.speak('0123456789', 'ro-RO', done)
    spoken[0].onboundary?.({ charIndex: 4, charLength: 1 })
    expect(tts.progress.value).toBeCloseTo(0.5)
    spoken[0].onend?.()
    expect(done).toHaveBeenCalledOnce()
    expect(tts.speaking.value).toBe(false)

    tts.speak('altceva', 'ro-RO', done)
    tts.stop()
    spoken[1].onend?.()          // browserul trimite onend și după cancel
    expect(done).toHaveBeenCalledOnce()
  })

  it('reports no support when the browser has no speechSynthesis', () => {
    Reflect.deleteProperty(window, 'speechSynthesis')
    const tts = useTts()
    expect(tts.supported).toBe(false)
    expect(tts.speak('x')).toBe(false)
  })

  it('cycles the speed 1 → 1.25 → 1.5 → 1', () => {
    const tts = useTts()
    const seen = [1, 2, 3].map(() => { tts.cycleRate(); return tts.rate.value })
    expect(seen).toEqual([1.25, 1.5, 1])
  })
})

const pt = (id: number, title: string, durationSec?: number): GuidePointDto => ({ id, position: id, title, text: `Textul ${title}.`, durationSec })

describe('useAudioGuide', () => {
  it('reads "title. text", moves to the next point and keeps reading', () => {
    const g = useAudioGuide(ref([pt(1, 'Unu', 80), pt(2, 'Doi', 70)]), ref('ro'))
    g.toggle()
    expect(spoken.at(-1)?.text).toBe('Unu. Textul Unu.')
    g.next()
    expect(g.index.value).toBe(1)
    expect(spoken.at(-1)?.text).toBe('Doi. Textul Doi.')
    g.next()
    expect(g.index.value).toBe(0)   // după ultimul punct revine la primul
  })

  it('pause stops reading; picking a point while paused does not speak', () => {
    const g = useAudioGuide(ref([pt(1, 'Unu'), pt(2, 'Doi')]), ref('ro'))
    g.toggle()
    g.toggle()
    expect(g.playing.value).toBe(false)
    const before = spoken.length
    g.pick(1)
    expect(spoken.length).toBe(before)
    expect(g.index.value).toBe(1)
  })

  it('uses en-US when the app is in English', () => {
    const g = useAudioGuide(ref([pt(1, 'One')]), ref('en'))
    g.toggle()
    expect(spoken.at(-1)?.lang).toBe('en-US')
  })
})

describe('guide helpers', () => {
  it('formats a clock and estimates missing durations like the backend', () => {
    expect(clock(80)).toBe('1:20')
    expect(clock(5)).toBe('0:05')
    expect(pointSeconds(pt(1, 'x', 95))).toBe(95)
    expect(pointSeconds({ ...pt(1, 'x'), text: Array(140).fill('cuvânt').join(' ') })).toBe(60)
    expect(pointSeconds({ ...pt(1, 'x'), text: 'scurt' })).toBe(20)
  })
})
