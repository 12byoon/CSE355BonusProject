import React, { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { formatStack } from '../pda/pdaUtils.js'

const STATE_COLOR = {
  start:   '#4f7ec9',
  compare: '#b07d1a',
  drain:   '#c0622b',
  accept:  '#2e8f62',
}

const NODE_R = 20
const NODE_W = 65
const NODE_H = 85
const PAD    = 60

function buildHierarchy(nodes, rootIds) {
  const map = new Map(nodes.map(n => [n.id, { ...n, d3children: [] }]))
  for (const n of nodes) {
    if (n.parentId !== null && map.has(n.parentId)) {
      map.get(n.parentId).d3children.push(map.get(n.id))
    }
  }
  const hasVirtual = rootIds.length !== 1
  if (!hasVirtual) {
    const root = map.get(rootIds[0])
    return root ? { hier: d3.hierarchy(root, d => d.d3children), hasVirtual } : null
  }
  const vroot = { id: '__vroot__', virtual: true, d3children: rootIds.map(id => map.get(id)).filter(Boolean) }
  return { hier: d3.hierarchy(vroot, d => d.d3children), hasVirtual }
}

function computeLayout(tree, stepIndex) {
  if (!tree || tree.nodes.length === 0) return null

  const visibleNodes = tree.nodes.filter(n => n.stepIndex <= stepIndex)
  if (visibleNodes.length === 0) return null

  const result = buildHierarchy(visibleNodes, tree.rootIds)
  if (!result) return null
  const { hier, hasVirtual } = result

  const treeLayout = d3.tree().nodeSize([NODE_W, NODE_H])
  treeLayout(hier)

  const positions = {}
  let minX = Infinity, maxX = -Infinity, maxY = -Infinity

  hier.each(node => {
    if (node.data.virtual) return
    const y = hasVirtual ? node.y - NODE_H : node.y
    positions[node.data.id] = { x: node.x, y }
    if (node.x < minX) minX = node.x
    if (node.x > maxX) maxX = node.x
    if (y > maxY) maxY = y
  })

  if (!isFinite(minX)) return null

  const svgWidth  = maxX - minX + PAD * 2
  const svgHeight = maxY + PAD * 2
  const offsetX   = PAD - minX
  const offsetY   = PAD

  const visibleIds = new Set(visibleNodes.map(n => n.id))
  const visibleEdges = visibleNodes.flatMap(n =>
    n.childIds
      .filter(cid => visibleIds.has(cid))
      .map(cid => ({ parentId: n.id, childId: cid }))
  )

  return { positions, svgWidth, svgHeight, offsetX, offsetY, visibleNodes, visibleEdges }
}

export default function ComputationTree({ tree, stepIndex, pda }) {
  const [tooltip, setTooltip] = useState(null)

  const layout = useMemo(() => computeLayout(tree, stepIndex), [tree, stepIndex])

  const nodeMap = useMemo(
    () => new Map((tree?.nodes ?? []).map(n => [n.id, n])),
    [tree]
  )

  const stateRoleMap = useMemo(() => {
    const m = new Map()
    for (const s of pda.stateInfo) m.set(s.id, s)
    return m
  }, [pda])

  function getColor(node) {
    if (node.dead) return '#94a3b8'
    const info = stateRoleMap.get(node.config.state)
    return STATE_COLOR[info?.role] ?? '#94a3b8'
  }

  function getLabel(stateId) {
    return stateRoleMap.get(stateId)?.label ?? stateId
  }

  if (!tree) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
        Run a string to see the computation tree
      </div>
    )
  }

  if (!layout) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
        —
      </div>
    )
  }

  const { positions, svgWidth, svgHeight, offsetX, offsetY, visibleNodes, visibleEdges } = layout

  return (
    <>
      {tooltip && (
        <div
          style={{ position: 'fixed', left: tooltip.mx + 14, top: tooltip.my - 10, zIndex: 50, pointerEvents: 'none' }}
          className="bg-white border border-slate-200 rounded-md shadow-md px-3 py-2 text-xs"
        >
          <div className="font-semibold text-slate-700">{getLabel(tooltip.node.config.state)}</div>
          <div className="text-slate-500">
            Input: <span className="font-mono">{tooltip.node.config.remainingInput || 'ε'}</span>
          </div>
          <div className="text-slate-500">
            Stack: <span className="font-mono">{formatStack(tooltip.node.config.stack)}</span>
          </div>
          {tooltip.node.accepted && <div className="text-green-600 font-semibold mt-0.5">ACCEPT</div>}
          {tooltip.node.dead    && <div className="text-red-400 font-semibold mt-0.5">dead end</div>}
        </div>
      )}

      <div className="overflow-auto h-full">
        <svg
          width={Math.max(svgWidth, 100)}
          height={Math.max(svgHeight, 100)}
          onMouseLeave={() => setTooltip(null)}
        >
          <g transform={`translate(${offsetX}, ${offsetY})`}>
            {visibleEdges.map(({ parentId, childId }) => {
              const p = positions[parentId]
              const c = positions[childId]
              if (!p || !c) return null
              const parentNode = nodeMap.get(parentId)
              const color = parentNode?.dead
                ? '#cbd5e1'
                : (getColor(parentNode) + 'bb')
              const x1 = p.x, y1 = p.y + NODE_R
              const x2 = c.x, y2 = c.y - NODE_R
              const my = (y1 + y2) / 2
              return (
                <path
                  key={`${parentId}-${childId}`}
                  d={`M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                />
              )
            })}

            {visibleNodes.map(node => {
              const pos = positions[node.id]
              if (!pos) return null
              const color       = getColor(node)
              const opacity     = node.dead ? 0.35 : 1
              const strokeWidth = node.stepIndex === stepIndex ? 3 : 2
              const fill        = node.accepted
                ? color + '33'
                : (node.dead ? '#f1f5f9' : 'white')

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  opacity={opacity}
                  style={{ cursor: 'default' }}
                  onMouseMove={e => setTooltip({ mx: e.clientX, my: e.clientY, node })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {node.accepted && (
                    <circle r={NODE_R + 6} fill="none" stroke={color} strokeWidth={1.5} />
                  )}
                  <circle r={NODE_R} fill={fill} stroke={color} strokeWidth={strokeWidth} />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize={12}
                    fontWeight={700}
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {getLabel(node.config.state)}
                  </text>
                  {node.dead && (
                    <text
                      y={NODE_R + 12}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#94a3b8"
                      fontSize={9}
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      ✗
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      </div>
    </>
  )
}
