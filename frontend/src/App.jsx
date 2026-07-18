import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MindMap from './components/MindMap'
import ArticleModal from './components/ArticleModal'
import UploadModal from './components/UploadModal'
import TextUploadModal from './components/TextUploadModal'
import { listarDocumentos, detalheDocumento, buscar } from './api/client'

export default function App() {
  const [documento, setDocumento] = useState(null)
  const [artigoModal, setArtigoModal] = useState(null)
  const [showUploadJSON, setShowUploadJSON] = useState(false)
  const [showUploadText, setShowUploadText] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)

  const { data: docsList } = useQuery({
    queryKey: ['documentos'],
    queryFn: listarDocumentos,
  })

  useEffect(() => {
    if (docsList?.length > 0) {
      const slug = docsList[0].slug
      detalheDocumento(slug).then((doc) => {
        setDocumento(doc)
      })
    }
  }, [docsList])

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
    }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        onSearch={handleSearch}
        onUploadJSON={() => setShowUploadJSON(true)}
        onUploadText={() => setShowUploadText(true)}
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
