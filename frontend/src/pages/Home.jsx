import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Shield, Zap, Grid } from 'lucide-react'
import axios from 'axios'
import ScanningAnimation from '@/components/ScanningAnimation'
import UnifiedReport from '@/components/UnifiedReport'

const PLACEHOLDER_URLS = [
  'https://www.amazon.in/dp/...',
  'https://www.flipkart.com/...',
  'https://www.myntra.com/...',
  'https://www.ebay.com/itm/...',
]

export default function Home() {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState('input') // input | scanning | report | error
  const [audit, setAudit] = useState(null)
  const [comparison, setComparison] = useState(null) // null = loading, object = done
  const [dataReady, setDataReady] = useState(false) // API has responded (audit is the gate)
  const [error, setError] = useState('')
  const [placeholder] = useState(
    () => PLACEHOLDER_URLS[Math.floor(Math.random() * PLACEHOLDER_URLS.length)]
  )

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    setPhase('scanning')
    setDataReady(false)
    setAudit(null)
    setComparison(null)
    setError('')

    // Fire BOTH audit and comparison in parallel
    // Audit is the primary — its completion gates the scanning animation
    // Comparison can arrive later (it will pop in when ready)
    const auditPromise = axios.post('/api/audit', { url: trimmed })
      .then(({ data }) => {
        setAudit(data)
        setDataReady(true)
      })
      .catch(err => {
        const msg = err.response?.data?.error ?? 'Audit failed. Check the URL and try again.'
        setError(msg)
        setDataReady(true)
      })

    // Comparison runs independently — doesn't block the scanning animation
    axios.post('/api/compare', { url: trimmed })
      .then(({ data }) => {
        setComparison(data)
      })
      .catch(() => {
        // Non-fatal: comparison just won't show
        setComparison({ matches: [] })
      })
  }

  // Called by ScanningAnimation after animation completes AND dataReady=true
  function onScanComplete() {
    if (error) {
      setPhase('error')
    } else if (audit) {
      setPhase('report')
    }
  }

  function reset() {
    setPhase('input')
    setAudit(null)
    setComparison(null)
    setDataReady(false)
    setUrl('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-slate-100">TrustLens</span>
          <span className="text-xs text-slate-600 ml-1">AI Audit</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/gallery"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Grid className="w-4 h-4" />
            Scam Gallery
          </Link>
        </div>
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
              {/* Hero */}
              <div className="text-center space-y-4 pt-12">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 150 }}
                  className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20
                             text-cyan-400 text-xs font-mono px-4 py-1.5 rounded-full"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Audit + Compare in one scan
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-100 leading-tight">
                  Paste any product URL.
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    Get the truth.
                  </span>
                </h1>
                <p className="text-slate-500 max-w-md mx-auto">
                  Scam signals, fake-discount detection, bot-review analysis, and
                  cross-platform comparison — all in one scan.
                </p>
              </div>

              {/* URL Input */}
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
                               focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10
                               transition-all duration-200"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-4 text-base">
                  Audit & Compare
                </button>
              </form>

              {/* Supported sites */}
              <div className="text-center">
                <div className="text-xs text-slate-600 mb-3">Supported platforms</div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
                  {['Amazon', 'Flipkart', 'Myntra', 'eBay', 'Meesho', 'Croma'].map(site => (
                    <span key={site} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
                      {site}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScanningAnimation
                url={url}
                dataReady={dataReady}
                onComplete={onScanComplete}
              />
            </motion.div>
          )}

          {phase === 'report' && audit && (
            <motion.div
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <UnifiedReport
                audit={audit}
                comparison={comparison}
                onReset={reset}
              />
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
              <button onClick={reset} className="btn-primary">
                Try again
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
