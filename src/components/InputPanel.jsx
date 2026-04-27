import React, { useState } from 'react'

const EXAMPLES = ['01', '10', '011', '0010', '10110', '010', '0110', '00100']

// input field + run button + example strings
export default function InputPanel({ onRun, disabled }) {
  const [value, setValue] = useState('')
  const [error, setError]  = useState('')

  function handleChange(e) {
    const raw = e.target.value
    if (/^[01]*$/.test(raw)) {
      setValue(raw)
      setError('')
    } else {
      setError('Only 0 and 1 are allowed.')
    }
  }

  function handleRun() {
    if (value === '') {
      setError('Enter a binary string first.')
      return
    }
    setError('')
    onRun(value)
  }

  function handleExample(ex) {
    setValue(ex)
    setError('')
    onRun(ex)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleRun()
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          NPDA Visualizer
        </h1>
        <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5">
          Non-Palindrome Acceptor
        </span>
      </div>

      {/* Input row */}
      <div className="flex gap-2 items-start">
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter binary string (e.g. 0110)"
            spellCheck={false}
            className="
              w-full px-3 py-2 rounded-md
              bg-white border border-slate-300
              text-slate-800 placeholder-slate-400
              font-mono text-base tracking-widest
              focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100
              transition-colors
            "
          />
          {error && (
            <span className="text-red-600 text-xs">{error}</span>
          )}
          <div className="text-xs text-slate-400">
            {value.length > 0 ? `Length: ${value.length}` : 'Empty string (palindrome)'}
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={disabled}
          className="
            px-4 py-2 rounded-md font-semibold text-sm
            bg-blue-600 hover:bg-blue-700 active:bg-blue-800
            text-white transition-colors shadow-sm
            disabled:opacity-40 disabled:cursor-not-allowed
            whitespace-nowrap
          "
        >
          Run
        </button>
      </div>

      {/* Example strings */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-400">Examples:</span>
        {EXAMPLES.map((ex) => {
          const isPalin = ex === ex.split('').reverse().join('')
          return (
            <button
              key={ex}
              onClick={() => handleExample(ex)}
              className={`
                text-xs px-2 py-0.5 rounded-md border font-mono transition-colors
                ${isPalin
                  ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                  : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                }
              `}
              title={isPalin ? 'Palindrome → REJECT' : 'Non-palindrome → ACCEPT'}
            >
              {ex}
            </button>
          )
        })}
      </div>
    </div>
  )
}
