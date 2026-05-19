import { motion } from 'framer-motion'
import { ExternalLink, Star, ShieldCheck, AlertTriangle, Truck, Store, TrendingDown } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

const VERDICT_STYLES = {
  BUY:  { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  WAIT: { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-400' },
  AVOID:{ bg: 'bg-red-500/15',     border: 'border-red-500/40',     text: 'text-red-400' },
}

function Badge({ label, color }) {
  const colors = {
    cyan:    'bg-cyan-500/15 border-cyan-500/40 text-cyan-400',
    emerald: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    amber:   'bg-amber-500/15 border-amber-500/40 text-amber-400',
    purple:  'bg-purple-500/15 border-purple-500/40 text-purple-400',
    red:     'bg-red-500/15 border-red-500/40 text-red-400',
  }
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider', colors[color] ?? colors.cyan)}>
      {label}
    </span>
  )
}

export default function ProductCard({ product, index, recommendation, isSource }) {
  const {
    site, url, title, brand, price_current, price_mrp, currency = 'INR',
    image, rating_avg, rating_count, seller_name, seller_age_days,
    delivery_estimate, similarity_score, trust_score, verdict, discount_pct,
    is_suspicious,
  } = product

  const vstyle = VERDICT_STYLES[verdict] ?? VERDICT_STYLES.WAIT

  const isBestValue = recommendation?.best_value_index === index
  const isSafest    = recommendation?.safest_seller_index === index
  const isBestDeal  = recommendation?.best_deal_index === index && !isBestValue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn(
        'relative flex flex-col glass-card overflow-hidden transition-all duration-300',
        'hover:border-cyan-500/30 hover:shadow-glow',
        isSource && 'border-cyan-500/30',
        is_suspicious && 'border-red-500/20'
      )}
    >
      {/* Top badges */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10">
        {isSource  && <Badge label="Source"     color="cyan" />}
        {isBestValue && <Badge label="Best Value" color="emerald" />}
        {isSafest  && <Badge label="Safest"     color="purple" />}
        {isBestDeal && <Badge label="Best Deal"  color="amber" />}
        {is_suspicious && <Badge label="Suspicious" color="red" />}
      </div>

      {/* Image */}
      <div className="h-36 bg-dark-600/60 flex items-center justify-center overflow-hidden">
        {image
          ? <img src={image} alt={title} className="h-full w-full object-contain p-3" />
          : (
            <div className="text-3xl font-bold text-slate-700 select-none">
              {(site ?? '?').charAt(0).toUpperCase()}
            </div>
          )
        }
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 space-y-3">

        {/* Site + similarity */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
            {site}
          </span>
          {!isSource && similarity_score != null && (
            <span className="text-xs text-slate-500 font-mono">
              {Math.round(similarity_score * 100)}% match
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug">{title}</p>

        {/* Price */}
        <div className="flex items-end gap-2">
          <span className="text-xl font-bold text-slate-100">
            {price_current ? formatCurrency(price_current, currency) : '—'}
          </span>
          {price_mrp && price_mrp > price_current && (
            <span className="text-xs text-slate-600 line-through mb-0.5">
              {formatCurrency(price_mrp, currency)}
            </span>
          )}
          {discount_pct > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-emerald-400 mb-0.5">
              <TrendingDown className="w-3 h-3" />
              {discount_pct}%
            </span>
          )}
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

        {/* Seller */}
        {seller_name && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Store className="w-3 h-3" />
            <span className="truncate">{seller_name}</span>
            {seller_age_days != null && (
              <span className={seller_age_days < 30 ? 'text-red-400' : 'text-slate-600'}>
                · {seller_age_days < 30 ? '⚠ New' : `${Math.floor(seller_age_days / 30)}mo`}
              </span>
            )}
          </div>
        )}

        {/* Delivery */}
        {delivery_estimate && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Truck className="w-3 h-3" />
            {delivery_estimate}
          </div>
        )}

        {/* Trust score + verdict */}
        <div className="flex items-center justify-between pt-1 mt-auto">
          {trust_score != null ? (
            <div className="flex items-center gap-1.5">
              {is_suspicious
                ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                : <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              }
              <span className="text-xs font-mono text-slate-400">
                Trust <span className={is_suspicious ? 'text-red-400' : 'text-cyan-400'}>{trust_score}</span>/100
              </span>
            </div>
          ) : <div />}

          {verdict && (
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider', vstyle.bg, vstyle.border, vstyle.text)}>
              {verdict}
            </span>
          )}
        </div>

        {/* View on site */}
        {url && url !== '#' && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-slate-500
                       hover:text-cyan-400 border border-white/10 hover:border-cyan-500/30
                       rounded-xl py-2 transition-all duration-200 mt-1"
          >
            View on {site}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  )
}
