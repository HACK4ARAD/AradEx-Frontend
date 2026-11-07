import { describe, expect, it } from 'vitest'
import { fitInsets } from './types'

describe('fitInsets', () => {
  it('keeps the insets when they leave enough of the map visible', () => {
    expect(fitInsets({ top: 170, bottom: 480 }, 900)).toEqual({ top: 170, bottom: 480 })
  })

  it('shrinks them proportionally on short screens so the route still has room', () => {
    const r = fitInsets({ top: 170, bottom: 480 }, 640)
    expect(r.top + r.bottom).toBeLessThanOrEqual(640 * 0.8)
    expect(r.bottom).toBeGreaterThan(r.top)
  })

  it('leaves them alone before the map has a size', () => {
    expect(fitInsets({ top: 240, bottom: 430 }, 0)).toEqual({ top: 240, bottom: 430 })
  })
})
