import { motion } from 'framer-motion'
import { Bot, Clock, User, AlertTriangle } from 'lucide-react'

function Flag({ icon: Icon, label, value, flagged }) {
  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${
      flagged ? 'bg-red-500/10 border border-red-500/20' : 'bg-dark-600/50'
    }`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${flagged ? 'text-red-400' : 'text-slate-500'}`} />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <span className={`text-sm font-mono ${flagged ? 'text-red-300' : 'text-slate-400'}`}>
        {value}
      </span>
    </div>
  )
}

export default function ReviewAnalysis({ reviewData }) {
  const {
    totalReviews = 0,
    genericPhrasePct = 0,
    burstDetected = false,
    burstPct = 0,
    suspiciousNamePct = 0,
    sampleReviews = [],
  } = reviewData ?? {}

  const flags = [
    {
      icon: Bot,
      label: 'Generic bot phrases',
      value: `${Math.round(genericPhrasePct)}%`,
      flagged: genericPhrasePct > 30,
    },
    {
      icon: Clock,
      label: 'Review burst (7-day window)',
      value: burstDetected ? `${Math.round(burstPct)}% in 7 days` : 'None detected',
      flagged: burstDetected,
    },
    {
      icon: User,
      label: 'Suspicious reviewer names',
      value: `${Math.round(suspiciousNamePct)}%`,
      flagged: suspiciousNamePct > 20,
    },
  ]

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          Review Authenticity
        </h3>
        <span className="text-xs text-slate-500 font-mono">{totalReviews} reviews</span>
      </div>

      <div className="space-y-2">
        {flags.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Flag {...f} />
          </motion.div>
        ))}
      </div>

      {sampleReviews.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Sample Reviews</div>
          {sampleReviews.slice(0, 3).map((r, i) => (
            <div key={i} className="bg-dark-600/40 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{r.reviewer_name}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span key={j} className={`text-xs ${j < r.rating ? 'text-amber-400' : 'text-slate-700'}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-300 line-clamp-2">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
