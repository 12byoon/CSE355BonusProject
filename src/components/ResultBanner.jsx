import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// animated accept/reject banner
export default function ResultBanner({ result, inputString }) {
  const isAccept = result === 'accept'
  const isReject = result === 'reject'
  const show     = isAccept || isReject

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={result + inputString}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`
            flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm
            ${isAccept
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <span className={`
              text-base font-bold w-6 h-6 rounded-full flex items-center justify-center
              ${isAccept ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}
            `}>
              {isAccept ? '✓' : '✗'}
            </span>
            <div>
              <div className="font-semibold">
                {isAccept ? 'Accepted' : 'Rejected'}
              </div>
              <div className="text-xs font-normal opacity-75">
                {inputString
                  ? `"${inputString}" is ${isAccept ? 'not a palindrome' : 'a palindrome (or empty)'}`
                  : 'Empty string'
                }
              </div>
            </div>
          </div>

          <div className="text-xs opacity-60 text-right leading-snug">
            {isAccept
              ? 'A branch reached q₃'
              : 'All branches exhausted'
            }
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
