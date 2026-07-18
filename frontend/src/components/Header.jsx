import { useState, useCallback } from 'react'

export default function Header({ docsList, activeSlug, onSelectDocumento, onSearch, onUploadJSON, onUploadText, onExportJSON, onExportPNG }) {
  const [query, setQuery] = useState('')
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [showDocMenu, setShowDocMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleSearch = useCallback((e) => {
    e.preventDefault()
    onSearch(query)
  }, [query, onSearch])

  const activeDoc = docsList?.find((d) => d.slug === activeSlug)

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
      <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap shrink-0">
        📜 Portal
      </h1>

      <div className="relative shrink-0">
        <button
          onClick={() => setShowDocMenu(!showDocMenu)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors min-w-[200px]"
        >
          <span className="truncate">{activeDoc?.titulo || 'Selecionar documento...'}</span>
          <span className="text-xs text-gray-400 shrink-0">{showDocMenu ? '▲' : '▼'}</span>
        </button>

        {showDocMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDocMenu(false)} />
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[250px] max-h-60 overflow-y-auto">
              {docsList?.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">Nenhum documento</p>
              )}
              {docsList?.map((doc) => (
                <button
                  key={doc.slug}
                  onClick={() => { onSelectDocumento(doc.slug); setShowDocMenu(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    doc.slug === activeSlug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="truncate">{doc.titulo}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{doc.slug}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-xl relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar artigos, palavras-chave..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
      </form>

      <div className="relative">
        <button
          onClick={() => setShowUploadMenu(!showUploadMenu)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Importar
        </button>

        {showUploadMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowUploadMenu(false)} />
            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-48">
              <button
                onClick={() => { onUploadJSON(); setShowUploadMenu(false) }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
              >
                📄 Upload JSON
              </button>
              <button
                onClick={() => { onUploadText(); setShowUploadMenu(false) }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
              >
                ✏️ Colar texto (IA)
              </button>
            </div>
          </>
        )}
      </div>

      <div className="relative shrink-0">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          ↓ Exportar
        </button>

        {showExportMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-48">
              <button
                onClick={() => { onExportJSON(); setShowExportMenu(false) }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
              >
                📥 Baixar JSON
              </button>
              <button
                onClick={() => { onExportPNG(); setShowExportMenu(false) }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
              >
                🖼️ Baixar PNG
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
