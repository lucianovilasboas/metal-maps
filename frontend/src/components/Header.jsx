import { useState, useCallback } from 'react'

export default function Header({ onSearch, onUploadJSON, onUploadText }) {
  const [query, setQuery] = useState('')
  const [showUploadMenu, setShowUploadMenu] = useState(false)

  const handleSearch = useCallback((e) => {
    e.preventDefault()
    onSearch(query)
  }, [query, onSearch])

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
      <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap">
        📜 Portal de Regulamentos
      </h1>

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
    </header>
  )
}
