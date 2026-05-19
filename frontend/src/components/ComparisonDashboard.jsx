import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown, RefreshCw, ExternalLink } from 'lucide-react'
import ProductCard from './ProductCard'
import AIRecommendation from './AIRecommendation'

const SORTS = [
  { label: 'Price ↑',    key: 'price_asc',   fn: (a, b) => (a.price_current ?? Infinity) - (b.price_current ?? Infinity) },
  { label: 'Price ↓',    key: 'price_desc',  fn: (a, b) => (b.price_current ?? 0) - (a.price_current ?? 0) },
  { label: 'Trust ↓',    key: 'trust_desc',  fn: (a, b) => (b.trust_score ?? 0) - (a.trust_score ?? 0) },
  { label: 'Match %',    key: 'sim_desc',    fn: (a, b) => (b.similarity_score ?? 0) - (a.similarity_score ?? 0) },
]

export default function ComparisonDashboard({ comparison, onReset }) {
  const [sort, setSort] = useState('price_asc')

  const { sourceProduct, matches = [], aiRecommendation, comparedAt, sourceUrl } = comparison

  const sortFn = SORTS.find(s => s.key === sort)?.fn ?? SORTS[0].fn

  // All products flat array for recommendation index references
  const allProducts = [sourceProduct, ...matches]

  // Sorted matches (source stays pinned first)
  const sortedMatches = [...matches].sort(sortFn)

  const cheapest = allProducts.reduce((min, p) =>
    (p.price_current ?? Infinity) < (min.price_current ?? Infinity) ? p : min, allProducts[0])

  const savings = matches.length && cheapest.site !== sourceProduct.site && cheapest.price_current && sourceProduct.price_current
    ? sourceProduct.price_current - cheapest.price_current
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8 pb-16"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 line-clamp-2">
            {sourceProduct.title}
          </h1>
          {sourceProduct.brand && (
            <p className="text-sm text-slate-500 mt-0.5">{sourceProduct.brand}</p>
          )}
          <p className="text-xs text-slate-600 mt-1">
            Compared {new Date(comparedAt).toLocaleString()} · {allProducts.length} listing{allProducts.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={onReset}
          className="shrink-0 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300
                     bg-dark-600/60 border border-white/10 px-3 py-2 rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          New comparison
        </button>
      </div>

      {/* Savings callout */}
      {savings > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20
                     rounded-2xl px-5 py-4"
        >
          <div>
            <div className="text-sm font-semibold text-emerald-400">
              Save ₹{savings.toLocaleString()} by buying on {cheapest.site}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              vs. source listing at {sourceProduct.site}
            </div>
          </div>
          {cheapest.url && cheapest.url !== '#' && (
            <a
              href={cheapest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300
                         border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-colors"
            >
              View deal <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </motion.div>
      )}

      {/* AI Recommendation */}
      <AIRecommendation recommendation={aiRecommendation} allProducts={allProducts} />

      {/* Sort controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          All Listings ({allProducts.length})
        </h2>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex gap-1">
            {SORTS.map(s => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  sort === s.key
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-500 hover:text-slate-300 border border-white/5'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards grid — source pinned first, then sorted matches */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {/* Source product — always first */}
        <ProductCard
          product={sourceProduct}
          index={0}
          recommendation={aiRecommendation}
          isSource
        />
        {/* Sorted matches */}
        {sortedMatches.map((m, i) => {
          const originalIdx = allProducts.indexOf(m) // keep rec index correct
          return (
            <ProductCard
              key={m.url ?? i}
              product={m}
              index={originalIdx}
              recommendation={aiRecommendation}
              isSource={false}
            />
          )
        })}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-12 text-slate-600">
          No matching products found on other platforms.
        </div>
      )}
    </motion.div>
  )
}
