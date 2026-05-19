import { motion } from 'framer-motion'
import { Store, Calendar, Star, AlertTriangle, CheckCircle } from 'lucide-react'

function SellerStat({ icon: Icon, label, value, flagged }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${flagged ? 'bg-red-500/15' : 'bg-dark-600/60'}`}>
        <Icon className={`w-4 h-4 ${flagged ? 'text-red-400' : 'text-slate-400'}`} />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`text-sm font-medium ${flagged ? 'text-red-300' : 'text-slate-200'}`}>
          {value}
        </div>
      </div>
    </div>
  )
}

export default function SellerInfo({ sellerData }) {
  const {
    name = 'Unknown Seller',
    age_days = 0,
    rating = 0,
    total_reviews = 0,
    return_policy_flags = [],
  } = sellerData ?? {}

  const isNewSeller = age_days < 30
  const isLowRating = rating > 0 && rating < 3.5

  const ageLabel = age_days < 1 ? 'New today'
    : age_days < 30 ? `${age_days} days old`
    : age_days < 365 ? `${Math.floor(age_days / 30)} months`
    : `${Math.floor(age_days / 365)}+ years`

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
        Seller Signals
      </h3>

      <div className="flex items-center gap-3 pb-2 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-dark-600/80 flex items-center justify-center">
          <Store className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <div className="text-base font-semibold text-slate-100">{name}</div>
          {isNewSeller && (
            <div className="flex items-center gap-1 text-xs text-red-400">
              <AlertTriangle className="w-3 h-3" />
              New seller — verify before buying
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SellerStat
          icon={Calendar}
          label="Account age"
          value={ageLabel}
          flagged={isNewSeller}
        />
        <SellerStat
          icon={Star}
          label="Seller rating"
          value={rating > 0 ? `${rating.toFixed(1)} ★` : 'No rating'}
          flagged={isLowRating}
        />
      </div>

      {return_policy_flags.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-1.5"
        >
          <div className="text-xs text-slate-500 uppercase tracking-wide">Return Policy Flags</div>
          {return_policy_flags.map((flag, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-red-300">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              {flag}
            </div>
          ))}
        </motion.div>
      )}

      {return_policy_flags.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle className="w-4 h-4" />
          No return policy red flags
        </div>
      )}
    </div>
  )
}
