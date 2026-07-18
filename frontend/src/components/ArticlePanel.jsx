export default function ArticlePanel({ artigo, onSelectArtigo }) {
  if (!artigo) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p className="text-lg">Selecione um artigo na árvore ou no mapa mental</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-3">
          {artigo.id_code}
        </span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{artigo.titulo}</h2>

        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{artigo.texto}</p>
        </div>

        {artigo.relacionados?.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              📎 Relacionados
            </h3>
            <div className="flex flex-wrap gap-2">
              {artigo.relacionados.map((rel) => (
                <button
                  key={rel.id}
                  onClick={() => onSelectArtigo(rel)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                >
                  {rel.id_code}
                  {rel.titulo && <span className="text-gray-400">·</span>}
                  {rel.titulo && <span className="truncate max-w-[200px]">{rel.titulo}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
