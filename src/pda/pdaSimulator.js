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

export function buildComputationTree(pda, inputString) {
  let nextId = 0
  const nodes = []

  function makeNode(config, stepIndex, parentId) {
    const node = { id: nextId++, config, stepIndex, parentId, childIds: [], accepted: false, dead: false }
    nodes.push(node)
    return node
  }

  function epsilonCloseOne(config) {
    const seen = new Map()
    const worklist = [config]
    seen.set(configKey(config), config)
    while (worklist.length > 0) {
      const cfg = worklist.pop()
      for (const t of applicableTransitions(pda, cfg, null)) {
        const next = applyTransition(cfg, t, null)
        const key = configKey(next)
        if (!seen.has(key)) { seen.set(key, next); worklist.push(next) }
      }
    }
    return Array.from(seen.values())
  }

  function getChildConfigs(config) {
    if (config.remainingInput.length === 0) return []
    const symbol = config.remainingInput[0]
    const results = new Map()
    for (const t of applicableTransitions(pda, config, symbol)) {
      const next = applyTransition(config, t, symbol)
      for (const cfg of epsilonCloseOne(next)) {
        const key = configKey(cfg)
        if (!results.has(key)) results.set(key, cfg)
      }
    }
    return Array.from(results.values())
  }

  const startConfigs = epsilonCloseOne(createInitialConfig(pda, inputString))
  let frontier = startConfigs.map(cfg => makeNode(cfg, 0, null))
  const rootIds = frontier.map(n => n.id)

  while (frontier.length > 0) {
    const nextFrontier = []
    for (const parentNode of frontier) {
      if (parentNode.config.remainingInput.length === 0) continue
      const childConfigs = getChildConfigs(parentNode.config)
      for (const cfg of childConfigs) {
        const child = makeNode(cfg, parentNode.stepIndex + 1, parentNode.id)
        parentNode.childIds.push(child.id)
        nextFrontier.push(child)
      }
    }
    frontier = nextFrontier
  }

  for (const node of nodes) {
    node.accepted = pda.acceptStates.includes(node.config.state) && node.config.remainingInput.length === 0
    node.dead = !node.accepted && node.childIds.length === 0
  }

  return { nodes, rootIds }
}

export function stepResult(pda, configs, isLastStep) {
  if (configs.some((cfg) => isAccepting(pda, cfg))) return 'accept';
  if (isLastStep && configs.length === 0) return 'reject';
  if (isLastStep) return configs.every((cfg) => cfg.remainingInput.length === 0) ? 'reject' : 'running';
  return 'running';
}
