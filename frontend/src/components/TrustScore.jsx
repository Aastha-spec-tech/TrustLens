import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const SIGNALS = [
  { key: 'priceReality', label: 'Price Reality', weight: 25, color: 'bg-cyan-500' },
  { key: 'reviewAuthenticity', label: 'Review Authenticity', weight: 25, color: 'bg-purple-500' },
  { key: 'sellerTrust', label: 'Seller Trust', weight: 20, color: 'bg-blue-500' },
  { key: 'ratingDistribution', label: 'Rating Distribution', weight: 15, color: 'bg-indigo-500' },
  { key: 'returnPolicy', label: 'Return Policy', weight: 15, color: 'bg-teal-500' },
]

function ScoreRing({ score }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDash = (score / 100) * circumference

  const color =
    score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171'

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="absolute inset-0 -rotate-90" width="160" height="160">
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="#1e2535"
          strokeWidth="10"
        />
        <motion.circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="text-center z-10">
        <motion.div
          className="text-4xl font-bold font-mono"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.div>
        <div className="text-xs text-slate-500 uppercase tracking-widest">/ 100</div>
      </div>
    </div>
  )
}

function SignalBar({ signal, rawScore, index }) {
  const pct = (rawScore / signal.weight) * 100
  const displayScore = Math.round(rawScore)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index + 0.6 }}
      className="space-y-1"
    >
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{signal.label}</span>
        <span className="text-slate-300 font-mono">
          {displayScore}/{signal.weight}
        </span>
      </div>
      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', signal.color)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 * index + 0.7 }}
        />
      </div>
    </motion.div>
  )
}

export default function TrustScore({ score, signals }) {
  return (
    <div className="glass-card p-6 space-y-6">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
        Trust Score
      </h3>
      <div className="flex items-center gap-8">
        <ScoreRing score={score} />
        <div className="flex-1 space-y-3">
          {SIGNALS.map((s, i) => (
            <SignalBar
              key={s.key}
              signal={s}
              rawScore={signals?.[s.key] ?? 0}
              index={i}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
