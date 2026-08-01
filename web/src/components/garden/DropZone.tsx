import { useDroppable } from '@dnd-kit/core'

export function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'garden-drop-zone' })

  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-0 z-10 transition-colors duration-300 rounded-2xl ${
        isOver ? 'bg-garden-forest/10 ring-2 ring-garden-forest/40 ring-dashed' : ''
      }`}
    >
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-4xl animate-bounce">🍽️</span>
        </div>
      )}
    </div>
  )
}
