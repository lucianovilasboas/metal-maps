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

const LEVEL_RADII = [180, 280, 380, 480, 580, 680]
const NODE_W = 200
const NODE_H = 48
const ROOT_W = 220
const ROOT_H = 56

const HANDLE_STYLE = { opacity: 0, pointerEvents: 'none' }

function DocNode({ data }) {
  return (
    <div className={`px-6 py-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-xl border-2 border-blue-400 flex items-center justify-center gap-2 select-none transition-opacity duration-300 ${data.blurred ? 'opacity-20' : ''}`}
      style={{ width: ROOT_W, height: ROOT_H }}
    >
      <Handle type="source" position={Position.Top} id="top" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Left} id="left" isConnectable={false} style={HANDLE_STYLE} />
      <span className="text-2xl">📜</span>
      <span className="text-sm font-bold truncate">{data.label}</span>
    </div>
  )
}

function ChapterNode({ data }) {
  const collapsed = data.collapsed
  return (
    <div
      onClick={data.onToggle}
      className={`px-5 py-2 rounded-full border-2 font-medium transition-all duration-300 cursor-grab active:cursor-grabbing select-none flex items-center justify-center gap-2 ${
        data.blurred
          ? 'opacity-20 border-gray-200 text-gray-400'
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
    </div>
  )
}

function ArticleNode({ data }) {
  return (
    <div
      className={`px-4 py-2 rounded-full border border-gray-200 bg-white text-sm cursor-grab active:cursor-grabbing transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:bg-blue-50 select-none flex items-center gap-2 ${data.blurred ? 'opacity-20' : ''}`}
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
    </div>
  )
}

const nodeTypes = { docNode: DocNode, chapterNode: ChapterNode, articleNode: ArticleNode }

function nodeDim(node) {
  if (node.id === 'doc') return { w: ROOT_W, h: ROOT_H }
  if (node.type === 'chapterNode') return { w: NODE_W, h: NODE_H }
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

function contarArtigosRecursivo(bloco) {
  let total = (bloco.artigos || []).length
  for (const f of (bloco.filhos || [])) total += contarArtigosRecursivo(f)
  return total
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
          ? { stroke: '#94a3b8', strokeWidth: 2 }
          : { stroke: '#cbd5e1', strokeWidth: 1.5 }
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
          const artR = LEVEL_RADII[depth + 1] != null ? LEVEL_RADII[depth + 1] : LEVEL_RADII[LEVEL_RADII.length - 1]
          const artSpan = angleStep * 0.75
          const artStart = midAngle - artSpan / 2

          arts.forEach((art, aj) => {
            const artAngle = arts.length > 1
              ? artStart + (artSpan * aj) / (arts.length - 1)
              : midAngle
            const artW = NODE_W - 20
            const artH = NODE_H - 8
            const artId = `art-${art.id}`

            allNodes.push({
              id: artId,
              type: 'articleNode',
              position: dp(artId) || { x: (centerX + artR * Math.cos(artAngle)) - artW / 2, y: (centerY + artR * Math.sin(artAngle)) - artH / 2 },
              data: { label: art.titulo, id_code: art.id_code || art.id },
            })

            const blocoNode = allNodes.find(n => n.id === blocoId)
            const artNode = allNodes.find(n => n.id === artId)
            if (blocoNode && artNode) {
              const h = bestHandles(blocoNode, artNode)
              allEdges.push({
                id: `e-${blocoId}-${artId}`,
                source: blocoId,
                target: artId,
                sourceHandle: h.sourceHandle,
                targetHandle: h.targetHandle,
                type: 'bezier',
                style: { stroke: '#d1d5db', strokeWidth: 1.5 },
              })
            }
          })
        }
      }
    })
  }

  const topLevelArc = 2 * Math.PI * 0.9
  layoutRecursivo(documento.blocos, 'doc', -Math.PI / 2, topLevelArc, 0)

  return { nodes: allNodes, edges: allEdges }
}

function acharBlocosRecursivo(blocos) {
  const result = []
  for (const b of blocos) {
    result.push(b)
    if (b.filhos?.length) result.push(...acharBlocosRecursivo(b.filhos))
  }
  return result
}

export default function MindMap({ documento, onSelectArtigo, onSalvarPosicoes, containerRef, searchResults, activeBlocoId }) {
  const [collapsed, setCollapsed] = useState(new Set())
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

    const allBlocoIds = new Set((documento.blocos || []).map(b => `bloco-${b.id}`))

    const saved = localStorage.getItem(`mm-state-${documento.slug}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (!hasBackend && data.positions) {
          draggedPositionsRef.current = data.positions
        }
        setCollapsed(new Set(data.collapsed || allBlocoIds))
      } catch {
        if (!hasBackend) draggedPositionsRef.current = {}
        setCollapsed(allBlocoIds)
      }
    } else if (!hasBackend) {
      draggedPositionsRef.current = {}
      setCollapsed(allBlocoIds)
    }

    setLoadVersion((v) => v + 1)
  }, [documento?.slug])

  function saveState() {
    if (!documento?.slug) return
    localStorage.setItem(`mm-state-${documento.slug}`, JSON.stringify({
      positions: draggedPositionsRef.current,
      collapsed: [...collapsed],
    }))
  }

  useEffect(() => {
    if (loadVersion > 0) saveState()
  }, [collapsed, documento?.slug, loadVersion])

  useEffect(() => {
    if (!activeBlocoId) return
    setFocoId(activeBlocoId)
    setCollapsed((prev) => {
      if (!prev.has(activeBlocoId)) return prev
      const next = new Set(prev)
      next.delete(activeBlocoId)
      return next
    })
    setTimeout(() => {
      const el = document.querySelector(`[data-id="${activeBlocoId}"]`)
      if (el && reactFlowInstanceRef.current) {
        reactFlowInstanceRef.current.fitView({ duration: 400, padding: 0.3 })
      }
    }, 100)
  }, [activeBlocoId])

  const handleToggle = useCallback((blocoId) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(blocoId)) next.delete(blocoId)
      else next.add(blocoId)
      return next
    })
    setTimeout(() => {
      reactFlowInstanceRef.current?.fitView({ padding: 0.25, duration: 400 })
    }, 50)
  }, [])

  const graph = useMemo(() => {
    const g = radialLayout(documento, collapsed, draggedPositionsRef.current)

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
                style: { stroke: '#93c5fd', strokeWidth: 1.5, strokeDasharray: '4 4' },
              })
            }
          })
          break
        }
      }
    }

    let searchSet = null
    if (searchResults) {
      searchSet = new Set(['doc'])
      const resultIds = new Set(searchResults.map(r => r.id))
      const todosBlocos = acharBlocosRecursivo(documento?.blocos || [])
      for (const bloco of todosBlocos) {
        const blocoId = `bloco-${bloco.id}`
        const artMatches = (bloco.artigos || []).filter(a => resultIds.has(a.id))
        if (artMatches.length > 0) {
          searchSet.add(blocoId)
          artMatches.forEach(a => searchSet.add(`art-${a.id}`))
        }
      }
    }

    g.nodes = g.nodes.map((n) => {
      const blurred = (focusSet && !focusSet.has(n.id)) || (searchSet && !searchSet.has(n.id))
      if (n.type === 'chapterNode') {
        return { ...n, data: { ...n.data, onToggle: () => handleToggle(n.id), blurred } }
      }
      return { ...n, data: { ...n.data, blurred } }
    })
    return g
  }, [documento, collapsed, handleToggle, loadVersion, focoId, mostrarRel, relAtivo, searchResults])

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
      state.collapsed = [...collapsed]
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
  }, [setEdges, documento?.slug, collapsed, onSalvarPosicoes])

  const onNodeClick = useCallback((_, node) => {
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
  }, [documento, onSelectArtigo, mostrarRel])

  const onNodeDoubleClick = useCallback((_, node) => {
    if (node.type === 'chapterNode') {
      setFocoId((prev) => (prev === node.id ? null : node.id))
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
