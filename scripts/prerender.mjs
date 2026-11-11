// Pre-generează paginile publice ale site-ului ca HTML complet, după `npm run build`, ca Google să le citească fără să
// ruleze JavaScript (SEO). Deschide fiecare pagină în Chrome (cel instalat; în CI e pe runner), servind dist/ local, și scrie
// HTML-ul randat în dist/prerender/<pagina>.html; nginx (deploy/nginx.conf) îl servește pe /, /community, /privacy, /terms,
// /evenimente, /obiective și pe paginile fiecărui eveniment și obiectiv (/evenimente/<id>/…, /obiective/<id>/…).
// La pornire, aplicația Vue montează peste același #app, deci pagina rămâne interactivă exact ca înainte.
// Cererile spre API (VITE_API_URL, producția în CI) trec prin Node, cu originea site-ului; hărțile externe și pozele sunt oprite.
// Dacă o pagină arată o eroare (API căzut), nu se scrie: nginx servește atunci aplicația obișnuită. Cele 6 pagini principale
// opresc build-ul în CI; o pagină de detaliu care nu merge se sare, cu un avertisment.
// La final scrie dist/sitemap.xml cu paginile principale și cu fiecare detaliu randat (adresa canonică, cu slug).
import { chromium } from 'playwright-core'
import http from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const started = Date.now()
const DIST = path.resolve('dist')
const SITE = 'https://aradexperience.site'
const API = (process.env.VITE_API_URL || `${SITE}/api/v1`).replace(/\/$/, '')
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY) || 6
/** pagina, fișierul (fără .html), cât de des se schimbă și prioritatea în sitemap */
const MAIN = [
  ['/', 'index', 'weekly', '1.0'],
  ['/evenimente', 'evenimente', 'daily', '0.9'],
  ['/obiective', 'obiective', 'weekly', '0.9'],
  ['/community', 'community', 'daily', '0.8'],
  ['/privacy', 'privacy', 'yearly', '0.3'],
  ['/terms', 'terms', 'yearly', '0.3'],
]
const SIGHT_TYPES = new Set(['ATTRACTION', 'MUSEUM', 'NATURE', 'PARK'])
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml' }
const BLOCKED = /maps\.googleapis\.com|maps\.gstatic\.com|tile\.openstreetmap|basemaps\.cartocdn|tile\./i

// ---------------------------------------------------------------- id-urile paginilor de detaliu, din API

async function api(pathAndQuery) {
  const res = await fetch(API + pathAndQuery, { headers: { accept: 'application/json', origin: SITE, referer: SITE + '/' } })
  if (!res.ok) throw new Error(`${res.status} ${pathAndQuery}`)
  return res.json()
}

/** Evenimentele publice de randat: cele viitoare și cele din ultimele 30 de zile, fără cele demo (toate paginile listei). */
async function eventIds() {
  const from = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)
  const ids = []
  for (let page = 0; page < 20; page++) {
    const p = await api(`/events?from=${from}&sort=date&size=100&page=${page}`)
    for (const e of p.content ?? []) if (!e.isDemo) ids.push(e.id)
    if (!p.content?.length || (page + 1) * (p.size || 100) >= (p.totalElements ?? 0)) break
  }
  return [...new Set(ids)]
}

/** Obiectivele turistice (atracții, muzee, natură, parcuri). */
async function placeIds() {
  const list = await api('/places')
  return list.filter((p) => SIGHT_TYPES.has(p.type)).map((p) => p.id)
}

const details = []
try {
  const [events, places] = await Promise.all([eventIds(), placeIds()])
  for (const id of events) details.push({ route: `/evenimente/${id}`, file: `evenimente/${id}` })
  for (const id of places) details.push({ route: `/obiective/${id}`, file: `obiective/${id}` })
  console.log(`prerender: ${events.length} evenimente + ${places.length} obiective din ${API}`)
} catch (e) {
  console.warn(`prerender: nu am putut lista evenimentele / obiectivele (${e.message}); randez doar paginile principale`)
}

// ---------------------------------------------------------------- serverul local cu dist/ și Chrome

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
  console.warn(`${msg}; sar peste (local), rămâne public/sitemap.xml`)
  process.exit(0)
}

async function newContext() {
  const context = await browser.newContext({ locale: 'ro-RO', viewport: { width: 1280, height: 900 } })
  await context.route('**/*', async (r) => {
    const req = r.request()
    const u = req.url()
    if (u.startsWith(origin)) return ['image', 'media'].includes(req.resourceType()) ? r.abort() : r.continue()
    if (BLOCKED.test(u) || ['image', 'media'].includes(req.resourceType())) return r.abort()
    if (u.includes('/api/')) {
      try {
        // ca de pe site: API-ul acceptă doar originile lui (CORS), nu serverul local de aici
        const res = await r.fetch({ headers: { ...req.headers(), origin: SITE, referer: SITE + '/' } })
        return r.fulfill({ response: res, headers: { ...res.headers(), 'access-control-allow-origin': '*' } })
      } catch { return r.abort() }
    }
    return r.continue()
  })
  return context
}

/** Randează o pagină; întoarce `{ ok, reason?, canonical?, chars }`. Scrie fișierul doar dacă pagina e bună. */
async function render(context, route, file) {
  const page = await context.newPage()
  try {
    await page.goto(origin + route, { waitUntil: 'load', timeout: 30000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(300)
    const info = await page.evaluate(() => ({
      text: document.querySelector('#app')?.innerText.trim().length ?? 0,
      broken: /Nu am putut încărca|Eroare \d{3}/.test(document.body.innerText),
      robots: document.head.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
      canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      title: document.title,
    }))
    if (info.broken) return { ok: false, reason: 'pagina arată o eroare' }
    if (info.robots.includes('noindex')) return { ok: false, reason: 'noindex (nu există sau e demo)' }
    if (info.text < 200) return { ok: false, reason: `prea puțin text (${info.text})` }
    // Vite pune linkurile modulelor încărcate la cerere cu adresa completă a serverului de aici; le facem relative (/assets/…)
    const html = ('<!doctype html>\n' + await page.evaluate(() => document.documentElement.outerHTML)).replaceAll(origin, '')
    if (html.includes('127.0.0.1')) return { ok: false, reason: 'a rămas o adresă locală' }
    const out = path.join(DIST, 'prerender', `${file}.html`)
    await mkdir(path.dirname(out), { recursive: true })
    await writeFile(out, html)
    return { ok: true, canonical: info.canonical, chars: info.text, title: info.title }
  } catch (e) {
    return { ok: false, reason: e.message.split('\n')[0] }
  } finally {
    await page.close()
  }
}

// ---------------------------------------------------------------- randarea, câte CONCURRENCY deodată

const jobs = [
  ...MAIN.map(([route, file, freq, prio]) => ({ route, file, main: true, freq, prio })),
  ...details.map((d) => ({ ...d, main: false, freq: 'weekly', prio: '0.7' })),
]
const done = []
let failed = false
let skipped = 0
let next = 0
await mkdir(path.join(DIST, 'prerender'), { recursive: true })
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, async () => {
  const context = await newContext()
  while (next < jobs.length) {
    const job = jobs[next++]
    const r = await render(context, job.route, job.file)
    if (r.ok) {
      done.push({ ...job, canonical: r.canonical || SITE + job.route })
      if (job.main) console.log(`prerender ${job.route} → dist/prerender/${job.file}.html · ${r.chars} caractere · ${r.title}`)
    } else if (job.main) {
      console.error(`prerender ${job.route}: ${r.reason}, nu scriu`)
      failed = true
    } else {
      console.warn(`prerender ${job.route}: ${r.reason}, sar peste`)
      skipped++
    }
  }
  await context.close()
}))
await browser.close()
server.close()

// ---------------------------------------------------------------- sitemap.xml

const today = new Date().toISOString().slice(0, 10)
const order = new Map(jobs.map((j, i) => [j.route, i]))
const urls = [
  ...MAIN.map(([route, , freq, prio]) => ({ loc: SITE + route, freq, prio })),
  ...done.filter((d) => !d.main).sort((a, b) => order.get(a.route) - order.get(b.route)).map((d) => ({ loc: d.canonical, freq: d.freq, prio: d.prio })),
]
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map((u) => `  <url><loc>${esc(u.loc)}</loc><lastmod>${today}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.prio}</priority></url>`).join('\n')
  + '\n</urlset>\n'
await writeFile(path.join(DIST, 'sitemap.xml'), sitemap)

const mainOk = done.filter((d) => d.main).length
const secs = ((Date.now() - started) / 1000).toFixed(1)
console.log(`prerender: ${mainOk}/${MAIN.length} pagini principale, ${done.length - mainOk}/${details.length} detalii (${skipped} sărite) în ${secs} s; sitemap.xml cu ${urls.length} adrese`)
if (failed && process.env.CI) process.exit(1)
