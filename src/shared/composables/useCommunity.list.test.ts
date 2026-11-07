import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const register = vi.fn()
const cancel = vi.fn()
const actions = vi.fn()
vi.mock('@/shared/api/community', () => ({
  communityApi: { register: (id: number) => register(id), cancel: (id: number) => cancel(id), actions: () => actions() },
  cityCommunityApi: {},
}))

import { applyRegistration, registrationPill, useActions } from './useCommunity'
import { ApiError } from '@/shared/api/client'
import type { ActionSummary, RegistrationDto } from '@/shared/types/community'

const action = (id: number, extra: Partial<ActionSummary> = {}): ActionSummary => ({
  id, title: `A${id}`, category: 'ENVIRONMENT', startAt: '2026-11-08T07:00:00Z', endAt: '2026-11-08T10:00:00Z', locationName: 'Ceala',
  lat: 46.19, lng: 21.26, pointsReward: 40, capacity: 60, registeredCount: 14, goingPreview: [], ...extra,
})
const reg = (actionId: number, status: RegistrationDto['status'] = 'REGISTERED'): RegistrationDto => ({
  id: 100 + actionId, actionId, actionTitle: `A${actionId}`, actionStartAt: '2026-11-08T07:00:00Z', locationName: 'Ceala', pointsReward: 40,
  code: `AX-C${actionId}-7WC6YC`, status, registeredAt: '2026-11-07T10:00:00Z',
})

beforeEach(() => { setActivePinia(createPinia()); register.mockReset(); cancel.mockReset(); actions.mockReset() })

describe('applyRegistration', () => {
  it('adds my registration and counts me once', () => {
    const list = applyRegistration([action(1), action(2)], 2, reg(2))
    expect(list[1]).toMatchObject({ registeredCount: 15, myRegistration: { code: 'AX-C2-7WC6YC' } })
    expect(list[0].registeredCount).toBe(14)
    // înscrierea refolosită (deja activă) nu mai adaugă un loc
    expect(applyRegistration(list, 2, reg(2))[1].registeredCount).toBe(15)
  })

  it('removes it and frees the spot, never below zero', () => {
    expect(applyRegistration([action(1, { registeredCount: 15, myRegistration: reg(1) })], 1, undefined)[0])
      .toMatchObject({ registeredCount: 14, myRegistration: undefined })
    expect(applyRegistration([action(1, { registeredCount: 0, myRegistration: reg(1) })], 1, undefined)[0].registeredCount).toBe(0)
  })
})

describe('registrationPill', () => {
  it('maps the status to a tone and a label key', () => {
    expect(registrationPill({ status: 'CONFIRMED' })).toEqual({ tone: 'ok', key: 'community.tickets.confirmed' })
    expect(registrationPill({ status: 'REGISTERED' }).tone).toBe('pending')
    expect(registrationPill({ status: 'NO_SHOW' }).key).toBe('community.tickets.rejected')
  })
})

describe('useActions register / cancel', () => {
  it('updates the list in place after signing up and cancelling', async () => {
    actions.mockResolvedValue([action(1), action(2)])
    register.mockResolvedValue(reg(1))
    cancel.mockResolvedValue(undefined)
    const l = useActions()
    await l.load()
    expect(await l.register(1)).toMatchObject({ actionId: 1 })
    expect(l.actions.value[0]).toMatchObject({ registeredCount: 15, myRegistration: { actionId: 1 } })
    expect(l.busyId.value).toBeNull()
    expect(await l.cancel(1)).toBe(true)
    expect(l.actions.value[0]).toMatchObject({ registeredCount: 14, myRegistration: undefined })
  })

  it('reloads the list when the action filled up meanwhile (409)', async () => {
    actions.mockResolvedValue([action(1)])
    register.mockRejectedValue(new ApiError(409, 'Full'))
    const l = useActions()
    await l.load()
    expect(await l.register(1)).toBeNull()
    expect(actions).toHaveBeenCalledTimes(2)
  })
})
