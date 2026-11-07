// Chat AI · T12. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.

export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export interface ChatResponse { reply: string; suggestedEventIds: number[]; quickReplies: string[]; offline: boolean }
