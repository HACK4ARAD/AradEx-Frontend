import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/shared/i18n'
import { useAuthStore } from '@/shared/stores/auth'
import type { UserDto } from '@/shared/types/auth'
import DemoAccountBanner from './DemoAccountBanner.vue'

const user = (email: string): UserDto => ({
  id: 1, email, displayName: 'X', role: 'LOCAL', locale: 'ro', pointsBalance: 0, mustChangePassword: false, hasRecoveryCode: true,
})

function render(u: UserDto | null) {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'ro'
  useAuthStore().user = u
  return mount(DemoAccountBanner, { global: { plugins: [i18n] } })
}

describe('DemoAccountBanner', () => {
  beforeEach(() => sessionStorage.clear())

  it('shows only for @demo.ro accounts', () => {
    expect(render(user('local@demo.ro')).find('[data-test=demo-banner]').text()).toContain('Cont demo: doar vizualizare până la lansare. Poți explora tot, dar nu poți salva modificări.')
    expect(render(user('Admin@Demo.RO')).find('[data-test=demo-banner]').exists()).toBe(true)
    expect(render(user('ana@exemplu.ro')).find('[data-test=demo-banner]').exists()).toBe(false)
    expect(render(null).find('[data-test=demo-banner]').exists()).toBe(false)
  })

  it('hides after dismiss and stays hidden for the session', async () => {
    const w = render(user('visitor@demo.ro'))
    await w.find('[data-test=demo-banner-close]').trigger('click')
    expect(w.find('[data-test=demo-banner]').exists()).toBe(false)
    expect(sessionStorage.getItem('ax.demoBanner.dismissed')).toBe('1')
    expect(render(user('visitor@demo.ro')).find('[data-test=demo-banner]').exists()).toBe(false)   // alt ecran, aceeași sesiune
    sessionStorage.clear()                                                                          // sesiune nouă
    expect(render(user('visitor@demo.ro')).find('[data-test=demo-banner]').exists()).toBe(true)
  })
})
