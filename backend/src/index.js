import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import auditRouter from './routes/audit.js'
import demoRouter, { loadAllDemos } from './routes/demo.js'
import compareRouter from './routes/compare.js'
import { set as cacheSet } from './services/cache.js'
import { connectDB } from './services/mongodb.js'

const app = express()
const PORT = process.env.PORT ?? 3001

const ALLOWED_ORIGINS = [
  'http://localhost:5173', 'http://localhost:5174',
  'http://localhost:4173', 'http://localhost:3000',
  /\.vercel\.app$/,
  process.env.FRONTEND_URL,
].filter(Boolean)
app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(express.json())

// Health
app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }))

// Routes
app.use('/api/audit', auditRouter)
app.use('/api/compare', compareRouter)
app.use('/api/demo-gallery', demoRouter)

// 404
app.use((req, res) => res.status(404).json({ error: `No route: ${req.method} ${req.path}` }))

// Error handler
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message ?? 'Internal server error' })
})

// Pre-load demo audits into cache (follow-up chat works after restart)
function warmDemoCache() {
  const demos = loadAllDemos()
  for (const d of demos) {
    if (d.id) cacheSet(`audit:id:${d.id}`, d, 0)
  }
  console.log(`Demo cache warmed: ${demos.length} audits`)
}

// Auto-enable demo mode if no Apify token configured
const hasApifyToken = !!process.env.APIFY_API_TOKEN
if (!hasApifyToken && process.env.DEMO_MODE !== 'false') {
  process.env.DEMO_MODE = 'true'
}

const hasLLMKey = !!(
  process.env.GROQ_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.TOGETHER_API_KEY
)

async function start() {
  await connectDB()

  app.listen(PORT, () => {
    warmDemoCache()
    console.log(`\nTrustLens backend → http://localhost:${PORT}`)
    console.log(`Apify token     : ${hasApifyToken ? 'YES' : 'NO (demo mode active)'}`)
    console.log(`LLM key         : ${hasLLMKey ? 'YES' : 'NO (follow-up chat uses stubs)'}`)
    console.log(`NVIDIA key      : ${process.env.NVIDIA_API_KEY ? 'YES (semantic similarity active)' : 'NO (using Jaccard fallback)'}`)
    console.log(`MiniMax key     : ${process.env.MINIMAX_API_KEY ? 'YES' : 'NO (using configured LLM)'}`)
    console.log(`Demo mode       : ${process.env.DEMO_MODE === 'true' ? 'ON' : 'OFF'}`)
    console.log('')
  })
}

start().catch(err => {
  console.error('Startup failed:', err)
  process.exit(1)
})
