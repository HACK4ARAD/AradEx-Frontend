import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import type { GoogleInfoDto } from '@/shared/types/google'
import GoogleReviews from './GoogleReviews.vue'
import { formatCount, formatRating, ratingsText, starsOf } from '@/shared/composables/useGoogle'

const place = vi.fn()
const business = vi.fn()
vi.mock('@/shared/api/google', () => ({
  googleApi: { place: (...a: unknown[]) => place(...a), business: (...a: unknown[]) => business(...a) },
}))

const info: GoogleInfoDto = {
  rating: 4.6, userRatingCount: 1240, mapsUrl: 'https://maps.google.com/?cid=1', attribution: 'Powered by Google',
  reviews: [
    { author: 'Ana P.', authorUrl: 'https://g.co/a', rating: 5, text: 'Superb', relativeTime: 'acum o lună' },
    { author: 'Mihai R.', rating: 3, text: 'Frumos, dar aglomerat' },
  ],
}

async function render(kind: 'place' | 'business', locale = 'ro') {
  i18n.global.locale.value = locale as 'ro' | 'en'
  const w = mount(GoogleReviews, { props: { kind, id: 2 }, global: { plugins: [i18n] } })
  await flushPromises()
  return w
}

describe('GoogleReviews', () => {
  it('shows the rating, the count, the reviews with their authors and the Google attribution', async () => {
    place.mockReset().mockResolvedValue(info)
    const w = await render('place')
    expect(place).toHaveBeenCalledWith(2, 'ro')
    expect(w.text()).toContain('Pe Google')
    expect(w.text()).toContain('4,6')
    expect(w.text()).toContain('1.240 de păreri')
    expect(w.text()).toContain('Ana P.')
    expect(w.text()).toContain('acum o lună')
    expect(w.find('a[href="https://g.co/a"]').exists()).toBe(true)
    expect(w.find('[data-test=google-attribution]').text()).toBe('Powered by Google')
    expect(w.find('a[href="https://maps.google.com/?cid=1"]').exists()).toBe(true)
  })

  it('asks the business endpoint in the app language', async () => {
    business.mockReset().mockResolvedValue(info)
    const w = await render('business', 'en')
    expect(business).toHaveBeenCalledWith(2, 'en')
    expect(w.text()).toContain('On Google')
    expect(w.text()).toContain('1,240 ratings')
    i18n.global.locale.value = 'ro'
  })

  it('is hidden when the place is not on Google or the request fails', async () => {
    place.mockReset().mockRejectedValue(new Error('404'))
    const w = await render('place')
    expect(w.find('[data-test=google-reviews]').exists()).toBe(false)
    expect(w.html()).not.toContain('section')
  })
})

describe('useGoogle helpers', () => {
  it('formats rating and count per language and rounds the stars', () => {
    i18n.global.locale.value = 'ro'
    expect(formatRating(4.6)).toBe('4,6')
    expect(formatCount(1240)).toBe('1.240')
    expect(starsOf(4.6)).toEqual([true, true, true, true, true])
    expect(starsOf(3.2)).toEqual([true, true, true, false, false])
    expect(starsOf(undefined)).toEqual([false, false, false, false, false])
  })

  it('uses the Romanian „de” from 20 up (and at 100, 1.000), English plurals otherwise', () => {
    const t = i18n.global.t as (k: string, n?: Record<string, unknown>) => string
    i18n.global.locale.value = 'ro'
    expect([0, 1, 2, 19, 20, 101, 119, 120, 200, 1240].map((n) => ratingsText(t, n))).toEqual([
      'nicio părere', 'o părere', '2 păreri', '19 păreri', '20 de păreri', '101 păreri', '119 păreri', '120 de păreri', '200 de păreri', '1.240 de păreri',
    ])
    i18n.global.locale.value = 'en'
    expect([0, 1, 631].map((n) => ratingsText(t, n))).toEqual(['no ratings', 'one rating', '631 ratings'])
    i18n.global.locale.value = 'ro'
  })
})
