import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import type { StopArrivalsDto } from '@/shared/types/transit'
import NearestStop from './NearestStop.vue'

const nearest = vi.fn()
vi.mock('@/shared/api/transit', () => ({ transitApi: { nearest: (...a: unknown[]) => nearest(...a) } }))

const base: StopArrivalsDto = {
  stop: { id: 239, name: 'Primariei 1', lat: 46.1753, lng: 21.3178, routeIds: [11, 13], lines: ['1', '3'] },
  distanceKm: 0.3, live: true, attribution: 'Date: CTP Arad / Telelink', arrivals: [],
}
const arrival = (routeId: number, n: string, minutes: number) =>
  ({ routeId, routeShortName: n, mode: 'TRAM' as const, stopId: 239, at: '2026-11-07T15:20:00Z', minutes, delaySeconds: 0, realtime: true })

async function render(res: StopArrivalsDto) {
  i18n.global.locale.value = 'ro'
  nearest.mockReset().mockResolvedValue(res)
  const w = mount(NearestStop, { props: { lat: 46.1754, lng: 21.3193 }, global: { plugins: [i18n] } })
  await flushPromises()
  return w
}

describe('NearestStop', () => {
  it('shows the next tram of each line, the walk and the attribution', async () => {
    const w = await render({ ...base, arrivals: [arrival(11, '1', 4), arrival(11, '1', 9), arrival(13, '3', 0)] })
    expect(w.text()).toContain('Stația cea mai apropiată · Primariei 1')
    expect(w.text()).toContain('Tramvaiul 1 în 4 min · Tramvaiul 3 acum')
    expect(w.text()).toContain('0,3 km pe jos · Date: CTP Arad / Telelink')
  })

  it('falls back to the lines of the stop when there is no live data', async () => {
    const w = await render({ ...base, live: false })
    expect(w.text()).toContain('Liniile 1, 3 · Fără date live acum')
  })

  it('is hidden when the stop is too far to walk or the request fails', async () => {
    expect((await render({ ...base, distanceKm: 4 })).find('[data-test=nearest-stop]').exists()).toBe(false)
    nearest.mockReset().mockRejectedValue(new Error('down'))
    const w = mount(NearestStop, { props: { lat: 46.1, lng: 21.3 }, global: { plugins: [i18n] } })
    await flushPromises()
    expect(w.find('[data-test=nearest-stop]').exists()).toBe(false)
  })
})
