import axios from 'axios'
import { callLLM, parseJSON } from './llm.js'

// MiniMax AI — multi-product comparison analysis
// Free tier: https://platform.minimaxi.com
// Falls back to existing LLM (Groq/Gemini) if no MiniMax key

export async function generateComparisonAnalysis(sourceProduct, matches) {
  const prompt = buildPrompt(sourceProduct, matches)

  // Try MiniMax first, fall back to configured LLM (Groq/Gemini)
  if (process.env.MINIMAX_API_KEY) {
    try {
      const result = await callMiniMax(prompt)
      return parseJSON(result)
    } catch (err) {
      console.warn('MiniMax failed, falling back to LLM:', err.message)
    }
  }

  try {
    const result = await callLLM(prompt, 500)
    return parseJSON(result)
  } catch {
    return generateRuleBasedAnalysis(sourceProduct, matches)
  }
}

async function callMiniMax(prompt) {
  const { data } = await axios.post(
    'https://api.minimaxi.com/v1/text/chatcompletion_v2',
    {
      model: 'MiniMax-Text-01',
      messages: [
        {
          role: 'system',
          content: 'You are TrustLens AI, an expert product comparison analyst. Be concise, direct, and accurate.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.1,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  )
  return data.choices[0].message.content
}

function buildPrompt(source, matches) {
  const fmt = (p, label) =>
    `${label}: ${p.site} | Price ₹${p.price_current ?? '?'} | MRP ₹${p.price_mrp ?? '?'} | ` +
    `Rating ${p.rating_avg ?? '?'}★ (${p.rating_count ?? '?'} reviews) | ` +
    `Seller age ${p.seller_age_days ?? '?'} days | Trust ${p.trust_score ?? '?'}/100`

  const lines = [fmt(source, 'SOURCE (index 0)')]
  matches.forEach((m, i) => lines.push(fmt(m, `MATCH ${i + 1} (index ${i + 1})`)))

  return `Analyze these product listings found across e-commerce sites for the same product.

${lines.join('\n')}

Return ONLY valid JSON (no markdown):
{
  "best_value_index": <0=source,1=first match,etc — lowest price with decent trust>,
  "best_value_reason": "<one sentence>",
  "safest_seller_index": <index of listing with most trustworthy seller>,
  "safest_seller_reason": "<one sentence>",
  "suspicious_indices": [<indices of listings that look suspicious, empty array if none>],
  "suspicious_reason": "<what specifically looks suspicious, or null>",
  "best_deal_index": <index of best overall deal>,
  "verdict": "<2 sentences: overall recommendation and action to take>",
  "fake_discount_detected": <true|false — is any MRP artificially inflated?>
}`
}

function generateRuleBasedAnalysis(source, matches) {
  const all = [source, ...matches]

  const bestTrustIdx = all.reduce((bi, p, i) =>
    (p.trust_score ?? 0) > (all[bi].trust_score ?? 0) ? i : bi, 0)

  const cheapestIdx = all.reduce((bi, p, i) => {
    const price = p.price_current ?? Infinity
    return price < (all[bi].price_current ?? Infinity) ? i : bi
  }, 0)

  const suspicious = all
    .map((p, i) => ({ i, score: p.trust_score ?? 100 }))
    .filter(({ score }) => score < 40)
    .map(({ i }) => i)

  const fakeMRP = all.some(p => {
    if (!p.price_current || !p.price_mrp) return false
    const disc = ((p.price_mrp - p.price_current) / p.price_mrp) * 100
    return disc > 70
  })

  return {
    best_value_index: cheapestIdx,
    best_value_reason: cheapestIdx === 0 ? 'Source listing has lowest price' : `${all[cheapestIdx].site} offers lowest price`,
    safest_seller_index: bestTrustIdx,
    safest_seller_reason: 'Highest trust score based on seller age and review authenticity',
    suspicious_indices: suspicious,
    suspicious_reason: suspicious.length ? 'Low trust score — possible fake reviews or new seller' : null,
    best_deal_index: cheapestIdx,
    verdict: `Check all listings before purchasing. ${suspicious.length ? `Avoid listings ${suspicious.map(i => all[i].site).join(', ')} — suspicious signals detected.` : 'All listings appear legitimate.'}`,
    fake_discount_detected: fakeMRP,
  }
}
