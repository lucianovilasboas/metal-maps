import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadJSON } from '../api/client'

export default function UploadModal({ onClose, onImported }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setLoading(true)
    setError('')

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result = await uploadJSON(data)
      onImported(result)
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao processar JSON')
    } finally {
      setLoading(false)
    }
  }, [onClose, onImported])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    maxFiles: 1,
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">📄 Importar JSON</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            {loading ? (
              <p className="text-gray-600">Processando...</p>
            ) : isDragActive ? (
              <p className="text-blue-600 font-medium">Solte o arquivo aqui</p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-1">
                  Arraste um JSON ou clique para selecionar
                </p>
                <p className="text-gray-400 text-sm">
                  O JSON deve seguir o schema de documentos do portal
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
