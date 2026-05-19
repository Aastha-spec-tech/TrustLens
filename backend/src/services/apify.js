import axios from 'axios'
import { callLLM, parseJSON } from './llm.js'

const BASE = 'https://api.apify.com/v2'

function token() {
  const t = process.env.APIFY_API_TOKEN
  if (!t) throw new Error('APIFY_API_TOKEN not set in .env')
  return t
}

// Run actor synchronously, return dataset items array
async function runActor(actorId, input, timeoutSecs = 120) {
  const { data } = await axios.post(
    `${BASE}/acts/${actorId}/run-sync-get-dataset-items`,
    input,
    {
      params: { token: token(), timeout: timeoutSecs, memory: 256 },
      headers: { 'Content-Type': 'application/json' },
      timeout: (timeoutSecs + 30) * 1000,
    }
  )
  return Array.isArray(data) ? data : []
}

function isAmazon(url) {
  try { return new URL(url).hostname.includes('amazon') } catch { return false }
}

// ─── WORKFLOW 1: Scrape product page ─────────────────────────────────────────
export async function scrapeProduct(url) {
  if (isAmazon(url)) return scrapeAmazon(url)
  return scrapeGeneric(url)
}

async function scrapeAmazon(url) {
  const items = await runActor('apify~amazon-product-scraper', {
    startUrls: [{ url }],
    maxItems: 1,
    scrapeReviews: true,
    maxReviews: 20,
  }, 120)

  const item = items[0]
  if (!item) throw new Error('Amazon scraper returned no results')

  return {
    title: item.title ?? item.name ?? '',
    brand: item.brand ?? '',
    price_current: item.price ?? item.salePrice ?? null,
    price_mrp: item.originalPrice ?? item.listPrice ?? null,
    currency: 'INR',
    images: item.images ?? item.imageUrls ?? [],
    rating_avg: item.stars ?? item.rating ?? null,
    rating_count: item.reviewsCount ?? item.numberOfReviews ?? null,
    reviews: (item.reviews ?? item.topReviews ?? []).slice(0, 20).map(r => ({
      text: r.text ?? r.body ?? '',
      rating: r.rating ?? r.stars ?? null,
      timestamp: r.date ?? null,
      reviewer_name: r.name ?? r.reviewerName ?? 'Anonymous',
    })),
    seller: {
      name: item.seller?.name ?? item.sellerName ?? null,
      age_days: null,
      rating: item.seller?.rating ?? null,
      total_reviews: null,
    },
    return_policy_text: item.returnPolicy ?? '',
    delivery_estimate: item.deliveryTime ?? item.availability ?? '',
    specifications: item.specifications ?? item.technicalDetails ?? {},
    source_site: 'amazon.in',
  }
}

async function scrapeGeneric(url) {
  const items = await runActor('apify~website-content-crawler', {
    startUrls: [{ url }],
    maxCrawlPages: 1,
    crawlerType: 'playwright:adaptive',
    outputFormats: ['markdown'],
  }, 150)

  const item = items[0]
  if (!item) throw new Error('Website crawler returned no results')

  const markdown = item.markdown ?? item.text ?? item.content ?? ''
  if (!markdown.trim()) throw new Error('Website crawler returned empty content')

  return extractProductData(markdown, url)
}

async function extractProductData(rawContent, url) {
  const today = new Date().toISOString().slice(0, 10)
  const sourceSite = (() => {
    try {
      const host = new URL(url).hostname.replace('www.', '')
      const known = [
        'flipkart.com', 'myntra.com', 'meesho.com', 'croma.com',
        'tatacliq.com', 'ajio.com', 'reliancedigital.in', 'ebay.com',
      ]
      return known.find(s => host.includes(s.split('.')[0])) ?? 'other'
    } catch { return 'other' }
  })()

  const prompt = `Extract product data from this scraped e-commerce page. Return ONLY valid JSON, no markdown fences.

Schema (null for missing fields):
{"title":"string","brand":"string","price_current":number,"price_mrp":number|null,"currency":"INR","images":["url"],"rating_avg":number|null,"rating_count":number|null,"reviews":[{"text":"string","rating":number,"timestamp":"ISO8601|null","reviewer_name":"string"}],"seller":{"name":"string","age_days":number|null,"rating":number|null,"total_reviews":number|null},"return_policy_text":"string","delivery_estimate":"string","specifications":{},"source_site":"${sourceSite}"}

Rules:
- price_current = current selling price (number only)
- price_mrp = crossed-out/MRP price
- Max 20 reviews, most recent first
- seller.age_days: days from join date to today (${today}), null if unknown

SCRAPED CONTENT:
${rawContent.slice(0, 8000)}`

  const raw = await callLLM(prompt, 2000)
  return parseJSON(raw)
}

// ─── WORKFLOW 2: Find same product on other platforms ─────────────────────────
const ALL_PLATFORMS = [
  { site: 'flipkart.com',       name: 'Flipkart' },
  { site: 'amazon.in',          name: 'Amazon' },
  { site: 'myntra.com',         name: 'Myntra' },
  { site: 'meesho.com',         name: 'Meesho' },
  { site: 'croma.com',          name: 'Croma' },
  { site: 'tatacliq.com',       name: 'Tata CLiQ' },
  { site: 'ajio.com',           name: 'AJIO' },
  { site: 'reliancedigital.in', name: 'Reliance Digital' },
]

export async function findProductOnPlatforms(productTitle, brand, sourceUrl, maxPlatforms = 3) {
  const sourceHost = (() => {
    try { return new URL(sourceUrl).hostname.replace('www.', '') } catch { return '' }
  })()

  const targets = ALL_PLATFORMS
    .filter(p => !sourceHost.includes(p.site.split('.')[0]))
    .slice(0, maxPlatforms)

  const shortTitle = productTitle.split(/[,|–—]/)[0].trim().slice(0, 80)

  const searchResults = await Promise.allSettled(
    targets.map(platform => searchOnPlatform(shortTitle, brand, platform))
  )

  return searchResults
    .map((r, i) => r.status === 'fulfilled' && r.value
      ? { ...r.value, platform: targets[i] }
      : null)
    .filter(Boolean)
    .filter(r => r.similarity_score >= 0.35)
}

async function searchOnPlatform(productTitle, brand, platform) {
  const query = `"${productTitle}" ${brand} buy online site:${platform.site}`

  try {
    const items = await runActor('apify~google-search-scraper', {
      queries: query,
      maxPagesPerQuery: 1,
      resultsPerPage: 5,
      countryCode: 'in',
      languageCode: 'en',
    }, 60)

    const results = items.flatMap(item => item.organicResults ?? item.results ?? [])

    const match = results.find(r => {
      const u = r.url ?? r.link ?? ''
      return u.includes(platform.site.split('.')[0]) || u.includes(platform.site)
    })

    if (!match) return null

    const url = match.url ?? match.link
    const title = match.title ?? ''
    const snippet = match.snippet ?? match.description ?? ''
    const priceMatch = `${title} ${snippet}`.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i)
    const priceFromSearch = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null

    return {
      site: platform.name,
      url,
      title,
      snippet,
      priceFromSearch,
      similarity_score: jaccardSimilarity(productTitle, title),
    }
  } catch {
    return null
  }
}

// ─── Legacy competitor finder (used by /api/audit) ────────────────────────────
export async function findCompetitors(productTitle, brand, keySpecs) {
  const specsStr = keySpecs && typeof keySpecs === 'object'
    ? Object.values(keySpecs).slice(0, 3).join(' ')
    : ''
  const query = `${productTitle} ${brand} ${specsStr} price buy india`.trim()

  const items = await runActor('apify~google-search-scraper', {
    queries: query,
    maxPagesPerQuery: 1,
    resultsPerPage: 10,
    countryCode: 'in',
    languageCode: 'en',
  }, 60)

  const results = items.flatMap(item => item.organicResults ?? item.results ?? [])
  return parseSearchResults(results, productTitle)
}

function parseSearchResults(results, productTitle) {
  const PRICE_RE = /(?:₹|rs\.?|inr|usd|\$)\s*([\d,]+(?:\.\d{1,2})?)/gi
  const matches = []

  for (const r of results.slice(0, 8)) {
    const siteUrl = r.url ?? r.link ?? ''
    const site = extractSiteName(siteUrl)
    if (!site) continue

    const text = `${r.title ?? ''} ${r.snippet ?? r.description ?? ''}`
    const priceMatches = [...text.matchAll(PRICE_RE)]
    if (!priceMatches.length) continue

    const price = parseFloat(priceMatches[0][1].replace(/,/g, ''))
    if (!price || price < 10) continue

    matches.push({
      site,
      url: siteUrl,
      title: r.title ?? '',
      price,
      rating: null,
      similarity_score: jaccardSimilarity(productTitle, r.title ?? ''),
    })
  }

  return {
    matches: matches
      .filter(m => m.similarity_score >= 0.55)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 3),
  }
}

function extractSiteName(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '')
    return ALL_PLATFORMS.find(p => host.includes(p.site.split('.')[0]))?.name ?? host
  } catch { return null }
}

function jaccardSimilarity(a, b) {
  if (!a || !b) return 0
  const wa = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 2))
  const wb = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 2))
  const inter = [...wa].filter(w => wb.has(w)).length
  const union = new Set([...wa, ...wb]).size
  return union === 0 ? 0 : inter / union
}
