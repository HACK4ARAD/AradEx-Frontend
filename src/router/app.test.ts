import { describe, expect, it, vi } from 'vitest'
import { mobilePreviewHref, selectApp, uiOf } from './app'

function memStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    getItem: vi.fn((k: string) => (k in data ? data[k] : null)),
    setItem: vi.fn((k: string, v: string) => { data[k] = v }),
    removeItem: vi.fn((k: string) => { delete data[k] }),
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

  it('?preview=mobile opens the mobile app once, without saving it', () => {
    const storage = memStorage({ 'ax.app': 'web' })
    expect(selectApp({ native: false, search: '?preview=mobile', storage })).toBe('mobile')
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(selectApp({ native: false, search: '', storage })).toBe('web')
  })

  it('an old /m link opens the mobile app for this tab, without saving it', () => {
    const storage = memStorage()
    const session = memStorage()
    expect(selectApp({ native: false, search: '', path: '/m/places/1', storage, session })).toBe('mobile')
    expect(selectApp({ native: false, search: '', path: '/m', storage, session })).toBe('mobile')
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(selectApp({ native: false, search: '', path: '/media', storage: memStorage(), session: memStorage() })).toBe('web')
  })

  it('the tab keeps the mobile app after a reload (preview or old /m link)', () => {
    const session = memStorage()
    selectApp({ native: false, search: '?preview=mobile', path: '/places/1', storage: memStorage(), session })
    expect(selectApp({ native: false, search: '', path: '/places/1', storage: memStorage(), session })).toBe('mobile')
  })

  it('?app= wins over the tab choice and clears it', () => {
    const session = memStorage({ 'ax.app.tab': 'mobile' })
    expect(selectApp({ native: false, search: '?app=web', path: '/', storage: memStorage(), session })).toBe('web')
    expect(selectApp({ native: false, search: '', path: '/', storage: memStorage(), session })).toBe('web')
  })

  it('works when storage throws', () => {
    const storage = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    }
    expect(selectApp({ native: false, search: '', storage })).toBe('web')
    expect(selectApp({ native: false, search: '?app=mobile', storage })).toBe('mobile')
    expect(selectApp({ native: false, search: '?preview=mobile', storage, session: storage })).toBe('mobile')
  })
})

describe('uiOf', () => {
  it('maps the app to the auth ui code', () => {
    expect(uiOf('mobile')).toBe('m')
    expect(uiOf('web')).toBe('w')
  })
})

describe('mobilePreviewHref', () => {
  it('adds the preview flag, keeping an existing query', () => {
    expect(mobilePreviewHref('/places/3')).toBe('/places/3?preview=mobile')
    expect(mobilePreviewHref('/map?to=place:3')).toBe('/map?to=place:3&preview=mobile')
  })
})
