import { createPortal } from 'react-dom'

export default function Tooltip({ visible, x, y, content }) {
  if (!visible || !content) return null
  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none max-w-sm bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg leading-relaxed"
      style={{ left: x + 12, top: y - 8, transform: 'translateY(-100%)' }}
    >
      {content}
    </div>,
    document.body
  )
}
