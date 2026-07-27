export default function ReportPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-garden-brown)' }}>成长报告</h1>
      <div className="grid grid-cols-3 gap-4">
        {['打卡天数', '连续天数', '花园等级', '徽章数量', '便便分析', '投喂次数', '问答正确', '水分值', 'Bristol健康', '使用时长', '解锁功能', '探索进度'].map((metric) => (
          <div key={metric} className="bg-white/60 backdrop-blur rounded-xl p-6 text-center">
            <div className="text-sm text-gray-400 mb-2">{metric}</div>
            <div className="text-2xl font-bold text-gray-300">—</div>
          </div>
        ))}
      </div>
    </div>
  )
}
