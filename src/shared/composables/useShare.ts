import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/shared/stores/ui'

/** „Trimite”: Web Share pe telefon; altfel copiază linkul și arată un toast. */
export function useShare() {
  const ui = useUiStore()
  const { t } = useI18n()
  return async (title: string, url = window.location.href) => {
    try {
      if (navigator.share) { await navigator.share({ title, url }); return }
      await navigator.clipboard.writeText(url)
      ui.toast(t('places.detail.linkCopied'), 'success')
    } catch { /* anulat de om */ }
  }
}
