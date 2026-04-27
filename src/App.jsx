import React, { useState, useEffect, useRef, useCallback } from 'react'

import { NON_PALINDROME_PDA } from './pda/nonPalindromePDA.js'
import { runSimulation, stepResult } from './pda/pdaSimulator.js'

import InputPanel   from './components/InputPanel.jsx'
import ControlBar   from './components/ControlBar.jsx'
import StateDiagram from './components/StateDiagram.jsx'
import StackPanel   from './components/StackPanel.jsx'
import ConfigTable  from './components/ConfigTable.jsx'
import ResultBanner from './components/ResultBanner.jsx'

/** Speed → interval ms */
function speedToMs(speed) {
  return Math.round(1000 / speed)
}

export default function App() {
  const pda = NON_PALINDROME_PDA

  // simulation state
  const [fullInput,   setFullInput]   = useState('')
  const [simulation,  setSimulation]  = useState(null)
  const [stepIndex,   setStepIndex]   = useState(0)
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [speed,       setSpeed]       = useState(1)

  const playIntervalRef = useRef(null)

  // derived values
  const currentConfigs = simulation?.history[stepIndex] ?? []
  const totalSteps     = simulation?.history.length ?? 1
  const isLastStep     = stepIndex >= totalSteps - 1

  const currentResult  = simulation
    ? stepResult(pda, currentConfigs, isLastStep)
    : null

  const activeStates = new Set(currentConfigs.map((c) => c.state))

  // play/pause
  const stopPlay = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const startPlay = useCallback(() => {
    if (!simulation) return
    setIsPlaying(true)

    playIntervalRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= simulation.history.length - 1) {
          stopPlay()
          return prev
        }
        return prev + 1
      })
    }, speedToMs(speed))
  }, [simulation, speed, stopPlay])

  useEffect(() => {
    if (isLastStep && isPlaying) stopPlay()
  }, [isLastStep, isPlaying, stopPlay])

  useEffect(() => {
    if (isPlaying) {
      stopPlay()
      setTimeout(startPlay, 10)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed])

  useEffect(() => () => stopPlay(), [stopPlay])

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT') return

      if (e.key === ' ') {
        e.preventDefault()
        if (isPlaying) stopPlay()
        else if (simulation && !isLastStep) startPlay()
      }
      if (e.key === 'ArrowRight' && !isPlaying && simulation && !isLastStep) {
        setStepIndex((p) => Math.min(p + 1, totalSteps - 1))
      }
      if (e.key === 'ArrowLeft' && !isPlaying && simulation && stepIndex > 0) {
        setStepIndex((p) => Math.max(p - 1, 0))
      }
      if (e.key === 'r' || e.key === 'R') {
        handleReset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, simulation, isLastStep, stepIndex, totalSteps])

  // handlers
  function handleRun(input) {
    stopPlay()
    const result = runSimulation(pda, input)
    setFullInput(input)
    setSimulation(result)
    setStepIndex(0)
  }

  function handleReset() {
    stopPlay()
    setStepIndex(0)
  }

  function handleStepBack() {
    stopPlay()
    setStepIndex((p) => Math.max(p - 1, 0))
  }

  function handleStepForward() {
    setStepIndex((p) => Math.min(p + 1, totalSteps - 1))
  }

  // render
  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-800">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 px-5 pt-4 pb-3 flex flex-col gap-3 border-b border-slate-200 bg-white shadow-sm">
        <InputPanel onRun={handleRun} disabled={isPlaying} />

        {simulation && (
          <>
            <ResultBanner result={currentResult} inputString={fullInput} />
            <ControlBar
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              isPlaying={isPlaying}
              speed={speed}
              onStepBack={handleStepBack}
              onStepForward={handleStepForward}
              onPlay={startPlay}
              onPause={stopPlay}
              onReset={handleReset}
              onSpeedChange={(s) => setSpeed(s)}
              disabled={false}
            />
          </>
        )}

        <div className="text-xs text-slate-400 flex gap-4">
          <span>Space: play/pause</span>
          <span>← →: step</span>
          <span>R: reset</span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex items-start">

        {/* Left: State Diagram */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 p-4">
          <SectionHeader>State Diagram</SectionHeader>
          <div className="h-[420px] bg-white rounded-lg border border-slate-200 shadow-sm">
            <StateDiagram pda={pda} activeStates={activeStates} />
          </div>
        </div>

        {/* Right: Stacks + Table */}
        <div className="w-[480px] flex-shrink-0 flex flex-col">

          {/* Stack towers */}
          <div className="border-b border-slate-200 p-4 bg-[#f8fafc]">
            <SectionHeader>
              Active Configurations
              {simulation && (
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  ({currentConfigs.length} live)
                </span>
              )}
            </SectionHeader>
            {simulation ? (
              <StackPanel configs={currentConfigs} fullInput={fullInput} />
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 italic text-sm">
                Run a string to start
              </div>
            )}
          </div>

          {/* Config table */}
          <div className="p-4 bg-white">
            <SectionHeader>Configuration Table</SectionHeader>
            {simulation ? (
              <ConfigTable
                configs={currentConfigs}
                fullInput={fullInput}
                stateInfo={pda.stateInfo}
              />
            ) : (
              <div className="h-20 flex items-center justify-center text-slate-400 italic text-sm">
                —
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="border-t border-slate-200 p-4 bg-[#f8fafc]">
            <Legend />
          </div>
        </div>
      </div>
    </div>
  )
}

// sub-components

function SectionHeader({ children }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
      {children}
    </h2>
  )
}

function Legend() {
  const states = [
    { id: 'q0', label: 'q₀', color: '#4f7ec9', desc: 'Start / Push' },
    { id: 'q1', label: 'q₁', color: '#b07d1a', desc: 'Compare' },
    { id: 'q2', label: 'q₂', color: '#c0622b', desc: 'Drain' },
    { id: 'q3', label: 'q₃', color: '#2e8f62', desc: 'Accept' },
  ]
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {states.map((s) => (
        <div key={s.id} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border" style={{ background: s.color + '33', borderColor: s.color }} />
          <span className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</span>
          <span className="text-xs text-slate-500">{s.desc}</span>
        </div>
      ))}
      <div className="text-xs text-slate-400 w-full mt-0.5">
        L = &#123; w ∈ &#123;0,1&#125;* | w ≠ w<sup>R</sup> &#125;
      </div>
    </div>
  )
}
