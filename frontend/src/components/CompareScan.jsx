import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2 } from 'lucide-react'

const STEPS = [
  { id: 1, text: 'Scraping source product...', duration: 1400 },
  { id: 2, text: 'Searching Amazon, Flipkart, Myntra...', duration: 1600 },
  { id: 3, text: 'Analyzing matching listings...', duration: 1800 },
  { id: 4, text: 'Computing AI similarity scores...', duration: 1200 },
  { id: 5, text: 'Generating buying recommendation...', duration: 1000 },
]

export default function CompareScan({ url, dataReady, onComplete }) {
  const [completedSteps, setCompletedSteps] = useState([])
  const [activeStep, setActiveStep] = useState(0)
  const [animDone, setAnimDone] = useState(false)
  const [waitingForData, setWaitingForData] = useState(false)
  const dataReadyRef = useRef(dataReady)

  useEffect(() => { dataReadyRef.current = dataReady }, [dataReady])

  useEffect(() => {
    let total = 0
    STEPS.forEach((step, i) => {
      setTimeout(() => {
        setActiveStep(i)
        if (i > 0) setCompletedSteps(prev => [...prev, i - 1])
      }, total)
      total += step.duration
    })
    setTimeout(() => {
      setCompletedSteps(prev => [...prev, STEPS.length - 1])
      setAnimDone(true)
    }, total)
  }, [])

  useEffect(() => {
    if (!animDone) return
    if (dataReadyRef.current) setTimeout(() => onComplete?.(), 400)
    else setWaitingForData(true)
  }, [animDone])

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
        <div className="text-cyan-400 font-mono text-sm">Comparing</div>
        <div className="text-slate-300 text-base font-medium max-w-sm truncate">{hostname}</div>
      </div>

      {/* Multi-ring scanner */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {[1, 0.7, 0.4].map((scale, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-cyan-500/30"
            style={{ width: `${scale * 96}px`, height: `${scale * 96}px` }}
            animate={{ scale: [scale, scale * 1.08, scale], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
        <motion.div
          className="absolute w-24 h-24 rounded-full border-t-2 border-r-2 border-cyan-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
        <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
      </div>

      <div className="space-y-3 w-full max-w-xs font-mono text-sm">
        <AnimatePresence>
          {STEPS.map((step, i) => {
            const isDone = completedSteps.includes(i)
            const isActive = activeStep === i && !isDone
            if (i > activeStep && !isDone) return null
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
                <span className={isDone ? 'text-slate-500' : 'text-slate-200'}>{step.text}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>

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
                {waitingForData ? 'Finalizing comparison...' : '→ Comparison ready.'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
