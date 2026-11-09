/**
 * Copiază un text: `navigator.clipboard` când există (HTTPS, aplicația), altfel varianta veche cu un textarea + `execCommand`
 * (WebView-uri vechi, pagini fără context securizat). true = copiat.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* refuzat: încercăm varianta veche */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = typeof document.execCommand === 'function' && document.execCommand('copy')
    document.body.removeChild(ta)
    return !!ok
  } catch {
    return false
  }
}
