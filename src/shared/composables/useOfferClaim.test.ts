import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import type { OfferDto, RedemptionDto } from '@/shared/types/offers'

const toast = vi.fn()
const push = vi.fn()
const redeem = vi.fn()
const loadPoints = vi.fn()
const offer = ref<OfferDto | null>(null)
const points = ref<{ balance: number } | null>(null)
const auth = { isLoggedIn: true, role: 'LOCAL' as string | null }

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }))
vi.mock('vue-router', () => ({ useRoute: () => ({ fullPath: '/offers/7' }), useRouter: () => ({ push }) }))
vi.mock('@/shared/stores/ui', () => ({ useUiStore: () => ({ toast }) }))
vi.mock('@/shared/stores/auth', () => ({ useAuthStore: () => auth }))
vi.mock('@/shared/composables/useOffers', () => ({
  useOffer: () => ({ offer, loading: ref(false), notFound: ref(false), error: ref(null), redeeming: ref(false), reload: vi.fn(), redeem: (...a: unknown[]) => redeem(...a) }),
}))
vi.mock('@/shared/composables/useCommunity', () => ({
  earnsPoints: (r: string | null) => r === 'LOCAL' || r === 'VISITOR',
  usePoints: () => ({ points, load: loadPoints }),
}))

import { useOfferClaim } from './useOfferClaim'

const code = (status: RedemptionDto['status'] = 'ISSUED') => ({ id: 1, code: 'AX-O7-1', status, pointsSpent: 0 }) as unknown as RedemptionDto
const mkOffer = (o: Partial<OfferDto> = {}) => ({ id: 7, title: 'Cafea', discountLabel: '-20%', category: 'CAFE', pointsPrice: 30, redemptionsCount: 0, ...o }) as unknown as OfferDto

beforeEach(() => {
  toast.mockReset(); push.mockReset(); redeem.mockReset(); loadPoints.mockReset()
  auth.isLoggedIn = true; auth.role = 'LOCAL'
  offer.value = mkOffer()
  points.value = { balance: 100 }
})

describe('useOfferClaim', () => {
  it('without an account sends to login with ?next= and does not claim', async () => {
    auth.isLoggedIn = false; auth.role = null
    const c = useOfferClaim(ref(7))
    expect(await c.claim()).toBe(false)
    expect(push).toHaveBeenCalledWith({ path: '/login', query: { next: '/offers/7' } })
    expect(redeem).not.toHaveBeenCalled()
  })

  it('claims with money and reports a code to show', async () => {
    redeem.mockResolvedValue(code())
    const c = useOfferClaim(ref(7))
    expect(await c.claim()).toBe(true)
    expect(redeem).toHaveBeenCalledWith('offers.redeem.done')
  })

  it('an active code is shown again without a new claim', async () => {
    offer.value = mkOffer({ myRedemption: code('ISSUED') })
    const c = useOfferClaim(ref(7))
    expect(c.active.value?.code).toBe('AX-O7-1')
    expect(await c.claim()).toBe(true)
    expect(redeem).not.toHaveBeenCalled()
  })

  it('paying with points needs enough points', async () => {
    points.value = { balance: 10 }
    const c = useOfferClaim(ref(7))
    expect(await c.pay()).toBe(false)
    expect(toast).toHaveBeenCalledWith('offers.redeem.notEnough', 'error')
    expect(redeem).not.toHaveBeenCalled()
  })

  it('pays with points and reloads the balance', async () => {
    redeem.mockResolvedValue(code())
    const c = useOfferClaim(ref(7))
    loadPoints.mockClear()
    expect(await c.pay()).toBe(true)
    expect(redeem).toHaveBeenCalledWith('offers.redeem.paidDone', true)
    expect(loadPoints).toHaveBeenCalledTimes(1)
  })

  it('accounts that do not earn points cannot pay with points', async () => {
    auth.role = 'BUSINESS'
    const c = useOfferClaim(ref(7))
    expect(c.canEarn.value).toBe(false)
    expect(await c.pay()).toBe(false)
    expect(toast).toHaveBeenCalledWith('offers.redeem.pointsLocalsOnly')
  })
})
