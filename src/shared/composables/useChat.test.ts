import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/client'

const chat = vi.fn()
const getEvent = vi.fn()
vi.mock('@/shared/api/ai', () => ({ aiApi: { chat: (b: unknown) => chat(b) } }))
vi.mock('@/shared/api/events', () => ({ eventsApi: { get: (id: number) => getEvent(id) } }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k, tm: (k: string) => (k === 'chat.starters' ? ['a', 'b'] : []), locale: { value: 'ro' } }) }))

import { useChat } from './useChat'

const ev = (id: number) => ({ id, title: `E${id}` })

beforeEach(() => { chat.mockReset(); getEvent.mockReset(); sessionStorage.clear() })

describe('useChat', () => {
  it('starts with the greeting and the starter chips', () => {
    const c = useChat()
    expect(c.items.value).toHaveLength(1)
    expect(c.items.value[0]).toMatchObject({ from: 'bot', text: 'chat.greeting', chips: ['a', 'b'], starter: true })
  })

  it('sends the conversation without the greeting, then shows the reply, chips and events', async () => {
    chat.mockResolvedValue({ reply: 'Sâmbătă e teatrul.', suggestedEventIds: [4, 7], quickReplies: ['Altceva'], offline: false })
    getEvent.mockImplementation(async (id: number) => ev(id))
    const c = useChat()
    await c.send('Ce fac cu copiii?')
    expect(chat).toHaveBeenCalledWith({ messages: [{ role: 'user', content: 'Ce fac cu copiii?' }], locale: 'ro' })
    const bot = c.items.value[2]
    expect(bot).toMatchObject({ from: 'bot', text: 'Sâmbătă e teatrul.', chips: ['Altceva'], eventIds: [4, 7] })
    expect(c.event(4)?.title).toBe('E4')
    expect(c.typing.value).toBe(false)

    chat.mockResolvedValue({ reply: 'ok', suggestedEventIds: [], quickReplies: [], offline: true })
    await c.send('Sâmbătă')
    expect(chat.mock.calls[1][0].messages).toEqual([
      { role: 'user', content: 'Ce fac cu copiii?' },
      { role: 'assistant', content: 'Sâmbătă e teatrul.' },
      { role: 'user', content: 'Sâmbătă' },
    ])
    expect(c.items.value[4].offline).toBe(true)
  })

  it('ignores empty text and a second send while waiting', async () => {
    let done!: (v: unknown) => void
    chat.mockImplementation(() => new Promise((r) => { done = r }))
    const c = useChat()
    await c.send('   ')
    const first = c.send('Ce e azi?')
    await c.send('Și mâine?')
    expect(chat).toHaveBeenCalledTimes(1)
    done({ reply: 'x', suggestedEventIds: [], quickReplies: [], offline: false })
    await first
  })

  it('a failed request shows an error bubble and keeps the question so it can be retried', async () => {
    chat.mockRejectedValue(new ApiError(429, 'Too many'))
    const c = useChat()
    await c.send('Ce e azi?')
    const last = c.items.value[c.items.value.length - 1]
    expect(last).toMatchObject({ from: 'bot', error: true, text: 'chat.errors.tooMany', retry: 'Ce e azi?' })
    chat.mockResolvedValue({ reply: 'Azi e concert.', suggestedEventIds: [], quickReplies: [], offline: false })
    await c.retry(last)
    expect(c.items.value.filter((i) => i.error)).toHaveLength(0)
    expect(c.items.value[c.items.value.length - 1].text).toBe('Azi e concert.')
    expect(chat.mock.calls[1][0].messages).toEqual([{ role: 'user', content: 'Ce e azi?' }])
  })

  it('keeps the chat for the session and "new chat" starts over', async () => {
    chat.mockResolvedValue({ reply: 'r', suggestedEventIds: [], quickReplies: [], offline: false })
    const c = useChat()
    await c.send('Salut')
    expect(useChat().items.value).toHaveLength(3)
    c.reset()
    expect(c.items.value).toHaveLength(1)
    expect(useChat().items.value).toHaveLength(1)
  })
})
