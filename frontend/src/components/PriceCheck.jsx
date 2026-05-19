import { motion } from 'framer-motion'
import { TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function PriceCheck({ priceData }) {
  const { current, mrp, currency = 'INR', competitors = [], isFakeDiscount, discountPct } = priceData ?? {}

  const realDiscount = mrp && current ? Math.round(((mrp - current) / mrp) * 100) : null

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
        Price Reality Check
      </h3>

      <div className="flex items-end gap-4">
        <div>
          <div className="text-3xl font-bold text-slate-100">
            {formatCurrency(current, currency)}
          </div>
          {mrp && mrp > current && (
            <div className="text-sm text-slate-500 line-through mt-0.5">
              MRP {formatCurrency(mrp, currency)}
            </div>
          )}
        </div>
        {realDiscount !== null && (
          <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-lg ${
            isFakeDiscount ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
          }`}>
            <TrendingDown className="w-3 h-3" />
            {realDiscount}% off
          </div>
        )}
      </div>

      {isFakeDiscount && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">
            Fake anchor pricing detected — MRP is artificially inflated. Actual price
            matches competitor median.
          </p>
        </motion.div>
      )}

      {competitors.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Competitor Prices</div>
          {competitors.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                <span className="text-sm text-slate-300">{c.site}</span>
                {c.similarity_score && (
                  <span className="text-xs text-slate-600">
                    {Math.round(c.similarity_score * 100)}% match
                  </span>
                )}
              </div>
              <span className="text-sm font-mono text-slate-200">
                {formatCurrency(c.price, currency)}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {competitors.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CheckCircle className="w-4 h-4" />
          No close competitor matches found
        </div>
      )}
    </div>
  )
}
