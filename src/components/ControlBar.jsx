import React from 'react'

// step navigation, play/pause, and speed controls
export default function ControlBar({
  stepIndex,
  totalSteps,
  isPlaying,
  speed,
  onStepBack,
  onStepForward,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  disabled,
}) {
  const atStart = stepIndex === 0
  const atEnd   = stepIndex >= totalSteps - 1
  const SPEEDS  = [0.25, 0.5, 1, 2, 4]

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Reset */}
      <button onClick={onReset} disabled={disabled} title="Reset (R)" className="btn-control">
        ↺ Reset
      </button>

      <div className="w-px h-5 bg-slate-200" />

      {/* Step back */}
      <button
        onClick={onStepBack}
        disabled={disabled || atStart || isPlaying}
        title="Step back (←)"
        className="btn-control"
      >
        ← Back
      </button>

      {/* Play / Pause */}
      {isPlaying ? (
        <button onClick={onPause} disabled={disabled} title="Pause (Space)" className="btn-control-primary">
          ⏸ Pause
        </button>
      ) : (
        <button onClick={onPlay} disabled={disabled || atEnd} title="Play (Space)" className="btn-control-primary">
          ▶ Play
        </button>
      )}

      {/* Step forward */}
      <button
        onClick={onStepForward}
        disabled={disabled || atEnd || isPlaying}
        title="Step forward (→)"
        className="btn-control"
      >
        Next →
      </button>

      <div className="w-px h-5 bg-slate-200" />

      {/* Step counter */}
      <span className="text-sm text-slate-500 tabular-nums">
        Step {stepIndex} / {totalSteps - 1}
      </span>

      {/* Progress bar */}
      <div className="flex-1 min-w-[80px] h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-200"
          style={{ width: totalSteps > 1 ? `${(stepIndex / (totalSteps - 1)) * 100}%` : '0%' }}
        />
      </div>

      <div className="w-px h-5 bg-slate-200" />

      {/* Speed */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Speed:</span>
        <div className="flex gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`
                text-xs px-2 py-0.5 rounded border transition-colors
                ${speed === s
                  ? 'border-blue-400 bg-blue-50 text-blue-700 font-semibold'
                  : 'border-slate-300 text-slate-500 bg-white hover:border-slate-400 hover:text-slate-700'
                }
              `}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
