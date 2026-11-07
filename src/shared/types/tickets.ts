// Bilete · T07. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.

export interface TicketDto {
  code: string; eventId: number; eventTitle: string; startAt: string; locationName: string
  qtyAdult: number; qtyChild: number; total: number; status: string; createdAt: string
}
