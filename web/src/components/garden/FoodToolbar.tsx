import { useDraggable } from '@dnd-kit/core'
import { sfx } from '@/lib/sound'

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
      className="w-12 h-12 rounded-full bg-white/80 shadow flex items-center justify-center hover:scale-110 transition-transform cursor-grab active:cursor-grabbing"
      onPointerDown={() => sfx.pop()}
    >
      <img src={`/assets/foods/food_${name}.png`} alt={label} className="w-8 h-8" />
    </button>
  )
}

export default function FoodToolbar() {
  return (
    <div className="flex items-center gap-2">
      {FOODS.map((f) => (
        <DraggableFood key={f.name} name={f.name} label={f.label} />
      ))}
    </div>
  )
}
