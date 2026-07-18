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

const R1 = 180
const R2 = 340
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
      <span className="text-xs truncate font-semibold">{data.label}</span>
      <span className="text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full shrink-0">{data.count}</span>
    </div>
  )
}

function ArticleNode({ data }) {
  return (
    <div
      onMouseEnter={() => data.onHoverEnter?.()}
      onMouseLeave={() => data.onHoverLeave?.()}
      className={`px-4 py-2 rounded-full border border-gray-200 bg-white text-sm cursor-grab active:cursor-grabbing transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:bg-blue-50 select-none flex items-center gap-2 ${data.blurred ? 'opacity-20' : ''}`}
      style={{ width: NODE_W - 20, height: NODE_H - 8, minHeight: 40 }}
    >
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Right} id="right" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Bottom} id="bottom" isConnectable={false} style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={HANDLE_STYLE} />
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

function radialLayout(documento, collapsed, draggedPositions) {
  if (!documento?.capitulos) return { nodes: [], edges: [] }

  const centerX = 0
  const centerY = 0
  const caps = documento.capitulos
  const total = caps.length
  const angleStep = (2 * Math.PI) / total

  const allNodes = []
  const allEdges = []

  const dp = (id) => draggedPositions[id] || null

  allNodes.push({
    id: 'doc',
    type: 'docNode',
    position: dp('doc') || { x: centerX - ROOT_W / 2, y: centerY - ROOT_H / 2 },
    data: { label: documento.titulo },
  })

  caps.forEach((cap, ci) => {
    const capId = `cap-${cap.id}`
    const midAngle = -Math.PI / 2 + ci * angleStep + angleStep / 2

    const capX = centerX + R1 * Math.cos(midAngle)
    const capY = centerY + R1 * Math.sin(midAngle)

    allNodes.push({
      id: capId,
      type: 'chapterNode',
      position: dp(capId) || { x: capX - NODE_W / 2, y: capY - NODE_H / 2 },
      data: {
        label: cap.titulo,
        id_code: cap.id_code || cap.id,
        collapsed: collapsed.has(capId),
        count: (cap.artigos || []).length,
        onToggle: undefined,
      },
    })

    if (!collapsed.has(capId)) {
      const arts = cap.artigos || []
      const artSpan = angleStep * 0.8
      const artStart = midAngle - artSpan / 2

      arts.forEach((art, aj) => {
        const artAngle = arts.length > 1
          ? artStart + (artSpan * aj) / (arts.length - 1)
          : midAngle

        const artX = centerX + R2 * Math.cos(artAngle)
        const artY = centerY + R2 * Math.sin(artAngle)
        const artW = NODE_W - 20
        const artH = NODE_H - 8

        const artId = `art-${art.id}`
        allNodes.push({
          id: artId,
          type: 'articleNode',
          position: dp(artId) || { x: artX - artW / 2, y: artY - artH / 2 },
          data: { label: art.titulo, id_code: art.id_code || art.id },
        })
      })
    }
  })

  const nodeMap = {}
  allNodes.forEach((n) => { nodeMap[n.id] = n })

  caps.forEach((cap) => {
    const capId = `cap-${cap.id}`
    const docNode = nodeMap['doc']
    const capNode = nodeMap[capId]
    if (docNode && capNode) {
      const h = bestHandles(docNode, capNode)
      allEdges.push({
        id: `e-doc-${capId}`,
        source: 'doc',
        target: capId,
        sourceHandle: h.sourceHandle,
        targetHandle: h.targetHandle,
        type: 'bezier',
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      })
    }

    if (!collapsed.has(capId)) {
      const arts = cap.artigos || []
      arts.forEach((art) => {
        const artId = `art-${art.id}`
        const artNode = nodeMap[artId]
        if (capNode && artNode) {
          const h = bestHandles(capNode, artNode)
          allEdges.push({
            id: `e-${capId}-${artId}`,
            source: capId,
            target: artId,
            sourceHandle: h.sourceHandle,
            targetHandle: h.targetHandle,
            type: 'bezier',
            style: { stroke: '#d1d5db', strokeWidth: 1.5 },
          })
        }
      })
    }
  })

  return { nodes: allNodes, edges: allEdges }
}

export default function MindMap({ documento, onSelectArtigo, onSalvarPosicoes }) {
  const [collapsed, setCollapsed] = useState(new Set())
  const [focoId, setFocoId] = useState(null)
  const [mostrarRel, setMostrarRel] = useState(false)
  const [relHoverVersion, setRelHoverVersion] = useState(0)
  const [loadVersion, setLoadVersion] = useState(0)
  const relHoverRef = useRef(null)
  const draggedPositionsRef = useRef({})
  const reactFlowInstanceRef = useRef(null)
  const relDebugRef = useRef({ totalRel: 0, edgesCriadas: 0, artigosComRel: 0 })

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
        setCollapsed(new Set(data.collapsed || []))
      } catch {
        if (!hasBackend) draggedPositionsRef.current = {}
        setCollapsed(new Set())
      }
    } else if (!hasBackend) {
      draggedPositionsRef.current = {}
      setCollapsed(new Set())
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

  const handleToggle = useCallback((capId) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(capId)) next.delete(capId)
      else next.add(capId)
      return next
    })
    setTimeout(() => {
      reactFlowInstanceRef.current?.fitView({ padding: 0.25, duration: 400 })
    }, 50)
  }, [])

  const handleRelHover = useCallback((id) => {
    relHoverRef.current = id
    setRelHoverVersion((v) => v + 1)
  }, [])

  const handleRelLeave = useCallback(() => {
    relHoverRef.current = null
    setRelHoverVersion((v) => v + 1)
  }, [])

  const graph = useMemo(() => {
    const g = radialLayout(documento, collapsed, draggedPositionsRef.current)

    let focusSet = null
    if (focoId) {
      focusSet = new Set([focoId])
      for (const cap of (documento?.capitulos || [])) {
        if (focoId === `cap-${cap.id}`) {
          cap.artigos?.forEach((a) => focusSet.add(`art-${a.id}`))
          break
        }
      }
    }

    if (mostrarRel && documento) {
      const nodeMap = {}
      g.nodes.forEach((n) => { nodeMap[n.id] = n })
      let artigosComRel = 0
      let totalRel = 0
      let edgesCriadas = 0
      for (const cap of documento.capitulos) {
        for (const art of cap.artigos) {
          const artId = `art-${art.id}`
          const rels = (art.relacionados || []).slice(0, 5)
          if (rels.length > 0) artigosComRel++
          totalRel += rels.length
          if (!nodeMap[artId]) continue
          rels.forEach((rel) => {
            const relId = `art-${rel.id}`
            if (relId !== artId && nodeMap[relId]) {
              edgesCriadas++
              const h = bestHandles(nodeMap[artId], nodeMap[relId])
              g.edges.push({
                id: `e-rel-${artId}-${relId}`,
                source: artId,
                target: relId,
                sourceHandle: h.sourceHandle,
                targetHandle: h.targetHandle,
                type: 'smoothstep',
                style: { stroke: '#93c5fd', strokeWidth: 1.5, strokeDasharray: '4 4' },
              })
            }
          })
        }
      }
      relDebugRef.current = { totalRel, edgesCriadas, artigosComRel }
    }

    g.nodes = g.nodes.map((n) => {
      const blurred = focusSet ? !focusSet.has(n.id) : false
      if (n.type === 'chapterNode') {
        return { ...n, data: { ...n.data, onToggle: () => handleToggle(n.id), blurred } }
      }
      if (n.type === 'articleNode' && mostrarRel) {
        return { ...n, data: { ...n.data, blurred, onHoverEnter: () => handleRelHover(n.id), onHoverLeave: handleRelLeave } }
      }
      return { ...n, data: { ...n.data, blurred } }
    })
    return g
  }, [documento, collapsed, handleToggle, loadVersion, focoId, mostrarRel, relHoverVersion])

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
      for (const cap of documento.capitulos || []) {
        for (const art of cap.artigos || []) {
          if (`art-${art.id}` === node.id) {
            onSelectArtigo(art)
            break
          }
        }
      }
    }
  }, [documento, onSelectArtigo])

  const onNodeDoubleClick = useCallback((_, node) => {
    if (node.type === 'chapterNode') {
      setFocoId((prev) => (prev === node.id ? null : node.id))
    }
  }, [])

  const onPaneClick = useCallback(() => {
    if (focoId) setFocoId(null)
  }, [focoId])

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
    const focusIds = new Set([focoId])
    for (const cap of documento.capitulos) {
      if (focoId === `cap-${cap.id}`) {
        cap.artigos?.forEach((a) => focusIds.add(`art-${a.id}`))
        break
      }
    }
    const fitNodes = nodes.filter((n) => focusIds.has(n.id))
    if (fitNodes.length > 0) {
      setTimeout(() => reactFlowInstanceRef.current?.fitView({ nodes: fitNodes, padding: 0.3, duration: 400 }), 50)
    }
  }, [focoId, documento, nodes])

  return (
    <div className="h-full w-full">
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
        {mostrarRel && (
          <div className="absolute bottom-4 left-4 z-10 bg-white/90 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 shadow-sm">
            Artigos c/ relações: {relDebugRef.current.artigosComRel} |
            Relações total: {relDebugRef.current.totalRel} |
            Arestas criadas: {relDebugRef.current.edgesCriadas}
          </div>
        )}
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
