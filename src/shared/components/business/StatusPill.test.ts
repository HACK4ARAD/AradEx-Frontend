import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import StatusPill from './StatusPill.vue'

describe('StatusPill', () => {
  it('shows a draft in yellow and a published item in green, in Romanian', () => {
    i18n.global.locale.value = 'ro'
    const draft = mount(StatusPill, { props: { status: 'DRAFT' }, global: { plugins: [i18n] } })
    expect(draft.text()).toBe('Ciornă')
    expect(draft.classes()).toContain('bg-warn-soft')
    const pub = mount(StatusPill, { props: { status: 'PUBLISHED' }, global: { plugins: [i18n] } })
    expect(pub.text()).toBe('Publicat')
    expect(pub.classes()).toContain('bg-ok-soft')
  })
})
