import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routesFor } from './routes'
import type { AppKind } from './app'

function routerFor(app: AppKind) {
  return createRouter({ history: createMemoryHistory(), routes: routesFor(app) })
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
  })

  it('keep the role meta', () => {
    expect(r.resolve('/vol/actions').meta.roles).toEqual(['VOLUNTEER'])
    expect(r.resolve('/tickets').meta.roles).toEqual(['VISITOR', 'LOCAL'])
  })

  it('have no web panels', async () => {
    expect((await landsOn('mobile', '/city')).path).toBe('/')
  })

  it('redirect old /m links', async () => {
    expect((await landsOn('mobile', '/m/places/1')).name).toBe('m-place')
    expect((await landsOn('mobile', '/m')).name).toBe('m-home')
  })
})

describe('web routes', () => {
  const r = routerFor('web')

  it('keep the presentation, community, privacy and login', () => {
    expect(r.resolve('/').name).toBe('w-landing')
    expect(r.resolve('/community').name).toBe('w-community')
    expect(r.resolve('/community').meta.roles).toBeUndefined()
    expect(r.resolve('/privacy').name).toBe('w-privacy')
    expect(r.resolve('/login').name).toBe('w-login')
  })

  it('keep the panels with their roles', () => {
    expect(r.resolve('/business').name).toBe('w-business')
    expect(r.resolve('/business').meta.roles).toEqual(['BUSINESS'])
    expect(r.resolve('/city/places').name).toBe('w-city-places')
    expect(r.resolve('/city/places').meta.roles).toEqual(['CITY_HALL'])
    expect(r.resolve('/admin/users').meta.roles).toEqual(['ADMIN'])
  })

  it('drop the public app pages', async () => {
    for (const p of ['/events/1', '/places/1', '/map', '/plan', '/offers', '/chat', '/account/tickets', '/businesses/3']) {
      expect((await landsOn('web', p)).path, p).toBe('/')
    }
  })

  it('redirect old /w links', async () => {
    expect((await landsOn('web', '/w/city')).name).toBe('w-city')
    expect((await landsOn('web', '/w/login')).name).toBe('w-login')
    expect((await landsOn('web', '/w')).name).toBe('w-landing')
  })
})
