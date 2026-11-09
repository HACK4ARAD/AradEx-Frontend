import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { mobileRoutes } from './mobile'
import { webRoutes } from './web'

type AppKind = 'mobile' | 'web'
const lists: Record<AppKind, RouteRecordRaw[]> = { mobile: mobileRoutes, web: webRoutes }

function routerFor(app: AppKind) {
  return createRouter({ history: createMemoryHistory(), routes: lists[app] })
}

async function landsOn(app: AppKind, path: string) {
  const r = routerFor(app)
  await r.push(path)
  return r.currentRoute.value
}

describe('mobile routes', () => {
  const r = routerFor('mobile')

  it('resolve without a prefix', () => {
    expect(r.resolve('/').name).toBe('m-home')
    expect(r.resolve('/events/1').name).toBe('m-event')
    expect(r.resolve('/places/1').name).toBe('m-place')
    expect(r.resolve('/login').name).toBe('m-login')
    expect(r.resolve('/password').name).toBe('m-password')
  })

  it('keep the role meta', () => {
    expect(r.resolve('/vol/actions').meta.roles).toEqual(['VOLUNTEER'])
    expect(r.resolve('/tickets').meta.roles).toEqual(['VISITOR', 'LOCAL'])
  })

  it('have no web panels', async () => {
    expect((await landsOn('mobile', '/city')).path).toBe('/')
  })

  it('know nothing about the old /m prefix', async () => {
    expect((await landsOn('mobile', '/m/places/1')).path).toBe('/')
  })
})

describe('web routes', () => {
  const r = routerFor('web')

  it('keep the presentation, community, privacy and login', () => {
    expect(r.resolve('/').name).toBe('w-landing')
    expect(r.resolve('/community').name).toBe('w-community')
    expect(r.resolve('/community').meta.roles).toBeUndefined()
    expect(r.resolve('/privacy').name).toBe('w-privacy')
    expect(r.resolve('/terms').name).toBe('w-terms')
    expect(r.resolve('/login').name).toBe('w-login')
    expect(r.resolve('/password').name).toBe('w-password')
    expect(r.resolve('/password').meta.roles).toContain('CITY_HALL')
  })

  it('keep the panels with their roles', () => {
    expect(r.resolve('/business').name).toBe('w-business')
    expect(r.resolve('/business').meta.roles).toEqual(['BUSINESS'])
    expect(r.resolve('/city/places').name).toBe('w-city-places')
    expect(r.resolve('/city/places').meta.roles).toEqual(['CITY_HALL'])
    expect(r.resolve('/admin/users').meta.roles).toEqual(['ADMIN'])
  })

  it('drop the app pages the web does not have', async () => {
    for (const p of ['/places/1', '/plan', '/chat', '/transport']) {
      expect((await landsOn('web', p)).path, p).toBe('/')
    }
  })

  it('T23: have the app pages for personal accounts, behind a sign-in', () => {
    const r = routerFor('web')
    for (const [p, name] of [['/events', 'w-events'], ['/events/1', 'w-event'], ['/events/1/tickets', 'w-event-tickets'], ['/checkout', 'w-checkout'],
      ['/tickets/AX-T1', 'w-ticket'], ['/map', 'w-map'], ['/offers', 'w-offers'], ['/offers/2', 'w-offer'], ['/account/tickets', 'w-account-tickets']]) {
      const to = r.resolve(p)
      expect(to.name, p).toBe(name)
      expect(to.meta.roles, p).toEqual(['VISITOR', 'LOCAL'])
    }
    expect(r.resolve('/community/actions/1').name).toBe('w-action')
    expect(r.resolve('/community/actions/1').meta.roles).toBeUndefined()
    expect(r.resolve('/businesses/3').name).toBe('w-business-page')
  })

  it('redirect old /w links', async () => {
    expect((await landsOn('web', '/w/city')).name).toBe('w-city')
    expect((await landsOn('web', '/w/login')).name).toBe('w-login')
    expect((await landsOn('web', '/w')).name).toBe('w-landing')
  })

  it('know nothing about the mobile app', async () => {
    expect((await landsOn('web', '/m/places/1')).path).toBe('/')
    expect(webRoutes.flatMap(function names(r): string[] { return [String(r.name ?? ''), ...(r.children ?? []).flatMap(names)] }).filter((n) => n.startsWith('m-'))).toEqual([])
  })
})
