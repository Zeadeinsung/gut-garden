import { useDemoStore } from '@/stores/demoStore'

export default function DemoCodeLog() {
  const codes = useDemoStore((s) => s.codes)
  const removeCode = useDemoStore((s) => s.removeCode)
  const clearCodes = useDemoStore((s) => s.clearCodes)

  if (!codes.length) return null

  return (
    <div className="fixed bottom-3 right-3 z-[100] max-w-[300px] text-[11px] font-mono bg-[#10151b]/85 text-lime-300 rounded-xl px-3 py-2 shadow-2xl border border-lime-400/20 backdrop-blur select-none">
      <div className="flex items-center justify-between gap-3 text-[10px] text-lime-200/60 font-sans mb-0.5">
        <span>演示验证码（模拟短信）</span>
        <button className="hover:text-white transition-colors" onClick={clearCodes} title="全部清空">✕</button>
      </div>
      {codes.map((c) => (
        <div key={c.at} className="flex items-center gap-2 py-0.5">
          <span className="text-lime-100/70 truncate">{c.phone}</span>
          <span className="text-lime-100/30">→</span>
          <span className="font-bold tracking-widest text-lime-300">{c.code}</span>
          <button className="ml-auto text-lime-200/40 hover:text-lime-200/80" onClick={() => removeCode(c.at)}>×</button>
        </div>
      ))}
    </div>
  )
}
