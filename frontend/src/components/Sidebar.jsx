import { useState, useEffect, useRef } from 'react'

function contarAncestrais(blocos, targetId, ancestrais) {
  for (const bloco of blocos) {
    const blocoId = `bloco-${bloco.id}`
    if (blocoId === targetId) return true
    if (bloco.filhos?.length) {
      if (contarAncestrais(bloco.filhos, targetId, ancestrais)) {
        ancestrais.add(blocoId)
        return true
      }
    }
    if (bloco.artigos?.length) {
      for (const art of bloco.artigos) {
        if (`art-${art.id}` === targetId) {
          ancestrais.add(blocoId)
          return true
        }
      }
    }
  }
  return false
}

function BlocoNode({ bloco, onSelect, expandido, ativo, expandirTodos }) {
  const [aberto, setAberto] = useState(expandido || expandirTodos)
  const ref = useRef(null)

  useEffect(() => {
    setAberto(expandido || expandirTodos)
  }, [expandido, expandirTodos])

  useEffect(() => {
    if (ativo && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [ativo])

  const filhos = bloco.filhos || []
  const artigos = bloco.artigos || []
  const hasChildren = filhos.length > 0 || artigos.length > 0

  return (
    <div className="mb-0.5" ref={ref}>
      <button
        onClick={() => setAberto(!aberto)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
          ativo
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100 font-medium'
        }`}
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
            <BlocoNode key={filho.id} bloco={filho} onSelect={onSelect} expandido={false} ativo={false} expandirTodos={expandirTodos} />
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

export default function Sidebar({ documento, onSelect, searchResults, searchLoading, onClearSearch, activeBlocoId, onNavigate }) {
  const sidebarRef = useRef(null)
  const [expandirTodos, setExpandirTodos] = useState(false)

  const ancestrais = new Set()
  if (activeBlocoId && documento?.blocos) {
    contarAncestrais(documento.blocos, activeBlocoId, ancestrais)
  }

  return (
    <aside className="w-60 border-r border-gray-200 bg-white flex flex-col shrink-0" ref={sidebarRef}>
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
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {documento?.titulo || 'Capítulos'}
            </h2>
            <button
              onClick={() => setExpandirTodos(!expandirTodos)}
              className="text-[10px] text-blue-600 hover:underline shrink-0"
              title={expandirTodos ? 'Recolher todos' : 'Expandir todos'}
            >
              {expandirTodos ? '▴ Recolher' : '▾ Expandir'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {(documento?.blocos || []).map((bloco) => (
              <BlocoNode
                key={bloco.id}
                bloco={bloco}
                onSelect={onSelect}
                expandido={ancestrais.has(`bloco-${bloco.id}`)}
                ativo={activeBlocoId === `bloco-${bloco.id}`}
                expandirTodos={expandirTodos}
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
