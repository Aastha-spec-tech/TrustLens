import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { scrapeProduct, findCompetitors } from '../services/apify.js'
import { computeTrustScore, scoreToVerdict } from '../services/trustScore.js'
import { generateNarrative, answerFollowUp } from '../services/llm.js'
import { get as cacheGet, set as cacheSet } from '../services/cache.js'
import { loadAllDemos } from './demo.js'

const router = Router()

const SUPPORTED_DOMAINS = [
  'amazon', 'flipkart', 'myntra', 'ebay', 'meesho',
  'snapdeal', 'croma', 'tatacliq', 'ajio', 'reliancedigital',
]

function validateUrl(url) {
  let parsed
  try { parsed = new URL(url) } catch { return 'Invalid URL format' }
  if (!['http:', 'https:'].includes(parsed.protocol)) return 'URL must start with http:// or https://'
  // In live mode only, enforce supported domains
  if (process.env.DEMO_MODE !== 'true') {
    const host = parsed.hostname.toLowerCase()
    if (!SUPPORTED_DOMAINS.some(d => host.includes(d))) {
      return `Unsupported site. Supported: Amazon, Flipkart, Myntra, eBay, Meesho, Croma, and more.`
    }
  }
  return null // valid
}

function pickDemoFallback(url) {
  const demos = loadAllDemos()
  // Try keyword match first
  const keyword = demos.find(d => d._matchKeyword && url.includes(d._matchKeyword))
  if (keyword) return keyword
  // Spread load: hash the URL to always return the same demo for the same URL
  const idx = Math.abs(url.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % demos.length
  return demos[idx] ?? demos[0]
}

// POST /api/audit
router.post('/', async (req, res) => {
  const { url } = req.body ?? {}
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' })
  }

  const validationError = validateUrl(url)
  if (validationError) return res.status(400).json({ error: validationError })

  // Check cache (dedup identical requests)
  const cacheKey = `audit:${url}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.json(cached)

  // Demo mode: consistent demo per URL
  if (process.env.DEMO_MODE === 'true') {
    const demo = pickDemoFallback(url)
    const result = { ...demo, sourceUrl: url }
    cacheSet(cacheKey, result, 300)
    return res.json(result)
  }

  // ── Live scraping path ───────────────────────────────────────────────────
  try {
    let productData
    try {
      productData = await scrapeProduct(url)
    } catch (err) {
      console.error('Anakin scrape failed:', err.message)
      const fallback = pickDemoFallback(url)
      return res.json({ ...fallback, sourceUrl: url, _fallback: true })
    }

    let competitorData = { matches: [] }
    try {
      competitorData = await findCompetitors(productData.title, productData.brand, productData.specifications)
    } catch (err) {
      console.warn('Competitor search failed (non-fatal):', err.message)
    }

    const competitors = competitorData?.matches ?? []
    const scoreData = computeTrustScore(
      productData,
      productData.reviews ?? [],
      productData.seller ?? {},
      competitors
    )

    const verdict = scoreToVerdict(scoreData.trustScore)
    let narrative = { verdictReason: 'Analysis complete.', insights: [] }
    try {
      narrative = await generateNarrative(productData, scoreData, verdict)
    } catch (err) {
      console.warn('Narrative generation failed (non-fatal):', err.message)
    }

    const audit = {
      id: uuid(),
      sourceUrl: url,
      product: {
        title: productData.title,
        brand: productData.brand,
        images: productData.images ?? [],
        rating_avg: productData.rating_avg,
        rating_count: productData.rating_count,
        source_site: productData.source_site,
      },
      verdict,
      verdictReason: narrative.verdictReason,
      insights: narrative.insights ?? [],
      trustScore: scoreData.trustScore,
      signals: scoreData.signals,
      priceData: scoreData.priceData,
      reviewData: scoreData.reviewData,
      sellerData: scoreData.sellerData,
      auditedAt: new Date().toISOString(),
    }

    cacheSet(`audit:id:${audit.id}`, audit, 0) // never expires in session
    cacheSet(cacheKey, audit, 1800)

    return res.json(audit)
  } catch (err) {
    console.error('Audit error:', err)
    return res.status(500).json({ error: 'Internal audit error: ' + err.message })
  }
})

// POST /api/audit/:id/ask
router.post('/:id/ask', async (req, res) => {
  const { id } = req.params
  const { question } = req.body ?? {}

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question is required' })
  }

  const audit = cacheGet(`audit:id:${id}`)
  if (!audit) {
    return res.status(404).json({ error: 'Audit session expired. Run a new audit first.' })
  }

  const answer = await answerFollowUp(question.trim(), {
    product: audit.product,
    verdict: audit.verdict,
    verdictReason: audit.verdictReason,
    trustScore: audit.trustScore,
    signals: audit.signals,
    priceData: audit.priceData,
    reviewData: { ...audit.reviewData, sampleReviews: undefined },
    sellerData: audit.sellerData,
  })

  return res.json({ answer })
})

export default router
