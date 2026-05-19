import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2 } from 'lucide-react'

const STEPS = [
  { id: 1, text: 'Extracting product data via Anakin...', duration: 1600 },
  { id: 2, text: 'Searching 3 competitor sites...', duration: 1400 },
  { id: 3, text: 'Analyzing reviews for bot patterns...', duration: 1800 },
  { id: 4, text: 'Cross-checking seller history...', duration: 1200 },
  { id: 5, text: 'Computing trust signals...', duration: 1000 },
]

export default function ScanningAnimation({ url, dataReady, onComplete }) {
  const [completedSteps, setCompletedSteps] = useState([])
  const [activeStep, setActiveStep] = useState(0)
  const [animDone, setAnimDone] = useState(false)
  const [waitingForData, setWaitingForData] = useState(false)
  const dataReadyRef = useRef(dataReady)

  useEffect(() => { dataReadyRef.current = dataReady }, [dataReady])

  // Run the fixed animation sequence
  useEffect(() => {
    let total = 0
    STEPS.forEach((step, i) => {
      setTimeout(() => {
        setActiveStep(i)
        if (i > 0) setCompletedSteps(prev => [...prev, i - 1])
      }, total)
      total += step.duration
    })
    // After last step completes
    setTimeout(() => {
      setCompletedSteps(prev => [...prev, STEPS.length - 1])
      setAnimDone(true)
    }, total)
  }, [])

  // When animation finishes, either finish immediately or wait for data
  useEffect(() => {
    if (!animDone) return
    if (dataReadyRef.current) {
      // Data already arrived — go straight to verdict
      setTimeout(() => onComplete?.(), 400)
    } else {
      // Data still in flight — show waiting state
      setWaitingForData(true)
    }
  }, [animDone])

  // When data arrives after animation is done
  useEffect(() => {
    if (dataReady && waitingForData) {
      setWaitingForData(false)
      setTimeout(() => onComplete?.(), 400)
    }
  }, [dataReady, waitingForData])

  const hostname = (() => {
    try { return new URL(url).hostname.replace('www.', '') }
    catch { return url }
  })()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-1">
        <div className="text-cyan-400 font-mono text-sm">Auditing</div>
        <div className="text-slate-300 text-base font-medium max-w-sm truncate">{hostname}</div>
      </div>

      {/* Spinner */}
      <div className="relative">
        <motion.div
          className="w-20 h-20 rounded-full border-2 border-cyan-500/30"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-20 h-20 rounded-full border-t-2 border-r-2 border-cyan-500" />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-3 w-full max-w-xs font-mono text-sm">
        <AnimatePresence>
          {STEPS.map((step, i) => {
            const isDone = completedSteps.includes(i)
            const isActive = activeStep === i && !isDone
            const isPending = i > activeStep

            if (isPending) return null
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                {isDone
                  ? <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                  : <Loader2 className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
                }
                <span className={isDone ? 'text-slate-500' : 'text-slate-200'}>
                  {step.text}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Final line — shown after all steps done */}
        <AnimatePresence>
          {animDone && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              {waitingForData
                ? <Loader2 className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
                : <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              }
              <span className="text-cyan-300 font-semibold">
                {waitingForData ? 'Finalizing analysis...' : '→ Verdict ready.'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
