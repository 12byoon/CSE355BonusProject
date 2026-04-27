import React from 'react'

const STATE_COLORS = {
  q0: 'text-blue-700  border-blue-200  bg-blue-50',
  q1: 'text-amber-700 border-amber-200 bg-amber-50',
  q2: 'text-orange-700 border-orange-200 bg-orange-50',
  q3: 'text-green-700  border-green-200  bg-green-50',
}

// shows the input string with consumed chars crossed out and the next one highlighted
function InputDisplay({ remaining, full }) {
  if (!full) return <span className="text-slate-400 italic text-xs">ε</span>

  const consumed = full.length - remaining.length

  return (
    <span className="font-mono tracking-widest text-sm">
      {full.split('').map((ch, i) => {
        if (i < consumed) {
          return <span key={i} className="text-slate-400 line-through">{ch}</span>
        }
        if (i === consumed) {
          return (
            <span key={i} className="bg-amber-100 text-amber-800 rounded px-0.5 font-semibold">
              {ch}
            </span>
          )
        }
        return <span key={i} className="text-slate-700">{ch}</span>
      })}
    </span>
  )
}

// table showing all live configurations at the current step
export default function ConfigTable({ configs, fullInput, stateInfo }) {
  const stateMap = Object.fromEntries(stateInfo.map((s) => [s.id, s]))

  if (configs.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-slate-400 text-sm italic">
        All branches exhausted — no live configurations
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
            <th className="text-left py-1.5 px-2 font-medium">#</th>
            <th className="text-left py-1.5 px-2 font-medium">State</th>
            <th className="text-left py-1.5 px-2 font-medium">Input</th>
            <th className="text-left py-1.5 px-2 font-medium">Stack (top → bottom)</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((cfg, idx) => {
            const info     = stateMap[cfg.state]
            const colors   = STATE_COLORS[cfg.state] ?? 'text-slate-600 border-slate-200 bg-slate-50'
            const isAccept = cfg.state === 'q3' && cfg.remainingInput.length === 0

            return (
              <tr
                key={idx}
                className={`border-b border-slate-100 ${isAccept ? 'bg-green-50' : 'hover:bg-slate-50'}`}
              >
                <td className="py-1.5 px-2 text-slate-400 tabular-nums text-xs">{idx + 1}</td>

                <td className="py-1.5 px-2">
                  <span className={`
                    inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold
                    ${colors}
                  `}>
                    <span>{info?.label ?? cfg.state}</span>
                    <span className="opacity-60 font-normal hidden sm:inline">{info?.description}</span>
                  </span>
                </td>

                <td className="py-1.5 px-2">
                  <InputDisplay remaining={cfg.remainingInput} full={fullInput} />
                  {cfg.remainingInput.length === 0 && (
                    <span className="ml-1 text-xs text-slate-400 italic">done</span>
                  )}
                </td>

                <td className="py-1.5 px-2">
                  {cfg.stack.length === 0
                    ? <span className="text-slate-400 italic text-xs">empty</span>
                    : [...cfg.stack].reverse().map((sym, si) => (
                        <span
                          key={si}
                          className={`
                            inline-block mr-1 px-1.5 py-0.5 rounded border text-xs font-semibold font-mono
                            ${sym === 'Z'  ? 'bg-slate-100 text-slate-600 border-slate-300' :
                              sym === '0'  ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                             'bg-amber-100 text-amber-700 border-amber-200'}
                          `}
                        >
                          {sym}
                        </span>
                      ))
                  }
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
