import { useState } from 'react'

const MODEL_OPTIONS = [
  { provider: 'gemini', model: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { provider: 'gemini', model: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { provider: 'openai', model: 'gpt-4.1',           label: 'GPT-4.1' },
  { provider: 'openai', model: 'gpt-4o',            label: 'GPT-4o' },
]

export default function TextUploadModal({ onClose, onImported }) {
  const [texto, setTexto] = useState('')
  const [titulo, setTitulo] = useState('')
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!texto.trim()) return

    setLoading(true)
    setError('')

    try {
      const body = { texto: texto.trim() }
      if (titulo.trim()) body.titulo = titulo.trim()
      body.provider = selectedModel.provider
      body.model = selectedModel.model

      const res = await fetch('/api/v1/documentos/upload-texto/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do documento (opcional — IA sugere se vazio)"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <select
            value={`${selectedModel.provider}|${selectedModel.model}`}
            onChange={(e) => {
              const [provider, model] = e.target.value.split('|')
              setSelectedModel(MODEL_OPTIONS.find(m => m.provider === provider && m.model === model) || MODEL_OPTIONS[0])
            }}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={`${opt.provider}|${opt.model}`} value={`${opt.provider}|${opt.model}`}>
                {opt.label}
              </option>
            ))}
          </select>

          <p className="text-sm text-gray-500 mb-3">
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processando...
                </span>
              ) : 'Estruturar com IA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
