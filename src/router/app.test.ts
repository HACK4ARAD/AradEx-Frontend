import { describe, expect, it, vi } from 'vitest'
import { selectApp, uiOf } from './app'

function memStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    getItem: vi.fn((k: string) => (k in data ? data[k] : null)),
    setItem: vi.fn((k: string, v: string) => { data[k] = v }),
  }
}

describe('selectApp', () => {
  it('native wins over ?app= and the saved value', () => {
    const storage = memStorage({ 'ax.app': 'web' })
    expect(selectApp({ native: true, search: '?app=web', storage })).toBe('mobile')
  })

  it('?app= wins and is saved', () => {
    const storage = memStorage({ 'ax.app': 'web' })
    expect(selectApp({ native: false, search: '?app=mobile', storage })).toBe('mobile')
    expect(storage.setItem).toHaveBeenCalledWith('ax.app', 'mobile')
  })

  it('uses the saved value', () => {
    expect(selectApp({ native: false, search: '', storage: memStorage({ 'ax.app': 'mobile' }) })).toBe('mobile')
  })

  it('defaults to web', () => {
    expect(selectApp({ native: false, search: '', storage: memStorage() })).toBe('web')
  })

  it('ignores an invalid ?app= value', () => {
    const storage = memStorage()
    expect(selectApp({ native: false, search: '?app=x', storage })).toBe('web')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('works when storage throws', () => {
    const storage = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    }
    expect(selectApp({ native: false, search: '', storage })).toBe('web')
    expect(selectApp({ native: false, search: '?app=mobile', storage })).toBe('mobile')
  })
})

describe('uiOf', () => {
  it('maps the app to the auth ui code', () => {
    expect(uiOf('mobile')).toBe('m')
    expect(uiOf('web')).toBe('w')
  })
})
