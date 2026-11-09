import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/shared/i18n'
import { useUiStore } from '@/shared/stores/ui'
import RecoveryCodeNotice from './RecoveryCodeNotice.vue'

function render() {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'ro'
  return mount(RecoveryCodeNotice, { props: { code: 'K7QM-4XPT-9DWA', ui: 'w' }, global: { plugins: [i18n] } })
}

describe('RecoveryCodeNotice', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'clipboard', original)
    else Reflect.deleteProperty(navigator, 'clipboard')
  })

  it('shows the code and explains it is shown only once', () => {
    const w = render()
    expect(w.find('[data-test=secret-code]').text()).toBe('K7QM-4XPT-9DWA')
    expect(w.text()).toContain('Nu-l arătăm din nou')
  })

  it('"Continuă" stays disabled until "L-am salvat" is ticked', async () => {
    const w = render()
    const btn = w.find('[data-test=recovery-continue]')
    expect(btn.attributes('disabled')).toBeDefined()
    await btn.trigger('click')
    expect(w.emitted('continue')).toBeUndefined()

    await w.find('[data-test=recovery-saved] input').setValue(true)
    expect(btn.attributes('disabled')).toBeUndefined()
    await btn.trigger('click')
    expect(w.emitted('continue')).toHaveLength(1)
  })

  it('"Copiază" puts the code on the clipboard and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const w = render()
    await w.find('[data-test=copy-code]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('K7QM-4XPT-9DWA')
    expect(useUiStore().toasts.map((t) => t.message)).toContain('Codul e copiat.')
  })

  it('without the clipboard API it falls back to the old copy command; if that fails too it says so', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    const exec = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, 'execCommand', { value: exec, configurable: true })
    const w = render()
    await w.find('[data-test=copy-code]').trigger('click')
    await flushPromises()
    expect(exec).toHaveBeenCalledWith('copy')
    expect(useUiStore().toasts.map((t) => t.message)).toContain('Codul e copiat.')

    exec.mockReturnValue(false)
    await w.find('[data-test=copy-code]').trigger('click')
    await flushPromises()
    expect(useUiStore().toasts.map((t) => t.message)).toContain('Nu am putut copia. Selectează codul și copiază-l de mână.')
    Reflect.deleteProperty(document, 'execCommand')
  })
})
