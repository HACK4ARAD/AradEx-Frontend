import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { MAX_QTY, useTicketPick } from './useTicketOrder'
import { useTicketOrderStore } from '@/shared/stores/ticketOrder'
import type { EventDto } from '@/shared/types/events'

const ev = (over: Partial<EventDto> = {}): EventDto => ({
  id: 22, title: 'Teatru de păpuși', category: 'FAMILY', startAt: '2099-11-07T09:00:00Z', endAt: '2099-11-07T09:50:00Z',
  locationName: 'Teatrul Clasic', lat: 46.17, lng: 21.31, ticketType: 'IN_APP', isHot: false, isDemo: true, participantsCount: 0,
  organizerName: 'Teatrul Clasic', organizerType: 'EXTERNAL', ratingCount: 0, description: '', savesCount: 0, status: 'PUBLISHED',
  priceAdult: 40, priceChild: 25, capacity: 50, spotsLeft: 3, ...over,
})

describe('useTicketPick', () => {
  beforeEach(() => { sessionStorage.clear(); setActivePinia(createPinia()) })

  it('starts with one adult, totals adults and children, clamps the stepper', () => {
    const p = useTicketPick(shallowRef(ev()))
    expect(p.n.value).toBe(1)
    expect(p.total.value).toBe(40)
    p.step('child', 1)
    expect(p.total.value).toBe(65)
    p.step('adult', -5)
    expect(p.qty.adult).toBe(0)
    for (let i = 0; i < 20; i++) p.step('child', 1)
    expect(p.qty.child).toBe(MAX_QTY)
  })

  it('offers the child ticket only when the event has a child price', () => {
    expect(useTicketPick(shallowRef(ev())).kinds.value.map((k) => k.key)).toEqual(['adult', 'child'])
    expect(useTicketPick(shallowRef(ev({ priceChild: undefined }))).kinds.value.map((k) => k.key)).toEqual(['adult'])
  })

  it('blocks more tickets than spots left, sold out, ended or zero', () => {
    const p = useTicketPick(shallowRef(ev()))
    p.step('adult', 3)
    expect(p.tooMany.value).toBe(true)
    expect(p.blocked.value).toBe(true)
    expect(p.commit()).toBe(false)
    expect(useTicketPick(shallowRef(ev({ spotsLeft: 0 }))).blocked.value).toBe(true)
    expect(useTicketPick(shallowRef(ev({ startAt: '2020-01-01T09:00:00Z', endAt: '2020-01-01T10:00:00Z' }))).blocked.value).toBe(true)
  })

  it('commit puts the order in the store and a later pick for the same event restores it', async () => {
    const e = shallowRef<EventDto | null>(ev())
    const p = useTicketPick(e)
    p.step('child', 1)
    expect(p.commit()).toBe(true)
    expect(useTicketOrderStore().order).toMatchObject({ adult: 1, child: 1, event: { id: 22 } })
    const again = useTicketPick(shallowRef<EventDto | null>(null))
    expect(again.qty.child).toBe(0)
    const later = shallowRef<EventDto | null>(null)
    const restored = useTicketPick(later)
    later.value = ev()
    await nextTick()
    expect(restored.qty).toEqual({ adult: 1, child: 1 })
  })
})
