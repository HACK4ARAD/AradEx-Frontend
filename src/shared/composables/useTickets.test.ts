import { describe, expect, it } from 'vitest'
import { isPast, orderTotal, ticketLines } from './useTickets'
import type { TicketDto } from '@/shared/types/tickets'

const tk = (over: Partial<TicketDto> = {}): TicketDto => ({
  code: 'AX-T22-K8D2QF', eventId: 22, eventTitle: 'Teatru de păpuși', startAt: '2026-11-07T09:00:00Z', endAt: '2026-11-07T09:50:00Z',
  locationName: 'Teatrul Clasic', lat: 46.17, lng: 21.31, ticketType: 'IN_APP', qtyAdult: 2, qtyChild: 1, priceAdult: 40, priceChild: 25,
  total: 105, status: 'CONFIRMED', email: 'ana@exemplu.ro', createdAt: '2026-11-07T08:00:00Z', ...over,
})
const labels = { adult: 'Adult', child: 'Copil', registration: 'Înscriere' }

describe('tickets', () => {
  it('order total = adults × adult price + children × child price', () => {
    expect(orderTotal(2, 1, 40, 25)).toBe(105)
    expect(orderTotal(1, 0, 55)).toBe(55)
    expect(orderTotal(0, 0, 40, 25)).toBe(0)
    expect(orderTotal(3, 0, 13.5)).toBe(40.5)
  })
  it('lines on the ticket', () => {
    expect(ticketLines(tk(), labels)).toEqual([{ qty: 2, label: 'Adult', amount: 80 }, { qty: 1, label: 'Copil', amount: 25 }])
    expect(ticketLines(tk({ qtyChild: 0 }), labels)).toHaveLength(1)
    expect(ticketLines(tk({ ticketType: 'FREE', qtyAdult: 1, qtyChild: 0, total: 0 }), labels)).toEqual([{ qty: 1, label: 'Înscriere', amount: 0 }])
  })
  it('past = after the end (or the start when there is no end)', () => {
    const at = (iso: string) => new Date(iso).getTime()
    expect(isPast(tk(), at('2026-11-07T09:30:00Z'))).toBe(false)
    expect(isPast(tk(), at('2026-11-07T10:00:00Z'))).toBe(true)
    expect(isPast(tk({ endAt: undefined }), at('2026-11-07T09:30:00Z'))).toBe(true)
  })
})
