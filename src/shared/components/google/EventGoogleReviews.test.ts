import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import type { GoogleInfoDto } from '@/shared/types/google'
import EventGoogleReviews from './EventGoogleReviews.vue'

const place = vi.fn()
const business = vi.fn()
vi.mock('@/shared/api/google', () => ({
  googleApi: { place: (...a: unknown[]) => place(...a), business: (...a: unknown[]) => business(...a) },
}))

const info = (author: string): GoogleInfoDto => ({
  rating: 4.8, userRatingCount: 631, mapsUrl: 'https://maps.google.com/?cid=1', attribution: 'Google Maps',
  reviews: [{ author, rating: 5, text: 'Superb' }],
})

async function render(props: { placeId?: number | null; organizerBusinessId?: number | null }) {
  i18n.global.locale.value = 'ro'
  const w = mount(EventGoogleReviews, { props, global: { plugins: [i18n] } })
  await flushPromises()
  return w
}

describe('EventGoogleReviews', () => {
  it('shows the venue reviews when the venue is on Google, without asking for the organizer', async () => {
    place.mockReset().mockResolvedValue(info('Ana'))
    business.mockReset().mockResolvedValue(info('Firma'))
    const w = await render({ placeId: 2, organizerBusinessId: 1 })
    expect(w.text()).toContain('Locul pe Google')
    expect(w.text()).toContain('Ana')
    expect(business).not.toHaveBeenCalled()
  })

  it('falls back to the organizer when the venue is not on Google', async () => {
    place.mockReset().mockRejectedValue(new Error('404'))
    business.mockReset().mockResolvedValue(info('Firma'))
    const w = await render({ placeId: 2, organizerBusinessId: 1 })
    expect(business).toHaveBeenCalledWith(1, 'ro')
    expect(w.text()).toContain('Organizatorul pe Google')
    expect(w.text()).toContain('Firma')
  })

  it('uses the organizer directly when the event has no venue, and shows nothing when neither has reviews', async () => {
    place.mockReset()
    business.mockReset().mockResolvedValue(info('Firma'))
    expect((await render({ placeId: null, organizerBusinessId: 1 })).text()).toContain('Organizatorul pe Google')
    expect(place).not.toHaveBeenCalled()

    business.mockReset().mockRejectedValue(new Error('404'))
    expect((await render({ placeId: null, organizerBusinessId: 1 })).find('[data-test=event-google]').exists()).toBe(false)
  })
})
