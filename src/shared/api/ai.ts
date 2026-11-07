// T12/T13 · docs/API.md §AI (T12, T13): POST /ai/chat, POST /ai/itinerary, /me/itineraries.
import { client } from './client'
import type { ChatMessage, ChatResponse } from '@/shared/types/chat'

export const aiApi = {
  /** T12: răspunsul asistentului din evenimentele din următoarele 14 zile; `offline` = răspuns pregătit (Claude n-a răspuns). */
  chat: (body: { messages: ChatMessage[]; locale: 'ro' | 'en' }) => client.post<ChatResponse>('/ai/chat', body),
}
