// Deterministic trust scoring. LLM never touches these numbers.
// Weights: priceReality(25) + reviewAuthenticity(25) + sellerTrust(20)
//          + ratingDistribution(15) + returnPolicy(15) = 100

const BOT_PHRASES = [
  'very nice product', 'good quality', 'value for money', 'nice product',
  'good product', 'best product', 'excellent product', 'highly recommend',
  'worth it', 'satisfied', 'fast delivery', 'good packaging', 'as described',
  'five stars', '5 stars', 'awesome product', 'great product', 'perfect product',
]

const RETURN_RED_FLAGS = [
  'no returns', 'no return', 'no refund', 'final sale', 'as-is', 'as is',
  'all sales final', 'damaged in transit not covered', 'non-refundable',
  'no exchange', 'sold as is',
]

const SUSPICIOUS_NAME_PATTERNS = [
  /^user\d{3,}/i,
  /^[a-z]{1,4}\d{4,}$/i,
  /^customer\d+/i,
  /^buyer\d+/i,
  /^[a-z]\d{5,}$/i,
]

// 1. Price Reality (max 25)
function scorePriceReality(product, competitors) {
  const { price_current: current, price_mrp: mrp } = product

  if (!current) return { score: 12, isFakeDiscount: false, discountPct: null }

  // No competitors → neutral half score
  if (!competitors?.length) return { score: 17, isFakeDiscount: false, discountPct: null }

  const validComps = competitors.filter(c => c.price && c.similarity_score >= 0.75)
  if (!validComps.length) return { score: 17, isFakeDiscount: false, discountPct: null }

  const median = validComps
    .map(c => c.price)
    .sort((a, b) => a - b)[Math.floor(validComps.length / 2)]

  const discountPct = mrp ? ((mrp - current) / mrp) * 100 : 0
  const pctFromMedian = Math.abs(current - median) / median

  // Fake anchor: MRP discount > 60% AND price ≈ competitor median
  const isFakeDiscount = discountPct > 60 && pctFromMedian < 0.1

  let score
  if (isFakeDiscount) {
    score = 5 // heavy penalty
  } else if (pctFromMedian < 0.05) {
    score = 25 // fair price
  } else if (current < median) {
    score = 20 // cheaper than market — slight suspicion
  } else {
    // overpriced relative to market
    score = Math.max(8, 25 - Math.floor(pctFromMedian * 20))
  }

  return { score, isFakeDiscount, discountPct: Math.round(discountPct) }
}

// 2. Review Authenticity (max 25)
function scoreReviewAuthenticity(reviews = []) {
  if (!reviews.length) return { score: 13, genericPhrasePct: 0, burstDetected: false, burstPct: 0, suspiciousNamePct: 0 }

  // Generic phrase detection
  const genericCount = reviews.filter(r =>
    BOT_PHRASES.some(p => r.text?.toLowerCase().includes(p))
  ).length
  const genericPhrasePct = (genericCount / reviews.length) * 100

  // Burst detection — > 40% in any 7-day window
  const dated = reviews.filter(r => r.timestamp).map(r => new Date(r.timestamp).getTime())
  let burstPct = 0
  let burstDetected = false
  if (dated.length >= 5) {
    dated.sort((a, b) => a - b)
    const WEEK = 7 * 86400 * 1000
    for (let i = 0; i < dated.length; i++) {
      const windowEnd = dated[i] + WEEK
      const inWindow = dated.filter(d => d >= dated[i] && d <= windowEnd).length
      const pct = (inWindow / dated.length) * 100
      if (pct > burstPct) burstPct = pct
    }
    burstDetected = burstPct > 40
  }

  // Suspicious reviewer names
  const suspiciousCount = reviews.filter(r =>
    SUSPICIOUS_NAME_PATTERNS.some(p => p.test(r.reviewer_name ?? ''))
  ).length
  const suspiciousNamePct = (suspiciousCount / reviews.length) * 100

  // Score
  let score = 25
  if (genericPhrasePct > 60) score -= 12
  else if (genericPhrasePct > 30) score -= 6
  if (burstDetected) score -= 8
  if (suspiciousNamePct > 40) score -= 6
  else if (suspiciousNamePct > 20) score -= 3
  score = Math.max(0, score)

  return { score, genericPhrasePct, burstDetected, burstPct, suspiciousNamePct }
}

// 3. Seller Trust (max 20)
function scoreSellerTrust(seller = {}) {
  const { age_days = 0, rating = 0, total_reviews = 0 } = seller
  let score = 20

  if (age_days < 30) score -= 12
  else if (age_days < 90) score -= 6
  else if (age_days < 180) score -= 2

  if (rating > 0) {
    if (rating < 3) score -= 6
    else if (rating < 4) score -= 3
  }

  // Suspicious velocity: many reviews in very short time
  if (age_days > 0 && total_reviews / age_days > 10) score -= 4

  return Math.max(0, score)
}

// 4. Rating Distribution (max 15)
function scoreRatingDistribution(product) {
  const { rating_avg: avg, rating_count: count } = product ?? {}
  if (!avg || !count) return 8

  // If rating seems suspiciously perfect
  if (avg >= 4.9 && count > 50) return 3
  if (avg >= 4.8 && count > 200) return 6
  if (avg >= 4.0) return 15
  if (avg >= 3.5) return 10
  return 5
}

// 5. Return Policy (max 15)
function scoreReturnPolicy(returnPolicyText = '') {
  const safeText = returnPolicyText || ''
  const lower = safeText.toLowerCase()
  const flags = RETURN_RED_FLAGS.filter(f => lower.includes(f))
  if (flags.length >= 2) return { score: 0, flags }
  if (flags.length === 1) return { score: 5, flags }
  if (!safeText.trim()) return { score: 8, flags: [] }
  return { score: 15, flags: [] }
}

export function computeTrustScore(product, reviews, seller, competitors) {
  const priceResult = scorePriceReality(product, competitors)
  const reviewResult = scoreReviewAuthenticity(reviews)
  const sellerScore = scoreSellerTrust(seller)
  const ratingScore = scoreRatingDistribution(product)
  const returnResult = scoreReturnPolicy(product?.return_policy_text)

  const total = Math.round(
    priceResult.score +
    reviewResult.score +
    sellerScore +
    ratingScore +
    returnResult.score
  )

  return {
    trustScore: Math.min(100, Math.max(0, total)),
    signals: {
      priceReality: priceResult.score,
      reviewAuthenticity: reviewResult.score,
      sellerTrust: sellerScore,
      ratingDistribution: ratingScore,
      returnPolicy: returnResult.score,
    },
    priceData: {
      current: product?.price_current,
      mrp: product?.price_mrp,
      currency: product?.currency ?? 'INR',
      isFakeDiscount: priceResult.isFakeDiscount,
      discountPct: priceResult.discountPct,
      competitors: competitors?.filter(c => c.similarity_score >= 0.75) ?? [],
    },
    reviewData: {
      totalReviews: reviews?.length ?? 0,
      genericPhrasePct: reviewResult.genericPhrasePct,
      burstDetected: reviewResult.burstDetected,
      burstPct: reviewResult.burstPct,
      suspiciousNamePct: reviewResult.suspiciousNamePct,
      sampleReviews: reviews?.slice(0, 5) ?? [],
    },
    sellerData: {
      name: seller?.name,
      age_days: seller?.age_days ?? 0,
      rating: seller?.rating ?? 0,
      total_reviews: seller?.total_reviews ?? 0,
      return_policy_flags: returnResult.flags,
    },
  }
}

export function scoreToVerdict(score) {
  if (score >= 80) return 'BUY'
  if (score >= 50) return 'WAIT'
  return 'AVOID'
}
