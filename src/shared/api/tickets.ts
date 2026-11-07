import { client } from './client'
import type { TicketDto, TicketRequest } from '@/shared/types/tickets'

/** Același API ca `client` (VITE_API_URL), pentru link-uri deschise direct de browser (fișierul .ics). */
const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api/v1').replace(/\/$/, '')

/** TicketsApi din BE (docs/API.md §Evenimente & bilete, T07). */
export const ticketsApi = {
  buy: (eventId: number, req: TicketRequest) => client.post<TicketDto>(`/events/${eventId}/tickets`, req),
  mine: (upcoming?: boolean) => client.get<TicketDto[]>('/me/tickets', { query: { upcoming } }),
  get: (code: string) => client.get<TicketDto>(`/tickets/${encodeURIComponent(code)}`),
  use: (code: string) => client.post<TicketDto>(`/tickets/${encodeURIComponent(code)}/use`),
  /** Link direct spre fișierul .ics (public) — se deschide în browser / calendarul telefonului. */
  icsUrl: (eventId: number) => `${BASE}/events/${eventId}/ics`,
}
