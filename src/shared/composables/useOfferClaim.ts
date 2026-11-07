import { computed, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useOffer } from '@/shared/composables/useOffers'
import { offerBadge } from '@/shared/composables/useOfferForm'
import { earnsPoints, usePoints } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

/**
 * T10 / T11 / T23 · detaliul ofertei + revendicarea, comune aplicației (S1c, codul în sheet) și web-ului (W11, codul în cardul din dreapta).
 * Oferta doar pe puncte se plătește cu punctele (`pay`); oferta normală se revendică (`claim`) și, dacă are `pointsPrice`,
 * se poate plăti și cu puncte. Fără cont → login cu `?next=`. `claim` / `pay` întorc true când există un cod de arătat.
 */
export function useOfferClaim(id: Ref<number>) {
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const auth = useAuthStore()
  const ui = useUiStore()
  const { offer, loading, notFound, error, redeeming, reload, redeem } = useOffer(id, t)

  /** codul activ (emis, nefolosit) */
  const active = computed(() => (offer.value?.myRedemption?.status === 'ISSUED' ? offer.value.myRedemption : null))

  /* T11: punctele mele, ca butoanele de plată să știe dacă îmi ajung */
  const pts = usePoints()
  const canEarn = computed(() => earnsPoints(auth.role))
  if (canEarn.value) void pts.load()
  const price = computed(() => offer.value?.pointsPrice ?? 0)
  const pointsOnly = computed(() => !!offer.value && offerBadge(offer.value).kind === 'points')
  const balance = computed(() => pts.points.value?.balance ?? auth.user?.pointsBalance ?? 0)
  const enough = computed(() => balance.value >= price.value)

  function needLogin(): boolean {
    if (auth.isLoggedIn) return false
    ui.toast(t('offers.redeem.login'))
    void router.push({ path: '/login', query: { next: route.fullPath } })
    return true
  }

  async function pay(): Promise<boolean> {
    if (needLogin()) return false
    if (!canEarn.value) { ui.toast(t('offers.redeem.pointsLocalsOnly')); return false }
    if (!enough.value) { ui.toast(t('offers.redeem.notEnough', { have: balance.value, n: price.value }), 'error'); return false }
    if (await redeem(t('offers.redeem.paidDone', { n: price.value }), true)) { void pts.load(); return true }
    return false
  }

  async function claim(): Promise<boolean> {
    if (needLogin()) return false
    if (active.value) return true
    return !!(await redeem(t('offers.redeem.done')))
  }

  return { offer, loading, notFound, error, redeeming, reload, active, canEarn, price, pointsOnly, balance, enough, pay, claim }
}
