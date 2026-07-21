import { useState, useCallback, useRef } from 'react'
import Tooltip from './Tooltip'

function BlocoNode({ bloco, onSelect, ativo, collapsedBlocos, onToggleBloco, showTooltip, moveTooltip, hideTooltip }) {
  const blocoId = `bloco-${bloco.id}`
  const aberto = !collapsedBlocos.has(blocoId)

  const filhos = bloco.filhos || []
  const artigos = bloco.artigos || []
  const hasChildren = filhos.length > 0 || artigos.length > 0

  return (
    <div className="mb-0.5">
      <button
        onClick={() => onToggleBloco(blocoId)}
        onMouseEnter={(e) => showTooltip(
          <div>
            <div className="font-semibold mb-0.5">{bloco.rotulo} {bloco.titulo}</div>
            <div className="text-gray-300 text-[10px] uppercase">{bloco.tipo}</div>
            {hasChildren && <div className="text-gray-300 text-[10px]">{artigos.length} artigos, {filhos.length} sub-blocos</div>}
          </div>,
          e
        )}
        onMouseMove={(e) => moveTooltip(e)}
        onMouseLeave={hideTooltip}
        className={`w-full flex items-center gap-2 px-3 py-1 text-xs rounded-md transition-colors ${
          ativo
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100 font-medium'
        }`}
      >
        {hasChildren && (
          <span className="text-[10px] text-gray-400 w-4 shrink-0">
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
            <BlocoNode key={filho.id} bloco={filho} onSelect={onSelect} ativo={false} collapsedBlocos={collapsedBlocos} onToggleBloco={onToggleBloco} showTooltip={showTooltip} moveTooltip={moveTooltip} hideTooltip={hideTooltip} />
          ))}
          {artigos.map((artigo) => (
            <button
              key={artigo.id}
              onClick={() => onSelect(artigo)}
              onMouseEnter={(e) => showTooltip(
                <div>
                  <div className="font-semibold mb-0.5">{artigo.titulo}</div>
                  <div className="text-gray-300 text-[10px]">{(artigo.caput || artigo.texto || '').slice(0, 200)}</div>
                </div>,
                e
              )}
              onMouseMove={(e) => moveTooltip(e)}
              onMouseLeave={hideTooltip}
              className="w-full flex items-center gap-2 pl-3 pr-3 py-0.5 text-xs text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <span className="text-[10px] text-blue-500 w-8 shrink-0 font-mono">{artigo.id_code}</span>
              <span className="truncate">{artigo.titulo}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ documento, onSelect, searchResults, searchLoading, onClearSearch, activeBlocoId, onNavigate, expandirTodos, onToggleExpandirTodos, collapsedBlocos, onToggleBloco, width }) {
  const [tooltip, setTooltip] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const tooltipTimer = useRef(null)

  const showTooltip = useCallback((content, e) => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setTooltipPos({ x: e.clientX, y: e.clientY })
    tooltipTimer.current = setTimeout(() => setTooltip(content), 300)
  }, [])

  const moveTooltip = useCallback((e) => {
    if (tooltipTimer.current) setTooltipPos({ x: e.clientX, y: e.clientY })
  }, [])

  const hideTooltip = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setTooltip(null)
  }, [])

  return (
    <aside className="border-r border-gray-200 bg-white flex flex-col shrink-0" style={{ width }}>
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
                  onMouseEnter={(e) => showTooltip(
                    <div>
                      <div className="font-semibold mb-0.5">{r.titulo}</div>
                      <div className="text-gray-300 text-[10px]">{r.texto_preview}</div>
                    </div>,
                    e
                  )}
                  onMouseMove={(e) => moveTooltip(e)}
                  onMouseLeave={hideTooltip}
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
              onClick={onToggleExpandirTodos}
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
                ativo={activeBlocoId === `bloco-${bloco.id}`}
                collapsedBlocos={collapsedBlocos}
                onToggleBloco={onToggleBloco}
                showTooltip={showTooltip}
                moveTooltip={moveTooltip}
                hideTooltip={hideTooltip}
              />
            ))}
          </div>
        </div>
      )}
      <Tooltip visible={!!tooltip} x={tooltipPos.x} y={tooltipPos.y} content={tooltip} />
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
