export default function CheckinPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-garden-brown)' }}>每日打卡</h1>
      <div className="grid grid-cols-3 gap-4">
        {['探索花园', '吃好', '睡好'].map((task) => (
          <div key={task} className="bg-white/60 backdrop-blur rounded-xl p-6 text-center">
            <div className="text-lg font-bold mb-2">{task}</div>
            <div className="text-sm text-gray-400">待完成</div>
            <button className="mt-4 px-6 py-2 bg-green-200 rounded-lg text-sm">确认完成</button>
          </div>
        ))}
      </div>
    </div>
  )
}
