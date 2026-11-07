// T12/T13 · docs/API.md §AI (T12, T13): POST /ai/chat, POST /ai/itinerary (salvarea și lista: api/itineraries.ts).
import { client } from './client'
import type { ChatMessage, ChatResponse } from '@/shared/types/chat'
import type { ItineraryDto, ItineraryRequest } from '@/shared/types/plan'

export const aiApi = {
  /** T12: răspunsul asistentului din evenimentele din următoarele 14 zile; `offline` = răspuns pregătit (Claude n-a răspuns). */
  chat: (body: { messages: ChatMessage[]; locale: 'ro' | 'en' }) => client.post<ChatResponse>('/ai/chat', body),
  /** T13: programul generat (nesalvat, fără `id`); se salvează cu itinerariesApi.save. */
  itinerary: (body: ItineraryRequest) => client.post<ItineraryDto>('/ai/itinerary', body),
}
