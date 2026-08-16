import { useState, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import { isRegistered, getActiveChildId } from '@/hooks/useApiSync'
import { UiIcon } from '@/lib/uiIcons'

type Mode = 'icon' | 'photo'

interface BristolType {
  id: number
  label: string
  icon: string
  desc: string
  health: 'good' | 'ok' | 'bad'
}

const STOOL_PNG: Record<number, string> = {
  1: '/assets/stools/stool_type1_rabbit.png',
  2: '/assets/stools/stool_type2_grape.png',
  3: '/assets/stools/stool_type3_corn.png',
  4: '/assets/stools/stool_type4_banana.png',
  5: '/assets/stools/stool_type5_icecream.png',
  6: '/assets/stools/stool_type6_marshmallow.png',
  7: '/assets/stools/stool_type7_water.png',
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
  const [result, setResult] = useState<string | null>(null)

  const handleSelect = useCallback((typeId: number) => {
    setSelected(typeId)
    const bristol = BRISTOL_TYPES.find((b) => b.id === typeId)
    if (bristol) {
      setResult(HEALTH_RESULTS[bristol.health] || '')
    }
  }, [])

  const handleConfirm = () => {
    if (selected === null) return

    if (isRegistered()) {
      const childId = getActiveChildId()
      if (childId) {
        api
          .post<{ bristol_type: number; diagnosis: string }>('/stool/select-icon', { child_id: childId, bristol_type: selected })
          .then((data) => {
            const bristol = BRISTOL_TYPES.find((b) => b.id === data.bristol_type)
            toast(`已记录：${bristol?.label} · ${data.diagnosis ?? ''}`, 'success')
            setStoolModalOpen(false)
          })
          .catch(() => {})
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
    toast(`已记录：${bristol?.label}`, 'success')
    setStoolModalOpen(false)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-8">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setStoolModalOpen(false)}
      />

      {/* Container */}
      <div className="relative bg-white/95 backdrop-blur rounded-2xl shadow-xl w-full max-w-[600px] mx-4 overflow-auto max-h-[90vh]">
        {/* Title */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-garden-forest inline-flex items-center gap-2"><UiIcon name="camera" size={18} /> 今日便便观察</h2>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setStoolModalOpen(false)}
          >
            <UiIcon name="close" size={20} />
          </button>
        </div>

        {/* Mode switch */}
        <div className="flex gap-1 bg-garden-cream rounded-xl p-1 m-5 mb-0">
          <button
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
              activeMode === 'icon'
                ? 'bg-white text-garden-forest shadow-sm'
                : 'text-gray-400 hover:text-garden-forest/70'
            }`}
            onClick={() => setActiveMode('icon')}
          >
            <UiIcon name="rabbit" size={16} /> 图标选择
          </button>
          <button
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
              activeMode === 'photo'
                ? 'bg-white text-garden-forest shadow-sm'
                : 'text-gray-400 hover:text-garden-forest/70'
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
            <div className="flex flex-wrap justify-center gap-3 mb-4 mx-auto" style={{ maxWidth: 348 }}>
              {BRISTOL_TYPES.map((b) => (
                <button
                  key={b.id}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all w-[72px] ${
                    selected === b.id
                      ? 'border-garden-forest bg-garden-cream shadow-md scale-105'
                      : 'border-transparent bg-gray-50 hover:bg-white hover:border-gray-200'
                  }`}
                  onClick={() => handleSelect(b.id)}
                >
                  <img src={b.icon} alt={b.label} className="w-10 h-10 object-contain" />
                  <span className="text-[11px] font-medium text-gray-600">{b.label}</span>
                  <span className="text-[10px] text-gray-400">Type {b.id}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-4">
              <span className="mb-3 block text-gray-300"><UiIcon name="camera" size={40} strokeWidth={1.4} /></span>
              <p className="text-sm text-gray-400 mb-1">
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

          {/* --- or --- divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">或</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Photo upload row (always shown) */}
          <div className={`border-2 border-dashed rounded-xl p-4 text-center mb-4 transition-colors ${
            mode === 'guest'
              ? 'border-gray-200 bg-gray-50/50 opacity-60'
              : 'border-gray-200 hover:border-garden-sky/50 cursor-pointer'
          }`}>
            <span className="mb-1 block text-gray-300"><UiIcon name="camera" size={28} strokeWidth={1.4} /></span>
            <p className="text-xs text-gray-400">
              {mode === 'guest'
                ? '上传便便照片（需注册）'
                : '上传便便照片 · ≤10MB自动压缩 · HEIC→JPEG'}
            </p>
          </div>

          {/* Result preview */}
          {result && (
            <div className="bg-garden-cream rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-garden-forest"><UiIcon name="chart" size={18} /></span>
                <p className="text-sm text-garden-forest font-medium">{result}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
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
              <span className="inline-flex items-center gap-1.5"><UiIcon name="checkCircle" size={16} /> 确认记录</span>
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="px-5 pb-4 text-center">
          <p className="text-[10px] text-gray-300 inline-flex items-center gap-1 justify-center">
            <UiIcon name="alert" size={12} /> 数据仅存本地 · 不构成医疗建议 · 出现持续症状请就医
          </p>
        </div>
      </div>
    </div>
  )
}
