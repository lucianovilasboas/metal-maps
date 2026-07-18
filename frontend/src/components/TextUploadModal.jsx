import { useState } from 'react'

export default function TextUploadModal({ onClose, onImported }) {
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!texto.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/v1/documentos/upload-texto/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto.trim(), titulo: 'Documento importado' }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.erro || 'Erro ao processar texto')
      }

      const data = await res.json()
      onImported(data)
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao processar texto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">✏️ Importar Texto (IA)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Cole o texto do regulamento abaixo. A IA vai estruturar automaticamente em capítulos, artigos e relacionamentos.
          </p>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Cole aqui o texto do regulamento..."
            rows={15}
            className="w-full border border-gray-300 rounded-lg p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
          />

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !texto.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processando...' : 'Estruturar com IA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
