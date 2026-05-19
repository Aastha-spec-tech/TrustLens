import { Router } from 'express'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DEMO_DIR = join(__dir, '../../../demo-data')

function loadAllDemos() {
  try {
    return readdirSync(DEMO_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try { return JSON.parse(readFileSync(join(DEMO_DIR, f), 'utf-8')) }
        catch { return null }
      })
      .filter(Boolean)
  } catch { return [] }
}

export { loadAllDemos }

export function loadDemoByUrl(url) {
  const demos = loadAllDemos()
  return demos.find(d => d.sourceUrl && url.includes(d._matchKeyword ?? '___NOMATCH___')) ?? null
}

const router = Router()

// GET /api/demo-gallery — returns all pre-cached audits for the gallery page
router.get('/', (req, res) => {
  const demos = loadAllDemos()
  // Sort: AVOID first (the money shot), then WAIT, then BUY
  const order = { AVOID: 0, WAIT: 1, BUY: 2 }
  demos.sort((a, b) => (order[a.verdict] ?? 3) - (order[b.verdict] ?? 3))
  res.json(demos)
})

export default router
