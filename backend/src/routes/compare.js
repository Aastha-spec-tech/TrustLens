import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { scrapeProduct, findProductOnPlatforms } from '../services/apify.js'
import { computeTrustScore, scoreToVerdict } from '../services/trustScore.js'
import { productSimilarity } from '../services/nvidia.js'
import { generateComparisonAnalysis } from '../services/minimax.js'
import { get as cacheGet, set as cacheSet } from '../services/cache.js'
import { isUsingMemory } from '../services/mongodb.js'
import { loadAllDemos } from './demo.js'

let ComparisonModel = null
async function getModel() {
  if (ComparisonModel) return ComparisonModel
  if (!isUsingMemory()) {
    const mod = await import('../models/Comparison.js')
    ComparisonModel = mod.default
  }
  return ComparisonModel
}

const router = Router()

const SUPPORTED_DOMAINS = [
  'amazon', 'flipkart', 'myntra', 'ebay', 'meesho',
  'snapdeal', 'croma', 'tatacliq', 'ajio', 'reliancedigital',
]

function validateUrl(url) {
  try {
    const p = new URL(url)
    if (!['http:', 'https:'].includes(p.protocol)) return 'URL must be http/https'
    if (process.env.DEMO_MODE !== 'true') {
      const host = p.hostname.toLowerCase()
      if (!SUPPORTED_DOMAINS.some(d => host.includes(d)))
        return 'Unsupported site. Supported: Amazon, Flipkart, Myntra, eBay, Meesho, Croma.'
    }
    return null
  } catch { return 'Invalid URL format' }
}

// Build a snapshot from scraped data + search snippet fallback
function buildSnapshot(site, url, scraped, snippetData, similarity) {
  const data = scraped ?? {}
  const srcPrice   = data.price_current ?? snippetData?.priceFromSearch ?? null
  const srcMrp     = data.price_mrp ?? null
  const discPct    = srcMrp && srcPrice && srcMrp > srcPrice
    ? Math.round(((srcMrp - srcPrice) / srcMrp) * 100)
    : null

  const scoreData = scraped
    ? computeTrustScore(scraped, scraped.reviews ?? [], scraped.seller ?? {}, [])
    : null

  return {
    site: scraped?.source_site ?? site,
    url,
    title: scraped?.title ?? snippetData?.title ?? null,
    brand: scraped?.brand ?? null,
    price_current: srcPrice,
    price_mrp: srcMrp,
    currency: scraped?.currency ?? 'INR',
    image: scraped?.images?.[0] ?? null,
    rating_avg: scraped?.rating_avg ?? null,
    rating_count: scraped?.rating_count ?? null,
    seller_name: scraped?.seller?.name ?? null,
    seller_age_days: scraped?.seller?.age_days ?? null,
    delivery_estimate: scraped?.delivery_estimate ?? null,
    similarity_score: Math.round((similarity ?? 0) * 100) / 100,
    trust_score: scoreData?.trustScore ?? null,
    verdict: scoreData ? scoreToVerdict(scoreData.trustScore) : null,
    is_suspicious: scoreData ? scoreData.trustScore < 40 : false,
    discount_pct: discPct,
    // carry review/seller detail for AI context
    _signals: scoreData?.signals ?? null,
  }
}

// ─── POST /api/compare ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { url } = req.body ?? {}
  if (!url) return res.status(400).json({ error: 'url is required' })

  const err = validateUrl(url)
  if (err) return res.status(400).json({ error: err })

  const cacheKey = `compare:${url}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.json({ ...cached, fromCache: true })

  if (process.env.DEMO_MODE === 'true') {
    const result = buildDemoComparison(url)
    cacheSet(cacheKey, result, 300)
    return res.json(result)
  }

  // ── Live path ──────────────────────────────────────────────────────────────
  try {
    // Step 1: Scrape the source product page
    let sourceRaw
    try {
      sourceRaw = await scrapeProduct(url)
    } catch (e) {
      console.error('Source scrape failed:', e.message)
      return res.json({ ...buildDemoComparison(url), _fallback: true })
    }

    const sourceScoreData = computeTrustScore(
      sourceRaw,
      sourceRaw.reviews ?? [],
      sourceRaw.seller ?? {},
      []
    )

    const sourceSnapshot = buildSnapshot(
      new URL(url).hostname.replace('www.', ''),
      url,
      sourceRaw,
      null,
      1.0
    )

    // Step 2: Find same product on other platforms (targeted per-platform search)
    let platformResults = []
    try {
      platformResults = await findProductOnPlatforms(
        sourceRaw.title,
        sourceRaw.brand,
        url,
        3  // search 3 other platforms
      )
      console.log(`Found ${platformResults.length} platform matches for: ${sourceRaw.title?.slice(0, 40)}`)
    } catch (e) {
      console.warn('Platform search failed:', e.message)
    }

    // Step 3: Scrape each platform's product page in parallel
    const scrapedResults = await Promise.allSettled(
      platformResults.map(p => scrapeProduct(p.url))
    )

    // Step 4: Build match snapshots — use scraped data, fall back to search snippet
    const matchSnapshots = await Promise.all(
      platformResults.map(async (p, i) => {
        const scraped = scrapedResults[i].status === 'fulfilled'
          ? scrapedResults[i].value
          : null

        if (scrapedResults[i].status === 'rejected') {
          console.warn(`Scrape failed for ${p.url}: ${scrapedResults[i].reason?.message}`)
        }

        // Compute similarity: NVIDIA if available, else Jaccard
        const sim = await productSimilarity(sourceRaw.title, p.title).catch(() => p.similarity_score)

        return buildSnapshot(p.site, p.url, scraped, p, sim)
      })
    )

    // Filter out matches with very low similarity after scraping
    const validMatches = matchSnapshots.filter(m =>
      m.similarity_score >= 0.3 || m.price_current != null
    )

    // Step 5: AI comparison analysis
    const aiRecommendation = await generateComparisonAnalysis(
      sourceSnapshot,
      validMatches
    ).catch(() => null)

    const comparison = {
      id: uuid(),
      sourceUrl: url,
      sourceProduct: sourceSnapshot,
      matches: validMatches,
      aiRecommendation,
      comparedAt: new Date().toISOString(),
      fromCache: false,
    }

    // Persist to MongoDB (non-blocking)
    const Model = await getModel()
    if (Model) {
      Model.create({ _id: comparison.id, ...comparison })
        .catch(e => console.warn('DB save failed:', e.message))
    }

    cacheSet(cacheKey, comparison, 3600)
    cacheSet(`comparison:id:${comparison.id}`, comparison, 0)

    return res.json(comparison)
  } catch (err) {
    console.error('Compare error:', err)
    return res.status(500).json({ error: 'Comparison failed: ' + err.message })
  }
})

// ─── GET /api/compare/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const cached = cacheGet(`comparison:id:${req.params.id}`)
  if (cached) return res.json({ ...cached, fromCache: true })

  const Model = await getModel()
  if (Model) {
    const doc = await Model.findById(req.params.id).lean().catch(() => null)
    if (doc) {
      cacheSet(`comparison:id:${req.params.id}`, doc, 3600)
      return res.json({ ...doc, fromCache: true })
    }
  }
  return res.status(404).json({ error: 'Comparison not found or expired' })
})

// ─── Demo comparison ──────────────────────────────────────────────────────────
function buildDemoComparison(url) {
  const demos = loadAllDemos()
  const idx = Math.abs(url.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % demos.length
  const base = demos[idx]

  const sourceProduct = {
    site: base.product?.source_site ?? 'amazon.in',
    url,
    title: base.product?.title,
    brand: base.product?.brand,
    price_current: base.priceData?.current,
    price_mrp: base.priceData?.mrp,
    currency: base.priceData?.currency ?? 'INR',
    image: null,
    rating_avg: base.product?.rating_avg,
    rating_count: base.product?.rating_count,
    seller_name: base.sellerData?.name,
    seller_age_days: base.sellerData?.age_days,
    delivery_estimate: '2-4 days',
    similarity_score: 1.0,
    trust_score: base.trustScore,
    verdict: base.verdict,
    is_suspicious: base.trustScore < 40,
    discount_pct: base.priceData?.discountPct,
  }

  const DEMO_PLATFORMS = ['Flipkart', 'Myntra', 'Meesho']
  const matches = (base.priceData?.competitors ?? []).map((c, i) => ({
    site: c.site ?? DEMO_PLATFORMS[i] ?? 'Other',
    url: c.url ?? '#',
    title: c.title ?? base.product?.title,
    brand: base.product?.brand,
    price_current: c.price,
    price_mrp: Math.round(c.price * 1.3),
    currency: 'INR',
    image: null,
    rating_avg: parseFloat((3.8 + i * 0.2).toFixed(1)),
    rating_count: 500 + i * 300,
    seller_name: `${(c.site ?? DEMO_PLATFORMS[i] ?? 'Store').split('.')[0]} Official`,
    seller_age_days: 180 + i * 90,
    delivery_estimate: i === 0 ? '1-2 days' : '3-5 days',
    similarity_score: c.similarity_score ?? 0.85,
    trust_score: 58 + i * 12,
    verdict: 'WAIT',
    is_suspicious: false,
    discount_pct: 22 + i * 5,
  }))

  return {
    id: `demo-compare-${idx}`,
    sourceUrl: url,
    sourceProduct,
    matches,
    aiRecommendation: {
      best_value_index: matches.length ? 1 : 0,
      best_value_reason: matches.length
        ? `${matches[0].site} offers lower price for the same product`
        : 'Only one listing found',
      safest_seller_index: 0,
      safest_seller_reason: 'Source listing has strongest seller trust signals',
      suspicious_indices: base.trustScore < 40 ? [0] : [],
      suspicious_reason: base.trustScore < 40 ? base.verdictReason : null,
      best_deal_index: matches.length ? 1 : 0,
      verdict: base.verdictReason + ' Compare with alternatives before purchasing.',
      fake_discount_detected: base.priceData?.isFakeDiscount ?? false,
    },
    comparedAt: new Date().toISOString(),
    fromCache: false,
  }
}

export default router
