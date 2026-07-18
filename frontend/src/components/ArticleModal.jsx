import { useEffect } from 'react'

export default function ArticleModal({ artigo, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

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
            <h2 className="text-lg font-bold text-gray-900 truncate">{artigo.titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
            {artigo.texto}
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 shrink-0">
          Clique fora ou pressione ESC para fechar
        </div>
      </div>
    </div>
  )
}
