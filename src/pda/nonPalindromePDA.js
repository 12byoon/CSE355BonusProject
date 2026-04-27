/**
 * 4-state NPDA for L = { w in {0,1}* | w != w^R } (binary non-palindromes)
 *
 * q0 - push input chars onto the stack, nondeterministically guess the midpoint
 * q1 - compare: pop stack top vs next input char, die on match, mismatch goes to q2
 * q2 - drain remaining input and stack after a mismatch is confirmed
 * q3 - accept
 *
 * Even-length midpoint guess uses an epsilon transition (no char consumed).
 * Odd-length guess reads and discards the middle character.
 * The drain phase makes sure only valid witness positions can reach q3.
 *
 * stackPush: symbols pushed after popping the top, last element ends up on top.
 * Empty stackPush = pure pop. input: null means epsilon transition.
 */

/** @typedef {{ id: string, label: string, role: string }} StateInfo */
/** @typedef {{ state: string, input: string|null, stackTop: string, nextState: string, stackPush: string[], description: string }} Transition */

/**
 * @typedef {Object} PDADefinition
 * @property {string[]}      states        - All state identifiers
 * @property {StateInfo[]}   stateInfo     - Display metadata per state
 * @property {string[]}      inputAlphabet
 * @property {string[]}      stackAlphabet
 * @property {string}        startState
 * @property {string}        startStack    - Symbol placed on stack at start
 * @property {string[]}      acceptStates
 * @property {Transition[]}  transitions
 */

/** @type {PDADefinition} */
export const NON_PALINDROME_PDA = {
  states: ['q0', 'q1', 'q2', 'q3'],

  stateInfo: [
    { id: 'q0', label: 'q₀', role: 'start',   description: 'Start / Push'    },
    { id: 'q1', label: 'q₁', role: 'compare', description: 'Compare'         },
    { id: 'q2', label: 'q₂', role: 'drain',   description: 'Drain'           },
    { id: 'q3', label: 'q₃', role: 'accept',  description: 'Accept'          },
  ],

  inputAlphabet: ['0', '1'],
  stackAlphabet: ['0', '1', 'Z'],

  startState: 'q0',
  startStack: 'Z',

  acceptStates: ['q3'],

  transitions: [
    // q0: push phase - read a character and push it onto the stack

    {
      state: 'q0', input: '0', stackTop: 'Z',
      nextState: 'q0', stackPush: ['Z', '0'],
      description: 'Push 0 (stack bottom: Z)',
    },
    {
      state: 'q0', input: '1', stackTop: 'Z',
      nextState: 'q0', stackPush: ['Z', '1'],
      description: 'Push 1 (stack bottom: Z)',
    },
    {
      state: 'q0', input: '0', stackTop: '0',
      nextState: 'q0', stackPush: ['0', '0'],
      description: 'Push 0 on 0',
    },
    {
      state: 'q0', input: '0', stackTop: '1',
      nextState: 'q0', stackPush: ['1', '0'],
      description: 'Push 0 on 1',
    },
    {
      state: 'q0', input: '1', stackTop: '0',
      nextState: 'q0', stackPush: ['0', '1'],
      description: 'Push 1 on 0',
    },
    {
      state: 'q0', input: '1', stackTop: '1',
      nextState: 'q0', stackPush: ['1', '1'],
      description: 'Push 1 on 1',
    },

    // q0 -> q1: guess even midpoint (epsilon, no char consumed)

    {
      state: 'q0', input: null, stackTop: '0',
      nextState: 'q1', stackPush: ['0'],
      description: 'Guess even midpoint (top=0)',
    },
    {
      state: 'q0', input: null, stackTop: '1',
      nextState: 'q1', stackPush: ['1'],
      description: 'Guess even midpoint (top=1)',
    },

    // q0 -> q1: guess odd midpoint (read and discard the middle char, don't push it)
    // these share the same (input, stackTop) pairs as the push transitions above, which is what makes it nondeterministic

    {
      state: 'q0', input: '0', stackTop: '0',
      nextState: 'q1', stackPush: ['0'],
      description: 'Guess odd midpoint, skip middle 0 (top=0)',
    },
    {
      state: 'q0', input: '0', stackTop: '1',
      nextState: 'q1', stackPush: ['1'],
      description: 'Guess odd midpoint, skip middle 0 (top=1)',
    },
    {
      state: 'q0', input: '1', stackTop: '0',
      nextState: 'q1', stackPush: ['0'],
      description: 'Guess odd midpoint, skip middle 1 (top=0)',
    },
    {
      state: 'q0', input: '1', stackTop: '1',
      nextState: 'q1', stackPush: ['1'],
      description: 'Guess odd midpoint, skip middle 1 (top=1)',
    },

    // q1: compare phase - pop stack top and read input, match stays in q1, mismatch goes to q2

    // matches - pop and keep comparing
    {
      state: 'q1', input: '0', stackTop: '0',
      nextState: 'q1', stackPush: [],
      description: 'Compare: 0 = 0 (match, pop, continue)',
    },
    {
      state: 'q1', input: '1', stackTop: '1',
      nextState: 'q1', stackPush: [],
      description: 'Compare: 1 = 1 (match, pop, continue)',
    },

    // mismatches - witness found, go to drain
    {
      state: 'q1', input: '0', stackTop: '1',
      nextState: 'q2', stackPush: [],
      description: 'Compare: 0 ≠ 1 (MISMATCH — witness found)',
    },
    {
      state: 'q1', input: '1', stackTop: '0',
      nextState: 'q2', stackPush: [],
      description: 'Compare: 1 ≠ 0 (MISMATCH — witness found)',
    },

    // no transitions for (q1, _, Z) so branch dies if stack runs out before input (wrong midpoint guess)

    // q2: drain phase - consume remaining input and pop remaining stack one-for-one
    // if input and stack don't run out at the same time the branch dies here

    {
      state: 'q2', input: '0', stackTop: '0',
      nextState: 'q2', stackPush: [],
      description: 'Drain: pop 0, read 0',
    },
    {
      state: 'q2', input: '0', stackTop: '1',
      nextState: 'q2', stackPush: [],
      description: 'Drain: pop 1, read 0',
    },
    {
      state: 'q2', input: '1', stackTop: '0',
      nextState: 'q2', stackPush: [],
      description: 'Drain: pop 0, read 1',
    },
    {
      state: 'q2', input: '1', stackTop: '1',
      nextState: 'q2', stackPush: [],
      description: 'Drain: pop 1, read 1',
    },

    // q2 -> q3: pop Z and accept (epsilon transition, fires when input is also empty)

    {
      state: 'q2', input: null, stackTop: 'Z',
      nextState: 'q3', stackPush: [],
      description: 'Drain complete: pop Z → ACCEPT',
    },
  ],
}
