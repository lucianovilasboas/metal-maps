import { useState, useEffect, useRef } from 'react'

const LAYOUT_OPTIONS = [
  { value: 'radial', label: 'Radial' },
  { value: 'treeVertical', label: 'Árvore Vertical' },
  { value: 'treeHorizontal', label: 'Árvore Horizontal' },
  { value: 'convex', label: 'Convexo' },
  { value: 'organic', label: 'Orgânico' },
  { value: 'spring', label: 'Elétrico' },
  { value: 'balloon', label: 'Balão' },
  { value: 'spiral', label: 'Espiral' },
  { value: 'hierarchical', label: 'Hierárquico' },
]

export default function Header({ docsList, activeSlug, onSelectDocumento, onSearch, onUploadJSON, onUploadText, onExportJSON, onExportPNG, onDeleteDocumento, onAtualizarDocumento, searchVersion, layoutType, onSelectLayout }) {
  const [query, setQuery] = useState('')
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [showDocMenu, setShowDocMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editValue, setEditValue] = useState('')
  const editInputRef = useRef(null)
  const debounceRef = useRef(null)
  const activeDocRef = useRef(null)

  useEffect(() => {
    setQuery('')
  }, [searchVersion])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.length >= 3) {
      debounceRef.current = setTimeout(() => onSearch(query), 300)
    } else {
      onSearch('')
    }
    return () => clearTimeout(debounceRef.current)
  }, [query, onSearch])

  useEffect(() => {
    if (showDocMenu && activeDocRef.current) {
      activeDocRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [showDocMenu])

  useEffect(() => {
    if (editingTitle && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingTitle])

  const handleStartEdit = () => {
    if (activeDoc) {
      setEditValue(activeDoc.titulo)
      setEditingTitle(true)
    }
  }

  const handleSaveEdit = () => {
    const val = editValue.trim()
    if (val && activeDoc && val !== activeDoc.titulo) {
      onAtualizarDocumento(activeSlug, { titulo: val })
    }
    setEditingTitle(false)
  }

  const handleCancelEdit = () => {
    setEditingTitle(false)
  }

  const activeDoc = docsList?.find((d) => d.slug === activeSlug)
  const activeLayout = LAYOUT_OPTIONS.find(l => l.value === layoutType) || LAYOUT_OPTIONS[0]

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
      <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap shrink-0">
        📜 Portal
      </h1>

      <div className="relative shrink-0">
        {editingTitle ? (
          <div className="flex items-center gap-1 bg-white border border-blue-400 rounded-lg shadow-sm">
            <input
              ref={editInputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') handleCancelEdit()
              }}
              className="px-3 py-1.5 text-sm border-none outline-none bg-transparent min-w-[180px]"
            />
            <button onClick={handleSaveEdit} className="px-1.5 py-1 text-green-600 hover:text-green-700" title="Salvar">✔</button>
            <button onClick={handleCancelEdit} className="px-1.5 py-1 text-gray-400 hover:text-gray-600" title="Cancelar">✕</button>
          </div>
        ) : (
          <div className="flex items-center">
            <button
              onClick={() => setShowDocMenu(!showDocMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-l-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors min-w-[200px]"
            >
              <span className="truncate">{activeDoc?.titulo || 'Selecionar documento...'}</span>
            </button>
            {activeDoc && (
              <button
                onClick={(e) => { e.stopPropagation(); handleStartEdit() }}
                className="shrink-0 px-2 py-1.5 bg-gray-50 border-y border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                title="Editar título"
              >
                ✎
              </button>
            )}
            <button
              onClick={() => setShowDocMenu(!showDocMenu)}
              className="shrink-0 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-r-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors"
            >
              {showDocMenu ? '▲' : '▼'}
            </button>
          </div>
        )}

        {showDocMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDocMenu(false)} />
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[250px] max-h-60 overflow-y-auto">
              {docsList?.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">Nenhum documento</p>
              )}
              {docsList?.map((doc) => (
                <div
                  key={doc.slug}
                  ref={doc.slug === activeSlug ? activeDocRef : null}
                  className={`flex items-center border-b border-gray-100 last:border-b-0 transition-colors ${
                    doc.slug === activeSlug ? 'bg-blue-50' : ''
                  }`}
                >
                  <button
                    onClick={() => { onSelectDocumento(doc.slug); setShowDocMenu(false) }}
                    className={`flex-1 text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${
                      doc.slug === activeSlug ? 'text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <div className="truncate">{doc.titulo}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{doc.slug}</div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(`Excluir "${doc.titulo}"?`)) {
                        onDeleteDocumento(doc.slug)
                        setShowDocMenu(false)
                      }
                    }}
                    className="shrink-0 px-2 py-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Excluir documento"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {activeDoc && (
        <button
          onClick={() => {
            if (window.confirm(`Excluir "${activeDoc.titulo}"?`)) {
              onDeleteDocumento(activeDoc.slug)
            }
          }}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
          title="Excluir documento"
        >
          🗑
        </button>
      )}

      <div className="relative shrink-0">
        <button
          onClick={() => setShowLayoutMenu(!showLayoutMenu)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors min-w-[140px]"
        >
          <span className="text-xs text-gray-400 shrink-0">Layout:</span>
          <span className="truncate">{activeLayout.label}</span>
          <span className="text-xs text-gray-400 shrink-0">{showLayoutMenu ? '▲' : '▼'}</span>
        </button>

        {showLayoutMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowLayoutMenu(false)} />
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px]">
              {LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onSelectLayout(opt.value); setShowLayoutMenu(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    opt.value === layoutType ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 max-w-xl relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar artigos, palavras-chave..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
      </div>

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
