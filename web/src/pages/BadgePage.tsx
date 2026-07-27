export default function BadgePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-garden-brown)' }}>成长徽章</h1>
      <div className="bg-white/60 backdrop-blur rounded-xl p-6 mb-4">
        <div className="text-sm text-gray-500 mb-2">花园等级 Lv.1</div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-300 rounded-full" style={{ width: '30%' }} />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white/40 rounded-xl aspect-square flex items-center justify-center text-3xl text-gray-300">
            🔒
          </div>
        ))}
      </div>
    </div>
  )
}
