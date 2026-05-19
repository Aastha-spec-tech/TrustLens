import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Shield, Layers, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import CompareScan from '@/components/CompareScan'
import ComparisonDashboard from '@/components/ComparisonDashboard'

const EXAMPLES = [
  'https://www.amazon.in/dp/...',
  'https://www.flipkart.com/...',
  'https://www.myntra.com/...',
]

export default function Compare() {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState('input') // input | scanning | result | error
  const [comparison, setComparison] = useState(null)
  const [dataReady, setDataReady] = useState(false)
  const [error, setError] = useState('')
  const [placeholder] = useState(() => EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)])

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    setPhase('scanning')
    setDataReady(false)
    setComparison(null)
    setError('')

    axios.post('/api/compare', { url: trimmed })
      .then(({ data }) => {
        setComparison(data)
        setDataReady(true)
      })
      .catch(err => {
        setError(err.response?.data?.error ?? 'Comparison failed. Check the URL and try again.')
        setDataReady(true)
      })
  }

  function onScanComplete() {
    setPhase(error ? 'error' : 'result')
  }

  function reset() {
    setPhase('input')
    setComparison(null)
    setDataReady(false)
    setUrl('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-slate-100">TrustLens</span>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5 text-sm text-cyan-400">
            <Layers className="w-4 h-4" />
            Compare
          </div>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Audit
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {phase === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4 pt-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20
                             text-cyan-400 text-xs font-mono px-4 py-1.5 rounded-full"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Multi-platform comparison
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-100 leading-tight">
                  Find the same product
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    everywhere it's sold.
                  </span>
                </h1>
                <p className="text-slate-500 max-w-lg mx-auto">
                  Paste one URL. TrustLens finds the same product across Amazon, Flipkart,
                  Myntra and more — AI-ranked by price, trust, and seller safety.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-dark-700/60 border border-white/10 rounded-2xl pl-12 pr-4 py-4
                               text-slate-200 placeholder-slate-600 outline-none text-base
                               focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-4 text-base">
                  Compare across platforms
                </button>
              </form>

              {/* Feature highlights */}
              <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {[
                  { icon: '🔍', title: 'AI Matching', desc: 'NVIDIA embeddings find the exact same product even with different names' },
                  { icon: '💰', title: 'Price Intel', desc: 'Real prices from all platforms, fake discount detection included' },
                  { icon: '🛡️', title: 'Trust Analysis', desc: 'Each listing scored for seller age, review authenticity, return policy' },
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="glass-card p-4 text-center space-y-2"
                  >
                    <div className="text-2xl">{f.icon}</div>
                    <div className="text-sm font-semibold text-slate-200">{f.title}</div>
                    <div className="text-xs text-slate-500">{f.desc}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'scanning' && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CompareScan url={url} dataReady={dataReady} onComplete={onScanComplete} />
            </motion.div>
          )}

          {phase === 'result' && comparison && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ComparisonDashboard comparison={comparison} onReset={reset} />
            </motion.div>
          )}

          {phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4 pt-24"
            >
              <div className="text-red-400 font-mono text-sm bg-red-500/10 border border-red-500/20
                              rounded-xl px-4 py-3 max-w-md mx-auto">
                {error}
              </div>
              <button onClick={reset} className="btn-primary">Try again</button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
