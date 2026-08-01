import { useDraggable } from '@dnd-kit/core'

const FOODS = [
  { name: 'broccoli', label: '西兰花', effect: 'healthy' },
  { name: 'carrot', label: '胡萝卜', effect: 'healthy' },
  { name: 'yogurt', label: '酸奶', effect: 'healthy' },
  { name: 'apple', label: '苹果', effect: 'healthy' },
  { name: 'corn', label: '玉米', effect: 'healthy' },
  { name: 'candy', label: '糖果', effect: 'high_sugar' },
  { name: 'cake', label: '蛋糕', effect: 'high_sugar' },
]

function DraggableFood({ name, label }: { name: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: name })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="w-14 h-14 rounded-xl bg-white/80 shadow flex items-center justify-center hover:scale-110 transition-transform cursor-grab active:cursor-grabbing"
    >
      <img src={`/assets/foods/food_${name}.png`} alt={label} className="w-10 h-10" />
    </button>
  )
}

export default function FoodToolbar() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 bg-white/50 backdrop-blur rounded-2xl px-4 py-2">
      {FOODS.map((f) => (
        <DraggableFood key={f.name} name={f.name} label={f.label} />
      ))}
    </div>
  )
}
