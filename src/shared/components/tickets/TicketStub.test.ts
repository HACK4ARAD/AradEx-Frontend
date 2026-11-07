import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import TicketStub from './TicketStub.vue'
import type { TicketDto } from '@/shared/types/tickets'

const ticket: TicketDto = {
  code: 'AX-T29-RZLBUD', eventId: 29, eventTitle: 'Prânz de duminică pe Faleză', startAt: '2026-11-08T11:00:00Z', locationName: 'Bistro La Mureș',
  lat: 46.17, lng: 21.32, ticketType: 'IN_APP', qtyAdult: 2, qtyChild: 0, priceAdult: 55, total: 110, status: 'CONFIRMED', email: 'local@demo.ro', createdAt: '2026-11-07T10:00:00Z',
}

describe('TicketStub', () => {
  it('shows the lines, the QR with exactly the code and the code in text', async () => {
    const w = mount(TicketStub, { props: { ticket }, global: { plugins: [i18n] } })
    await flushPromises()
    expect(w.text()).toContain('2 × Adult')
    expect(w.text()).toContain('110 lei')
    expect(w.text()).toContain('AX-T29-RZLBUD')
    expect(w.find('svg').exists()).toBe(true)
    expect(w.find('[role="img"]').attributes('aria-label')).toBe('AX-T29-RZLBUD')
  })
})
