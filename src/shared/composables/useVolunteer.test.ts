import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/client'
import { emptyVolunteerForm, formatPhone, messageTime, toCreate, validateVolunteerForm, volunteerErrorKey } from './useVolunteer'

describe('useVolunteer', () => {
  it('validates the new-volunteer form like the backend', () => {
    const ok = { ...emptyVolunteerForm(), name: 'Andrei Popa', phone: '0740 000 001' }
    expect(validateVolunteerForm(ok)).toEqual({})
    expect(validateVolunteerForm({ ...ok, phone: '+40740000001' })).toEqual({})
    expect(validateVolunteerForm({ ...ok, name: ' ', phone: '123', email: 'nu-e-email' })).toEqual({ name: 'name', phone: 'phone', email: 'email' })
    expect(toCreate({ ...ok, email: ' ', coordinatorId: 201, actionIds: [1], oneTime: true }))
      .toEqual({ name: 'Andrei Popa', phone: '0740 000 001', email: undefined, coordinatorId: 201, actionIds: [1], oneTime: true })
  })

  it('maps backend errors to Romanian texts', () => {
    expect(volunteerErrorKey(new ApiError(401, 'Invalid volunteer code'))).toBe('volunteer.errors.wrongCode')
    expect(volunteerErrorKey(new ApiError(401, 'This volunteer account is suspended'))).toBe('volunteer.errors.suspended')
    expect(volunteerErrorKey(new ApiError(403, 'Scanning opens 30 minutes before the start'))).toBe('volunteer.errors.locked')
    expect(volunteerErrorKey(new ApiError(409, 'This code is for another action: Curățenie'))).toBe('volunteer.errors.otherAction')
    expect(volunteerErrorKey(new ApiError(404, 'Unknown code AX-C1-ZZZZZZ'))).toBe('volunteer.errors.unknownCode')
    expect(volunteerErrorKey(new ApiError(429, 'Too many wrong codes, try again later'))).toBe('volunteer.errors.tooMany')
    expect(volunteerErrorKey(new ApiError(0, 'offline'))).toBe('network')
    expect(volunteerErrorKey(new Error('x'))).toBeNull()
  })

  it('formats phones and message times like the design', () => {
    expect(formatPhone('+40740000001')).toBe('0740 000 001')
    expect(formatPhone('+36301234567')).toBe('+36301234567')
    const now = new Date('2026-11-07T16:30:00Z')                 // 18:30 la Arad
    expect(messageTime('2026-11-07T15:02:00Z', now)).toBe('azi, 17:02')
    expect(messageTime('2026-11-06T15:40:00Z', now)).toBe('ieri, 17:40')
    expect(messageTime('2026-11-03T08:00:00Z', now)).toMatch(/^Mar\.?, 3 nov\.? · 10:00$/)
  })
})
