// Verifică build-ul web (dist/): nu are voie să conțină nimic din aplicația mobilă (build separat, `npm run build:mobile`).
// Rulează după `npm run build` (local și în deploy.yml). Folderul se poate da ca argument: `node scripts/check-web-build.mjs dist-mobile`.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? 'dist'
// urme sigure ale aplicației mobile: numele rutelor și titluri care există doar în src/router/mobile.ts
const markers = ['m-home', 'm-vol-scan', 'm-transport-trip', 'm-itinerary-map', 'Intră ca voluntar']

function files(d) {
  return readdirSync(d).flatMap((f) => {
    const p = join(d, f)
    return statSync(p).isDirectory() ? files(p) : /\.(js|html|webmanifest)$/.test(f) ? [p] : []
  })
}

const found = []
for (const f of files(dir)) {
  const text = readFileSync(f, 'utf8')
  for (const m of markers) if (text.includes(`'${m}'`) || text.includes(`"${m}"`) || text.includes(`\`${m}\``)) found.push(`${f}: ${m}`)
}
const manifest = files(dir).filter((f) => f.endsWith('.webmanifest'))

if (found.length || manifest.length) {
  console.error(`✗ ${dir} conține cod din aplicația mobilă:`)
  for (const x of [...found, ...manifest.map((f) => `${f}: manifest PWA`)]) console.error('  ' + x)
  process.exit(1)
}
console.log(`✓ ${dir}: nimic din aplicația mobilă`)
