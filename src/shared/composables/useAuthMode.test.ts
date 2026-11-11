import { beforeEach, describe, expect, it, vi } from 'vitest'

const config = vi.fn()
/** răspunsul cererii; o funcție simplă (nu un vi.fn) pentru promisiunea respinsă, ca vitest să n-o raporteze ca eroare */
let failWith: Error | null = null
vi.mock('@/shared/api/auth', () => ({ authApi: { config: () => (failWith ? (config(), Promise.reject(failWith)) : config()) } }))

/** modulul ține starea la nivel de modul (o cerere pe pornire): îl reîncărcăm pentru fiecare caz, cu ApiError-ul lui */
async function fresh() {
  vi.resetModules()
  const m = await import('./useAuthMode')
  const { ApiError } = await import('@/shared/api/client')
  return { ...m, ApiError }
}

describe('useAuthMode', () => {
  beforeEach(() => { config.mockReset(); failWith = null })

  it('demoOnly true from GET /auth/config', async () => {
    config.mockResolvedValue({ demoOnly: true })
    const m = await fresh()
    expect(await m.loadAuthMode()).toBe(true)
    const { demoOnly, loaded } = m.useAuthMode()
    expect(demoOnly.value).toBe(true)
    expect(loaded.value).toBe(true)
  })

  it('demoOnly false', async () => {
    config.mockResolvedValue({ demoOnly: false })
    const m = await fresh()
    expect(await m.loadAuthMode()).toBe(false)
    expect(m.useAuthMode().demoOnly.value).toBe(false)
  })

  it('a failed request means demoOnly false (the server still enforces it)', async () => {
    const m = await fresh()
    failWith = new TypeError('Failed to fetch')
    expect(await m.loadAuthMode()).toBe(false)
    expect(m.useAuthMode().loaded.value).toBe(true)
  })

  it('asks the server only once per app load', async () => {
    config.mockResolvedValue({ demoOnly: true })
    const m = await fresh()
    m.useAuthMode()
    m.useAuthMode()
    await m.loadAuthMode()
    expect(config).toHaveBeenCalledTimes(1)
  })

  it('recognises the 403 "Not live yet" error by status and detail', async () => {
    const m = await fresh()
    const detail = 'Not live yet: only the demo accounts can sign in'
    expect(m.isNotLiveError(new m.ApiError(403, detail, { status: 403, detail }))).toBe(true)
    expect(m.isNotLiveError(new m.ApiError(403, 'Account disabled', { status: 403, detail: 'Account disabled' }))).toBe(false)
    expect(m.isNotLiveError(new m.ApiError(401, detail, { status: 401, detail }))).toBe(false)
    expect(m.isNotLiveError(new Error(detail))).toBe(false)
  })
})
