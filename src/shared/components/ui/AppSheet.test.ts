import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import AppSheet from './AppSheet.vue'

describe('AppSheet', () => {
  it('shows the content when open and closes on Escape', async () => {
    const w = mount(AppSheet, { props: { open: true, title: 'Filtre', 'onUpdate:open': (v: boolean) => w.setProps({ open: v }) }, slots: { default: 'conținut' }, global: { plugins: [i18n] }, attachTo: document.body })
    await w.vm.$nextTick()
    expect(document.body.textContent).toContain('conținut')
    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await w.vm.$nextTick()
    expect(w.props('open')).toBe(false)
    w.unmount()
  })
})
