const FOODS = [
  { name: 'cake',    label: '蛋糕',     category: 'sugar' },
  { name: 'cookie',  label: '饼干',     category: 'dry' },
  { name: 'vegetable', label: '蔬菜',   category: 'fiber' },
  { name: 'fruit',   label: '水果',     category: 'fiber' },
  { name: 'water_drop', label: '水滴',  category: 'water' },
]

export default function FoodToolbar() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 bg-white/50 backdrop-blur rounded-2xl px-4 py-2">
      {FOODS.map((f) => (
        <button
          key={f.name}
          className="w-14 h-14 rounded-xl bg-white/80 shadow flex items-center justify-center hover:scale-110 transition-transform"
          draggable
          onDragStart={(e) => e.dataTransfer.setData('food', f.name)}
        >
          <img src={`/assets/food/food_${f.name}.png`} alt={f.label} className="w-10 h-10" />
        </button>
      ))}
    </div>
  )
}
