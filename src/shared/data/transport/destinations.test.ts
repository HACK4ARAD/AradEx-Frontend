import { describe, expect, it } from 'vitest'
import { parsePt, parseTo, ptKey } from './destinations'

describe('picked points as destinations', () => {
  it('round-trips a point through ?to=pt:lat,lng', () => {
    const key = ptKey({ lat: 46.183014, lng: 21.295021 })
    expect(key).toBe('pt:46.18301,21.29502')
    expect(parseTo(key)).toBe(key)
    expect(parsePt(key)).toEqual({ lat: 46.18301, lng: 21.29502 })
  })

  it('rejects malformed or out-of-range points', () => {
    expect(parseTo('pt:abc,21')).toBeNull()
    expect(parseTo('pt:46.1;21.3')).toBeNull()
    expect(parsePt('pt:95.1,21.3')).toBeNull()
    expect(parseTo('place:3')).toBe('place:3')
  })
})
