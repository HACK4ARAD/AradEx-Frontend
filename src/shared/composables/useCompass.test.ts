import { describe, expect, it } from 'vitest'
import { angleDelta, compassHeading } from './useCompass'

describe('compassHeading', () => {
  it('uses the iOS compass heading as is', () => {
    expect(compassHeading({ alpha: 10, webkitCompassHeading: 90 })).toBe(90)
  })

  it('turns an absolute Android alpha into a heading and corrects for screen rotation', () => {
    expect(compassHeading({ alpha: 90, absolute: true })).toBe(270)
    expect(compassHeading({ alpha: 90, absolute: true }, 90)).toBe(0)
  })

  it('ignores readings that are not relative to north', () => {
    expect(compassHeading({ alpha: 90, absolute: false })).toBeNull()
    expect(compassHeading({ alpha: null, absolute: true })).toBeNull()
  })
})

describe('angleDelta', () => {
  it('takes the short way round', () => {
    expect(angleDelta(350, 10)).toBe(20)
    expect(angleDelta(10, 350)).toBe(20)
    expect(angleDelta(90, 270)).toBe(180)
  })
})
