import { motion } from 'framer-motion'
import { ShieldCheck, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const CONFIG = {
  BUY: {
    icon: ShieldCheck,
    label: 'BUY',
    cls: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400',
    glow: 'shadow-[0_0_30px_rgba(52,211,153,0.3)]',
  },
  WAIT: {
    icon: AlertTriangle,
    label: 'WAIT',
    cls: 'bg-amber-500/15 border-amber-500/50 text-amber-400',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
  },
  AVOID: {
    icon: XCircle,
    label: 'AVOID',
    cls: 'bg-red-500/15 border-red-500/50 text-red-400',
    glow: 'shadow-[0_0_30px_rgba(248,113,113,0.3)]',
  },
}

export default function VerdictBadge({ verdict, size = 'lg' }) {
  const cfg = CONFIG[verdict] ?? CONFIG.WAIT
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={cn(
        'inline-flex items-center gap-2 border rounded-2xl font-bold tracking-widest uppercase',
        cfg.cls,
        cfg.glow,
        size === 'lg' ? 'px-8 py-4 text-2xl' : 'px-4 py-2 text-sm'
      )}
    >
      <Icon className={size === 'lg' ? 'w-7 h-7' : 'w-4 h-4'} />
      {cfg.label}
    </motion.div>
  )
}
