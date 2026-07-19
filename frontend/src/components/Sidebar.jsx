import { useState } from 'react'

function BlocoNode({ bloco, onSelect }) {
  const [aberto, setAberto] = useState(false)
  const filhos = bloco.filhos || []
  const artigos = bloco.artigos || []
  const hasChildren = filhos.length > 0 || artigos.length > 0

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        {hasChildren && (
          <span className="text-xs text-gray-400 w-4 shrink-0">
            {aberto ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-4 shrink-0" />}
        <span className="text-[10px] uppercase text-gray-400 shrink-0">{bloco.tipo}</span>
        <span className="truncate">{bloco.rotulo} {bloco.titulo}</span>
      </button>
      {aberto && (
        <div className="ml-3 border-l border-gray-100 pl-2">
          {filhos.map((filho) => (
            <BlocoNode key={filho.id} bloco={filho} onSelect={onSelect} />
          ))}
          {artigos.map((artigo) => (
            <button
              key={artigo.id}
              onClick={() => onSelect(artigo)}
              className="w-full flex items-center gap-2 pl-3 pr-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <span className="text-xs text-blue-500 w-8 shrink-0 font-mono">{artigo.id_code}</span>
              <span className="truncate">{artigo.titulo}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ documento, onSelect, searchResults, searchLoading, onClearSearch }) {
  return (
    <aside className="w-60 border-r border-gray-200 bg-white flex flex-col shrink-0">
      {searchResults !== null ? (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">
              Resultados
            </h3>
            <button
              onClick={onClearSearch}
              className="text-xs text-blue-600 hover:underline"
            >
              Limpar
            </button>
          </div>
          {searchLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Buscando...</p>
          ) : searchResults.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum resultado</p>
          ) : (
            <div className="space-y-2">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    if (!documento) return
                    for (const bloco of recursivoBlocos(documento.blocos)) {
                      for (const art of (bloco.artigos || [])) {
                        if (art.id === r.id) {
                          onSelect(art)
                          return
                        }
                      }
                    }
                  }}
                  className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <span className="text-xs text-blue-600 font-mono">{r.id_code}</span>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{r.titulo}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.texto_preview}</p>
                  <span className="text-xs text-gray-400 mt-1 block">{r.capitulo}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {documento?.titulo || 'Capítulos'}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {(documento?.blocos || []).map((bloco) => (
              <BlocoNode
                key={bloco.id}
                bloco={bloco}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

function recursivoBlocos(blocos) {
  const result = []
  for (const b of blocos) {
    result.push(b)
    if (b.filhos?.length) result.push(...recursivoBlocos(b.filhos))
  }
  return result
}
