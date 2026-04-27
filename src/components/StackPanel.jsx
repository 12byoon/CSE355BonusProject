import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STATE_BADGE = {
  q0: 'bg-blue-100 text-blue-700 border-blue-200',
  q1: 'bg-amber-100 text-amber-700 border-amber-200',
  q2: 'bg-orange-100 text-orange-700 border-orange-200',
  q3: 'bg-green-100 text-green-700 border-green-200',
}

const STATE_LABEL = {
  q0: 'q₀ Push',
  q1: 'q₁ Compare',
  q2: 'q₂ Drain',
  q3: 'q₃ Accept',
}

const STACK_CHIP = {
  Z:   'bg-slate-100 text-slate-600 border-slate-300',
  '0': 'bg-blue-100 text-blue-800 border-blue-200',
  '1': 'bg-amber-100 text-amber-800 border-amber-200',
}

const MAX_DISPLAYED = 12

// row of stack towers, one per live config
export default function StackPanel({ configs, fullInput }) {
  const displayed = configs.slice(0, MAX_DISPLAYED)
  const overflow  = configs.length - MAX_DISPLAYED

  if (configs.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 italic text-sm">
        No active configurations
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 min-h-[160px] items-end">
      <AnimatePresence initial={false}>
        {displayed.map((cfg, i) => (
          <StackTower key={i} cfg={cfg} index={i} fullInput={fullInput} />
        ))}
      </AnimatePresence>

      {overflow > 0 && (
        <div className="flex-shrink-0 flex items-center justify-center w-16 h-24 rounded-lg border border-dashed border-slate-300 text-slate-400 text-xs text-center">
          +{overflow}<br />more
        </div>
      )}
    </div>
  )
}

// visual stack tower for one configuration
function StackTower({ cfg, index, fullInput }) {
  const badgeClass = STATE_BADGE[cfg.state] ?? 'bg-slate-100 text-slate-600 border-slate-300'
  const label      = STATE_LABEL[cfg.state] ?? cfg.state
  const isAccept   = cfg.state === 'q3' && cfg.remainingInput.length === 0

  const chips = [...cfg.stack].reverse()
  const dispInput = cfg.remainingInput.length > 0 ? cfg.remainingInput : 'ε'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.18 }}
      className={`
        flex-shrink-0 flex flex-col items-center gap-1.5
        rounded-xl border p-2 min-w-[76px] shadow-sm
        ${isAccept
          ? 'border-green-300 bg-green-50'
          : 'border-slate-200 bg-white'
        }
      `}
    >
      {/* State badge */}
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${badgeClass}`}>
        {label}
      </span>

      {/* Remaining input */}
      <div
        className="text-xs text-slate-500 font-mono tracking-widest max-w-[68px] truncate text-center"
        title={`Remaining: ${cfg.remainingInput || 'ε'}`}
      >
        {dispInput}
      </div>

      {/* Stack chips — top to bottom */}
      <div className="flex flex-col gap-0.5 w-full mt-0.5">
        <AnimatePresence initial={false}>
          {chips.map((sym, si) => (
            <motion.div
              key={`${index}-${si}-${sym}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.12 }}
              className={`
                text-center text-xs font-semibold font-mono py-1 rounded border
                ${STACK_CHIP[sym] ?? 'bg-slate-100 text-slate-600 border-slate-300'}
                ${si === 0 ? 'ring-1 ring-slate-300' : ''}
              `}
            >
              {sym}
            </motion.div>
          ))}
        </AnimatePresence>

        {chips.length === 0 && (
          <div className="text-center text-xs text-slate-400 italic py-1">empty</div>
        )}
      </div>
    </motion.div>
  )
}
