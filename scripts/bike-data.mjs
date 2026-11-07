// Generează src/shared/data/bikes/bikes.json: stațiile sistemului de bike sharing din Arad + punctele de închiriere din OSM.
//   node scripts/bike-data.mjs <folder cu stations.json, osm-bike.json>
// Surse:
//  - amplasamentele oficiale (22): Regulamentul de utilizare a sistemului de închiriere biciclete, Primăria Arad (tabelul de la final)
//  - coordonatele: harta publică https://aradbikes.ro (lista `items` din pagină, salvată ca stations.json) — doar 10 din cele 22 au poziție
//  - închirieri non-sistem: OpenStreetMap, amenity=bicycle_rental în Arad (Overpass, salvat ca osm-bike.json), © OpenStreetMap contributors
// Stațiile fără coordonate (12) nu intră pe hartă: nu inventăm poziții. Disponibilitatea live nu e publică: e doar în aplicația GloBikes.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const src = process.argv[2]
if (!src) { console.error('usage: node scripts/bike-data.mjs <data dir>'); process.exit(1) }
const read = (f) => JSON.parse(readFileSync(join(src, f), 'utf8'))

// numele de pe aradbikes.ro → amplasamentul din regulament (nr. crt. + text)
const OFFICIAL = {
  'Gara Aradul Nou': [22, 'Gara Aradul Nou', 'str. Ștefan cel Mare, între str. Caransebeș și str. N. Gogol'],
  'Piata UTA': [11, 'Piața UTA', 'Calea Aurel Vlaicu'],
  'Polivalenta': [4, 'Zona Polivalentă', 'Piața Sporturilor, lângă intrarea la bazinul de înot'],
  'Teatru Ioan Slavici': [7, 'Teatrul Ioan Slavici', 'B-dul Revoluției, în Piața Avram Iancu'],
  'Piata Garii': [10, 'Piața Gării', 'B-dul Revoluției'],
  'Piata Sarbeasca': [16, 'Piața Sârbească', 'parc'],
  'Fortuna': [3, 'Zona Fortuna', 'Calea Aurel Vlaicu, colț cu str. Dâmboviței'],
  'Piata Arenei': [8, 'Piața Arenei', 'colț cu str. Mucius Scaevola'],
  'Varfu cu Dor': [19, 'Vârful cu Dor', 'str. Vârful cu Dor intersecție cu str. Blanduziei'],
  'Petru Rares': [15, 'Grădiște', 'str. Petru Rareș'],
}

const round = (n) => Math.round(n * 1e5) / 1e5
const stations = []
for (const s of read('stations.json')) {
  const o = OFFICIAL[s.StationName]
  if (!o) { console.warn(`skip (not in the official list): ${s.StationName}`); continue }
  if (!s.Latitude || !s.Longitude) { console.warn(`skip (no coordinates): ${s.StationName}`); continue }
  stations.push({ id: `dock-${o[0]}`, kind: 'dock', name: o[1], address: o[2], lat: round(s.Latitude), lng: round(s.Longitude) })
}
for (const e of read('osm-bike.json').elements) {
  const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon
  if (lat == null || lng == null) continue
  stations.push({ id: `osm-${e.type}-${e.id}`, kind: 'rental', name: e.tags?.name ?? 'Închiriere biciclete', lat: round(lat), lng: round(lng) })
}

const out = {
  source: 'Amplasamente: Primăria Arad (Regulamentul sistemului de bike sharing) · coordonate: aradbikes.ro · închirieri: © OpenStreetMap contributors (ODbL)',
  officialStations: 22,
  stations,
}
const dest = 'src/shared/data/bikes/bikes.json'
writeFileSync(dest, JSON.stringify(out, null, 1) + '\n')
console.log(`${stations.filter((s) => s.kind === 'dock').length}/22 bike-sharing stations + ${stations.filter((s) => s.kind === 'rental').length} OSM rental → ${dest}`)
