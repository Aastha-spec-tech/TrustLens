import { motion } from 'framer-motion'
import { ExternalLink, RefreshCw } from 'lucide-react'
import VerdictBadge from './VerdictBadge'
import TrustScore from './TrustScore'
import PriceCheck from './PriceCheck'
import ReviewAnalysis from './ReviewAnalysis'
import SellerInfo from './SellerInfo'
import FollowUpChat from './FollowUpChat'

export default function AuditReport({ audit, onReset }) {
  const {
    id,
    product,
    verdict,
    verdictReason,
    trustScore,
    signals,
    insights = [],
    priceData,
    reviewData,
    sellerData,
    auditedAt,
    sourceUrl,
  } = audit

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-6 pb-16"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span className="truncate">{sourceUrl}</span>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 hover:text-cyan-400 transition-colors" />
            </a>
          </div>
          <h1 className="text-xl font-semibold text-slate-100 line-clamp-2">
            {product?.title ?? 'Product Audit'}
          </h1>
          {product?.brand && (
            <div className="text-sm text-slate-500 mt-1">{product.brand}</div>
          )}
        </div>
        <button
          onClick={onReset}
          className="shrink-0 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300
                     bg-dark-600/60 border border-white/10 px-3 py-2 rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          New audit
        </button>
      </div>

      {/* Verdict Hero */}
      <div className="glass-card p-8 text-center space-y-4">
        <VerdictBadge verdict={verdict} size="lg" />
        <p className="text-slate-300 text-lg max-w-xl mx-auto">{verdictReason}</p>

        {insights.length > 0 && (
          <ul className="text-left space-y-2 max-w-lg mx-auto mt-4">
            {insights.map((insight, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 + 0.3 }}
                className="flex items-start gap-2 text-sm text-slate-400"
              >
                <span className="text-cyan-500 mt-0.5">•</span>
                {insight}
              </motion.li>
            ))}
          </ul>
        )}

        <div className="text-xs text-slate-600">
          Audited {new Date(auditedAt).toLocaleString()}
        </div>
      </div>

      {/* Score */}
      <TrustScore score={trustScore} signals={signals} />

      {/* 2-col grid for price + reviews */}
      <div className="grid md:grid-cols-2 gap-6">
        <PriceCheck priceData={priceData} />
        <ReviewAnalysis reviewData={reviewData} />
      </div>

      {/* Seller */}
      <SellerInfo sellerData={sellerData} />

      {/* Chat */}
      <FollowUpChat auditId={id} />
    </motion.div>
  )
}
