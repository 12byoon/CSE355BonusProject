import React, { useState } from 'react'

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
          L = &#123; w ∈ &#123;0,1&#125;* | w ≠ w&#7487; &#125;
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
            placeholder="Enter string"
            spellCheck={false}
            className="
              w-full px-3 py-2 rounded-md
              bg-white border border-slate-300
              text-slate-800 placeholder-slate-400
              text-base
              focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100
              transition-colors
            "
          />
          {error && (
            <span className="text-red-600 text-xs">{error}</span>
          )}
          <div className="text-xs text-slate-400">
            {value.length > 0 ? `Length: ${value.length}` : ''}
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

    </div>
  )
}
