// Pre-generează paginile publice ale site-ului ca HTML complet, după `npm run build`, ca Google să le citească fără să
// ruleze JavaScript (SEO). Deschide fiecare pagină în Chrome (cel instalat; în CI e pe runner), servind dist/ local, și scrie
// HTML-ul randat în dist/prerender/<pagina>.html; nginx (deploy/nginx.conf) îl servește pe /, /community, /privacy, /terms.
// La pornire, aplicația Vue montează peste același #app, deci pagina rămâne interactivă exact ca înainte.
// Cererile spre API (VITE_API_URL, producția în CI) trec prin Node, cu originea site-ului; hărțile externe sunt oprite.
// Dacă o pagină arată o eroare (API căzut), nu se scrie: nginx servește atunci aplicația obișnuită.
import { chromium } from 'playwright-core'
import http from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DIST = path.resolve('dist')
const PAGES = [['/', 'index'], ['/community', 'community'], ['/privacy', 'privacy'], ['/terms', 'terms']]
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml' }
const SITE = 'https://aradexperience.site'
const BLOCKED = /maps\.googleapis\.com|maps\.gstatic\.com|tile\.openstreetmap|basemaps\.cartocdn|tile\./i

const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0])
  const file = path.join(DIST, path.normalize(url))
  try {
    if (!file.startsWith(DIST)) throw new Error('outside dist')
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(200, { 'content-type': TYPES['.html'] }).end(await readFile(path.join(DIST, 'index.html'))) // ruta SPA
  }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const origin = `http://127.0.0.1:${server.address().port}`

let browser
try {
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' })
} catch (e) {
  server.close()
  const msg = `prerender: Chrome nu e disponibil (${e.message.split('\n')[0]})`
  if (process.env.CI) { console.error(msg); process.exit(1) }
  console.warn(`${msg}; sar peste (local)`)
  process.exit(0)
}

let failed = false
await mkdir(path.join(DIST, 'prerender'), { recursive: true })
for (const [route, name] of PAGES) {
  const context = await browser.newContext({ locale: 'ro-RO', viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  await page.route('**/*', async (r) => {
    const u = r.request().url()
    if (u.startsWith(origin)) return r.continue()
    if (BLOCKED.test(u)) return r.abort()
    if (u.includes('/api/')) {
      try {
        // ca de pe site: API-ul acceptă doar originile lui (CORS), nu serverul local de aici
        const res = await r.fetch({ headers: { ...r.request().headers(), origin: SITE, referer: SITE + '/' } })
        return r.fulfill({ response: res, headers: { ...res.headers(), 'access-control-allow-origin': '*' } })
      } catch { return r.abort() }
    }
    return r.continue()
  })
  await page.goto(origin + route, { waitUntil: 'load' })
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(500)
  const text = await page.evaluate(() => document.querySelector('#app')?.innerText.trim().length ?? 0)
  const title = await page.title()
  const broken = await page.evaluate(() => /Nu am putut încărca|Eroare \d{3}/.test(document.body.innerText))
  if (broken) { console.error(`prerender ${route}: pagina arată o eroare, nu scriu`); failed = true; await context.close(); continue }
  if (text < 200) { console.error(`prerender ${route}: prea puțin text (${text}), nu scriu`); failed = true; await context.close(); continue }
  // Vite pune linkurile modulelor încărcate la cerere cu adresa completă a serverului de aici; le facem relative (/assets/…)
  const html = ('<!doctype html>\n' + await page.evaluate(() => document.documentElement.outerHTML)).replaceAll(origin, '')
  if (html.includes('127.0.0.1')) { console.error(`prerender ${route}: a rămas o adresă locală, nu scriu`); failed = true; await context.close(); continue }
  await writeFile(path.join(DIST, 'prerender', `${name}.html`), html)
  console.log(`prerender ${route} → dist/prerender/${name}.html · ${text} caractere · ${title}`)
  await context.close()
}
await browser.close()
server.close()
if (failed && process.env.CI) process.exit(1)
