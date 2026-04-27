// nondeterministic PDA simulation engine.
// tracks all active configurations simultaneously. Each step consumes one input symbol
// across all branches then computes epsilon closure.
// full history is precomputed so the UI can step forward and backward.

import { configKey, stackTop, applyStackOp } from './pdaUtils.js';

// returns all transitions that can fire from this config on the given input symbol (null = epsilon)
function applicableTransitions(pda, config, inputSymbol) {
  const top = stackTop(config.stack);
  return pda.transitions.filter(
    (t) =>
      t.state === config.state &&
      t.input === inputSymbol &&
      t.stackTop === top,
  );
}

// apply a transition and return the new config (doesn't mutate)
function applyTransition(config, transition, consumedSymbol) {
  return {
    state: transition.nextState,
    remainingInput: consumedSymbol === null
      ? config.remainingInput
      : config.remainingInput.slice(1),
    stack: applyStackOp(config.stack, transition.stackPush),
  };
}

// initial config before any input is consumed
export function createInitialConfig(pda, inputString) {
  return {
    state: pda.startState,
    remainingInput: inputString,
    stack: [pda.startStack],
  };
}

// keep applying epsilon transitions until no new configs are reachable
export function epsilonClosure(pda, configs) {
  const seen = new Map();
  const worklist = [...configs];

  for (const cfg of configs) {
    seen.set(configKey(cfg), cfg);
  }

  while (worklist.length > 0) {
    const cfg = worklist.pop();
    const epsTrans = applicableTransitions(pda, cfg, null);

    for (const t of epsTrans) {
      const next = applyTransition(cfg, t, null);
      const key = configKey(next);
      if (!seen.has(key)) {
        seen.set(key, next);
        worklist.push(next);
      }
    }
  }

  return Array.from(seen.values());
}

// consume the next input symbol across all live configs, then epsilon-close
// configs with no matching transition just die (drop out of the set)
export function stepForward(pda, configs) {
  const nextSet = new Map();

  for (const cfg of configs) {
    if (cfg.remainingInput.length === 0) continue;

    const symbol = cfg.remainingInput[0];
    const applicable = applicableTransitions(pda, cfg, symbol);

    for (const t of applicable) {
      const next = applyTransition(cfg, t, symbol);
      const key = configKey(next);
      if (!nextSet.has(key)) {
        nextSet.set(key, next);
      }
    }
  }

  return epsilonClosure(pda, Array.from(nextSet.values()));
}

// accept by final state: must be in accept state with no remaining input
export function isAccepting(pda, config) {
  return (
    pda.acceptStates.includes(config.state) &&
    config.remainingInput.length === 0
  );
}

// run the full simulation and store every step in history so the UI can scrub through it
export function runSimulation(pda, inputString) {
  const initial = createInitialConfig(pda, inputString);
  const step0 = epsilonClosure(pda, [initial]);
  const history = [step0];
  let current = step0;

  while (current.some((cfg) => cfg.remainingInput.length > 0)) {
    const next = stepForward(pda, current);
    history.push(next);
    current = next;
    if (current.length === 0) break;
  }

  const lastStep = history[history.length - 1];
  const accepted = lastStep.some((cfg) => isAccepting(pda, cfg));
  const finalResult = accepted ? 'accept' : 'reject';

  return { history, finalResult };
}

// get accept/reject/running status for the current step (used by UI while stepping)
export function stepResult(pda, configs, isLastStep) {
  if (configs.some((cfg) => isAccepting(pda, cfg))) return 'accept';
  if (isLastStep && configs.length === 0) return 'reject';
  if (isLastStep) return configs.every((cfg) => cfg.remainingInput.length === 0) ? 'reject' : 'running';
  return 'running';
}
