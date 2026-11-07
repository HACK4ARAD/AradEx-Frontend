// Generează src/shared/data/parking/parking.json din datele deschise https://github.com/baditaflorin/arad-parking-data
// (parcările cu plată Recons Arad + geometria OSM a străzilor de referință). Nu rulează nimic din acel repo: citește doar JSON-urile.
//   node scripts/parking-data.mjs <folder cu records.json, tariffs.json, rules.json>
// Păstrează doar ce folosește harta: id, nume scurt, zonă, capacitate, durată maximă, un punct și traseul străzii simplificat.
// Pozițiile fără geometrie (12, inclusiv Bd. Revoluției) nu intră: nu inventăm coordonate.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const src = process.argv[2]
if (!src) { console.error('usage: node scripts/parking-data.mjs <data dir>'); process.exit(1) }
const read = (f) => JSON.parse(readFileSync(join(src, f), 'utf8'))
const records = read('records.json')
const tariffs = read('tariffs.json')
const rules = read('rules.json')

/** ş ţ cu sedilă (cum vin din sursă) → ș ț cu virgulă. */
const fixDiacritics = (s) => s.replace(/ş/g, 'ș').replace(/Ş/g, 'Ș').replace(/ţ/g, 'ț').replace(/Ţ/g, 'Ț')

/** „Str. Horia- tronson cuprins între …” → { name: 'Str. Horia', detail: 'tronson cuprins între …' }. */
function splitName(raw) {
  const s = fixDiacritics(raw).replace(/\s+/g, ' ').trim()
  const m = s.match(/^(.+?)(?:\s*[-–]\s+|\s+[-–]\s*|\s*\(|\s*-\s*(?=tronson|între|intre))(.*)$/)
  if (!m) return { name: s }
  const detail = m[2].replace(/^\(/, '').replace(/\)\s*$/, '').replace(/^[-–\s]+/, '').trim()
  return detail ? { name: m[1].trim(), detail } : { name: m[1].trim() }
}

const R = 6371000
/** Douglas–Peucker în metri (proiecție echirectangulară locală, suficientă la scara unui oraș). */
function simplify(points, tol) {
  if (points.length <= 2) return points
  const lat0 = (points[0][0] * Math.PI) / 180
  const xy = points.map(([la, lo]) => [((lo * Math.PI) / 180) * Math.cos(lat0) * R, ((la * Math.PI) / 180) * R])
  const keep = new Array(points.length).fill(false)
  keep[0] = keep[points.length - 1] = true
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    const [ax, ay] = xy[a], [bx, by] = xy[b]
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy
    let max = 0, idx = -1
    for (let i = a + 1; i < b; i++) {
      const [px, py] = xy[i]
      const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
      if (d > max) { max = d; idx = i }
    }
    if (max > tol) { keep[idx] = true; stack.push([a, idx], [idx, b]) }
  }
  return points.filter((_, i) => keep[i])
}

const round = (n) => Math.round(n * 1e5) / 1e5 // ~1 m
/** GeoJSON [lng, lat] → [lat, lng] simplificat (5 m), cum îl vrea MapLine. */
function paths(geometry) {
  const parts = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.type === 'MultiLineString' ? geometry.coordinates : []
  return parts
    .map((line) => simplify(line.map(([lng, lat]) => [lat, lng]), 5).map(([la, lo]) => [round(la), round(lo)]))
    .filter((p) => p.length >= 2)
}

// excepția de duminică din rules.json: „Piața Obor, strada Pădurii și str. Căpitan Ignat”;
// str. Prof. Dr. Aurel Ardelean e numele nou al străzii Pădurii (sursa o scrie „str. Prof. Dr. Aurel Ardelean (Str. Pădurii)”)
const OBOR = /Obor|P[ăa]durii|Aurel Ardelean|Ignat/i

let dropped = 0
let before = 0
let after = 0
const spots = []
for (const r of records) {
  if (!r.geometry || r.latitude == null || r.longitude == null) { dropped++; continue }
  const p = paths(r.geometry)
  if (!p.length) { dropped++; continue }
  before += JSON.stringify(r.geometry.coordinates).match(/\[[-0-9.]+,[-0-9.]+\]/g).length
  after += p.reduce((n, l) => n + l.length, 0)
  spots.push({
    id: r.id.replace(/^recons-/, ''),
    ...splitName(r.name),
    zone: r.zone,
    capacity: r.capacity ?? null,
    maxStayMin: r.max_stay_minutes ?? null,
    ...(OBOR.test(r.name) ? { sundayObor: true } : {}),
    lat: round(r.latitude),
    lng: round(r.longitude),
    paths: p,
  })
}

// tarifele orare: parcometrul (lei, doar pe mediana Bd. Revoluției în sursă) și SMS-ul (EUR + TVA, cu codul)
const pick = (t) => ({ zone: t.zone, minutes: t.duration_value, amount: t.amount, currency: t.currency, vat: t.vat_included, ...(t.sms_code ? { smsCode: t.sms_code } : {}) })
const out = {
  source: 'Recons Arad (reconsarad.ro/parcari-cu-plata) prin github.com/baditaflorin/arad-parking-data · geometrie © OpenStreetMap contributors (ODbL)',
  retrievedAt: rules.retrieved_at,
  tariffs: {
    meter: tariffs.filter((t) => t.category.startsWith('parking_meter') && t.duration_unit === 'minute' && t.amount != null).map(pick),
    sms: tariffs.filter((t) => t.category === 'sms' && t.duration_unit === 'minute' && t.amount != null).map(pick),
  },
  spots,
}
const dest = 'src/shared/data/parking/parking.json'
writeFileSync(dest, JSON.stringify(out) + '\n')
console.log(`${spots.length} spots (${dropped} without geometry skipped), ${before} → ${after} points, ${(JSON.stringify(out).length / 1024).toFixed(1)} KB → ${dest}`)
