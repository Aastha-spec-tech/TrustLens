import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, AlertTriangle, Layers } from 'lucide-react'
import axios from 'axios'
import VerdictBadge from '@/components/VerdictBadge'

function ScamCard({ audit, index }) {
  const { product, verdict, verdictReason, trustScore, priceData } = audit
  const isAvoid = verdict === 'AVOID'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card-hover p-5 space-y-4 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 line-clamp-2">
            {product?.title ?? 'Product'}
          </p>
          {product?.brand && (
            <p className="text-xs text-slate-500 mt-0.5">{product.brand}</p>
          )}
        </div>
        <VerdictBadge verdict={verdict} size="sm" />
      </div>

      {/* Score bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Trust Score</span>
          <span className={`font-mono ${
            trustScore >= 80 ? 'text-emerald-400'
            : trustScore >= 50 ? 'text-amber-400'
            : 'text-red-400'
          }`}>{trustScore}/100</span>
        </div>
        <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              trustScore >= 80 ? 'bg-emerald-500'
              : trustScore >= 50 ? 'bg-amber-500'
              : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${trustScore}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
          />
        </div>
      </div>

      <p className="text-xs text-slate-400 line-clamp-2">{verdictReason}</p>

      {priceData?.isFakeDiscount && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertTriangle className="w-3 h-3" />
          Fake anchor pricing detected
        </div>
      )}
    </motion.div>
  )
}

export default function Gallery() {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/demo-gallery')
      .then(({ data }) => setAudits(data))
      .catch(() => setAudits([]))
      .finally(() => setLoading(false))
  }, [])

  const avoid = audits.filter(a => a.verdict === 'AVOID')
  const wait = audits.filter(a => a.verdict === 'WAIT')
  const buy = audits.filter(a => a.verdict === 'BUY')

  return (
    <div className="min-h-screen bg-dark-900">
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-slate-100">TrustLens</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/compare"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-400 transition-colors"
          >
            <Layers className="w-4 h-4" />
            Compare
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Audit
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-100">Scam Gallery</h1>
          <p className="text-slate-500">
            Real examples of deceptive product listings caught by TrustLens.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-slate-600 py-20">Loading gallery...</div>
        ) : (
          <>
            {avoid.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                    Avoid — Scam Listings
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {avoid.map((a, i) => <ScamCard key={a.id} audit={a} index={i} />)}
                </div>
              </section>
            )}

            {wait.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                    Wait — Proceed with Caution
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wait.map((a, i) => <ScamCard key={a.id} audit={a} index={i} />)}
                </div>
              </section>
            )}

            {buy.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                    Buy — Verified Safe
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buy.map((a, i) => <ScamCard key={a.id} audit={a} index={i} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
