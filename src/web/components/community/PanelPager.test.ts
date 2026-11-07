import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import PanelPager from './PanelPager.vue'

const opts = { global: { plugins: [i18n] } }

describe('PanelPager', () => {
  it('is hidden when everything fits on one page', () => {
    const w = mount(PanelPager, { props: { modelValue: 1, total: 12, size: 12 }, ...opts })
    expect(w.find('[data-test="pager"]').exists()).toBe(false)
  })

  it('shows the range, page numbers with gaps, and moves between pages', async () => {
    const w = mount(PanelPager, { props: { modelValue: 5, total: 100, size: 10 }, ...opts })
    expect(w.text()).toContain('41–50 din 100')
    const labels = w.findAll('button').map((b) => b.text()).filter((s) => /^\d+$/.test(s))
    expect(labels).toEqual(['1', '4', '5', '6', '10'])
    expect(w.text()).toContain('…')
    await w.findAll('button').at(-1)!.trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([6])
    await w.findAll('button').find((b) => b.text() === '1')!.trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([1])
  })

  it('disables back on the first page and next on the last', () => {
    const first = mount(PanelPager, { props: { modelValue: 1, total: 13, size: 12 }, ...opts })
    expect(first.findAll('button')[0].attributes('disabled')).toBeDefined()
    expect(first.text()).toContain('1–12 din 13')
    const last = mount(PanelPager, { props: { modelValue: 2, total: 13, size: 12 }, ...opts })
    expect(last.findAll('button').at(-1)!.attributes('disabled')).toBeDefined()
    expect(last.text()).toContain('13–13 din 13')
  })
})
