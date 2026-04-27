import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { buildEdgeGroups } from '../pda/pdaUtils.js'

// color per state role
const STATE_COLOR = {
  start:   '#4f7ec9',
  compare: '#b07d1a',
  drain:   '#c0622b',
  accept:  '#2e8f62',
}

// light tint for active nodes (~10% opacity)
const STATE_TINT = {
  start:   '#4f7ec918',
  compare: '#b07d1a18',
  drain:   '#c0622b18',
  accept:  '#2e8f6218',
}

const R = 30  // state circle radius
export default function StateDiagram({ pda, activeStates }) {
  const svgRef   = useRef(null)
  const simRef   = useRef(null)
  const nodesRef = useRef(null)

  const nodes = pda.stateInfo.map((s) => ({ id: s.id, label: s.label, role: s.role }))
  const edges = buildEdgeGroups(pda.transitions)

  // initialize D3 layout once
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const width  = svgEl.clientWidth  || 540
    const height = svgEl.clientHeight || 340

    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    const defs = svg.append('defs')

    // arrowhead markers, one per state color plus inactive grey
    const markerDefs = [
      ...Object.entries(STATE_COLOR).map(([role, color]) => ({ id: `arrow-${role}`, color })),
      { id: 'arrow-inactive', color: '#cbd5e1' },
      { id: 'arrow-start',    color: STATE_COLOR.start },
    ]
    markerDefs.forEach(({ id, color }) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', id === 'arrow-start' ? 10 : R + 10)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color)
    })

    const g = svg.append('g')

    // edges
    const edgeG   = g.append('g').attr('class', 'edges')
    const edgeSel = edgeG.selectAll('.edge')
      .data(edges)
      .enter()
      .append('g')
      .attr('class', 'edge')

    edgeSel.append('path')
      .attr('class', 'edge-path')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.5)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrow-inactive)')

    // white background behind each label
    edgeSel.append('rect')
      .attr('class', 'edge-label-bg')
      .attr('fill', 'white')
      .attr('rx', 3)
      .attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))')

    edgeSel.append('text')
      .attr('class', 'edge-label')
      .attr('fill', '#64748b')
      .attr('font-size', '10')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('text-anchor', 'middle')
      .each(function(d) {
        const el = d3.select(this)
        const uniq = [...new Set(d.labels)]
        uniq.forEach((lbl, i) => {
          el.append('tspan')
            .attr('x', 0)
            .attr('dy', i === 0 ? '0' : '12')
            .text(lbl)
        })
      })

    // nodes
    const nodeData = nodes.map((n) => ({ ...n, x: width / 2, y: height / 2 }))

    const nodeG   = g.append('g').attr('class', 'nodes')
    const nodeSel = nodeG.selectAll('.node')
      .data(nodeData)
      .enter()
      .append('g')
      .attr('class', (d) => `node node-${d.id}`)
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simRef.current?.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end',  (event, d) => {
            if (!event.active) simRef.current?.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )

    // main circle
    nodeSel.append('circle')
      .attr('class', 'node-main')
      .attr('r', R)
      .attr('fill', 'white')
      .attr('stroke', (d) => STATE_COLOR[d.role] ?? '#94a3b8')
      .attr('stroke-width', 2)
      .attr('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.10))')

    // double ring for accept state
    nodeSel.filter((d) => d.role === 'accept')
      .append('circle')
      .attr('class', 'node-accept-inner')
      .attr('r', R - 5)
      .attr('fill', 'none')
      .attr('stroke', STATE_COLOR.accept)
      .attr('stroke-width', 1.5)

    // state label
    nodeSel.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', (d) => STATE_COLOR[d.role] ?? '#94a3b8')
      .attr('font-size', 18)
      .attr('font-weight', 700)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text((d) => d.label)

    // role label below the circle
    nodeSel.append('text')
      .attr('class', 'node-role')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('y', R + 14)
      .attr('fill', '#94a3b8')
      .attr('font-size', 9)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text((d) => {
        if (d.role === 'start')   return 'start / push'
        if (d.role === 'compare') return 'compare'
        if (d.role === 'drain')   return 'drain'
        if (d.role === 'accept')  return 'accept'
        return ''
      })

    // entry arrow pointing to start state
    const startNode = nodeData.find((n) => n.role === 'start')
    if (startNode) {
      g.append('line')
        .attr('class', 'start-arrow')
        .attr('stroke', STATE_COLOR.start)
        .attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#arrow-start)')
    }

    nodesRef.current = nodeSel

    // force simulation
    const linkData = edges.map((e) => ({
      source: nodeData.find((n) => n.id === e.from) ?? nodeData[0],
      target: nodeData.find((n) => n.id === e.to)   ?? nodeData[0],
      isSelf: e.from === e.to,
    }))

    const sim = d3.forceSimulation(nodeData)
      .force('link', d3.forceLink(linkData.filter((l) => !l.isSelf))
        .id((d) => d.id)
        .distance(160)
        .strength(0.8))
      .force('charge',    d3.forceManyBody().strength(-400))
      .force('center',    d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(R + 20))
      .on('tick', () => {
        nodeData.forEach((d) => {
          d.x = Math.max(R + 50, Math.min(width - R - 50, d.x))
          d.y = Math.max(R + 30, Math.min(height - R - 30, d.y))
        })

        nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`)

        if (startNode) {
          g.select('.start-arrow')
            .attr('x1', startNode.x - R - 32)
            .attr('y1', startNode.y)
            .attr('x2', startNode.x - R - 2)
            .attr('y2', startNode.y)
        }

        edgeSel.each(function(d) {
          const src = nodeData.find((n) => n.id === d.from)
          const tgt = nodeData.find((n) => n.id === d.to)
          if (!src || !tgt) return

          const el      = d3.select(this)
          const path    = el.select('.edge-path')
          const labelEl = el.select('.edge-label')
          const labelBg = el.select('.edge-label-bg')

          if (d.from === d.to) {
            const loopR = 26
            const cx    = src.x
            const cy    = src.y - R - loopR
            path.attr('d', `
              M ${src.x - loopR * 0.7} ${src.y - R * 0.7}
              C ${src.x - loopR * 2} ${src.y - R - loopR * 2.5}
                ${src.x + loopR * 2} ${src.y - R - loopR * 2.5}
                ${src.x + loopR * 0.7} ${src.y - R * 0.7}
            `)
            positionLabel(labelEl, labelBg, cx, cy - loopR - 6)
          } else {
            const hasReverse = edges.some((e) => e.from === d.to && e.to === d.from)
            const dx  = tgt.x - src.x
            const dy  = tgt.y - src.y
            const len = Math.sqrt(dx * dx + dy * dy) || 1
            const nx  = -dy / len
            const ny  =  dx / len
            const curve = hasReverse ? 28 : 0
            const mx  = (src.x + tgt.x) / 2 + nx * curve
            const my  = (src.y + tgt.y) / 2 + ny * curve

            path.attr('d', `M ${src.x} ${src.y} Q ${mx} ${my} ${tgt.x} ${tgt.y}`)
            positionLabel(labelEl, labelBg, mx, my)
          }
        })
      })

    simRef.current = sim
    return () => sim.stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // highlight active states
  useEffect(() => {
    if (!nodesRef.current) return

    nodesRef.current.each(function(d) {
      const isActive = activeStates.has(d.id)
      const color    = STATE_COLOR[d.role] ?? '#94a3b8'
      const tint     = STATE_TINT[d.role]  ?? '#94a3b818'
      const el       = d3.select(this)

      el.select('.node-main')
        .attr('fill',         isActive ? tint  : 'white')
        .attr('stroke',       color)
        .attr('stroke-width', isActive ? 3     : 2)

      el.select('.node-label')
        .attr('fill',  color)
        .attr('opacity', isActive ? 1 : 0.55)
    })
  }, [activeStates])

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ minHeight: 300 }}
    />
  )
}

// position a label and its background rect at (lx, ly)
function positionLabel(labelEl, labelBg, lx, ly) {
  labelEl.attr('transform', `translate(${lx},${ly})`)

  const node = labelEl.node()
  if (node) {
    try {
      const bb  = node.getBBox()
      const pad = 3
      labelBg
        .attr('x',         bb.x - pad)
        .attr('y',         bb.y - pad)
        .attr('width',     bb.width  + pad * 2)
        .attr('height',    bb.height + pad * 2)
        .attr('transform', `translate(${lx},${ly})`)
    } catch (_) {
      // getBBox can fail before the element is in the DOM
    }
  }
}
