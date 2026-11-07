// Verifică build-ul web (dist/): nu are voie să conțină nimic din aplicația mobilă (build separat, `npm run build:mobile`).
// Rulează după `npm run build` (local și în deploy.yml). Folderul se poate da ca argument: `node scripts/check-web-build.mjs dist-mobile`.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? 'dist'
// urme sigure ale aplicației mobile: orice nume de rută `m-…` (src/router/mobile.ts), layout-ul și un titlu doar din aplicație
const markers = [/['"`]m-[a-z][a-z-]*['"`]/g, /MobileLayout/g, /Intră ca voluntar/g]

function files(d) {
  return readdirSync(d).flatMap((f) => {
    const p = join(d, f)
    return statSync(p).isDirectory() ? files(p) : /\.(js|html|webmanifest)$/.test(f) ? [p] : []
  })
}

const found = []
for (const f of files(dir)) {
  const text = readFileSync(f, 'utf8')
  for (const m of markers) for (const hit of new Set(text.match(m) ?? [])) found.push(`${f}: ${hit}`)
}
const manifest = files(dir).filter((f) => f.endsWith('.webmanifest'))

if (found.length || manifest.length) {
  console.error(`✗ ${dir} conține cod din aplicația mobilă:`)
  for (const x of [...found, ...manifest.map((f) => `${f}: manifest PWA`)]) console.error('  ' + x)
  process.exit(1)
}
console.log(`✓ ${dir}: nimic din aplicația mobilă`)
