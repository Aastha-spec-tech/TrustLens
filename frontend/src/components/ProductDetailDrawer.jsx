import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Shield, Store, Star, Calendar, AlertTriangle, CheckCircle,
  Bot, Clock, User, TrendingDown, ExternalLink, ShieldCheck
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

const VERDICT_COLORS = {
  BUY:  { ring: '#34d399', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  WAIT: { ring: '#fbbf24', bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-400' },
  AVOID:{ ring: '#f87171', bg: 'bg-red-500/15',     border: 'border-red-500/40',     text: 'text-red-400' },
}

function MiniScoreRing({ score }) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const strokeDash = (score / 100) * circumference
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171'

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#1e2535" strokeWidth="6" />
        <motion.circle
          cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-lg font-bold font-mono" style={{ color }}>{score}</div>
        <div className="text-[9px] text-slate-600 uppercase tracking-widest">/ 100</div>
      </div>
    </div>
  )
}

function DetailSection({ icon: Icon, title, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-dark-600/80">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">{title}</h4>
      </div>
      {children}
    </div>
  )
}

function ReviewFlag({ icon: Icon, label, value, flagged }) {
  return (
    <div className={cn(
      'flex items-center justify-between py-2 px-3 rounded-xl',
      flagged ? 'bg-red-500/10 border border-red-500/20' : 'bg-dark-600/50'
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn('w-3.5 h-3.5', flagged ? 'text-red-400' : 'text-slate-500')} />
        <span className="text-xs text-slate-300">{label}</span>
      </div>
      <span className={cn('text-xs font-mono', flagged ? 'text-red-300' : 'text-slate-500')}>{value}</span>
    </div>
  )
}

export default function ProductDetailDrawer({ product, isOpen, onClose }) {
  if (!product) return null

  const {
    site, url, title, brand, price_current, price_mrp, currency = 'INR',
    image, rating_avg, rating_count, seller_name, seller_age_days,
    trust_score, verdict, discount_pct, is_suspicious, similarity_score,
    delivery_estimate,
    // Detailed data from the signals breakdown (may not always be present)
    _signals,
  } = product

  const vstyle = VERDICT_COLORS[verdict] ?? VERDICT_COLORS.WAIT
  const isNewSeller = seller_age_days != null && seller_age_days < 30
  const ageLabel = !seller_age_days ? 'Unknown'
    : seller_age_days < 1 ? 'New today'
    : seller_age_days < 30 ? `${seller_age_days} days`
    : seller_age_days < 365 ? `${Math.floor(seller_age_days / 30)} months`
    : `${Math.floor(seller_age_days / 365)}+ years`

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-dark-800/95
                       backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-dark-800/90 backdrop-blur-sm border-b border-white/5 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-slate-200">Seller & Review Details</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-8">
              {/* Product Summary Card */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl bg-dark-600/80 flex items-center justify-center overflow-hidden shrink-0">
                    {image
                      ? <img src={image} alt={title} className="w-full h-full object-contain p-1" />
                      : <span className="text-2xl font-bold text-slate-700">{(site ?? '?')[0].toUpperCase()}</span>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">{site}</div>
                    <p className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug">{title}</p>
                    {brand && <p className="text-xs text-slate-500 mt-0.5">{brand}</p>}
                  </div>
                </div>

                {/* Price + Verdict Row */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-100">
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
                          <TrendingDown className="w-3 h-3" />{discount_pct}% off
                        </span>
                      )}
                    </div>
                  </div>
                  {verdict && (
                    <span className={cn(
                      'text-xs font-bold px-3 py-1.5 rounded-xl border uppercase tracking-wider',
                      vstyle.bg, vstyle.border, vstyle.text
                    )}>
                      {verdict}
                    </span>
                  )}
                </div>

                {/* Rating + Similarity */}
                <div className="flex items-center gap-4 pt-1 border-t border-white/5">
                  {rating_avg != null && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-slate-300">{Number(rating_avg).toFixed(1)}</span>
                      {rating_count && (
                        <span className="text-xs text-slate-600">({rating_count.toLocaleString()})</span>
                      )}
                    </div>
                  )}
                  {similarity_score != null && similarity_score < 1 && (
                    <span className="text-xs text-slate-500 font-mono">
                      {Math.round(similarity_score * 100)}% match
                    </span>
                  )}
                  {delivery_estimate && (
                    <span className="text-xs text-slate-500">{delivery_estimate}</span>
                  )}
                </div>
              </div>

              {/* Trust Score */}
              {trust_score != null && (
                <DetailSection icon={ShieldCheck} title="Trust Score">
                  <div className="flex items-center gap-6">
                    <MiniScoreRing score={trust_score} />
                    <div className="flex-1 space-y-2">
                      {_signals ? (
                        Object.entries(_signals).map(([key, val]) => (
                          <div key={key} className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="text-slate-300 font-mono">{Math.round(val)}</span>
                            </div>
                            <div className="h-1 bg-dark-600 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-cyan-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (val / 25) * 100)}%` }}
                                transition={{ duration: 0.6 }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-1.5">
                          <div className="text-sm text-slate-300">
                            {trust_score >= 80 ? 'High trust — verified seller' :
                             trust_score >= 50 ? 'Moderate trust — proceed with caution' :
                             'Low trust — significant red flags'}
                          </div>
                          <div className={cn(
                            'flex items-center gap-1.5 text-xs',
                            is_suspicious ? 'text-red-400' : 'text-emerald-400'
                          )}>
                            {is_suspicious
                              ? <><AlertTriangle className="w-3 h-3" /> Suspicious patterns detected</>
                              : <><CheckCircle className="w-3 h-3" /> Passed automated checks</>
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </DetailSection>
              )}

              {/* Seller Information */}
              <DetailSection icon={Store} title="Seller Information">
                <div className="glass-card p-4 space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-dark-600/80 flex items-center justify-center">
                      <Store className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-100">
                        {seller_name ?? 'Unknown Seller'}
                      </div>
                      {isNewSeller && (
                        <div className="flex items-center gap-1 text-[10px] text-red-400">
                          <AlertTriangle className="w-2.5 h-2.5" /> New seller — verify before buying
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded-lg', isNewSeller ? 'bg-red-500/15' : 'bg-dark-600/60')}>
                        <Calendar className={cn('w-3.5 h-3.5', isNewSeller ? 'text-red-400' : 'text-slate-400')} />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Account Age</div>
                        <div className={cn('text-xs font-medium', isNewSeller ? 'text-red-300' : 'text-slate-200')}>
                          {ageLabel}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-dark-600/60">
                        <Star className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Rating</div>
                        <div className="text-xs font-medium text-slate-200">
                          {rating_avg ? `${Number(rating_avg).toFixed(1)} ★` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DetailSection>

              {/* Review Signals */}
              <DetailSection icon={Bot} title="Review Signals">
                <div className="space-y-2">
                  {_signals ? (
                    <>
                      <ReviewFlag
                        icon={Bot}
                        label="Review Authenticity Score"
                        value={`${Math.round(_signals.reviewAuthenticity ?? 0)}/25`}
                        flagged={(_signals.reviewAuthenticity ?? 25) < 12}
                      />
                      <ReviewFlag
                        icon={ShieldCheck}
                        label="Seller Trust Score"
                        value={`${Math.round(_signals.sellerTrust ?? 0)}/20`}
                        flagged={(_signals.sellerTrust ?? 20) < 10}
                      />
                      <ReviewFlag
                        icon={Star}
                        label="Rating Distribution"
                        value={`${Math.round(_signals.ratingDistribution ?? 0)}/15`}
                        flagged={(_signals.ratingDistribution ?? 15) < 7}
                      />
                    </>
                  ) : (
                    <>
                      <ReviewFlag
                        icon={Bot}
                        label="Bot pattern analysis"
                        value={trust_score >= 70 ? 'Clean' : 'Flagged'}
                        flagged={trust_score < 70}
                      />
                      <ReviewFlag
                        icon={Clock}
                        label="Review burst detection"
                        value={trust_score >= 60 ? 'None' : 'Detected'}
                        flagged={trust_score < 60}
                      />
                      <ReviewFlag
                        icon={User}
                        label="Reviewer name analysis"
                        value={trust_score >= 50 ? 'Normal' : 'Suspicious'}
                        flagged={trust_score < 50}
                      />
                    </>
                  )}
                </div>
              </DetailSection>

              {/* View on Site CTA */}
              {url && url !== '#' && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                             border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10
                             text-sm font-medium transition-all duration-200"
                >
                  View on {site}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
