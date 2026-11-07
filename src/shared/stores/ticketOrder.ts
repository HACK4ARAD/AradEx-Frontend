import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EventDto } from '@/shared/types/events'

/**
 * T07 · comanda în curs (S4 → S5): evenimentul ales și numărul de bilete. Se ține și în sessionStorage, ca un refresh pe S5
 * să nu piardă comanda. După plată se golește.
 */
export interface TicketOrder { event: EventDto; adult: number; child: number }
const KEY = 'ax.order'

export const useTicketOrderStore = defineStore('ticketOrder', () => {
  const order = ref<TicketOrder | null>(read())

  function read(): TicketOrder | null {
    try { return JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as TicketOrder | null } catch { return null }
  }
  function set(o: TicketOrder) {
    order.value = o
    try { sessionStorage.setItem(KEY, JSON.stringify(o)) } catch { /* ignore */ }
  }
  function clear() {
    order.value = null
    try { sessionStorage.removeItem(KEY) } catch { /* ignore */ }
  }
  return { order, set, clear }
})
