import { motion } from 'framer-motion'
import { Sparkles, ShieldCheck, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

function RecoRow({ icon: Icon, label, value, color = 'cyan', delay = 0 }) {
  const colors = {
    cyan:    'text-cyan-400 bg-cyan-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber:   'text-amber-400 bg-amber-500/10',
    red:     'text-red-400 bg-red-500/10',
    purple:  'text-purple-400 bg-purple-500/10',
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0"
    >
      <div className={`p-1.5 rounded-lg shrink-0 ${colors[color]}`}>
        <Icon className={`w-3.5 h-3.5 ${colors[color].split(' ')[0]}`} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">{label}</div>
        <div className="text-sm text-slate-200">{value}</div>
      </div>
    </motion.div>
  )
}

export default function AIRecommendation({ recommendation, allProducts }) {
  if (!recommendation) return null

  const {
    best_value_index,
    best_value_reason,
    safest_seller_index,
    safest_seller_reason,
    suspicious_indices = [],
    suspicious_reason,
    verdict,
    fake_discount_detected,
  } = recommendation

  const getLabel = (idx) => {
    if (!allProducts || idx == null) return 'Unknown'
    const p = allProducts[idx]
    return p ? `${p.site}${p.price_current ? ` · ₹${p.price_current.toLocaleString()}` : ''}` : 'Unknown'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-cyan-500/10">
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">AI Recommendation</h3>
          <p className="text-xs text-slate-600">Powered by TrustLens AI</p>
        </div>
      </div>

      {/* Main verdict */}
      <div className="bg-dark-600/60 rounded-xl px-4 py-3">
        <p className="text-sm text-slate-300 leading-relaxed">{verdict}</p>
      </div>

      {/* Signal rows */}
      <div>
        <RecoRow
          icon={TrendingDown}
          label="Best Value"
          value={`${getLabel(best_value_index)} — ${best_value_reason}`}
          color="emerald"
          delay={0.1}
        />
        <RecoRow
          icon={ShieldCheck}
          label="Safest Seller"
          value={`${getLabel(safest_seller_index)} — ${safest_seller_reason}`}
          color="purple"
          delay={0.2}
        />
        {suspicious_indices.length > 0 && (
          <RecoRow
            icon={AlertTriangle}
            label={`Suspicious (${suspicious_indices.length})`}
            value={`${suspicious_indices.map(i => allProducts?.[i]?.site ?? `Listing ${i}`).join(', ')} — ${suspicious_reason ?? 'Low trust signals'}`}
            color="red"
            delay={0.3}
          />
        )}
        {fake_discount_detected && (
          <RecoRow
            icon={AlertTriangle}
            label="Fake Discount Detected"
            value="One or more listings show artificially inflated MRP pricing"
            color="amber"
            delay={0.35}
          />
        )}
        {!suspicious_indices.length && !fake_discount_detected && (
          <RecoRow
            icon={CheckCircle}
            label="No Red Flags"
            value="All listings passed suspicious-pattern checks"
            color="emerald"
            delay={0.3}
          />
        )}
      </div>
    </motion.div>
  )
}
