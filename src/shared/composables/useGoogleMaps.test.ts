import { describe, expect, it, vi } from 'vitest'
import { googleUnavailable, loadGoogleMaps, onGoogleUnavailable } from './useGoogleMaps'

describe('Google Maps key refused (gm_authFailure)', () => {
  it('marks Google as unavailable, tells the open maps and stops loading it', async () => {
    expect(googleUnavailable()).toBe(false)
    const listener = vi.fn()
    const off = onGoogleUnavailable(listener)

    ;(window as unknown as { gm_authFailure: () => void }).gm_authFailure()

    expect(googleUnavailable()).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
    await expect(loadGoogleMaps('key')).rejects.toThrow()
    off()
  })

  it('a map opened after the refusal is told right away', () => {
    const listener = vi.fn()
    onGoogleUnavailable(listener)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
