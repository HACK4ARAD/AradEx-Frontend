import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ticketsApi } from '@/shared/api/tickets'
import { ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/stores/auth'
import type { TicketDto } from '@/shared/types/tickets'

/**
 * T07 · biletele utilizatorului, cu o copie în localStorage (`ax.tickets.<userId>`) ca S9/S10 să meargă și offline
 * (fără semnal la intrarea în sală). Cache-ul se actualizează la fiecare listare și la fiecare cumpărare.
 */
const KEY = (userId: number) => `ax.tickets.${userId}`

function readCache(userId: number): TicketDto[] {
  try { return JSON.parse(localStorage.getItem(KEY(userId)) ?? '[]') as TicketDto[] } catch { return [] }
}
function writeCache(userId: number, list: TicketDto[]) {
  try { localStorage.setItem(KEY(userId), JSON.stringify(list)) } catch { /* privat / plin */ }
}
/** Pune / înlocuiește un bilet în cache (după cumpărare sau după GET /tickets/{code}). */
export function cacheTicket(userId: number, t: TicketDto) {
  const list = readCache(userId).filter((x) => x.code !== t.code)
  writeCache(userId, [t, ...list])
}

export const isPast = (t: Pick<TicketDto, 'startAt' | 'endAt'>, now = Date.now()) => new Date(t.endAt ?? t.startAt).getTime() < now

/** Totalul unei comenzi (S4 / W6): adulți × preț adult + copii × preț copil. */
export function orderTotal(adult: number, child: number, priceAdult?: number, priceChild?: number): number {
  return Math.round((adult * (priceAdult ?? 0) + child * (priceChild ?? 0)) * 100) / 100
}

/** Rândurile de pe bilet: „1 × Adult · 40 lei”, „1 × Copil · 25 lei” sau „1 × Înscriere · gratuit”. */
export function ticketLines(t: TicketDto, labels: { adult: string; child: string; registration: string }) {
  if (t.ticketType === 'FREE') return [{ qty: t.qtyAdult + t.qtyChild, label: labels.registration, amount: 0 }]
  return [
    { qty: t.qtyAdult, label: labels.adult, amount: t.qtyAdult * (t.priceAdult ?? 0) },
    { qty: t.qtyChild, label: labels.child, amount: t.qtyChild * (t.priceChild ?? 0) },
  ].filter((l) => l.qty > 0)
}

/** Lista „Biletele mele” (viitoare + trecute dintr-o singură cerere), cu fallback pe cache când nu e rețea. */
export function useMyTickets() {
  const auth = useAuthStore()
  const all = shallowRef<TicketDto[]>([])
  const loading = ref(true)
  const offline = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    const uid = auth.user?.id
    if (!uid) { loading.value = false; return }
    loading.value = true
    error.value = null
    try {
      all.value = await ticketsApi.mine()
      writeCache(uid, all.value)
      offline.value = false
    } catch (err) {
      const cached = readCache(uid)
      if (err instanceof ApiError && err.status === 0 && cached.length) { all.value = cached; offline.value = true }
      else error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }
  const upcoming = computed(() => all.value.filter((t) => !isPast(t)).sort((a, b) => a.startAt.localeCompare(b.startAt)))
  const past = computed(() => all.value.filter((t) => isPast(t)).sort((a, b) => b.startAt.localeCompare(a.startAt)))
  return { all, upcoming, past, loading, offline, error, load }
}

/** Un bilet după cod: din API, iar fără rețea din cache. */
export function useTicket() {
  const auth = useAuthStore()
  const ticket = shallowRef<TicketDto | null>(null)
  const loading = ref(true)
  const notFound = ref(false)
  async function load(code: string) {
    loading.value = true
    notFound.value = false
    const uid = auth.user?.id
    const cached = uid ? readCache(uid).find((t) => t.code === code) : undefined
    if (cached) ticket.value = cached
    try {
      const t = await ticketsApi.get(code)
      ticket.value = t
      if (uid) cacheTicket(uid, t)
    } catch {
      if (!cached) { ticket.value = null; notFound.value = true }
    } finally {
      loading.value = false
    }
  }
  return { ticket, loading, notFound, load }
}

/** Mesajul în română pentru erorile de cumpărare (409 locuri / deja înscris, 400 încheiat), altfel `detail` din ProblemDetail. */
export function useTicketErrors() {
  const { t } = useI18n()
  return (err: unknown): string => {
    if (err instanceof ApiError) {
      const d = err.problem?.detail ?? ''
      if (err.status === 409 && /already registered/i.test(d)) return t('tickets.errors.already')
      if (err.status === 409) return t('tickets.errors.soldOut')
      if (err.status === 400 && /ended/i.test(d)) return t('tickets.errors.ended')
      return err.message
    }
    return err instanceof Error ? err.message : String(err)
  }
}
