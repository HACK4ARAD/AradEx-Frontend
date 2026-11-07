import { useRouter } from 'vue-router'

/** Butonul „înapoi” din top bar: pagina anterioară din aplicație sau, dacă ecranul a fost deschis direct, `fallback`. */
export function useBack(fallback: string) {
  const router = useRouter()
  return () => {
    if (window.history.state?.back) router.back()
    else router.push(fallback)
  }
}
