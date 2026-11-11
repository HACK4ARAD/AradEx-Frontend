import { afterEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/shared/i18n'
import { ApiError, DEMO_READ_ONLY_DETAIL, apiErrorMessage, client, isDemoReadOnlyError } from './client'

function respond(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })))
}
async function failure(p: Promise<unknown>): Promise<ApiError> {
  try { await p } catch (e) { if (e instanceof ApiError) return e }
  throw new Error('expected an ApiError')
}

describe('demo read-only errors (403 "Demo mode: changes are disabled until launch")', () => {
  afterEach(() => { vi.unstubAllGlobals(); i18n.global.locale.value = 'ro' })

  it('become the translated message, never the English detail', async () => {
    i18n.global.locale.value = 'ro'
    respond(403, { status: 403, title: 'Forbidden', detail: DEMO_READ_ONLY_DETAIL })
    const e = await failure(client.post('/community/actions/4/register'))
    expect(e.message).toBe('Mod demo: aplicația nu e încă live, așa că nu poți face modificări.')
    expect(isDemoReadOnlyError(e)).toBe(true)
    expect(e.problem?.detail).toBe(DEMO_READ_ONLY_DETAIL)          // detaliul original rămâne pentru cod

    i18n.global.locale.value = 'en'
    expect(apiErrorMessage(403, { status: 403, detail: DEMO_READ_ONLY_DETAIL })).toBe(i18n.global.t('common.demoReadOnly'))
    expect(apiErrorMessage(403, { status: 403, detail: DEMO_READ_ONLY_DETAIL })).not.toBe(DEMO_READ_ONLY_DETAIL)
  })

  it('any other 403 keeps its own detail', async () => {
    respond(403, { status: 403, title: 'Forbidden', detail: 'Account disabled' })
    const e = await failure(client.post('/auth/login', {}))
    expect(e.message).toBe('Account disabled')
    expect(isDemoReadOnlyError(e)).toBe(false)
    expect(apiErrorMessage(403, { status: 403, title: 'Forbidden' })).toBe('Forbidden')
    expect(apiErrorMessage(400, { status: 400, detail: DEMO_READ_ONLY_DETAIL })).toBe(DEMO_READ_ONLY_DETAIL)   // doar cu 403
    expect(isDemoReadOnlyError(new Error(DEMO_READ_ONLY_DETAIL))).toBe(false)
  })
})
