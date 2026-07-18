import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toCanvas } from 'html-to-image'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MindMap from './components/MindMap'
import ArticleModal from './components/ArticleModal'
import UploadModal from './components/UploadModal'
import TextUploadModal from './components/TextUploadModal'
import { listarDocumentos, detalheDocumento, buscar, salvarPosicoes } from './api/client'

function downloadFile(content, filename, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [documento, setDocumento] = useState(null)
  const [artigoModal, setArtigoModal] = useState(null)
  const [showUploadJSON, setShowUploadJSON] = useState(false)
  const [showUploadText, setShowUploadText] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [activeSlug, setActiveSlug] = useState(null)
  const mindMapRef = useRef(null)

  const { data: docsList } = useQuery({
    queryKey: ['documentos'],
    queryFn: listarDocumentos,
  })

  const loadDocumento = useCallback((slug) => {
    setSearchResults(null)
    setActiveSlug(slug)
    detalheDocumento(slug).then((doc) => setDocumento(doc))
  }, [])

  useEffect(() => {
    if (docsList?.length > 0 && !activeSlug) {
      loadDocumento(docsList[0].slug)
    }
  }, [docsList, activeSlug, loadDocumento])

  const handleSelectArtigo = useCallback((artigo) => {
    setArtigoModal(artigo)
    setSearchResults(null)
  }, [])

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults(null)
      return
    }
    setSearchLoading(true)
    try {
      const res = await buscar(query)
      setSearchResults(res.resultados)
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const handleImportFromJSON = useCallback((data) => {
    const doc = data.capitulos ? data : data.documentos?.[0]
    if (doc) {
      setDocumento(doc)
      setActiveSlug(doc.slug)
    }
  }, [])

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
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          documento={documento}
          onSelect={handleSelectArtigo}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onClearSearch={() => setSearchResults(null)}
        />

        <div className="flex-1 min-w-0 relative">
          <MindMap
            documento={documento}
            onSelectArtigo={handleSelectArtigo}
            onSalvarPosicoes={handleSalvarPosicoes}
            containerRef={mindMapRef}
          />
        </div>
      </div>

      {artigoModal && (
        <ArticleModal
          artigo={artigoModal}
          onClose={() => setArtigoModal(null)}
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
