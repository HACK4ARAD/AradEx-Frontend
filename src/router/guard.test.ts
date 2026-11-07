import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/shared/stores/auth'
import type { Role } from '@/shared/types/common'
import { installGuard } from './guard'
import { WEB_LOGINS, webRoutes } from './web'
import { MOBILE_LOGINS, mobileRoutes } from './mobile'

function webRouter() {
  const r = createRouter({ history: createMemoryHistory(), routes: webRoutes })
  installGuard(r, 'w', WEB_LOGINS)
  return r
}
function mobileRouter() {
  const r = createRouter({ history: createMemoryHistory(), routes: mobileRoutes })
  installGuard(r, 'm', MOBILE_LOGINS)
  return r
}
function signIn(role: Role | null) {
  const auth = useAuthStore()
  auth.ready = true
  auth.user = role ? ({ id: 1, email: 'x@demo.ro', displayName: 'X', role, locale: 'ro' } as never) : null
}
async function go(r: ReturnType<typeof webRouter>, path: string) {
  await r.push(path)
  return r.currentRoute.value.fullPath
}

beforeEach(() => setActivePinia(createPinia()))

describe('guard on the web', () => {
  it('sends a visitor without an account to login, keeping where they wanted to go', async () => {
    signIn(null)
    expect(await go(webRouter(), '/city/places')).toBe('/login?next=/city/places')
  })

  it('sends a signed-in panel user from login to their panel', async () => {
    signIn('CITY_HALL')
    expect(await go(webRouter(), '/login')).toBe('/city')
    signIn('BUSINESS')
    expect(await go(webRouter(), '/login?next=/business/offers')).toBe('/business/offers')
  })

  it('sends the wrong role to the presentation', async () => {
    signIn('LOCAL')
    expect(await go(webRouter(), '/business')).toBe('/')
  })
})

describe('guard in the mobile app', () => {
  it('sends volunteers to the volunteer login', async () => {
    signIn(null)
    expect(await go(mobileRouter(), '/vol/actions')).toBe('/vol/login?next=/vol/actions')
  })

  it('sends a signed-in volunteer from the volunteer login to their actions', async () => {
    signIn('VOLUNTEER')
    expect(await go(mobileRouter(), '/vol/login')).toBe('/vol/actions')
  })

  it('sends the wrong role home', async () => {
    signIn('VISITOR')
    expect(await go(mobileRouter(), '/panel')).toBe('/')
  })

  it('keeps a volunteer inside the 3 volunteer tabs (T18)', async () => {
    signIn('VOLUNTEER')
    expect(await go(mobileRouter(), '/')).toBe('/vol/actions')
    expect(await go(mobileRouter(), '/tickets')).toBe('/vol/actions')
    expect(await go(mobileRouter(), '/vol/messages')).toBe('/vol/messages')
  })

  it('does not let other roles into the volunteer tabs', async () => {
    signIn('LOCAL')
    expect(await go(mobileRouter(), '/vol/scan')).toBe('/')
  })
})
