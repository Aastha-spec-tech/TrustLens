import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, ExternalLink, ShieldCheck, AlertTriangle, Star, TrendingDown, Loader2, ChevronRight } from 'lucide-react'
import axios from 'axios'
import { formatCurrency } from '@/lib/utils'

// Seller trust pill
function SellerBadge({ ageDays, trustScore }) {
  const isNew    = ageDays != null && ageDays < 30
  const isSketchy = trustScore != null && trustScore < 45

  if (isNew || isSketchy) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5
                        rounded-full bg-red-500/15 border border-red-500/30 text-red-400">
        <AlertTriangle className="w-2.5 h-2.5" />
        {isNew ? 'New seller' : 'Low trust'}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5
                      rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
      <ShieldCheck className="w-2.5 h-2.5" />
      Trusted
    </span>
  )
}

function PlatformCard({ product, isBestDeal, isSource, index }) {
  const {
    site, url, price_current, price_mrp, currency = 'INR',
    rating_avg, rating_count, seller_name, seller_age_days,
    trust_score, discount_pct, title,
  } = product

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`relative shrink-0 w-52 rounded-2xl border p-4 space-y-3 transition-all
                  ${isBestDeal
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : isSource
                    ? 'bg-cyan-500/10 border-cyan-500/20'
                    : 'bg-dark-600/60 border-white/5 hover:border-white/10'}`}
    >
      {/* Best deal badge */}
      {isBestDeal && (
        <div className="absolute -top-2.5 left-4">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full
                           bg-emerald-500 text-dark-900 uppercase tracking-wide">
            Best Deal
          </span>
        </div>
      )}
      {isSource && !isBestDeal && (
        <div className="absolute -top-2.5 left-4">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full
                           bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 uppercase tracking-wide">
            Source
          </span>
        </div>
      )}

      {/* Site name */}
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">
        {site}
      </div>

      {/* Price */}
      <div>
        <div className="text-xl font-bold text-slate-100">
          {price_current ? formatCurrency(price_current, currency) : '—'}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {price_mrp && price_mrp > price_current && (
            <span className="text-xs text-slate-600 line-through">
              {formatCurrency(price_mrp, currency)}
            </span>
          )}
          {discount_pct > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-emerald-400">
              <TrendingDown className="w-3 h-3" />
              {discount_pct}% off
            </span>
          )}
        </div>
      </div>

      {/* Rating */}
      {rating_avg != null && (
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-sm text-slate-300">{Number(rating_avg).toFixed(1)}</span>
          {rating_count && (
            <span className="text-xs text-slate-600">({rating_count.toLocaleString()})</span>
          )}
        </div>
      )}

      {/* Seller trust */}
      <div className="space-y-1">
        {seller_name && (
          <p className="text-xs text-slate-500 truncate">{seller_name}</p>
        )}
        <SellerBadge ageDays={seller_age_days} trustScore={trust_score} />
      </div>

      {/* View link */}
      {url && url !== '#' && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-xs text-slate-500
                     hover:text-cyan-400 transition-colors group"
        >
          View on {site}
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </a>
      )}
    </motion.div>
  )
}

export default function InlineCompare({ sourceUrl }) {
  const [phase, setPhase] = useState('idle') // idle | loading | done | error
  const [comparison, setComparison] = useState(null)
  const [error, setError] = useState('')

  async function runCompare() {
    setPhase('loading')
    try {
      const { data } = await axios.post('/api/compare', { url: sourceUrl })
      setComparison(data)
      setPhase('done')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Comparison failed')
      setPhase('error')
    }
  }

  const allProducts = comparison
    ? [comparison.sourceProduct, ...(comparison.matches ?? [])]
    : []

  const bestDealIdx = comparison?.aiRecommendation?.best_deal_index ?? 0

  return (
    <div className="glass-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Compare on Other Platforms</h3>
            <p className="text-xs text-slate-600">Find same product · check seller trust everywhere</p>
          </div>
        </div>

        {phase === 'idle' && (
          <button onClick={runCompare} className="btn-primary px-4 py-2 text-sm">
            Compare now
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">

        {/* Loading */}
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 py-4"
          >
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-sm text-slate-400 font-mono">
              Searching Amazon, Flipkart, Myntra...
            </span>
          </motion.div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between py-2"
          >
            <span className="text-sm text-red-400">{error}</span>
            <button onClick={runCompare} className="text-xs text-slate-500 hover:text-slate-300 underline">
              Retry
            </button>
          </motion.div>
        )}

        {/* Results */}
        {phase === 'done' && comparison && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* AI verdict */}
            {comparison.aiRecommendation?.verdict && (
              <div className="bg-dark-600/60 rounded-xl px-4 py-3 text-sm text-slate-300">
                {comparison.aiRecommendation.verdict}
              </div>
            )}

            {/* Horizontal scroll cards */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
                 style={{ scrollbarWidth: 'thin' }}>
              {allProducts.map((p, i) => (
                <PlatformCard
                  key={p.url ?? i}
                  product={p}
                  index={i}
                  isSource={i === 0}
                  isBestDeal={i === bestDealIdx && bestDealIdx !== 0}
                />
              ))}
            </div>

            {/* Savings callout */}
            {(() => {
              const src = comparison.sourceProduct
              const best = allProducts[bestDealIdx]
              const saving = src?.price_current && best?.price_current && bestDealIdx !== 0
                ? src.price_current - best.price_current
                : 0
              return saving > 50 ? (
                <div className="flex items-center justify-between bg-emerald-500/10
                                border border-emerald-500/20 rounded-xl px-4 py-3">
                  <div className="text-sm text-emerald-400 font-semibold">
                    Save {formatCurrency(saving, 'INR')} by switching to {best.site}
                  </div>
                  {best.url && best.url !== '#' && (
                    <a href={best.url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1 text-xs text-emerald-400
                                  hover:text-emerald-300 transition-colors">
                      View deal <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : null
            })()}

            {allProducts.length <= 1 && (
              <p className="text-xs text-slate-600 text-center py-2">
                No matching listings found on other platforms.
              </p>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
