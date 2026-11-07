import { ref, watch, type Ref } from 'vue'
import { offersApi } from '@/shared/api/offers'
import { useUiStore } from '@/shared/stores/ui'
import { ARAD_CENTER } from '@/shared/composables/useGeo'
import type { OfferCreate, OfferDto, OfferQuery, OfferSummary, RedemptionDto, RedemptionStatus } from '@/shared/types/offers'

type Status = { status?: number }
const statusOf = (e: unknown) => (e as Status)?.status

/** Mesajele BE cunoscute (409) → cheile i18n în română; orice altceva rămâne `detail` din ProblemDetail. */
const KNOWN_ERRORS: Record<string, string> = {
  'Code already used': 'offers.codes.errUsed',
  'This code belongs to another business': 'offers.codes.errOther',
  'Code cancelled': 'offers.codes.errCancelled',
  'This offer is not valid today': 'offers.redeem.errUnavailable',
  insufficient_points: 'offers.redeem.errPoints',
}
export function knownErrorKey(e: unknown): string | null {
  return e instanceof Error ? KNOWN_ERRORS[e.message] ?? null : null
}

/** Filtrul din cercurile de categorii: o categorie, „Cu puncte” sau toate. */
export type OfferFilter = 'ALL' | 'CAFE' | 'RESTAURANT' | 'LOCAL' | 'EVENT' | 'POINTS'

export function filterToQuery(f: OfferFilter): OfferQuery {
  // distanța se calculează față de centrul Aradului (fără să cerem GPS la încărcare)
  const q: OfferQuery = { near: `${ARAD_CENTER.lat},${ARAD_CENTER.lng}` }
  if (f === 'POINTS') q.points = true
  else if (f === 'LOCAL') q.localProduct = true
  else if (f !== 'ALL') q.category = f
  return q
}

/** Lista publică de oferte (tab-ul Oferte mobil, W11), reîncărcată când se schimbă filtrul. */
export function useOfferList(filter: Ref<OfferFilter>) {
  const ui = useUiStore()
  const items = ref<OfferSummary[]>([])
  const loading = ref(true)
  const error = ref<unknown>(null)
  async function load() {
    loading.value = true
    error.value = null
    try { items.value = await offersApi.list(filterToQuery(filter.value)) } catch (e) { error.value = e; ui.error(e) } finally { loading.value = false }
  }
  watch(filter, load, { immediate: true })
  return { items, loading, error, reload: load }
}

/** Detaliul unei oferte + revendicarea (mobil S1c, sheet-ul de pe web). */
export function useOffer(id: Ref<number | null>, translate: (key: string) => string = (k) => k) {
  const ui = useUiStore()
  const offer = ref<OfferDto | null>(null)
  const loading = ref(false)
  const notFound = ref(false)
  const error = ref<unknown>(null)
  const redeeming = ref(false)

  async function load() {
    if (id.value == null) { offer.value = null; return }
    loading.value = true
    notFound.value = false
    error.value = null
    try { offer.value = await offersApi.get(id.value) } catch (e) {
      offer.value = null
      if (statusOf(e) === 404) notFound.value = true
      else { error.value = e; ui.error(e) }
    } finally { loading.value = false }
  }

  /**
   * Revendică (cu `withPoints`, T11: plătește cu puncte); dacă există deja un cod activ (409), reîncarcă oferta ca să-l arate.
   * Întoarce codul sau null. La 409 `insufficient_points` nu se emite niciun cod.
   */
  async function redeem(okMessage: string, withPoints = false): Promise<RedemptionDto | null> {
    if (!offer.value) return null
    redeeming.value = true
    try {
      const r = await offersApi.redeem(offer.value.id, withPoints)
      offer.value = { ...offer.value, myRedemption: r, redemptionsCount: offer.value.redemptionsCount + 1 }
      ui.toast(okMessage, 'success')
      return r
    } catch (e) {
      if (statusOf(e) === 409 && knownErrorKey(e) !== 'offers.redeem.errPoints') { await load(); if (offer.value?.myRedemption?.status === 'ISSUED') return offer.value.myRedemption }
      const key = knownErrorKey(e)
      if (key) ui.toast(translate(key), 'error')
      else ui.error(e)
      return null
    } finally { redeeming.value = false }
  }

  watch(id, load, { immediate: true })
  return { offer, loading, notFound, error, redeeming, reload: load, redeem }
}

/** Codurile mele (Contul meu · Ofertele mele). */
export function useMyRedemptions() {
  const ui = useUiStore()
  const items = ref<RedemptionDto[]>([])
  const loading = ref(true)
  async function load() {
    loading.value = true
    try { items.value = await offersApi.myRedemptions() } catch (e) { ui.error(e) } finally { loading.value = false }
  }
  load()
  return { items, loading, reload: load }
}

/** Ofertele firmei (panou web W16 + panoul mobil E5). */
export function useBusinessOffers() {
  const ui = useUiStore()
  const items = ref<OfferDto[]>([])
  const loading = ref(true)
  const saving = ref(false)
  const error = ref<unknown>(null)

  async function load() {
    loading.value = true
    error.value = null
    try { items.value = await offersApi.businessOffers() } catch (e) { error.value = e; ui.error(e) } finally { loading.value = false }
  }

  async function save(id: number | null, req: OfferCreate, msg: { published: string; draft: string }) {
    saving.value = true
    try {
      const o = id == null ? await offersApi.create(req) : await offersApi.update(id, req)
      items.value = id == null ? [o, ...items.value] : items.value.map((x) => (x.id === id ? o : x))
      ui.toast(o.status === 'PUBLISHED' ? msg.published : msg.draft, 'success')
      return o
    } catch (e) { ui.error(e); return null } finally { saving.value = false }
  }

  /** Pauză ↔ publică (PUT cu aceleași câmpuri și alt status). */
  async function setPaused(o: OfferDto, paused: boolean, msg: { published: string; draft: string }) {
    return save(o.id, {
      title: o.title, description: o.description, discountLabel: o.discountLabel, category: o.category, localProduct: o.localProduct,
      validFrom: o.validFrom, validUntil: o.validUntil, pointsPrice: o.pointsPrice, imageUrl: o.imageUrl, status: paused ? 'DRAFT' : 'PUBLISHED',
    }, msg)
  }

  async function remove(id: number, ok: string) {
    saving.value = true
    try { await offersApi.remove(id); items.value = items.value.filter((x) => x.id !== id); ui.toast(ok, 'success'); return true } catch (e) { ui.error(e); return false } finally { saving.value = false }
  }

  return { items, loading, saving, error, load, save, setPaused, remove }
}

/** Validarea codurilor la casă (W19, panoul mobil, cardul din dashboard) + codurile recente ale firmei. */
export function useCodeValidator() {
  const ui = useUiStore()
  const recent = ref<RedemptionDto[]>([])
  const loadingRecent = ref(false)
  const checking = ref(false)
  const last = ref<RedemptionDto | null>(null)
  const lastError = ref<string | null>(null)

  async function loadRecent(status?: RedemptionStatus) {
    loadingRecent.value = true
    try { recent.value = await offersApi.businessRedemptions(status) } catch (e) { ui.error(e) } finally { loadingRecent.value = false }
  }

  /**
   * Trimite codul; rezultatul în `last` (ok) sau `lastError` (mesajul de afișat). `msg404` = textul pentru cod necunoscut,
   * `translate` = `t` din i18n pentru erorile 409 cunoscute (deja folosit, altă firmă, anulat).
   */
  async function validate(code: string, msg404: string, translate: (key: string) => string = (k) => k) {
    checking.value = true
    last.value = null
    lastError.value = null
    try {
      const r = await offersApi.useCode(code)
      last.value = r
      recent.value = [r, ...recent.value.filter((x) => x.id !== r.id)]
      return r
    } catch (e) {
      const key = knownErrorKey(e)
      lastError.value = statusOf(e) === 404 ? msg404 : key ? translate(key) : e instanceof Error ? e.message : String(e)
      return null
    } finally { checking.value = false }
  }

  return { recent, loadingRecent, checking, last, lastError, loadRecent, validate }
}
