import React from 'react'

export default function ControlBar({
  stepIndex,
  totalSteps,
  isPlaying,
  onStepBack,
  onStepForward,
  onPlay,
  onPause,
  onReset,
  onSeek,
  disabled,
}) {
  const atStart = stepIndex === 0
  const atEnd   = stepIndex >= totalSteps - 1

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button onClick={onReset} disabled={disabled} title="Reset (R)" className="btn-control">
        ↺ Reset
      </button>

      <div className="w-px h-5 bg-slate-200" />

      <button
        onClick={onStepBack}
        disabled={disabled || atStart || isPlaying}
        title="Step back (←)"
        className="btn-control"
      >
        ← Back
      </button>

      {isPlaying ? (
        <button onClick={onPause} disabled={disabled} title="Pause (Space)" className="btn-control-primary">
          ⏸ Pause
        </button>
      ) : (
        <button onClick={onPlay} disabled={disabled || atEnd} title="Play (Space)" className="btn-control-primary">
          ▶ Play
        </button>
      )}

      <button
        onClick={onStepForward}
        disabled={disabled || atEnd || isPlaying}
        title="Step forward (→)"
        className="btn-control"
      >
        Next →
      </button>

      <div className="w-px h-5 bg-slate-200" />

      <span className="text-sm text-slate-500 tabular-nums">
        Step {stepIndex} / {totalSteps - 1}
      </span>

      <input
        type="range"
        min={0}
        max={totalSteps - 1}
        value={stepIndex}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="flex-1 min-w-[80px] accent-blue-500 cursor-pointer"
      />
    </div>
  )
}
