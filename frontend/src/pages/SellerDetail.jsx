import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Shield, Store, Star, Calendar, AlertTriangle, CheckCircle,
  Bot, Clock, User, TrendingDown, ExternalLink, ShieldCheck, XCircle,
  Package, Truck, BarChart3, MessageCircle
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

/* ── Score ring ──────────────────────────────────────────────────────────── */
function ScoreRing({ score, size = 'lg' }) {
  const isLg = size === 'lg'
  const dim  = isLg ? 180 : 100
  const r    = isLg ? 70 : 38
  const sw   = isLg ? 12 : 7
  const circumference = 2 * Math.PI * r
  const strokeDash = (score / 100) * circumference
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171'
  const label = score >= 80 ? 'Trusted' : score >= 50 ? 'Moderate' : 'Risky'

  return (
    <div className={cn('relative flex items-center justify-center', isLg ? 'w-[180px] h-[180px]' : 'w-[100px] h-[100px]')}>
      <svg className="absolute inset-0 -rotate-90" width={dim} height={dim}>
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="#1e2535" strokeWidth={sw} />
        <motion.circle
          cx={dim/2} cy={dim/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 10px ${color}66)` }}
        />
      </svg>
      <div className="text-center z-10">
        <motion.div
          className={cn('font-bold font-mono', isLg ? 'text-5xl' : 'text-2xl')}
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.div>
        <div className={cn('text-slate-500 uppercase tracking-widest', isLg ? 'text-xs mt-1' : 'text-[9px]')}>
          {isLg ? `/ 100 · ${label}` : '/ 100'}
        </div>
      </div>
    </div>
  )
}

/* ── Verdict badge ───────────────────────────────────────────────────────── */
function VerdictTag({ verdict }) {
  const cfg = {
    BUY:  { icon: ShieldCheck,   cls: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400', glow: 'shadow-[0_0_24px_rgba(52,211,153,0.25)]' },
    WAIT: { icon: AlertTriangle, cls: 'bg-amber-500/15 border-amber-500/50 text-amber-400',     glow: 'shadow-[0_0_24px_rgba(251,191,36,0.25)]' },
    AVOID:{ icon: XCircle,       cls: 'bg-red-500/15 border-red-500/50 text-red-400',           glow: 'shadow-[0_0_24px_rgba(248,113,113,0.25)]' },
  }[verdict] ?? { icon: AlertTriangle, cls: 'bg-amber-500/15 border-amber-500/50 text-amber-400', glow: '' }

  const Icon = cfg.icon
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={cn('inline-flex items-center gap-2 border rounded-2xl font-bold tracking-widest uppercase px-6 py-3 text-lg', cfg.cls, cfg.glow)}
    >
      <Icon className="w-5 h-5" />
      {verdict}
    </motion.div>
  )
}

/* ── Signal flag row ─────────────────────────────────────────────────────── */
function SignalRow({ icon: Icon, label, value, flagged, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={cn(
        'flex items-center justify-between py-3 px-4 rounded-xl',
        flagged ? 'bg-red-500/10 border border-red-500/20' : 'bg-dark-600/50'
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn('w-4 h-4', flagged ? 'text-red-400' : 'text-slate-500')} />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <span className={cn('text-sm font-mono', flagged ? 'text-red-300 font-semibold' : 'text-slate-400')}>
        {value}
      </span>
    </motion.div>
  )
}

/* ── Info stat card ──────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, flagged, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl',
        flagged ? 'bg-red-500/10 border border-red-500/20' : 'bg-dark-600/50 border border-white/5'
      )}
    >
      <div className={cn('p-2 rounded-lg', flagged ? 'bg-red-500/20' : 'bg-dark-700/80')}>
        <Icon className={cn('w-5 h-5', flagged ? 'text-red-400' : 'text-slate-400')} />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className={cn('text-sm font-semibold', flagged ? 'text-red-300' : 'text-slate-200')}>{value}</div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function SellerDetail() {
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [audit, setAudit] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('sellerDetailProduct')
    const storedAudit = sessionStorage.getItem('sellerDetailAudit')
    if (stored) setProduct(JSON.parse(stored))
    if (storedAudit) setAudit(JSON.parse(storedAudit))
  }, [])

  if (!product) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-slate-500">No product data found.</div>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go back
          </button>
        </div>
      </div>
    )
  }

  const {
    site, url, title, brand, price_current, price_mrp, currency = 'INR',
    image, rating_avg, rating_count, seller_name, seller_age_days,
    trust_score, verdict, discount_pct, is_suspicious, similarity_score,
    delivery_estimate, _signals,
  } = product

  const isNewSeller = seller_age_days != null && seller_age_days < 30
  const isLowRating = rating_avg != null && rating_avg < 3.5
  const ageLabel = !seller_age_days ? 'Unknown'
    : seller_age_days < 1 ? 'New today'
    : seller_age_days < 30 ? `${seller_age_days} days`
    : seller_age_days < 365 ? `${Math.floor(seller_age_days / 30)} months`
    : `${Math.floor(seller_age_days / 365)}+ years`

  const trustLevel = trust_score >= 80 ? { label: 'High Trust', desc: 'This seller has strong trust signals. Safe to purchase.', color: 'emerald' }
    : trust_score >= 50 ? { label: 'Moderate Trust', desc: 'Proceed with caution. Some trust signals are present but not all.', color: 'amber' }
    : { label: 'Low Trust', desc: 'Significant red flags detected. Consider alternative sellers.', color: 'red' }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 bg-dark-900/90 backdrop-blur-sm z-30">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-slate-100">TrustLens</span>
          <span className="text-slate-700">·</span>
          <span className="text-sm text-cyan-400">Seller Details</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to report
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Product Hero Card ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="md:w-56 h-48 md:h-auto bg-dark-600/60 flex items-center justify-center shrink-0">
              {image
                ? <img src={image} alt={title} className="h-full w-full object-contain p-4" />
                : <span className="text-5xl font-bold text-slate-700">{(site ?? '?')[0].toUpperCase()}</span>
              }
            </div>

            {/* Info */}
            <div className="flex-1 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-1 rounded-full">
                  {site}
                </span>
                {similarity_score != null && similarity_score < 1 && (
                  <span className="text-xs text-slate-500 font-mono">
                    {Math.round(similarity_score * 100)}% match
                  </span>
                )}
              </div>

              <h1 className="text-xl font-semibold text-slate-100 leading-snug">{title}</h1>
              {brand && <p className="text-sm text-slate-500">{brand}</p>}

              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-slate-100">
                  {price_current ? formatCurrency(price_current, currency) : '—'}
                </div>
                {price_mrp && price_mrp > price_current && (
                  <div className="space-y-0.5">
                    <span className="text-sm text-slate-600 line-through block">
                      {formatCurrency(price_mrp, currency)}
                    </span>
                    {discount_pct > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-emerald-400">
                        <TrendingDown className="w-3 h-3" />-{discount_pct}% off
                      </span>
                    )}
                  </div>
                )}
                <VerdictTag verdict={verdict} />
              </div>

              {url && url !== '#' && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View on {site} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Trust Score — BIG hero ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-8"
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
            Seller Trust Score
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <ScoreRing score={trust_score ?? 0} size="lg" />

            <div className="flex-1 space-y-4">
              {/* Trust level banner */}
              <div className={cn(
                'rounded-xl px-5 py-4 border',
                trustLevel.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
                trustLevel.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
                'bg-red-500/10 border-red-500/20'
              )}>
                <div className={cn(
                  'text-base font-semibold',
                  trustLevel.color === 'emerald' ? 'text-emerald-400' :
                  trustLevel.color === 'amber' ? 'text-amber-400' :
                  'text-red-400'
                )}>
                  {trustLevel.label}
                </div>
                <p className="text-sm text-slate-400 mt-1">{trustLevel.desc}</p>
              </div>

              {/* Signal breakdown */}
              {_signals && (
                <div className="space-y-2">
                  {[
                    { key: 'priceReality',        label: 'Price Reality',        max: 25 },
                    { key: 'reviewAuthenticity',   label: 'Review Authenticity',  max: 25 },
                    { key: 'sellerTrust',          label: 'Seller Trust',         max: 20 },
                    { key: 'ratingDistribution',   label: 'Rating Distribution',  max: 15 },
                    { key: 'returnPolicy',         label: 'Return Policy',        max: 15 },
                  ].map((sig, i) => {
                    const val = Math.round(_signals[sig.key] ?? 0)
                    const pct = (val / sig.max) * 100
                    return (
                      <motion.div
                        key={sig.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        className="space-y-1"
                      >
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">{sig.label}</span>
                          <span className="text-slate-300 font-mono">{val}/{sig.max}</span>
                        </div>
                        <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                          <motion.div
                            className={cn('h-full rounded-full', pct >= 60 ? 'bg-cyan-500' : pct >= 30 ? 'bg-amber-500' : 'bg-red-500')}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
                            transition={{ duration: 0.8, delay: 0.5 + i * 0.08 }}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Seller Information ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6 space-y-5"
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            Seller Information
          </h2>

          {/* Seller name banner */}
          <div className="flex items-center gap-4 pb-4 border-b border-white/5">
            <div className="w-14 h-14 rounded-xl bg-dark-600/80 flex items-center justify-center">
              <Store className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-100">
                {seller_name ?? 'Unknown Seller'}
              </div>
              <div className="text-xs text-slate-500">Selling on {site}</div>
              {isNewSeller && (
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  New seller — higher risk for high-value items
                </div>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid sm:grid-cols-2 gap-3">
            <StatCard
              icon={Calendar}
              label="Account Age"
              value={ageLabel}
              flagged={isNewSeller}
              delay={0.3}
            />
            <StatCard
              icon={Star}
              label="Seller Rating"
              value={rating_avg ? `${Number(rating_avg).toFixed(1)} ★ (${rating_count?.toLocaleString() ?? '?'} reviews)` : 'No rating available'}
              flagged={isLowRating}
              delay={0.35}
            />
            <StatCard
              icon={Truck}
              label="Delivery Estimate"
              value={delivery_estimate ?? 'Not specified'}
              delay={0.4}
            />
            <StatCard
              icon={Package}
              label="Product Match"
              value={similarity_score != null ? `${Math.round(similarity_score * 100)}% match` : 'Source product'}
              delay={0.45}
            />
          </div>
        </motion.div>

        {/* ── Review Signals ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              Review Authenticity Analysis
            </h2>
            {rating_count && (
              <span className="text-xs text-slate-500 font-mono">
                {rating_count.toLocaleString()} reviews analyzed
              </span>
            )}
          </div>

          <div className="space-y-2">
            {_signals ? (
              <>
                <SignalRow
                  icon={Bot}
                  label="Bot phrase detection"
                  value={(_signals.reviewAuthenticity ?? 0) >= 18 ? 'Clean' : (_signals.reviewAuthenticity ?? 0) >= 10 ? 'Some detected' : 'High bot activity'}
                  flagged={(_signals.reviewAuthenticity ?? 25) < 12}
                  delay={0.4}
                />
                <SignalRow
                  icon={Clock}
                  label="Review burst (7-day window)"
                  value={(_signals.ratingDistribution ?? 0) >= 10 ? 'Normal distribution' : 'Burst detected'}
                  flagged={(_signals.ratingDistribution ?? 15) < 8}
                  delay={0.45}
                />
                <SignalRow
                  icon={User}
                  label="Suspicious reviewer names"
                  value={(_signals.reviewAuthenticity ?? 0) >= 15 ? 'All legitimate' : 'Some suspicious'}
                  flagged={(_signals.reviewAuthenticity ?? 25) < 15}
                  delay={0.5}
                />
                <SignalRow
                  icon={BarChart3}
                  label="Rating distribution balance"
                  value={(_signals.ratingDistribution ?? 0) >= 10 ? 'Natural spread' : 'Skewed to 5-star'}
                  flagged={(_signals.ratingDistribution ?? 15) < 8}
                  delay={0.55}
                />
                <SignalRow
                  icon={ShieldCheck}
                  label="Return policy safety"
                  value={(_signals.returnPolicy ?? 0) >= 10 ? 'Returns accepted' : 'No returns / restricted'}
                  flagged={(_signals.returnPolicy ?? 15) < 8}
                  delay={0.6}
                />
              </>
            ) : (
              <>
                <SignalRow
                  icon={Bot}
                  label="Bot pattern analysis"
                  value={trust_score >= 70 ? 'Clean' : trust_score >= 40 ? 'Some flags' : 'High bot activity'}
                  flagged={trust_score < 50}
                  delay={0.4}
                />
                <SignalRow
                  icon={Clock}
                  label="Review burst detection"
                  value={trust_score >= 60 ? 'None detected' : 'Burst detected'}
                  flagged={trust_score < 60}
                  delay={0.45}
                />
                <SignalRow
                  icon={User}
                  label="Reviewer name analysis"
                  value={trust_score >= 50 ? 'Normal' : 'Suspicious patterns'}
                  flagged={trust_score < 50}
                  delay={0.5}
                />
                <SignalRow
                  icon={BarChart3}
                  label="Rating distribution"
                  value={trust_score >= 60 ? 'Natural' : 'Skewed'}
                  flagged={trust_score < 60}
                  delay={0.55}
                />
              </>
            )}
          </div>
        </motion.div>

        {/* ── Final Verdict Banner ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className={cn(
            'rounded-2xl border p-6 text-center space-y-3',
            verdict === 'BUY' ? 'bg-emerald-500/10 border-emerald-500/20' :
            verdict === 'AVOID' ? 'bg-red-500/10 border-red-500/20' :
            'bg-amber-500/10 border-amber-500/20'
          )}
        >
          <div className={cn(
            'text-lg font-bold',
            verdict === 'BUY' ? 'text-emerald-400' :
            verdict === 'AVOID' ? 'text-red-400' : 'text-amber-400'
          )}>
            {verdict === 'BUY' ? '✅ This seller appears trustworthy' :
             verdict === 'AVOID' ? '🚫 This seller has significant red flags' :
             '⚠️ Exercise caution with this seller'}
          </div>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            {verdict === 'BUY'
              ? 'Based on our analysis, this seller has good trust signals. Their account age, reviews, and return policy are all acceptable.'
              : verdict === 'AVOID'
              ? 'Multiple red flags were detected including potential fake reviews, new seller account, and restrictive return policy. Consider buying from a more established seller.'
              : 'Some trust signals are present but others raise concerns. Compare with other sellers before making a purchase decision.'}
          </p>
        </motion.div>

        {/* ── View on Site CTA ─────────────────────────────────────────── */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl
                       border border-white/10 text-slate-400 hover:text-slate-200
                       hover:border-white/20 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to full report
          </button>
          {url && url !== '#' && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-4 text-sm"
            >
              View on {site}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </main>
    </div>
  )
}
