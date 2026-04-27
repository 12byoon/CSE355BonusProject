// utility helpers for the PDA simulator

/**
 * @typedef {Object} Config
 * @property {string}   state
 * @property {string}   remainingInput
 * @property {string[]} stack  - index 0 = bottom, last = top
 */

// brandon yoon - CSE355

// unique string key for a config, used to deduplicate branches
export function configKey(config) {
  return `${config.state}|${config.remainingInput}|${config.stack.join(',')}`;
}

// top of stack, or null if empty
export function stackTop(stack) {
  return stack.length > 0 ? stack[stack.length - 1] : null;
}

// pop the top then push the replacement symbols (last element ends on top), returns new stack
export function applyStackOp(stack, pushSymbols) {
  // Pop the top element
  const newStack = stack.slice(0, stack.length - 1);
  // Push replacement symbols left-to-right so last ends on top
  return [...newStack, ...pushSymbols];
}

// group configs by state
export function groupConfigsByState(configs) {
  const map = new Map();
  for (const cfg of configs) {
    if (!map.has(cfg.state)) map.set(cfg.state, []);
    map.get(cfg.state).push(cfg);
  }
  return map;
}

// stack as a string, top first (e.g. "0 1 Z")
export function formatStack(stack) {
  return [...stack].reverse().join(' ');
}

// format a transition as "input, pop -> push" for edge labels in the diagram
export function transitionLabel(transition) {
  const inputStr = transition.input === null ? 'ε' : transition.input;
  const popStr   = transition.stackTop;
  const pushStr  = transition.stackPush.length === 0
    ? 'ε'
    : [...transition.stackPush].reverse().join('');
  return `${inputStr}, ${popStr} → ${pushStr}`;
}

// group all transitions by (from, to) pair so the diagram can draw one arrow with combined labels
export function buildEdgeGroups(transitions) {
  const edgeMap = new Map();
  for (const t of transitions) {
    const key = `${t.state}->${t.nextState}`;
    if (!edgeMap.has(key)) {
      edgeMap.set(key, { from: t.state, to: t.nextState, labels: [] });
    }
    edgeMap.get(key).labels.push(transitionLabel(t));
  }
  return Array.from(edgeMap.values());
}
