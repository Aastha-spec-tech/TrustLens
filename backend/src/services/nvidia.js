import axios from 'axios'

// NVIDIA NIM Embeddings — semantic product similarity
// Free: 1000 API credits at build.nvidia.com
// Model: nvidia/nv-embed-v1 (2048-dim)

export async function getEmbedding(text) {
  if (!process.env.NVIDIA_API_KEY) return null
  try {
    const { data } = await axios.post(
      'https://integrate.api.nvidia.com/v1/embeddings',
      {
        model: 'nvidia/nv-embed-v1',
        input: text.slice(0, 2048),
        input_type: 'query',
        encoding_format: 'float',
        truncate: 'END',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      }
    )
    return data.data[0].embedding
  } catch (err) {
    console.warn('NVIDIA embedding failed:', err.message)
    return null
  }
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return null
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

// Jaccard word overlap — fallback when no NVIDIA key
export function jaccardSimilarity(a, b) {
  if (!a || !b) return 0
  const wa = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 2))
  const wb = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 2))
  const inter = [...wa].filter(w => wb.has(w)).length
  const union = new Set([...wa, ...wb]).size
  return union === 0 ? 0 : inter / union
}

export async function productSimilarity(titleA, titleB) {
  const text = (t) => (t ?? '').slice(0, 512)
  const [embA, embB] = await Promise.all([
    getEmbedding(text(titleA)),
    getEmbedding(text(titleB)),
  ])
  if (embA && embB) return cosineSimilarity(embA, embB)
  return jaccardSimilarity(titleA, titleB) // graceful fallback
}
