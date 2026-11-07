import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import ChatThread from './ChatThread.vue'
import type { ChatMessageDto } from '@/shared/types/volunteer'

const msg = (id: number, authorId: number, mine: boolean, min: number, over: Partial<ChatMessageDto> = {}): ChatMessageDto => ({
  id, actionId: 1, authorId, authorName: authorId === 204 ? 'Maria Ionescu' : 'Andrei Popa', mine, text: `Mesaj ${id}`,
  createdAt: new Date(Date.UTC(2026, 10, 7, 7, min)).toISOString(), ...over,
})
const opts = { global: { plugins: [i18n] } }

describe('ChatThread', () => {
  it('shows the author once per run of messages, never for mine', () => {
    const w = mount(ChatThread, { props: { messages: [msg(1, 204, false, 0), msg(2, 204, false, 1), msg(3, 203, true, 2), msg(4, 204, false, 30)] }, ...opts })
    expect(w.findAll('[data-test="chat-author"]').map((a) => a.text())).toEqual(['Maria Ionescu', 'Maria Ionescu'])
    expect(w.text()).toContain('Mesaj 3')
  })

  it('photos open full screen and close again', async () => {
    const w = mount(ChatThread, { props: { messages: [msg(1, 204, false, 0, { text: undefined, imageUrl: '/img/actiune-plantare-copaci.jpg' })] }, ...opts, attachTo: document.body })
    expect(w.find('[data-test="chat-photo"] img').attributes('src')).toBe('/img/actiune-plantare-copaci.jpg')
    await w.find('[data-test="chat-photo"]').trigger('click')
    expect(w.find('[role="dialog"] img').exists()).toBe(true)
    await w.find('[role="dialog"]').trigger('click')
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    w.unmount()
  })
})
