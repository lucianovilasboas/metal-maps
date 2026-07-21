import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toCanvas } from 'html-to-image'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MindMap from './components/MindMap'
import ArticleModal from './components/ArticleModal'
import UploadModal from './components/UploadModal'
import TextUploadModal from './components/TextUploadModal'
import { listarDocumentos, detalheDocumento, buscar, salvarPosicoes, deletarDocumento, atualizarDocumento } from './api/client'

function clamp(v, min, max) { return Math.min(Math.max(v, min), max) }

function downloadFile(content, filename, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function acharBlocosRecursivo(blocos) {
  const result = []
  for (const b of blocos) {
    result.push(b)
    if (b.filhos?.length) result.push(...acharBlocosRecursivo(b.filhos))
  }
  return result
}

function encontrarCaminho(blocos, artigoId) {
  const todos = acharBlocosRecursivo(blocos || [])
  for (const bloco of todos) {
    for (const art of (bloco.artigos || [])) {
      if (art.id === artigoId) {
        const caminho = []
        let current = bloco
        while (current) {
          caminho.unshift({
            id: `bloco-${current.id}`,
            rotulo: `${current.rotulo} ${current.titulo}`.trim(),
            tipo: 'bloco',
          })
          current = todos.find(b => (b.filhos || []).some(f => f.id === current.id)) || null
        }
        return caminho
      }
    }
  }
  return []
}

export default function App() {
  const [documento, setDocumento] = useState(null)
  const [artigoModal, setArtigoModal] = useState(null)
  const [activeBlocoId, setActiveBlocoId] = useState(null)
  const [showUploadJSON, setShowUploadJSON] = useState(false)
  const [showUploadText, setShowUploadText] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSlug, setActiveSlug] = useState(() => localStorage.getItem('mm-active-slug'))
  const [searchVersion, setSearchVersion] = useState(0)
  const [layoutType, setLayoutType] = useState('radial')
  const [expandirTodos, setExpandirTodos] = useState(false)
  const [collapsedBlocos, setCollapsedBlocos] = useState(new Set())
  const mindMapRef = useRef(null)
  const queryClient = useQueryClient()

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('mm-sidebar-width')
    return saved ? clamp(parseInt(saved, 10), 200, 500) : 240
  })
  const draggingSidebar = useRef(false)

  const handleResizeStart = useCallback((e) => {
    e.preventDefault()
    draggingSidebar.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const move = (e) => {
      if (!draggingSidebar.current) return
      setSidebarWidth(clamp(e.clientX - 20, 200, 500))
    }
    const up = () => {
      if (!draggingSidebar.current) return
      draggingSidebar.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    return () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('mm-sidebar-width', sidebarWidth)
  }, [sidebarWidth])

  const { data: docsList } = useQuery({
    queryKey: ['documentos'],
    queryFn: listarDocumentos,
  })

  const loadDocumento = useCallback((slug) => {
    setSearchResults(null)
    setSearchQuery('')
    setSearchVersion(v => v + 1)
    setActiveBlocoId(null)
    setActiveSlug(slug)
    detalheDocumento(slug).then((doc) => setDocumento(doc))
  }, [])

  useEffect(() => {
    if (docsList?.length > 0 && !activeSlug) {
      const saved = localStorage.getItem('mm-active-slug')
      const match = saved && docsList.find((d) => d.slug === saved)
      loadDocumento(match ? saved : docsList[0].slug)
    }
  }, [docsList, activeSlug, loadDocumento])

  useEffect(() => {
    if (activeSlug) localStorage.setItem('mm-active-slug', activeSlug)
  }, [activeSlug])

  useEffect(() => {
    if (!documento?.slug) return
    const saved = localStorage.getItem(`mm-state-${documento.slug}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setCollapsedBlocos(new Set(data.collapsed || []))
        if (data.expandirTodos != null) setExpandirTodos(data.expandirTodos)
      } catch {
        const allIds = new Set()
        ;(function p(b) { for (const x of b) { allIds.add(`bloco-${x.id}`); if (x.filhos?.length) p(x.filhos) } })(documento.blocos || [])
        setCollapsedBlocos(allIds)
        setExpandirTodos(false)
      }
    } else {
      const allIds = new Set()
      ;(function p(b) { for (const x of b) { allIds.add(`bloco-${x.id}`); if (x.filhos?.length) p(x.filhos) } })(documento.blocos || [])
      setCollapsedBlocos(allIds)
      setExpandirTodos(false)
    }
  }, [documento?.slug])

  useEffect(() => {
    if (!documento?.slug) return
    const existing = localStorage.getItem(`mm-state-${documento.slug}`)
    let state = {}
    try { state = existing ? JSON.parse(existing) : {} } catch { state = {} }
    state.collapsed = [...collapsedBlocos]
    state.expandirTodos = expandirTodos
    localStorage.setItem(`mm-state-${documento.slug}`, JSON.stringify(state))
  }, [collapsedBlocos, expandirTodos, documento?.slug])

  const handleToggleBloco = useCallback((blocoId) => {
    setCollapsedBlocos((prev) => {
      const next = new Set(prev)
      if (next.has(blocoId)) next.delete(blocoId)
      else next.add(blocoId)
      return next
    })
  }, [])

  const handleSelectArtigo = useCallback((artigo) => {
    const caminho = encontrarCaminho(documento?.blocos, artigo.id)
    setArtigoModal({ ...artigo, caminho })
  }, [documento])

  const handleSelectArtigoPorId = useCallback((artigoId) => {
    if (!documento?.blocos) return
    const todos = acharBlocosRecursivo(documento.blocos)
    for (const bloco of todos) {
      for (const art of (bloco.artigos || [])) {
        if (art.id === artigoId) {
          handleSelectArtigo(art)
          return
        }
      }
    }
  }, [documento, handleSelectArtigo])

  const handleNavigate = useCallback((blocoId) => {
    setArtigoModal(null)
    setActiveBlocoId(blocoId)
  }, [])

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults(null)
      return
    }
    setSearchLoading(true)
    try {
      const res = await buscar(query, activeSlug)
      setSearchResults(res.resultados)
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [activeSlug])

  const handleImportFromJSON = useCallback(async (data) => {
    const doc = (data.blocos || data.capitulos) ? data : data.documentos?.[0]
    if (doc) {
      setDocumento(doc)
      setActiveSlug(doc.slug)
      try {
        const updatedList = await listarDocumentos()
        queryClient.setQueryData(['documentos'], updatedList)
      } catch {
        // silent
      }
    }
  }, [queryClient])

  const handleSalvarPosicoes = useCallback((posicoes) => {
    if (documento?.slug) {
      salvarPosicoes(documento.slug, posicoes).catch(() => {})
    }
  }, [documento?.slug])

  const handleExportJSON = useCallback(() => {
    if (!documento) return
    const json = JSON.stringify(documento, null, 2)
    downloadFile(json, `${documento.slug}.json`, 'application/json')
  }, [documento])

  const handleExportPNG = useCallback(async () => {
    const el = mindMapRef.current?.querySelector('.react-flow__renderer')
    if (!el) return
    try {
      const canvas = await toCanvas(el, {
        backgroundColor: '#f8fafc',
        pixelRatio: 2,
        cacheBust: true,
        useCORS: true,
      })
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${documento?.slug || 'mapa'}.png`
        a.click()
        URL.revokeObjectURL(url)
      })
    } catch {
      // silent
    }
  }, [documento])

  const handleDeletarDocumento = useCallback(async (slug) => {
    try {
      await deletarDocumento(slug)
    } catch {
      // silent
    }
    const updatedList = await listarDocumentos().catch(() => [])
    queryClient.setQueryData(['documentos'], updatedList)
    localStorage.removeItem(`mm-state-${slug}`)
    if (slug === activeSlug) {
      const next = updatedList.length > 0 ? updatedList[0] : null
      if (next) {
        setActiveSlug(next.slug)
        detalheDocumento(next.slug).then((doc) => setDocumento(doc))
      } else {
        setActiveSlug(null)
        setDocumento(null)
        setArtigoModal(null)
      }
    }
  }, [activeSlug, queryClient])

  const handleAtualizarDocumento = useCallback(async (slug, data) => {
    try {
      await atualizarDocumento(slug, data)
    } catch {
      // silent
    }
    const updatedList = await listarDocumentos().catch(() => [])
    queryClient.setQueryData(['documentos'], updatedList)
    if (slug === activeSlug && documento) {
      setDocumento({ ...documento, titulo: data.titulo })
    }
  }, [activeSlug, documento, queryClient])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        docsList={docsList}
        activeSlug={activeSlug}
        onSelectDocumento={loadDocumento}
        onSearch={handleSearch}
        onUploadJSON={() => setShowUploadJSON(true)}
        onUploadText={() => setShowUploadText(true)}
        onExportJSON={handleExportJSON}
        onExportPNG={handleExportPNG}
        onDeleteDocumento={handleDeletarDocumento}
        onAtualizarDocumento={handleAtualizarDocumento}
        searchVersion={searchVersion}
        layoutType={layoutType}
        onSelectLayout={setLayoutType}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          documento={documento}
          onSelect={handleSelectArtigo}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onClearSearch={() => {
            setSearchResults(null)
            setSearchQuery('')
            setSearchVersion(v => v + 1)
          }}
          activeBlocoId={activeBlocoId}
          onNavigate={handleNavigate}
          expandirTodos={expandirTodos}
          onToggleExpandirTodos={() => setExpandirTodos(v => {
            const novo = !v
            if (novo) {
              setCollapsedBlocos(new Set())
            } else {
              const allIds = new Set()
              ;(function p(b) { for (const x of b) { allIds.add(`bloco-${x.id}`); if (x.filhos?.length) p(x.filhos) } })(documento?.blocos || [])
              setCollapsedBlocos(allIds)
            }
            return novo
          })}
          collapsedBlocos={collapsedBlocos}
          onToggleBloco={handleToggleBloco}
          width={sidebarWidth}
        />

        <div
          className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize shrink-0 transition-colors"
          onMouseDown={handleResizeStart}
        />

        <div className="flex-1 min-w-0 relative">
          <MindMap
            documento={documento}
            onSelectArtigo={handleSelectArtigo}
            onSalvarPosicoes={handleSalvarPosicoes}
            containerRef={mindMapRef}
            searchResults={searchResults}
            activeBlocoId={activeBlocoId}
            onNavigate={handleNavigate}
            layoutType={layoutType}
            collapsedBlocos={collapsedBlocos}
            onToggleBloco={handleToggleBloco}
          />
        </div>
      </div>

      {artigoModal && (
        <ArticleModal
          artigo={artigoModal}
          onClose={() => setArtigoModal(null)}
          searchQuery={searchQuery}
          onNavigate={handleNavigate}
          onSelectArtigoPorId={handleSelectArtigoPorId}
        />
      )}

      {showUploadJSON && (
        <UploadModal
          onClose={() => setShowUploadJSON(false)}
          onImported={handleImportFromJSON}
        />
      )}

      {showUploadText && (
        <TextUploadModal
          onClose={() => setShowUploadText(false)}
          onImported={handleImportFromJSON}
        />
      )}
    </div>
  )
}
