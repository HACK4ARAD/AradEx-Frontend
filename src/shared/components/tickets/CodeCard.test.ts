import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import CodeCard from './CodeCard.vue'

describe('CodeCard', () => {
  it('shows the QR with exactly the code, the lines and „Cod demonstrativ”', async () => {
    const w = mount(CodeCard, { props: { code: 'AX-T29-RZLBUD', lines: '2 × Adult · 1 × Copil' }, global: { plugins: [i18n] } })
    await flushPromises()
    expect(w.find('svg').exists()).toBe(true)
    expect(w.find('[role="img"]').attributes('aria-label')).toBe('AX-T29-RZLBUD')
    expect(w.text()).toContain('AX-T29-RZLBUD')
    expect(w.text()).toContain('2 × Adult · 1 × Copil')
    expect(w.text()).toContain('Cod demonstrativ')
  })
})
