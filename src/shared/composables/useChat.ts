import { ref, shallowReactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { aiApi } from '@/shared/api/ai'
import { eventsApi } from '@/shared/api/events'
import { ApiError } from '@/shared/api/client'
import type { ChatMessage } from '@/shared/types/chat'
import type { EventDto } from '@/shared/types/events'

/**
 * T12 · S8 chat: conversația cu asistentul (POST /ai/chat). Salutul cu chips de început e local (nu se trimite).
 * Serverul primește tot istoricul (fără salut și fără erori) și întoarce textul, chips de răspuns rapid și id-urile
 * evenimentelor recomandate, pe care le aducem aici ca să le arătăm ca rânduri. Conversația rămâne cât e deschisă aplicația
 * (sessionStorage); „Chat nou” o golește.
 */
export interface ChatItem {
  from: 'me' | 'bot'
  text: string
  chips?: string[]
  eventIds?: number[]
  offline?: boolean
  /** salutul cu întrebările de început (chips cu săgeată, ca în design) */
  starter?: boolean
  /** cererea a eșuat: `retry` = întrebarea de retrimis */
  error?: boolean
  retry?: string
}

const KEY = 'ax.chat'
const events = shallowReactive(new Map<number, EventDto>())

function load(): ChatItem[] | null {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as ChatItem[] | null } catch { return null }
}
function store(items: ChatItem[]) {
  try { sessionStorage.setItem(KEY, JSON.stringify(items)) } catch { /* fără sessionStorage chatul ține cât ecranul */ }
}

export function useChat() {
  const { tm, locale } = useI18n()
  const greeting = (): ChatItem => ({ from: 'bot', text: 'chat.greeting', chips: tm('chat.starters') as string[], starter: true })
  const items = ref<ChatItem[]>(load() ?? [greeting()])
  const typing = ref(false)

  function history(): ChatMessage[] {
    return items.value.filter((i) => !i.starter && !i.error).map((i) => ({ role: i.from === 'me' ? 'user' : 'assistant', content: i.text }))
  }

  async function loadEvents(ids: number[]) {
    await Promise.allSettled(ids.filter((id) => !events.has(id)).map(async (id) => { events.set(id, await eventsApi.get(id)) }))
  }

  async function ask(question: string) {
    typing.value = true
    try {
      const r = await aiApi.chat({ messages: history(), locale: locale.value === 'en' ? 'en' : 'ro' })
      await loadEvents(r.suggestedEventIds)
      items.value.push({ from: 'bot', text: r.reply, chips: r.quickReplies, eventIds: r.suggestedEventIds.filter((id) => events.has(id)), offline: r.offline })
    } catch (e) {
      const key = e instanceof ApiError && e.status === 429 ? 'chat.errors.tooMany' : e instanceof ApiError && e.status === 0 ? 'chat.errors.network' : 'chat.errors.generic'
      items.value.push({ from: 'bot', text: key, error: true, retry: question })
    } finally {
      typing.value = false
      store(items.value)
    }
  }

  /** Trimite o întrebare (din câmp sau dintr-un chip). Ignoră textul gol și o a doua trimitere cât așteptăm răspunsul. */
  async function send(text: string) {
    const q = text.trim()
    if (!q || typing.value) return
    items.value.push({ from: 'me', text: q })
    store(items.value)
    await ask(q)
  }

  /** Reîncearcă după o eroare: scoate bula de eroare și retrimite aceeași conversație. */
  async function retry(item: ChatItem) {
    if (typing.value || !item.retry) return
    items.value = items.value.filter((i) => i !== item)
    await ask(item.retry)
  }

  function reset() {
    items.value = [greeting()]
    store(items.value)
  }

  return { items, typing, send, retry, reset, event: (id: number) => events.get(id) }
}
