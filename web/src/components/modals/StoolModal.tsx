import { useState, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/components/ui/Toast'
import { sfx } from '@/lib/sound'
import { api } from '@/lib/api'
import { isRegistered, getActiveChildId } from '@/hooks/useApiSync'
import { UiIcon } from '@/lib/uiIcons'
import { appVersionLabel } from '@/lib/appInfo'

type Mode = 'icon' | 'photo'
type Phase = 'select' | 'loading' | 'result'

interface BristolType {
  id: number
  label: string
  icon: string
  desc: string
  health: 'good' | 'ok' | 'bad'
}

interface StoolAiResult {
  bristol_type: number
  diagnosis: string
  task_suggestion: string
  child_sentence: string
  suggestion: string
  parent_note: string
  red_flag: boolean
  red_flag_text: string
  ai_source: 'ai' | 'preset'
}

const STOOL_PNG: Record<number, string> = {
  1: '/assets/stools/stool_type1_rabbit.webp',
  2: '/assets/stools/stool_type2_grape.webp',
  3: '/assets/stools/stool_type3_corn.webp',
  4: '/assets/stools/stool_type4_banana.webp',
  5: '/assets/stools/stool_type5_icecream.webp',
  6: '/assets/stools/stool_type6_marshmallow.webp',
  7: '/assets/stools/stool_type7_water.webp',
}

const BRISTOL_TYPES: BristolType[] = [
  { id: 1, label: '坚果便', icon: STOOL_PNG[1], desc: '干硬、分散的颗粒', health: 'bad' },
  { id: 2, label: '香肠便', icon: STOOL_PNG[2], desc: '干硬、表面凹凸', health: 'bad' },
  { id: 3, label: '条状有裂痕', icon: STOOL_PNG[3], desc: '表面有裂痕', health: 'ok' },
  { id: 4, label: '香蕉便', icon: STOOL_PNG[4], desc: '光滑柔软像香蕉', health: 'good' },
  { id: 5, label: '软块便', icon: STOOL_PNG[5], desc: '边缘清晰的软块', health: 'ok' },
  { id: 6, label: '糊状', icon: STOOL_PNG[6], desc: '边缘参差不齐', health: 'bad' },
  { id: 7, label: '水状', icon: STOOL_PNG[7], desc: '完全液体', health: 'bad' },
]

const HEALTH_RESULTS: Record<string, string> = {
  good: '香蕉便！非常健康！继续保持均衡饮食～',
  ok: '基本正常～注意多喝水、多吃蔬菜哦～',
  bad: '便便状态需要关注！建议调整饮食，多吃纤维食物，多喝水。持续异常请就医。',
}

export default function StoolModal() {
  const setStoolModalOpen = useUIStore((s) => s.setStoolModalOpen)
  const mode = useAuthStore((s) => s.mode)
  const [activeMode, setActiveMode] = useState<Mode>('icon')
  const [selected, setSelected] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<Phase>('select')
  const [aiResult, setAiResult] = useState<StoolAiResult | null>(null)

  const handleSelect = useCallback((typeId: number) => {
    sfx.pop()
    setSelected(typeId)
    setAiResult(null)
  }, [])

  const resetToSelect = useCallback(() => {
    setPhase('select')
    setAiResult(null)
  }, [])

  const handleConfirm = () => {
    if (selected === null) return

    if (isRegistered()) {
      const childId = getActiveChildId()
      if (childId) {
        setPhase('loading')
        api
          .post<StoolAiResult>('/stool/select-icon', {
            child_id: childId,
            bristol_type: selected,
            description: description.trim() || undefined,
          })
          .then((data) => {
            sfx.success()
            setAiResult(data)
            setPhase('result')
          })
          .catch(() => {
            setPhase('select')
          })
      }
      return
    }

    const entry = {
      date: new Date().toISOString().slice(0, 10),
      typeId: selected,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    try {
      const saved = localStorage.getItem('gg-stool-logs')
      const logs = saved ? JSON.parse(saved) : []
      localStorage.setItem('gg-stool-logs', JSON.stringify([entry, ...logs]))
    } catch { /* ignore */ }
    const bristol = BRISTOL_TYPES.find((b) => b.id === selected)
    sfx.success()
    toast(`已记录：${bristol?.label}`, 'success')
    setStoolModalOpen(false)
  }

  const selectedBristol = selected !== null ? BRISTOL_TYPES.find((b) => b.id === selected) : null

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-8">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setStoolModalOpen(false)}
      />

      {/* Container */}
      <div className="relative parchment-card w-full max-w-[600px] mx-4 overflow-auto max-h-[90vh]">
        {/* Title */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-garden-forest inline-flex items-center gap-2">
            <UiIcon name="camera" size={18} /> {phase === 'result' ? '今日便便观察 · 记录完成' : '今日便便观察'}
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setStoolModalOpen(false)}
          >
            <UiIcon name="close" size={20} />
          </button>
        </div>

        {/* 非医疗工具标识 */}
        <div className="px-5 pt-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8a8a5c] bg-[#f4f1e2] border border-[#e5dfc2] rounded-full px-2.5 py-1">
            <UiIcon name="shield" size={11} /> 非医疗工具 · 科普参考
          </span>
          <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] text-[#a8a279]">
            分类依据：布里斯托大便分类法（Bristol Stool Scale）
          </span>
        </div>

        {/* ========== SELECT PHASE ========== */}
        {phase === 'select' && (
          <>
            {/* Mode switch */}
            <div className="flex gap-1 bg-garden-cream rounded-xl p-1 m-5 mb-0">
              <button
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
                  activeMode === 'icon'
                    ? 'bg-white text-garden-forest shadow-sm'
                    : 'text-gray-600 hover:text-garden-forest/70'
                }`}
                onClick={() => setActiveMode('icon')}
              >
                <UiIcon name="rabbit" size={16} /> 图标选择
              </button>
              <button
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
                  activeMode === 'photo'
                    ? 'bg-white text-garden-forest shadow-sm'
                    : 'text-gray-600 hover:text-garden-forest/70'
                }`}
                onClick={() => setActiveMode('photo')}
                disabled={mode === 'guest'}
              >
                <UiIcon name="camera" size={16} /> 拍照分析
                {mode === 'guest' && <span className="text-[10px] ml-1">需注册</span>}
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {activeMode === 'icon' ? (
                <>
                  <div className="flex flex-wrap justify-center gap-4 mb-3 mx-auto" style={{ maxWidth: 480 }}>
                    {BRISTOL_TYPES.map((b) => (
                      <button
                        key={b.id}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all w-[108px] ${
                          selected === b.id
                            ? 'border-garden-forest bg-garden-cream shadow-md scale-105'
                            : 'border-transparent bg-gray-50 hover:bg-white hover:border-gray-200'
                        }`}
                        onClick={() => handleSelect(b.id)}
                      >
                        <img src={b.icon} alt={b.label} className="w-[60px] h-[60px] object-contain" />
                        <span className="text-[16px] font-medium text-gray-700 whitespace-nowrap">{b.label}</span>
                        <span className="text-[15px] text-gray-500">Type {b.id}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#a8a279] text-center inline-flex items-center gap-1 justify-center">
                    <UiIcon name="book" size={11} /> 选择最接近的便便类型 · 依据布里斯托大便分类法
                  </p>
                </>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-3">
                  <span className="mb-3 block text-gray-300"><UiIcon name="camera" size={40} strokeWidth={1.4} /></span>
                  <p className="text-sm text-gray-600 mb-1">
                    {mode === 'guest'
                      ? '注册后可上传便便照片进行AI分析'
                      : '拖拽或点击上传 · ≤10MB自动压缩 · HEIC→JPEG'}
                  </p>
                  {mode === 'guest' ? (
                    <p className="text-xs text-garden-coral">请先注册登录后使用拍照分析功能</p>
                  ) : (
                    <button className="mt-2 text-sm text-garden-forest hover:underline">选择文件</button>
                  )}
                </div>
              )}

              {/* Result preview（按选中类型给出健康参考 + 分类依据） */}
              {selectedBristol && (
                <div className="bg-garden-cream rounded-xl p-4 mb-3 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-garden-forest inline-flex items-center gap-1.5">
                      <UiIcon name="chart" size={15} /> {selectedBristol.label}
                    </p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      selectedBristol.health === 'good' ? 'bg-green-100 text-green-700'
                      : selectedBristol.health === 'ok' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-500'
                    }`}>
                      {selectedBristol.health === 'good' ? '健康参考' : selectedBristol.health === 'ok' ? '基本正常' : '需要关注'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{selectedBristol.desc}。{HEALTH_RESULTS[selectedBristol.health]}</p>
                </div>
              )}

              {/* 补充描述（注册用户可让 AI 更懂你） */}
              {isRegistered() && activeMode === 'icon' && selected !== null && (
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">补充描述（可选，AI 会参考）</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="比如：有点干、今天没怎么喝水、肚子有点不舒服…"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-garden-forest transition-colors resize-none"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                  onClick={() => setStoolModalOpen(false)}
                >
                  稍后再说
                </button>
                <button
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    selected !== null
                      ? 'bg-garden-mascot text-white hover:bg-[#7A9538] active:scale-95'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={handleConfirm}
                  disabled={selected === null}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <UiIcon name="checkCircle" size={16} /> {isRegistered() ? '确认记录并生成建议' : '确认记录'}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ========== LOADING PHASE ========== */}
        {phase === 'loading' && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-garden-mascot/30 border-t-garden-mascot rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-garden-forest">便便小医生正在分析…</p>
            <p className="text-xs text-gray-500 mt-1">依据布里斯托大便分类法生成专属建议</p>
          </div>
        )}

        {/* ========== RESULT PHASE ========== */}
        {phase === 'result' && aiResult && (
          <div className="p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-garden-forest inline-flex items-center gap-1.5">
                <UiIcon name="chart" size={15} /> {selectedBristol?.label ?? `Type ${aiResult.bristol_type}`}
              </p>
              {aiResult.red_flag ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold shrink-0">需要关注</span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold shrink-0">健康参考</span>
              )}
            </div>

            <div className="mt-3 bg-garden-cream rounded-xl p-4">
              <p className="text-[10px] text-[#9a9483]">给小宝贝的话</p>
              <p className="text-base font-bold text-garden-forest mt-1 leading-relaxed">{aiResult.child_sentence}</p>
            </div>

            {aiResult.suggestion && (
              <div className="mt-2 bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] text-[#9a9483]">今日小行动</p>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{aiResult.suggestion}</p>
              </div>
            )}

            {aiResult.parent_note && (
              <div className="mt-2 bg-[#f6f3e8] rounded-xl p-4 border border-[#e5dfc2]">
                <p className="text-[10px] text-[#9a9483]">给家长的话</p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{aiResult.parent_note}</p>
              </div>
            )}

            {aiResult.red_flag && aiResult.red_flag_text && (
              <div className="mt-2 bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-xs font-bold text-red-600 inline-flex items-center gap-1.5">
                  <UiIcon name="alert" size={13} /> {aiResult.red_flag_text}
                </p>
              </div>
            )}

            <p className="text-[10px] text-[#b0ab93] mt-2 text-center">
              {aiResult.ai_source === 'ai' ? 'AI 生成建议 · 仅供参考' : '科普参考'} · 依据布里斯托大便分类法
            </p>

            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                onClick={resetToSelect}
              >
                再来一次
              </button>
              <button
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-garden-mascot text-white hover:bg-[#7A9538] active:scale-95 transition-all"
                onClick={() => setStoolModalOpen(false)}
              >
                完成
              </button>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="px-5 pb-4 text-center">
          <p className="text-[11px] text-gray-600 inline-flex items-center gap-1 justify-center">
            <UiIcon name="alert" size={12} /> 非医疗工具 · 不构成医疗建议 · 数据仅存本地 · 持续异常请就医
          </p>
          <p className="text-[10px] text-[#b0ab93] mt-1">{appVersionLabel}</p>
        </div>
      </div>
    </div>
  )
}
