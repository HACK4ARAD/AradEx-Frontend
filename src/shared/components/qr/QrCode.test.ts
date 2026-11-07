import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import QrCode from './QrCode.vue'

describe('QrCode', () => {
  it('renders an SVG for the text code', async () => {
    const w = mount(QrCode, { props: { value: 'AX-T12-K8D2QF' } })
    await flushPromises()
    expect(w.find('svg').exists()).toBe(true)
    expect(w.find('[role="img"]').attributes('aria-label')).toBe('AX-T12-K8D2QF')
  })
})
