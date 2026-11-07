import { afterEach, describe, expect, it } from 'vitest'
import { STRIPE_JS, loadStripeJs } from './useStripe'

afterEach(() => {
  document.head.querySelectorAll(`script[src="${STRIPE_JS}"]`).forEach((s) => s.remove())
  delete (window as unknown as { Stripe?: unknown }).Stripe
})

describe('loadStripeJs', () => {
  it('adds the official script once and resolves with window.Stripe', async () => {
    const a = loadStripeJs()
    const b = loadStripeJs()
    const scripts = document.head.querySelectorAll(`script[src="${STRIPE_JS}"]`)
    expect(scripts).toHaveLength(1)
    const factory = () => ({})
    ;(window as unknown as { Stripe: unknown }).Stripe = factory
    scripts[0]!.dispatchEvent(new Event('load'))
    await expect(a).resolves.toBe(factory)
    await expect(b).resolves.toBe(factory)
  })
})
