import { useEffect, useMemo } from 'react'

function highlightText(texto, query) {
  if (!query || !texto) return texto
  const terms = query.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return texto
  const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const parts = texto.split(new RegExp(`(${pattern})`, 'gi'))
  return parts.map((part, i) =>
    terms.some(t => t.toLowerCase() === part.toLowerCase())
      ? `<mark class="bg-yellow-200 rounded px-0.5">${part}</mark>`
      : part
  ).join('')
}

function renderParagrafos(paragrafos, query) {
  if (!paragrafos?.length) return null
  return paragrafos.map((par) => (
    <div key={par.id} className="ml-6 mt-3">
      <p className="text-sm text-gray-700">
        <span className="font-semibold text-gray-900">{par.rotulo}</span>{' '}
        <span dangerouslySetInnerHTML={{ __html: highlightText(par.texto, query) }} />
      </p>
      {renderIncisos(par.incisos, query)}
    </div>
  ))
}

function renderIncisos(incisos, query) {
  if (!incisos?.length) return null
  return (
    <div className="ml-8 mt-2 space-y-1">
      {incisos.map((inc) => (
        <div key={inc.id}>
          <p className="text-sm text-gray-600">
            <span className="font-mono text-gray-800 font-medium">{inc.rotulo}</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: highlightText(inc.texto, query) }} />
          </p>
          {renderAlineas(inc.alineas, query)}
        </div>
      ))}
    </div>
  )
}

function renderAlineas(alineas, query) {
  if (!alineas?.length) return null
  return (
    <div className="ml-8 mt-1 space-y-1">
      {alineas.map((al) => (
        <div key={al.id}>
          <p className="text-sm text-gray-600">
            <span className="font-mono text-gray-800">{al.rotulo}</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: highlightText(al.texto, query) }} />
          </p>
          {renderItens(al.itens, query)}
        </div>
      ))}
    </div>
  )
}

function renderItens(itens, query) {
  if (!itens?.length) return null
  return (
    <div className="ml-8 mt-1 space-y-1">
      {itens.map((item) => (
        <p key={item.id} className="text-sm text-gray-600">
          <span className="font-mono text-gray-800">{item.rotulo}</span>{' '}
          <span dangerouslySetInnerHTML={{ __html: highlightText(item.texto, query) }} />
        </p>
      ))}
    </div>
  )
}

export default function ArticleModal({ artigo, onClose, searchQuery }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const tituloHtml = useMemo(() => highlightText(artigo.titulo, searchQuery), [artigo.titulo, searchQuery])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap">
              {artigo.id_code}
            </span>
            <h2 className="text-lg font-bold text-gray-900 truncate" dangerouslySetInnerHTML={{ __html: tituloHtml }} />
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          {artigo.caput && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-900 font-medium">Caput</p>
              <p
                className="text-sm text-gray-700 mt-1 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightText(artigo.caput, searchQuery) }}
              />
            </div>
          )}

          {artigo.texto && (
            <div className="mb-4">
              <p
                className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: highlightText(artigo.texto, searchQuery) }}
              />
            </div>
          )}

          {artigo.incisos?.length > 0 && !artigo.paragrafos?.length && (
            <div className="mt-2">
              {renderIncisos(artigo.incisos, searchQuery)}
            </div>
          )}

          {artigo.paragrafos?.length > 0 && (
            <div className="mt-2">
              {renderParagrafos(artigo.paragrafos, searchQuery)}
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 shrink-0">
          Clique fora ou pressione ESC para fechar
        </div>
      </div>
    </div>
  )
}
