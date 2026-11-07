import { computed, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/shared/composables/useFormat'
import { actionMapTo, isActiveRegistration, useAction } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

/**
 * Detaliul unei acțiuni comunitare (T11 mobil, T23 web): acțiunea, înscrierea mea activă, „Mă înscriu” (fără cont → login cu
 * întoarcere aici), anularea (cu confirmare), sheet-ul cu QR-ul și „Trimite”. Ecranele mobil și web doar așază datele.
 */
export function useActionDetail(id: Ref<number>) {
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const f = useFormat()
  const ui = useUiStore()
  const auth = useAuthStore()
  const { action, loading, notFound, saving, load, register, cancel } = useAction(id)
  const qrOpen = ref(false)

  const reg = computed(() => (isActiveRegistration(action.value?.myRegistration) ? action.value?.myRegistration : undefined))
  const mapTo = computed(() => (action.value ? actionMapTo(action.value.id) : '/map'))

  async function onRegister() {
    if (!auth.isLoggedIn) { router.push({ path: '/login', query: { next: route.fullPath } }); return }
    const r = await register()
    if (r) { ui.toast(t('community.action.registeredToast'), 'success'); qrOpen.value = true }
  }

  async function onCancel() {
    if (!window.confirm(t('community.action.cancelConfirm'))) return
    if (await cancel()) { qrOpen.value = false; ui.toast(t('community.action.cancelledToast'), 'success') }
  }

  async function share() {
    const a = action.value
    if (!a) return
    const data = { title: a.title, text: `${a.title} · ${f.dateTime(a.startAt)}`, url: window.location.href }
    if (navigator.share) {
      try { await navigator.share(data) } catch { /* închis de utilizator */ }
      return
    }
    try {
      await navigator.clipboard.writeText(data.url)
      ui.toast(t('community.action.linkCopied'), 'success')
    } catch {
      ui.toast(t('community.action.shareUnavailable'))   // ex. WebView-ul Android fără Web Share / clipboard
    }
  }

  return { action, loading, notFound, saving, load, reg, mapTo, qrOpen, onRegister, onCancel, share }
}
