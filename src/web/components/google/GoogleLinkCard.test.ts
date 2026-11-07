import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/shared/i18n'
import type { GoogleLinkDto } from '@/shared/types/google'
import GoogleLinkCard from './GoogleLinkCard.vue'

const placeLink = vi.fn()
vi.mock('@/shared/api/google', () => ({
  googleApi: { placeLink: (...a: unknown[]) => placeLink(...a), myLink: vi.fn(), setPlaceLink: vi.fn(), setMyLink: vi.fn() },
}))

const linked = (id: string, extra: Partial<GoogleLinkDto> = {}): GoogleLinkDto => ({ googlePlaceId: id, configured: true, ...extra })

function render(placeId: number) {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'ro'
  return mount(GoogleLinkCard, { props: { kind: 'place', placeId }, global: { plugins: [i18n] } })
}

describe('GoogleLinkCard', () => {
  it('ignores a slower answer for the previous place', async () => {
    let resolveA: (v: GoogleLinkDto) => void = () => {}
    placeLink.mockReset()
      .mockImplementationOnce(() => new Promise<GoogleLinkDto>((r) => { resolveA = r }))
      .mockImplementationOnce(() => Promise.resolve(linked('', { googlePlaceId: undefined })))
    const w = render(1)
    await w.setProps({ placeId: 2 })
    await flushPromises()
    resolveA(linked('ChIJplaceA'))
    await flushPromises()
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
    expect(w.text()).toContain('Nelegat de Google')
  })

  it('says the ID is wrong when Google does not know it', async () => {
    placeLink.mockReset().mockResolvedValue(linked('ChIJwrong', { problem: 'INVALID_ID' }))
    const w = render(1)
    await flushPromises()
    expect(w.find('[data-test=google-invalid]').text()).toContain('Google nu cunoaște acest Place ID')
  })
})
