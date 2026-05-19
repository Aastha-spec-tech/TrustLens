import axios from 'axios'

// Free LLM providers only. No paid APIs.
// Priority: GROQ → GEMINI → TOGETHER → stub
// All have free tiers, no card required.

export async function callLLM(prompt, maxTokens = 400) {
  if (process.env.GROQ_API_KEY)    return callGroq(prompt, maxTokens)
  if (process.env.GEMINI_API_KEY)  return callGemini(prompt, maxTokens)
  if (process.env.TOGETHER_API_KEY) return callTogether(prompt, maxTokens)
  throw new Error('Set GROQ_API_KEY or GEMINI_API_KEY in .env (both free, no card needed)')
}

// ─── Groq — Llama 3.3 70B ────────────────────────────────────────────────────
// Free: 14,400 req/day, 131K context
// Key: https://console.groq.com/keys  (instant, no card)
async function callGroq(prompt, maxTokens) {
  const { data } = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.1,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  )
  return data.choices[0].message.content
}

// ─── Google Gemini 2.0 Flash ──────────────────────────────────────────────────
// Free: 15 RPM, 1 million tokens/day, 1500 req/day
// Key: https://aistudio.google.com/apikey  (instant, no card)
async function callGemini(prompt, maxTokens) {
  const { data } = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.1 },
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
  )
  return data.candidates[0].content.parts[0].text
}

// ─── Together AI — Llama 3.1 70B ─────────────────────────────────────────────
// Free: $1 credit on signup (covers ~hundreds of audits), open-source models
// Key: https://api.together.xyz/settings/api-keys
async function callTogether(prompt, maxTokens) {
  const { data } = await axios.post(
    'https://api.together.xyz/v1/chat/completions',
    {
      model: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.1,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    }
  )
  return data.choices[0].message.content
}

// ─── Parse JSON from any LLM response (handles markdown fences) ──────────────
export function parseJSON(text) {
  if (typeof text !== 'string') return text
  const fence = text.match(/```(?:json)?\n?([\s\S]+?)\n?```/)
  if (fence) return JSON.parse(fence[1])
  const obj = text.match(/(\{[\s\S]+\})/)
  if (obj) return JSON.parse(obj[1])
  return JSON.parse(text)
}

// ─── Generate verdict narrative ───────────────────────────────────────────────
export async function generateNarrative(product, scoreData, verdict) {
  const { signals, priceData, reviewData, sellerData } = scoreData

  const prompt = `You are TrustLens, an AI product auditor. Trust signals are pre-computed — do NOT change any numbers. Write only the narrative.

PRODUCT: ${product?.title ?? 'Unknown'} by ${product?.brand ?? 'Unknown'}
VERDICT: ${verdict} (Trust Score: ${scoreData.trustScore}/100)

SIGNALS:
- Price Reality: ${signals.priceReality}/25${priceData?.isFakeDiscount ? ' ⚠️ FAKE ANCHOR PRICING' : ''}
- Review Authenticity: ${signals.reviewAuthenticity}/25${reviewData?.burstDetected ? ` ⚠️ BURST: ${Math.round(reviewData.burstPct)}% in 7 days` : ''}
- Seller Trust: ${signals.sellerTrust}/20${(sellerData?.age_days ?? 999) < 30 ? ' ⚠️ NEW SELLER <30 days' : ''}
- Rating Distribution: ${signals.ratingDistribution}/15
- Return Policy: ${signals.returnPolicy}/15${sellerData?.return_policy_flags?.length ? ` ⚠️ "${sellerData.return_policy_flags[0]}"` : ''}

Return ONLY this JSON (no markdown):
{"verdictReason":"<one sentence, max 20 words, plain English>","insights":["<most important finding>","<second finding>","<third finding>"]}`

  try {
    const raw = await callLLM(prompt, 300)
    return parseJSON(raw)
  } catch {
    return fallbackNarrative(verdict, scoreData)
  }
}

// ─── Follow-up chat (scoped to this audit only) ───────────────────────────────
export async function answerFollowUp(question, auditContext) {
  const prompt = `You are TrustLens. Answer using ONLY the audit data below. Be direct, 2-3 sentences. If the data doesn't cover it, say so.

AUDIT:
${JSON.stringify({
  product: auditContext.product,
  verdict: auditContext.verdict,
  trustScore: auditContext.trustScore,
  signals: auditContext.signals,
  priceData: auditContext.priceData,
  reviewData: { ...auditContext.reviewData, sampleReviews: undefined },
  sellerData: auditContext.sellerData,
}, null, 2)}

QUESTION: ${question}`

  try {
    return await callLLM(prompt, 200)
  } catch {
    return "Couldn't retrieve an answer right now. Check the audit signals above for context."
  }
}

// ─── Stub fallback when no LLM key is configured ─────────────────────────────
function fallbackNarrative(verdict, scoreData) {
  const { signals, priceData, reviewData, sellerData } = scoreData
  const reasons = {
    BUY: 'Strong trust signals across price, reviews, and seller history.',
    WAIT: 'Some signals require attention before purchasing.',
    AVOID: 'Multiple high-risk signals detected — proceed with extreme caution.',
  }
  const bullets = []
  if (priceData?.isFakeDiscount)             bullets.push('Artificially inflated MRP — actual discount is misleading')
  if (reviewData?.burstDetected)             bullets.push(`${Math.round(reviewData.burstPct)}% of reviews in a single 7-day burst`)
  if ((sellerData?.age_days ?? 999) < 30)    bullets.push('Seller account under 30 days old — high risk')
  if (signals.reviewAuthenticity < 10)       bullets.push('High proportion of generic bot-like review phrases')
  if (sellerData?.return_policy_flags?.length) bullets.push(`Return policy red flag: "${sellerData.return_policy_flags[0]}"`)
  if (signals.priceReality === 25)           bullets.push('Price aligns with competitor market rates')
  if (signals.sellerTrust === 20)            bullets.push('Established seller with good track record')
  while (bullets.length < 3) bullets.push('Analysis based on available product data')
  return { verdictReason: reasons[verdict], insights: bullets.slice(0, 3) }
}
