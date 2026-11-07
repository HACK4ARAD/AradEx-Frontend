import { beforeEach, describe, expect, it, vi } from 'vitest'

const config = vi.fn()
vi.mock('@/shared/api/payments', () => ({ paymentsApi: { config: () => config() } }))
const { resetPaymentMode, usePaymentMode } = await import('./usePaymentMode')
const flush = () => new Promise((r) => setTimeout(r, 0))

describe('usePaymentMode', () => {
  beforeEach(() => { resetPaymentMode(); config.mockReset() })

  it('asks the server once and follows its answer', async () => {
    config.mockResolvedValue({ cardPayments: true, currency: 'ron', testMode: true })
    const a = usePaymentMode()
    usePaymentMode()
    await flush()
    expect(a.cardOn.value).toBe(true)
    expect(config).toHaveBeenCalledTimes(1)
  })

  it('stays on the demo payment when the server cannot be reached, and asks again next time', async () => {
    config.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ cardPayments: false, currency: 'ron', testMode: true })
    const a = usePaymentMode()
    await flush()
    expect(a.cardOn.value).toBe(false)
    usePaymentMode()
    await flush()
    expect(config).toHaveBeenCalledTimes(2)
  })
})
