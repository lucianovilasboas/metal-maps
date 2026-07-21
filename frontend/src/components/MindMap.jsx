import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'

const LEVEL_RADII = [180, 280, 380, 480, 580, 680]
const NODE_W = 220
const NODE_H = 48
const ROOT_W = 220
const ROOT_H = 56

const HANDLE_STYLE = { opacity: 0, pointerEvents: 'none' }

function blurLevelClass(level) {
  if (!level || level === 0) return ''
  if (level === 1) return 'opacity-70'
  if (level === 2) return 'opacity-40'
  return 'opacity-20'
}

function DocNode({ data }) {
  return (
    <div className={`group relative px-6 py-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-xl border-2 border-blue-400 flex items-center justify-center gap-2 select-none transition-opacity duration-300 ${blurLevelClass(data.blurLevel)}`}
      style={{ width: ROOT_W, height: ROOT_H }}
    >
      <Handle type="source" position={Position.Top} id="top" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Left} id="left" isConnectable={false} style={HANDLE_STYLE} />
      <span className="text-2xl">📜</span>
      <span className="text-sm font-bold truncate">{data.label}</span>
      {data.ementa && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-normal max-w-[300px] shadow-lg pointer-events-none leading-relaxed">
          {data.ementa}
        </div>
      )}
    </div>
  )
}

function ChapterNode({ data }) {
  const collapsed = data.collapsed
  return (
    <div
      onClick={data.onToggle}
      className={`group relative px-5 py-2 rounded-full border-2 font-medium transition-all duration-300 cursor-grab active:cursor-grabbing select-none flex items-center justify-center gap-2 ${blurLevelClass(data.blurLevel)} ${
        data.searchActive
          ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-300/30 animate-[pulse_5s_cubic-bezier(0.4,0,0.6,1)_infinite]'
          : collapsed
            ? 'bg-white border-amber-300 text-amber-700 shadow-sm hover:shadow-md hover:border-amber-400'
            : 'bg-amber-100 border-amber-400 text-amber-900 shadow-md'
      }`}
      style={{ width: NODE_W, height: NODE_H }}
    >
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Right} id="right" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Bottom} id="bottom" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Top} id="top" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Left} id="left" isConnectable={false} style={HANDLE_STYLE} />
      <span className="text-xs shrink-0">{collapsed ? '▶' : '▼'}</span>
      <span className="text-[10px] uppercase text-gray-400 shrink-0">{data.tipo}</span>
      <span className="text-xs truncate font-semibold">{data.label}</span>
      <span className="text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full shrink-0">{data.count}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none leading-relaxed whitespace-nowrap">
        <div className="font-semibold">{data.label}</div>
        <div className="text-gray-300 text-[10px] uppercase">{data.tipo}</div>
        <div className="text-gray-300 text-[10px]">{data.count} artigo{data.count !== 1 ? 's' : ''}</div>
      </div>
    </div>
  )
}

function ArticleNode({ data }) {
  const expanded = data.expanded
  return (
    <div
      onContextMenu={(e) => { e.preventDefault(); data.onToggle && data.onToggle() }}
      className={`group relative px-4 py-2 rounded-full text-sm cursor-grab active:cursor-grabbing transition-all duration-300 select-none flex items-center gap-2 ${blurLevelClass(data.blurLevel)} ${
        data.searchActive
          ? 'border-2 border-blue-500 shadow-md shadow-blue-300/40 bg-blue-50 animate-[pulse_5s_cubic-bezier(0.4,0,0.6,1)_infinite]'
          : 'border border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg hover:bg-blue-50'
      } ${expanded ? 'border-blue-400 shadow-md' : ''}`}
      style={{ width: NODE_W - 20, height: NODE_H - 8, minHeight: 40 }}
    >
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Right} id="right" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Bottom} id="bottom" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Top} id="top" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Left} id="left" isConnectable={false} style={HANDLE_STYLE} />
      <span className="text-xs text-blue-500 font-mono shrink-0">{data.id_code}</span>
      <span className="truncate text-gray-700 text-xs">{data.label}</span>
      {data.incisoCount > 0 && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">{data.incisoCount}</span>}
      {(data.resumo || data.label) && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-normal max-w-[300px] shadow-lg pointer-events-none leading-relaxed">
          <div className="font-semibold mb-0.5">{data.label}</div>
          {data.resumo && <div className="text-gray-300">{data.resumo}</div>}
        </div>
      )}
    </div>
  )
}

function IncisoNode({ data }) {
  return (
    <div
      onClick={data.onClick}
      className={`group relative px-2 py-0.5 rounded-full text-[10px] cursor-grab active:cursor-grabbing select-none flex items-center border ${blurLevelClass(data.blurLevel)} border-gray-200 bg-white hover:border-blue-300`}
      style={{ width: 'auto', minWidth: 60, height: 26, minHeight: 26 }}
    >
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Right} id="right" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Bottom} id="bottom" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={HANDLE_STYLE} />
      <span className="font-mono text-gray-700 font-medium shrink-0">{data.rotulo}</span>
      {data.preview && <span className="ml-1 truncate text-gray-400 max-w-[120px]">— {data.preview}</span>}
      {data.fullText && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-gray-900 text-white text-[10px] rounded-lg px-3 py-2 whitespace-normal max-w-[300px] shadow-lg pointer-events-none leading-relaxed">
          {data.fullText}
        </div>
      )}
    </div>
  )
}

const nodeTypes = { docNode: DocNode, chapterNode: ChapterNode, articleNode: ArticleNode, incisoNode: IncisoNode }

function nodeDim(node) {
  if (node.id === 'doc') return { w: ROOT_W, h: ROOT_H }
  if (node.type === 'chapterNode') return { w: NODE_W, h: NODE_H }
  if (node.type === 'incisoNode') return { w: 120, h: 26 }
  return { w: NODE_W - 20, h: NODE_H - 8 }
}

function nodeCenter(node) {
  const d = nodeDim(node)
  return { x: node.position.x + d.w / 2, y: node.position.y + d.h / 2 }
}

function bestHandles(srcNode, tgtNode) {
  const s = nodeCenter(srcNode)
  const t = nodeCenter(tgtNode)
  const angle = Math.atan2(t.y - s.y, t.x - s.x)
  if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) return { sourceHandle: 'right', targetHandle: 'left' }
  if (angle >= Math.PI / 4 && angle <= (3 * Math.PI) / 4) return { sourceHandle: 'bottom', targetHandle: 'top' }
  if (angle >= (-3 * Math.PI) / 4 && angle <= -Math.PI / 4) return { sourceHandle: 'top', targetHandle: 'bottom' }
  return { sourceHandle: 'left', targetHandle: 'right' }
}

function aplicarRepulsao(base, minDist, iteracoes, damping = 0.80) {
  const nodeList = base.nodes.map(n => {
    const c = nodeCenter(n)
    return { id: n.id, x: c.x, y: c.y }
  })

  const relacionados = new Set()
  for (const edge of base.edges) {
    relacionados.add(`${edge.source}::${edge.target}`)
    relacionados.add(`${edge.target}::${edge.source}`)
  }

  for (let iter = 0; iter < iteracoes; iter++) {
    const forces = {}
    for (const n of nodeList) forces[n.id] = { fx: 0, fy: 0 }

    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const a = nodeList[i], b = nodeList[j]
        if (relacionados.has(`${a.id}::${b.id}`)) continue
        let dx = b.x - a.x, dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy) || 1
        if (dist < minDist) {
          const f = (minDist - dist) * 0.06
          forces[a.id].fx -= f * dx / dist
          forces[a.id].fy -= f * dy / dist
          forces[b.id].fx += f * dx / dist
          forces[b.id].fy += f * dy / dist
        }
      }
    }

    for (const n of nodeList) {
      if (n.id === 'doc') continue
      n.x += forces[n.id].fx * damping
      n.y += forces[n.id].fy * damping
    }
  }

  for (const n of nodeList) {
    const nd = base.nodes.find(x => x.id === n.id)
    if (nd && n.id !== 'doc') {
      const d = nodeDim(nd)
      nd.position.x = n.x - d.w / 2
      nd.position.y = n.y - d.h / 2
    }
  }

  return base
}

function resolverColisoes(base, maxPasses = 10) {
  const nodeList = base.nodes.map(n => {
    const c = nodeCenter(n)
    const d = nodeDim(n)
    return { id: n.id, x: c.x, y: c.y, w: d.w, h: d.h }
  })

  const relacionados = new Set()
  for (const edge of base.edges) {
    relacionados.add(`${edge.source}::${edge.target}`)
    relacionados.add(`${edge.target}::${edge.source}`)
  }

  for (let pass = 0; pass < maxPasses; pass++) {
    let moved = false
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const a = nodeList[i], b = nodeList[j]
        if (relacionados.has(`${a.id}::${b.id}`)) continue
        if (a.id === 'doc' && b.id === 'doc') continue

        const minX = (a.w + b.w) / 2 + 6
        const minY = (a.h + b.h) / 2 + 4

        const dx = b.x - a.x
        const dy = b.y - a.y
        const ox = Math.max(0, minX - Math.abs(dx))
        const oy = Math.max(0, minY - Math.abs(dy))

        if (ox > 0 && oy > 0) {
          moved = true
          const signX = dx >= 0 ? 1 : -1
          const signY = dy >= 0 ? 1 : -1

          if (ox < oy) {
            const push = ox / 2
            if (a.id !== 'doc') a.x -= push * signX
            if (b.id !== 'doc') b.x += push * signX
          } else {
            const push = oy / 2
            if (a.id !== 'doc') a.y -= push * signY
            if (b.id !== 'doc') b.y += push * signY
          }
        }
      }
    }
    if (!moved) break
  }

  for (const edge of base.edges) {
    const src = nodeList.find(n => n.id === edge.source)
    const tgt = nodeList.find(n => n.id === edge.target)
    if (!src || !tgt) continue
    const mx = (src.x + tgt.x) / 2
    const my = (src.y + tgt.y) / 2
    for (const n of nodeList) {
      if (n.id === edge.source || n.id === edge.target) continue
      const dx = mx - n.x, dy = my - n.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const minD = (n.w + n.h) / 2 + 20
      if (dist < minD) {
        const push = (minD - dist) * 0.2
        if (src.id !== 'doc') { src.x += (dx / dist) * push; src.y += (dy / dist) * push }
        if (tgt.id !== 'doc') { tgt.x += (dx / dist) * push; tgt.y += (dy / dist) * push }
      }
    }
  }

  for (const n of nodeList) {
    const nd = base.nodes.find(x => x.id === n.id)
    if (nd && n.id !== 'doc') {
      nd.position.x = n.x - n.w / 2
      nd.position.y = n.y - n.h / 2
    }
  }

  for (const edge of base.edges) {
    const src = base.nodes.find(n => n.id === edge.source)
    const tgt = base.nodes.find(n => n.id === edge.target)
    if (src && tgt) {
      const h = bestHandles(src, tgt)
      edge.sourceHandle = h.sourceHandle
      edge.targetHandle = h.targetHandle
    }
  }

  return base
}

function contarArtigosRecursivo(bloco) {
  let total = (bloco.artigos || []).length
  for (const f of (bloco.filhos || [])) total += contarArtigosRecursivo(f)
  return total
}

function coletarArtigosRecursivo(bloco) {
  const arts = [...(bloco.artigos || [])]
  for (const f of (bloco.filhos || [])) arts.push(...coletarArtigosRecursivo(f))
  return arts
}

function radialLayout(documento, collapsed, draggedPositions) {
  if (!documento?.blocos) return { nodes: [], edges: [] }

  const centerX = 0
  const centerY = 0
  const allNodes = []
  const allEdges = []

  const dp = (id) => draggedPositions[id] || null

  allNodes.push({
    id: 'doc',
    type: 'docNode',
    position: dp('doc') || { x: centerX - ROOT_W / 2, y: centerY - ROOT_H / 2 },
    data: { label: documento.titulo, ementa: documento.ementa },
  })

  function layoutRecursivo(blocos, parentId, parentAngle, arcSpan, depth) {
    if (blocos.length === 0) return
    const R = LEVEL_RADII[depth] != null ? LEVEL_RADII[depth] : LEVEL_RADII[LEVEL_RADII.length - 1]
    const count = blocos.length
    const angleStep = arcSpan / count

    blocos.forEach((bloco, i) => {
      const midAngle = parentAngle - arcSpan / 2 + angleStep / 2 + i * angleStep
      const blocoId = `bloco-${bloco.id}`
      const bx = centerX + R * Math.cos(midAngle)
      const by = centerY + R * Math.sin(midAngle)
      const totalArts = contarArtigosRecursivo(bloco)

      allNodes.push({
        id: blocoId,
        type: 'chapterNode',
        position: dp(blocoId) || { x: bx - NODE_W / 2, y: by - NODE_H / 2 },
        data: {
          label: `${bloco.rotulo} ${bloco.titulo}`.trim(),
          tipo: bloco.tipo,
          id_code: bloco.rotulo || bloco.id,
          collapsed: collapsed.has(blocoId),
          count: totalArts,
          onToggle: undefined,
        },
      })

      const parentNode = allNodes.find(n => n.id === parentId)
      if (parentNode) {
        const blocoNode = allNodes.find(n => n.id === blocoId)
        const h = bestHandles(parentNode, blocoNode)
        const edgeStyle = depth <= 1
          ? { stroke: '#94a3b8', strokeWidth: 1.5, opacity: 0.55 }
          : { stroke: '#cbd5e1', strokeWidth: 1, opacity: 0.45 }
        allEdges.push({
          id: `e-${parentId}-${blocoId}`,
          source: parentId,
          target: blocoId,
          sourceHandle: h.sourceHandle,
          targetHandle: h.targetHandle,
          type: 'bezier',
          style: edgeStyle,
        })
      }

      if (!collapsed.has(blocoId)) {
        const subBlocos = bloco.filhos || []
        const arts = bloco.artigos || []

        if (subBlocos.length > 0) {
          const childArcSpan = Math.min(angleStep * 0.8, Math.PI * 0.6)
          layoutRecursivo(subBlocos, blocoId, midAngle, childArcSpan, depth + 1)
        } else if (arts.length > 0) {
          const artW = NODE_W - 20
          const artH = NODE_H - 8
          const blocoNode = allNodes.find(n => n.id === blocoId)

          const localG = new dagre.graphlib.Graph()
          localG.setDefaultEdgeLabel(() => ({}))
          localG.setGraph({ rankdir: 'LR', nodesep: 20, ranksep: 35, marginx: 10, marginy: 8 })
          localG.setNode(blocoId, { width: NODE_W, height: NODE_H })
          for (const art of arts) {
            const artId = `art-${art.id}`
            localG.setNode(artId, { width: artW, height: artH })
            localG.setEdge(blocoId, artId)
          }
          dagre.layout(localG)

          const blocoDagre = localG.node(blocoId)
          const originX = blocoDagre ? bx - blocoDagre.x : bx - NODE_W / 2
          const originY = blocoDagre ? by - blocoDagre.y : by - NODE_H / 2

          for (const art of arts) {
            const artId = `art-${art.id}`
            const artDagre = localG.node(artId)
            const artX = artDagre ? originX + artDagre.x - artW / 2 : bx + 60
            const artY = artDagre ? originY + artDagre.y - artH / 2 : by + (arts.indexOf(art) - (arts.length - 1) / 2) * 55

            allNodes.push({
              id: artId,
              type: 'articleNode',
              position: dp(artId) || { x: artX, y: artY },
              data: { label: art.titulo, id_code: art.id_code || art.id, incisoCount: (art.incisos || []).length + (art.paragrafos || []).length, resumo: (art.caput || art.texto || '').slice(0, 150) },
            })

            const artNode = allNodes[allNodes.length - 1]
            if (blocoNode && artNode) {
              const h = bestHandles(blocoNode, artNode)
              allEdges.push({
                id: `e-${blocoId}-${artId}`,
                source: blocoId,
                target: artId,
                sourceHandle: h.sourceHandle,
                targetHandle: h.targetHandle,
                type: 'bezier',
                style: { stroke: '#d1d5db', strokeWidth: 1, opacity: 0.45 },
              })
            }
          }
        }
      }
    })
  }

  const topLevelArc = 2 * Math.PI * 0.9
  layoutRecursivo(documento.blocos, 'doc', -Math.PI / 2, topLevelArc, 0)

  return resolverColisoes(aplicarRepulsao({ nodes: allNodes, edges: allEdges }, 110, 20))
}

function acharBlocosRecursivo(blocos) {
  const result = []
  for (const b of blocos) {
    result.push(b)
    if (b.filhos?.length) result.push(...acharBlocosRecursivo(b.filhos))
  }
  return result
}

function cadaArtigo(blocos, fn) {
  for (const b of blocos) {
    for (const a of (b.artigos || [])) fn(a, b)
    if (b.filhos?.length) cadaArtigo(b.filhos, fn)
  }
}

function treeLayout(documento, collapsed, draggedPositions, rankdir) {
  if (!documento?.blocos) return { nodes: [], edges: [] }

  const dp = (id) => draggedPositions[id] || null
  const allNodes = []
  const allEdges = []
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir, nodesep: 20, ranksep: 50, marginx: 15, marginy: 15 })

  function addToGraph(parentId, blocos) {
    for (const bloco of blocos) {
      const blocoId = `bloco-${bloco.id}`
      g.setNode(blocoId, { width: NODE_W, height: NODE_H })

      const pNode = parentId === 'doc' || parentId.startsWith('bloco-')
      if (parentId && pNode) g.setEdge(parentId, blocoId)

      allNodes.push({
        id: blocoId,
        type: 'chapterNode',
        position: { x: 0, y: 0 },
        data: {
          label: `${bloco.rotulo} ${bloco.titulo}`.trim(),
          tipo: bloco.tipo,
          id_code: bloco.rotulo || bloco.id,
          collapsed: collapsed.has(blocoId),
          count: contarArtigosRecursivo(bloco),
          onToggle: undefined,
        },
      })

      if (!collapsed.has(blocoId)) {
        if (bloco.filhos?.length) {
          addToGraph(blocoId, bloco.filhos)
        }
        for (const art of (bloco.artigos || [])) {
          const artId = `art-${art.id}`
          g.setNode(artId, { width: NODE_W - 20, height: NODE_H - 8 })
          g.setEdge(blocoId, artId)
          allNodes.push({
            id: artId,
            type: 'articleNode',
            position: { x: 0, y: 0 },
            data: { label: art.titulo, id_code: art.id_code || art.id, incisoCount: (art.incisos || []).length + (art.paragrafos || []).length, resumo: (art.caput || art.texto || '').slice(0, 150) },
          })
        }
      }
    }
  }

  const todosTopo = documento.blocos
  g.setNode('doc', { width: ROOT_W, height: ROOT_H })
  allNodes.push({
    id: 'doc',
    type: 'docNode',
    position: { x: 0, y: 0 },
    data: { label: documento.titulo, ementa: documento.ementa },
  })

  for (const bloco of todosTopo) {
    g.setEdge('doc', `bloco-${bloco.id}`)
  }
  addToGraph('doc', todosTopo)

  dagre.layout(g)

  for (const node of allNodes) {
    const pos = g.node(node.id)
    if (pos) {
      const dw = node.type === 'articleNode' ? (NODE_W - 20) : node.id === 'doc' ? ROOT_W : NODE_W
      const dh = node.id === 'doc' ? ROOT_H : NODE_H
      node.position = dp(node.id) || { x: pos.x - dw / 2, y: pos.y - dh / 2 }
    }
  }

  for (const edge of g.edges()) {
    allEdges.push({
      id: `e-${edge.v}-${edge.w}`,
      source: edge.v,
      target: edge.w,
      type: 'smoothstep',
      style: { stroke: '#94a3b8', strokeWidth: 1, opacity: 0.45 },
    })
  }

  return { nodes: allNodes, edges: allEdges }
}

function convexLayout(documento, collapsed, draggedPositions) {
  if (!documento?.blocos) return { nodes: [], edges: [] }

  const centerX = 0
  const centerY = -100
  const dp = (id) => draggedPositions[id] || null
  const allNodes = []
  const allEdges = []

  allNodes.push({
    id: 'doc',
    type: 'docNode',
    position: dp('doc') || { x: centerX - ROOT_W / 2, y: centerY - 120 },
    data: { label: documento.titulo, ementa: documento.ementa },
  })

  const blocos = documento.blocos
  const total = blocos.length
  const arcSpan = Math.PI * 0.6
  const startAngle = -Math.PI / 2 - arcSpan / 2
  const R = 200

  blocos.forEach((bloco, i) => {
    const angle = startAngle + (arcSpan * i) / (total - 1 || 1)
    const bx = centerX + R * Math.cos(angle)
    const by = centerY + R * Math.sin(angle)
    const blocoId = `bloco-${bloco.id}`

    allNodes.push({
      id: blocoId,
      type: 'chapterNode',
      position: dp(blocoId) || { x: bx - NODE_W / 2, y: by - NODE_H / 2 },
      data: {
        label: `${bloco.rotulo} ${bloco.titulo}`.trim(),
        tipo: bloco.tipo,
        id_code: bloco.rotulo || bloco.id,
        collapsed: collapsed.has(blocoId),
        count: contarArtigosRecursivo(bloco),
        onToggle: undefined,
      },
    })

    allEdges.push({
      id: `e-doc-${blocoId}`,
      source: 'doc',
      target: blocoId,
      type: 'smoothstep',
      style: { stroke: '#94a3b8', strokeWidth: 1, opacity: 0.45 },
    })

    if (!collapsed.has(blocoId)) {
      const arts = bloco.filhos?.length ? coletarArtigosRecursivo(bloco) : (bloco.artigos || [])
      const colWidth = 220
      const startX = bx - (arts.length - 1) * colWidth / 2
      arts.forEach((art, aj) => {
        const artId = `art-${art.id}`
        const ax = startX + aj * colWidth
        const ay = by + 100
        allNodes.push({
          id: artId,
          type: 'articleNode',
          position: dp(artId) || { x: ax - (NODE_W - 20) / 2, y: ay - (NODE_H - 8) / 2 },
          data: { label: art.titulo, id_code: art.id_code || art.id, incisoCount: (art.incisos || []).length + (art.paragrafos || []).length, resumo: (art.caput || art.texto || '').slice(0, 150) },
        })
        allEdges.push({
          id: `e-${blocoId}-${artId}`,
          source: blocoId,
          target: artId,
          type: 'smoothstep',
          style: { stroke: '#d1d5db', strokeWidth: 1, opacity: 0.45 },
        })
      })
    }
  })

  return { nodes: allNodes, edges: allEdges }
}

function organicLayout(documento, collapsed, draggedPositions) {
  const base = treeLayout(documento, collapsed, draggedPositions, 'LR')
  if (!base.nodes.length) return base

  const dp = (id) => draggedPositions[id] || null
  const nodeList = []

  for (const nd of base.nodes) {
    const c = nodeCenter(nd)
    nodeList.push({ id: nd.id, x: c.x, y: c.y, vx: 0, vy: 0 })
  }

  for (let iter = 0; iter < 25; iter++) {
    const forces = {}
    for (const n of nodeList) forces[n.id] = { fx: 0, fy: 0 }

    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const a = nodeList[i]; const b = nodeList[j]
        let dx = b.x - a.x; let dy = b.y - a.y; let dist = Math.sqrt(dx * dx + dy * dy) || 1
        const minDist = a.id.startsWith('art-') || b.id.startsWith('art-') ? 110 : 140
        if (dist < minDist) {
          const f = (minDist - dist) * 0.06
          forces[a.id].fx -= f * dx / dist; forces[a.id].fy -= f * dy / dist
          forces[b.id].fx += f * dx / dist; forces[b.id].fy += f * dy / dist
        }
      }
    }

    for (const edge of base.edges) {
      const a = nodeList.find(n => n.id === edge.source)
      const b = nodeList.find(n => n.id === edge.target)
      if (!a || !b) continue
      let dx = b.x - a.x; let dy = b.y - a.y; let dist = Math.sqrt(dx * dx + dy * dy) || 1
      const f = (dist - 170) * 0.006
      forces[a.id].fx += f * dx / dist; forces[a.id].fy += f * dy / dist
      forces[b.id].fx -= f * dx / dist; forces[b.id].fy -= f * dy / dist
    }

    for (const n of nodeList) {
      if (n.id === 'doc') continue
      n.vx = (n.vx + forces[n.id].fx) * 0.85
      n.vy = (n.vy + forces[n.id].fy) * 0.85
      n.x += n.vx; n.y += n.vy
    }
  }

  for (const n of nodeList) {
    const nd = base.nodes.find(x => x.id === n.id)
    if (nd && n.id !== 'doc') {
      const dw = n.id.startsWith('art-') ? NODE_W - 20 : NODE_W
      const dh = n.id.startsWith('art-') ? NODE_H - 8 : NODE_H
      nd.position = dp(n.id) || { x: n.x - dw / 2, y: n.y - dh / 2 }
    }
  }

  return resolverColisoes(base)
}

function hierarchicalLayout(documento, collapsed, draggedPositions) {
  if (!documento?.blocos) return { nodes: [], edges: [] }

  const dp = (id) => draggedPositions[id] || null
  const allNodes = []
  const allEdges = []
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 25, ranksep: 35, marginx: 15, marginy: 15 })

  allNodes.push({
    id: 'doc', type: 'docNode', position: { x: 0, y: 0 },
    data: { label: documento.titulo, ementa: documento.ementa },
  })
  g.setNode('doc', { width: ROOT_W, height: ROOT_H })

  function addToGraph(parentId, blocos) {
    for (const bloco of blocos) {
      const blocoId = `bloco-${bloco.id}`
      g.setNode(blocoId, { width: NODE_W, height: NODE_H })
      g.setEdge(parentId, blocoId)
      allNodes.push({
        id: blocoId, type: 'chapterNode', position: { x: 0, y: 0 },
        data: {
          label: `${bloco.rotulo} ${bloco.titulo}`.trim(), tipo: bloco.tipo,
          id_code: bloco.rotulo || bloco.id, collapsed: collapsed.has(blocoId),
          count: contarArtigosRecursivo(bloco), onToggle: undefined,
        },
      })
      if (!collapsed.has(blocoId)) {
        if (bloco.filhos?.length) addToGraph(blocoId, bloco.filhos)
        for (const art of (bloco.artigos || [])) {
          const artId = `art-${art.id}`
          g.setNode(artId, { width: NODE_W - 20, height: NODE_H - 8 })
          g.setEdge(blocoId, artId)
          allNodes.push({
            id: artId, type: 'articleNode', position: { x: 0, y: 0 },
            data: { label: art.titulo, id_code: art.id_code || art.id, incisoCount: (art.incisos || []).length + (art.paragrafos || []).length, resumo: (art.caput || art.texto || '').slice(0, 150) },
          })
        }
      }
    }
  }

  for (const bloco of documento.blocos) g.setEdge('doc', `bloco-${bloco.id}`)
  addToGraph('doc', documento.blocos)
  dagre.layout(g)

  for (const node of allNodes) {
    const pos = g.node(node.id)
    if (pos) {
      const dw = node.type === 'articleNode' ? (NODE_W - 20) : node.id === 'doc' ? ROOT_W : NODE_W
      const dh = node.id === 'doc' ? ROOT_H : NODE_H
      node.position = dp(node.id) || { x: pos.x - dw / 2, y: pos.y - dh / 2 }
    }
  }

  for (const edge of g.edges()) {
    allEdges.push({
      id: `e-${edge.v}-${edge.w}`, source: edge.v, target: edge.w,
      type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 1, opacity: 0.45 },
    })
  }

  return resolverColisoes({ nodes: allNodes, edges: allEdges })
}

function balloonLayout(documento, collapsed, draggedPositions) {
  if (!documento?.blocos) return { nodes: [], edges: [] }

  const dp = (id) => draggedPositions[id] || null
  const allNodes = []
  const allEdges = []
  const centerX = 0, centerY = 0

  allNodes.push({
    id: 'doc',
    type: 'docNode',
    position: dp('doc') || { x: centerX - ROOT_W / 2, y: centerY - ROOT_H / 2 },
    data: { label: documento.titulo, ementa: documento.ementa },
  })

  function posNode(id, type, data, pos) {
    const d = nodeDim({ id, type })
    const node = { id, type, position: dp(id) || { x: pos.x - d.w / 2, y: pos.y - d.h / 2 }, data }
    allNodes.push(node)
    return node
  }

  function layoutSubtree(blocos, parentId, parentX, parentY, parentAngle, parentArcSpan, depth) {
    if (blocos.length === 0) return
    const R = 180 + depth * 120
    const angleStep = parentArcSpan / blocos.length

    blocos.forEach((bloco, i) => {
      const midAngle = parentAngle - parentArcSpan / 2 + angleStep / 2 + i * angleStep
      const bx = parentX + R * Math.cos(midAngle)
      const by = parentY + R * Math.sin(midAngle)
      const blocoId = `bloco-${bloco.id}`

      const blocoNode = posNode(blocoId, 'chapterNode', {
        label: `${bloco.rotulo} ${bloco.titulo}`.trim(),
        tipo: bloco.tipo,
        id_code: bloco.rotulo || bloco.id,
        collapsed: collapsed.has(blocoId),
        count: contarArtigosRecursivo(bloco),
        onToggle: undefined,
      }, { x: bx, y: by })

      const parentNode = allNodes.find(n => n.id === parentId)
      const h = bestHandles(parentNode, blocoNode)
      allEdges.push({
        id: `e-${parentId}-${blocoId}`, source: parentId, target: blocoId,
        sourceHandle: h.sourceHandle, targetHandle: h.targetHandle,
        type: 'bezier',
        style: { stroke: '#94a3b8', strokeWidth: depth === 0 ? 1.5 : 1, opacity: depth === 0 ? 0.55 : 0.45 },
      })

      if (!collapsed.has(blocoId)) {
        const arts = bloco.artigos || []
        const subBlocos = bloco.filhos || []

        if (arts.length > 0) {
          const artR = 130
          const artSpan = Math.PI * 0.9
          const artStart = midAngle - artSpan / 2

          arts.forEach((art, aj) => {
            const artAngle = arts.length > 1
              ? artStart + (artSpan * aj) / (arts.length - 1)
              : midAngle
            const artId = `art-${art.id}`

            const artNode = posNode(artId, 'articleNode', {
              label: art.titulo,
              id_code: art.id_code || art.id,
              incisoCount: (art.incisos || []).length + (art.paragrafos || []).length,
              resumo: (art.caput || art.texto || '').slice(0, 150),
            }, { x: bx + artR * Math.cos(artAngle), y: by + artR * Math.sin(artAngle) })

            const h2 = bestHandles(blocoNode, artNode)
            allEdges.push({
              id: `e-${blocoId}-${artId}`, source: blocoId, target: artId,
              sourceHandle: h2.sourceHandle, targetHandle: h2.targetHandle,
              type: 'bezier',
              style: { stroke: '#d1d5db', strokeWidth: 1, opacity: 0.45 },
            })
          })
        }

        if (subBlocos.length > 0) {
          const subArcSpan = Math.min(angleStep * 0.8, Math.PI * 0.7)
          layoutSubtree(subBlocos, blocoId, bx, by, midAngle + Math.PI * 0.3, subArcSpan, depth + 1)
        }
      }
    })
  }

  layoutSubtree(documento.blocos, 'doc', centerX, centerY, -Math.PI / 2, 2 * Math.PI * 0.9, 0)

  return resolverColisoes(aplicarRepulsao({ nodes: allNodes, edges: allEdges }, 100, 8))
}

function springLayout(documento, collapsed, draggedPositions) {
  const base = treeLayout(documento, collapsed, draggedPositions, 'LR')
  if (!base.nodes.length) return base

  const dp = (id) => draggedPositions[id] || null
  const nodeList = []

  for (const nd of base.nodes) {
    const c = nodeCenter(nd)
    nodeList.push({ id: nd.id, x: c.x, y: c.y, vx: 0, vy: 0 })
  }

  for (let iter = 0; iter < 120; iter++) {
    const forces = {}
    for (const n of nodeList) forces[n.id] = { fx: 0, fy: 0 }

    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const a = nodeList[i], b = nodeList[j]
        let dx = b.x - a.x, dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy) || 1
        const f = 8000 / (dist * dist)
        forces[a.id].fx -= f * dx / dist; forces[a.id].fy -= f * dy / dist
        forces[b.id].fx += f * dx / dist; forces[b.id].fy += f * dy / dist
      }
    }

    for (const edge of base.edges) {
      const a = nodeList.find(n => n.id === edge.source)
      const b = nodeList.find(n => n.id === edge.target)
      if (!a || !b) continue
      let dx = b.x - a.x, dy = b.y - a.y
      let dist = Math.sqrt(dx * dx + dy * dy) || 1
      const f = (dist - 180) * 0.015
      forces[a.id].fx += f * dx / dist; forces[a.id].fy += f * dy / dist
      forces[b.id].fx -= f * dx / dist; forces[b.id].fy -= f * dy / dist
    }

    for (const n of nodeList) {
      if (n.id === 'doc') continue
      n.vx = (n.vx + forces[n.id].fx) * 0.90
      n.vy = (n.vy + forces[n.id].fy) * 0.90
      n.x += n.vx; n.y += n.vy
    }
  }

  for (const n of nodeList) {
    const nd = base.nodes.find(x => x.id === n.id)
    if (nd && n.id !== 'doc') {
      const dw = n.id.startsWith('art-') ? NODE_W - 20 : NODE_W
      const dh = n.id.startsWith('art-') ? NODE_H - 8 : NODE_H
      nd.position = dp(n.id) || { x: n.x - dw / 2, y: n.y - dh / 2 }
    }
  }

  return resolverColisoes(base)
}

function spiralLayout(documento, collapsed, draggedPositions) {
  if (!documento?.blocos) return { nodes: [], edges: [] }

  const dp = (id) => draggedPositions[id] || null
  const allNodes = []
  const allEdges = []
  const centerX = 0, centerY = 0

  allNodes.push({
    id: 'doc',
    type: 'docNode',
    position: dp('doc') || { x: centerX - ROOT_W / 2, y: centerY - ROOT_H / 2 },
    data: { label: documento.titulo, ementa: documento.ementa },
  })

  const todosBlocos = []
  ;(function p(b) { for (const x of b) { todosBlocos.push(x); if (x.filhos?.length) p(x.filhos) } })(documento.blocos)

  const allVisible = []
  for (const bloco of todosBlocos) {
    const blocoId = `bloco-${bloco.id}`
    allVisible.push({ bloco, blocoId, type: 'chapterNode', depth: 0, parentId: null })
    if (!collapsed.has(blocoId)) {
      for (const art of (bloco.artigos || [])) {
        allVisible.push({ bloco, art, artId: `art-${art.id}`, type: 'articleNode', depth: 1, parentId: blocoId })
      }
    }
  }

  const total = allVisible.length
  const dTheta = (2 * Math.PI) / Math.max(total + 4, 10)
  const a = 30, b = 55

  const nodeMap = {}
  allVisible.forEach((v, i) => {
    const theta = dTheta * i
    const r = a + b * theta
    const x = centerX + r * Math.cos(theta)
    const y = centerY + r * Math.sin(theta)

    if (v.type === 'chapterNode') {
      const blocoNode = {
        id: v.blocoId,
        type: 'chapterNode',
        position: dp(v.blocoId) || { x: x - NODE_W / 2, y: y - NODE_H / 2 },
        data: {
          label: `${v.bloco.rotulo} ${v.bloco.titulo}`.trim(),
          tipo: v.bloco.tipo,
          id_code: v.bloco.rotulo || v.bloco.id,
          collapsed: collapsed.has(v.blocoId),
          count: contarArtigosRecursivo(v.bloco),
          onToggle: undefined,
        },
      }
      allNodes.push(blocoNode)
      nodeMap[v.blocoId] = blocoNode
    } else {
      const artNode = {
        id: v.artId,
        type: 'articleNode',
        position: dp(v.artId) || { x: x - (NODE_W - 20) / 2, y: y - (NODE_H - 8) / 2 },
        data: {
          label: v.art.titulo,
          id_code: v.art.id_code || v.art.id,
          incisoCount: (v.art.incisos || []).length + (v.art.paragrafos || []).length,
          resumo: (v.art.caput || v.art.texto || '').slice(0, 150),
        },
      }
      allNodes.push(artNode)
      nodeMap[v.artId] = artNode
    }
  })

  const docNode = allNodes.find(n => n.id === 'doc')
  const todosBlocosMap = {}
  for (const bloco of todosBlocos) todosBlocosMap[bloco.id] = bloco

  for (const bloco of todosBlocos) {
    const blocoNode = nodeMap[`bloco-${bloco.id}`]
    if (!blocoNode) continue

    const parentBloco = todosBlocos.find(b => (b.filhos || []).some(f => f.id === bloco.id))
    const parentNode = parentBloco ? nodeMap[`bloco-${parentBloco.id}`] : docNode
    if (parentNode) {
      const h = bestHandles(parentNode, blocoNode)
      allEdges.push({
        id: `e-${parentNode.id}-${blocoNode.id}`, source: parentNode.id, target: blocoNode.id,
        sourceHandle: h.sourceHandle, targetHandle: h.targetHandle,
        type: 'bezier', style: { stroke: parentNode.id === 'doc' ? '#94a3b8' : '#cbd5e1', strokeWidth: 1, opacity: 0.45 },
      })
    }

    if (!collapsed.has(`bloco-${bloco.id}`)) {
      for (const art of (bloco.artigos || [])) {
        const artNode = nodeMap[`art-${art.id}`]
        if (artNode) {
          const h = bestHandles(blocoNode, artNode)
          allEdges.push({
            id: `e-${blocoNode.id}-${artNode.id}`, source: blocoNode.id, target: artNode.id,
            sourceHandle: h.sourceHandle, targetHandle: h.targetHandle,
            type: 'bezier', style: { stroke: '#d1d5db', strokeWidth: 1, opacity: 0.45 },
          })
        }
      }
    }
  }

  return resolverColisoes(aplicarRepulsao({ nodes: allNodes, edges: allEdges }, 100, 5))
}

const LAYOUTS = {
  radial: (doc, col, dp) => radialLayout(doc, col, dp),
  treeVertical: (doc, col, dp) => treeLayout(doc, col, dp, 'TB'),
  treeHorizontal: (doc, col, dp) => treeLayout(doc, col, dp, 'LR'),
  convex: (doc, col, dp) => convexLayout(doc, col, dp),
  organic: (doc, col, dp) => organicLayout(doc, col, dp),
  spring: (doc, col, dp) => springLayout(doc, col, dp),
  balloon: (doc, col, dp) => balloonLayout(doc, col, dp),
  spiral: (doc, col, dp) => spiralLayout(doc, col, dp),
  hierarchical: (doc, col, dp) => hierarchicalLayout(doc, col, dp),
}

export default function MindMap({ documento, onSelectArtigo, onSalvarPosicoes, containerRef, searchResults, activeBlocoId, layoutType, collapsedBlocos, onToggleBloco }) {
  const [expandedArts, setExpandedArts] = useState(new Set())
  const [focoId, setFocoId] = useState(null)
  const [mostrarRel, setMostrarRel] = useState(false)
  const [relAtivo, setRelAtivo] = useState(null)
  const [loadVersion, setLoadVersion] = useState(0)
  const draggedPositionsRef = useRef({})
  const reactFlowInstanceRef = useRef(null)

  useEffect(() => {
    if (!documento?.slug) return

    let hasBackend = false
    if (documento.posicoes && typeof documento.posicoes === 'object' && Object.keys(documento.posicoes).length > 0) {
      draggedPositionsRef.current = documento.posicoes
      hasBackend = true
    }

    const saved = localStorage.getItem(`mm-state-${documento.slug}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (!hasBackend && data.positions) {
          draggedPositionsRef.current = data.positions
        }
        setExpandedArts(new Set(data.expandedArts || []))
      } catch {
        if (!hasBackend) draggedPositionsRef.current = {}
        setExpandedArts(new Set())
      }
    } else if (!hasBackend) {
      draggedPositionsRef.current = {}
      setExpandedArts(new Set())
    }

    setLoadVersion((v) => v + 1)
  }, [documento?.slug])

  useEffect(() => {
    if (!activeBlocoId) return
    setFocoId(activeBlocoId)
    if (collapsedBlocos.has(activeBlocoId)) {
      onToggleBloco(activeBlocoId)
    }
    setTimeout(() => {
      const el = document.querySelector(`[data-id="${activeBlocoId}"]`)
      if (el && reactFlowInstanceRef.current) {
        reactFlowInstanceRef.current.fitView({ duration: 400, padding: 0.3 })
      }
    }, 100)
  }, [activeBlocoId])

  useEffect(() => {
    if (!reactFlowInstanceRef.current) return
    setTimeout(() => reactFlowInstanceRef.current.fitView({ padding: 0.25, duration: 400 }), 100)
  }, [layoutType])

  useEffect(() => {
    if (!reactFlowInstanceRef.current) return
    setTimeout(() => reactFlowInstanceRef.current.fitView({ padding: 0.25, duration: 400 }), 100)
  }, [collapsedBlocos])

  const handleToggle = useCallback((blocoId) => {
    onToggleBloco(blocoId)
    setTimeout(() => {
      reactFlowInstanceRef.current?.fitView({ padding: 0.25, duration: 400 })
    }, 50)
  }, [onToggleBloco])

  const handleToggleArtigo = useCallback((artId) => {
    setExpandedArts((prev) => {
      const next = new Set(prev)
      if (next.has(artId)) next.delete(artId)
      else next.add(artId)
      return next
    })
  }, [])

  const graph = useMemo(() => {
    const layoutFn = LAYOUTS[layoutType] || LAYOUTS.radial
    const g = layoutFn(documento, collapsedBlocos, draggedPositionsRef.current)

    if (expandedArts.size > 0 && documento?.blocos) {
      const dp = (id) => draggedPositionsRef.current[id] || null
      const artNodeMap = {}
      g.nodes.forEach(n => { artNodeMap[n.id] = n })

      const todosBlocos = []
      ;(function p(b) { for (const x of b) { todosBlocos.push(x); if (x.filhos?.length) p(x.filhos) } })(documento.blocos)

      for (const bloco of todosBlocos) {
        for (const art of (bloco.artigos || [])) {
          const artId = `art-${art.id}`
          if (!expandedArts.has(artId)) continue
          const artNode = artNodeMap[artId]
          if (!artNode) continue

          const incisos = art.incisos || []
          const paragrafos = art.paragrafos || []
          const subs = [...incisos, ...paragrafos.flatMap(p => [p, ...(p.incisos || [])])]
          if (subs.length === 0) continue

          const cx = artNode.position.x + (NODE_W - 20) / 2
          const cy = artNode.position.y + (NODE_H - 8) / 2 + 30

          subs.forEach((sub, si) => {
            const isPar = sub.texto !== undefined && sub.rotulo?.startsWith('§')
            const subId = isPar ? `par-${sub.id}` : `inc-${sub.id}`
            const sx = cx
            const sy = cy + si * 30
            const preview = (sub.texto || '').slice(0, 80)

            g.nodes.push({
              id: subId,
              type: 'incisoNode',
              position: dp(subId) || { x: sx - 80, y: sy - 12 },
              data: { rotulo: sub.rotulo || sub.id_code || '?', preview, parentArticle: artId, fullText: sub.texto || '' },
            })

            const incNode = g.nodes[g.nodes.length - 1]
            const srcNode = artNode
            const tgtNode = incNode
            const h = bestHandles(srcNode, tgtNode)
            g.edges.push({
              id: `e-${artId}-${subId}`,
              source: artId,
              target: subId,
              sourceHandle: h.sourceHandle,
              targetHandle: h.targetHandle,
              type: 'bezier',
              style: { stroke: '#d1d5db', strokeWidth: 1, opacity: 0.45 },
            })
          })
        }
      }
    }

    let focusSet = null
    if (focoId) {
      focusSet = new Set(['doc', focoId])
    }

    if (mostrarRel && relAtivo && documento) {
      const nodeMap = {}
      g.nodes.forEach((n) => { nodeMap[n.id] = n })
      const todosBlocos = acharBlocosRecursivo(documento.blocos || [])
      for (const bloco of todosBlocos) {
        for (const art of (bloco.artigos || [])) {
          if (`art-${art.id}` !== relAtivo) continue
          const rels = (art.relacionados || []).slice(0, 5)
          rels.forEach((rel) => {
            const relId = `art-${rel.id}`
            if (relId !== relAtivo && nodeMap[relId]) {
              const h = bestHandles(nodeMap[relAtivo], nodeMap[relId])
              g.edges.push({
                id: `e-rel-${relAtivo}-${relId}`,
                source: relAtivo,
                target: relId,
                sourceHandle: h.sourceHandle,
                targetHandle: h.targetHandle,
                type: 'smoothstep',
                style: { stroke: '#93c5fd', strokeWidth: 1, opacity: 0.5, strokeDasharray: '4 4' },
              })
            }
          })
          break
        }
      }
    }

    let searchBlur = null
    if (searchResults) {
      searchBlur = new Map()
      searchBlur.set('doc', 0)
      const resultIds = new Set(searchResults.map(r => r.id))

      const parentMap = {}
      const todosBlocos = []
      ;(function percorrer(b) {
        for (const x of b) {
          todosBlocos.push(x)
          if (x.filhos?.length) {
            for (const f of x.filhos) parentMap[`bloco-${f.id}`] = `bloco-${x.id}`
            percorrer(x.filhos)
          }
        }
      })(documento?.blocos || [])

      for (const bloco of todosBlocos) {
        const blocoId = `bloco-${bloco.id}`
        const artMatches = (bloco.artigos || []).filter(a => resultIds.has(a.id))
        for (const art of artMatches) {
          searchBlur.set(`art-${art.id}`, 0)
          let current = blocoId
          let level = 1
          while (current && level <= 3) {
            const existing = searchBlur.get(current)
            if (existing == null || existing > level) searchBlur.set(current, level)
            current = parentMap[current]
            level++
          }
        }
      }
    }

    g.nodes = g.nodes.map((n) => {
      let blurLevel = 0
      let searchActive = false
      if (focusSet) {
        blurLevel = focusSet.has(n.id) ? 0 : 3
      } else if (searchBlur) {
        blurLevel = searchBlur.has(n.id) ? searchBlur.get(n.id) : 3
        searchActive = blurLevel === 0
      }
      if (n.type === 'chapterNode') {
        return { ...n, data: { ...n.data, onToggle: () => handleToggle(n.id), blurLevel, searchActive } }
      }
      if (n.type === 'articleNode') {
        return { ...n, data: { ...n.data, onToggle: () => handleToggleArtigo(n.id), blurLevel, searchActive, expanded: expandedArts.has(n.id), incisoCount: (n.data?.incisoCount || 0) } }
      }
      return { ...n, data: { ...n.data, blurLevel, searchActive } }
    })
    return g
  }, [documento, collapsedBlocos, handleToggle, loadVersion, focoId, mostrarRel, relAtivo, searchResults, layoutType, expandedArts])

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)

  const nodesRef = useRef(nodes)
  nodesRef.current = nodes
  const edgesRef = useRef(edges)
  edgesRef.current = edges

  useEffect(() => {
    setNodes(graph.nodes)
    setEdges(graph.edges)
  }, [graph, setNodes, setEdges])

  const onNodeDragStop = useCallback((_, node) => {
    draggedPositionsRef.current[node.id] = { x: node.position.x, y: node.position.y }

    if (documento?.slug) {
      const existing = localStorage.getItem(`mm-state-${documento.slug}`)
      let state
      try { state = existing ? JSON.parse(existing) : {} } catch { state = {} }
      state.positions = draggedPositionsRef.current
      state.expandedArts = [...expandedArts]
      localStorage.setItem(`mm-state-${documento.slug}`, JSON.stringify(state))

      if (onSalvarPosicoes) onSalvarPosicoes(draggedPositionsRef.current)
    }

    const currentEdges = edgesRef.current
    const currentNodes = nodesRef.current

    const updatedEdges = currentEdges.map((edge) => {
      if (edge.source !== node.id && edge.target !== node.id) return edge
      const srcNode = currentNodes.find((n) => n.id === edge.source)
      const tgtNode = currentNodes.find((n) => n.id === edge.target)
      if (!srcNode || !tgtNode) return edge
      const h = bestHandles(srcNode, tgtNode)
      return { ...edge, sourceHandle: h.sourceHandle, targetHandle: h.targetHandle }
    })

    setEdges(updatedEdges)
  }, [setEdges, documento?.slug, collapsedBlocos, onSalvarPosicoes])

  const onNodeClick = useCallback((event, node) => {
    if (event.button === 2) return
    if (node.type === 'articleNode' && onSelectArtigo && documento) {
      if (mostrarRel) {
        setRelAtivo((prev) => (prev === node.id ? null : node.id))
      }
      const todosBlocos = acharBlocosRecursivo(documento.blocos || [])
      for (const bloco of todosBlocos) {
        for (const art of (bloco.artigos || [])) {
          if (`art-${art.id}` === node.id) {
            onSelectArtigo(art)
            break
          }
        }
      }
    }
    if (node.type === 'incisoNode' && documento) {
      const parentId = node.data?.parentArticle
      if (!parentId) return
      const todosBlocos = acharBlocosRecursivo(documento.blocos || [])
      for (const bloco of todosBlocos) {
        for (const art of (bloco.artigos || [])) {
          if (`art-${art.id}` === parentId) {
            onSelectArtigo(art)
            break
          }
        }
      }
    }
  }, [documento, onSelectArtigo, mostrarRel])

  const onNodeDoubleClick = useCallback((_, node) => {
    if (node.type === 'chapterNode') {
      setFocoId((prev) => (prev === node.id ? null : node.id))
    }
    if (node.type === 'articleNode') {
      setExpandedArts((prev) => {
        const next = new Set(prev)
        if (next.has(node.id)) next.delete(node.id)
        else next.add(node.id)
        return next
      })
    }
  }, [])

  const onPaneClick = useCallback(() => {
    if (focoId) setFocoId(null)
    if (relAtivo) setRelAtivo(null)
  }, [focoId, relAtivo])

  useEffect(() => {
    if (!focoId) {
      setTimeout(() => reactFlowInstanceRef.current?.fitView({ padding: 0.25, duration: 300 }), 50)
      return
    }
    const handler = (e) => { if (e.key === 'Escape') setFocoId(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [focoId])

  useEffect(() => {
    if (!focoId || !reactFlowInstanceRef.current || !documento) return
    const todosBlocos = acharBlocosRecursivo(documento.blocos || [])
    const focusIds = new Set(['doc', focoId])
    for (const bloco of todosBlocos) {
      if (focoId === `bloco-${bloco.id}`) {
        bloco.artigos?.forEach((a) => focusIds.add(`art-${a.id}`))
        break
      }
    }
    const fitNodes = nodes.filter((n) => focusIds.has(n.id))
    if (fitNodes.length > 0) {
      setTimeout(() => reactFlowInstanceRef.current?.fitView({ nodes: fitNodes, padding: 0.3, duration: 400 }), 50)
    }
  }, [focoId, documento, nodes])

  return (
    <div ref={containerRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        onInit={(instance) => { reactFlowInstanceRef.current = instance; setTimeout(() => instance.fitView({ padding: 0.25, duration: 400 }), 100) }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView={false}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Controls showInteractive={false} />
        <button
          onClick={() => setMostrarRel((v) => !v)}
          className={`absolute top-20 right-4 z-10 w-8 h-8 flex items-center justify-center rounded text-xs font-bold border shadow-sm transition-colors ${
            mostrarRel
              ? 'bg-blue-500 text-white border-blue-600'
              : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'
          }`}
          title={mostrarRel ? 'Desligar relações' : 'Ligar relações entre artigos'}
        >
          R
        </button>
        <MiniMap
          nodeStrokeColor="#9ca3af"
          nodeColor={(n) =>
            n.type === 'docNode' ? '#2563eb'
            : n.type === 'chapterNode' ? '#f59e0b'
            : '#e5e7eb'
          }
          maskColor="rgba(0,0,0,0.06)"
          style={{ borderRadius: 8, margin: 8 }}
          pannable
          zoomable
        />
        <Background color="#f1f5f9" gap={20} size={1} />
      </ReactFlow>
    </div>
  )
}
