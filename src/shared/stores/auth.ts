import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/shared/api/auth'
import { tokenStore, setUnauthorizedHandler } from '@/shared/api/client'
import { i18n, setLocale, type Locale } from '@/shared/i18n'
import type { Role } from '@/shared/types/common'
import type { RegisterRequest, UpdateMeRequest, UserDto } from '@/shared/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserDto | null>(null)
  const token = ref<string | null>(tokenStore.get())
  const ready = ref(false)
  const savingLocale = ref(false)

  const isLoggedIn = computed(() => !!user.value)
  const role = computed<Role | null>(() => user.value?.role ?? null)

  /** Limba salvată în cont devine limba aplicației (login, pornire). */
  function applyAccountLocale(u: UserDto) {
    if (u.locale === 'ro' || u.locale === 'en') setLocale(u.locale)
  }

  function setSession(t: string, u: UserDto) {
    token.value = t
    tokenStore.set(t)
    user.value = u
  }

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password)
    setSession(res.token, res.user)
    applyAccountLocale(res.user)
    return res.user
  }

  /** Cont nou: păstrează limba aleasă înainte de înregistrare (contul nou pornește cu 'ro'). */
  async function register(req: RegisterRequest) {
    const res = await authApi.register(req)
    setSession(res.token, res.user)
    const chosen = i18n.global.locale.value as Locale
    if (chosen !== res.user.locale) {
      try { user.value = await authApi.updateMe({ locale: chosen }) } catch { /* rămâne local; nu blocăm înregistrarea */ }
    }
    return user.value ?? res.user
  }

  /** Nu schimbă limba UI-ului din răspuns (vezi changeLocale), ca răspunsurile venite în altă ordine să nu o comute înapoi. */
  async function updateMe(patch: UpdateMeRequest) {
    const u = await authApi.updateMe(patch)
    user.value = u
    return u
  }

  /**
   * Selectorul RO/EN (Profil S11 + WebLayout): limba se schimbă imediat local; pentru utilizatorul logat se salvează și în cont.
   * Un singur PATCH în zbor; la final, dacă utilizatorul a mai apăsat între timp, se trimite ultima alegere.
   */
  async function changeLocale(l: Locale) {
    setLocale(l)
    if (!user.value || savingLocale.value) return
    savingLocale.value = true
    try {
      let sent: Locale
      do {
        sent = i18n.global.locale.value as Locale
        await updateMe({ locale: sent })
      } while (user.value && sent !== i18n.global.locale.value)
    } finally {
      savingLocale.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    tokenStore.set(null)
  }

  /** La pornire: dacă există token, încarcă /me; dacă e invalid/expirat, curăță sesiunea (guard-ul decide apoi ruta). */
  async function init() {
    if (ready.value) return
    if (token.value) {
      try {
        user.value = await authApi.me()
        applyAccountLocale(user.value)
      } catch { logout() }
    }
    ready.value = true
  }

  /** ADMIN are voie peste tot. */
  function hasRole(...roles: Role[]) {
    return !!user.value && (user.value.role === 'ADMIN' || roles.includes(user.value.role))
  }

  // 401 pe un request autentificat (token expirat/revocat): logout; dacă pagina curentă cere cont → login cu ?next=.
  // În timpul init() (prima navigare) nu redirecționăm de aici: guard-ul router-ului se ocupă (import dinamic: router importă acest store).
  setUnauthorizedHandler(() => {
    logout()
    if (!ready.value) return
    import('@app/router').then(({ router }) => {
      const current = router.currentRoute.value
      if (!current.meta.roles?.length) return
      const login = current.meta.roles.includes('VOLUNTEER') ? '/vol/login' : '/login'
      router.push({ path: login, query: { next: current.fullPath } })
    })
  })

  return { user, token, ready, savingLocale, isLoggedIn, role, login, register, updateMe, changeLocale, logout, init, hasRole }
})
