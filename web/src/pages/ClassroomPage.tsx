import { useState } from 'react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'

interface Module {
  code: string
  title: string
  icon: string
  description: string
  cardCount: number
  quizCount: number
  unlocked: boolean
}

const MODULES: Module[] = [
  {
    code: 'digestion',
    title: '食物旅行记',
    icon: '🚀',
    description: '食物从嘴巴到马桶的完整旅程',
    cardCount: 5,
    quizCount: 3,
    unlocked: true,
  },
  {
    code: 'microbiome',
    title: '肠道小精灵',
    icon: '🦠',
    description: '认识住在你肠道里的好细菌',
    cardCount: 4,
    quizCount: 2,
    unlocked: true,
  },
  {
    code: 'fiber',
    title: '纤维的力量',
    icon: '🥦',
    description: '为什么蔬菜水果能让肠道开心',
    cardCount: 4,
    quizCount: 2,
    unlocked: false,
  },
  {
    code: 'hydration',
    title: '水的魔法',
    icon: '💧',
    description: '水在身体里的奇妙作用',
    cardCount: 3,
    quizCount: 2,
    unlocked: false,
  },
  {
    code: 'poop',
    title: '便便侦探',
    icon: '🔍',
    description: '从便便看出身体健康状况',
    cardCount: 5,
    quizCount: 3,
    unlocked: false,
  },
  {
    code: 'immunity',
    title: '免疫力基地',
    icon: '🛡️',
    description: '肠道是身体最大的免疫器官',
    cardCount: 4,
    quizCount: 2,
    unlocked: false,
  },
]

export default function ClassroomPage() {
  const [flipped, setFlipped] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full pb-20 px-4 overflow-auto">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-garden-forest">肠道小课堂</h1>
        <p className="text-sm text-gray-400 mt-1">探索奇妙的肠道世界</p>
      </div>

      {/* Modules */}
      <div className="max-w-sm mx-auto w-full flex flex-col gap-4">
        {MODULES.map((m) => (
          <div
            key={m.code}
            className={`rounded-2xl p-5 transition-all ${
              m.unlocked
                ? 'bg-white/70 shadow-sm hover:shadow-md'
                : 'bg-gray-100/50 opacity-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{m.icon}</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-700">{m.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400">{m.cardCount}张知识卡</span>
                  <span className="text-xs text-gray-400">{m.quizCount}个测验</span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={m.unlocked ? 30 : 0} max={100} color="bg-garden-sky" />
                </div>
              </div>
            </div>
            {m.unlocked && (
              <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => setFlipped(m.code)}>
                开始学习
              </Button>
            )}
            {!m.unlocked && (
              <Button variant="ghost" size="sm" className="w-full mt-3" disabled>
                🔒 尚未解锁
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Quick fact card preview (flipped) */}
      {flipped && (
        <div className="max-w-sm mx-auto w-full mt-4 bg-garden-cream rounded-2xl p-6 border border-garden-sky/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-garden-forest">知识卡片</span>
            <button className="text-gray-400 hover:text-gray-600" onClick={() => setFlipped(null)}>✕</button>
          </div>
          <div className="text-center">
            <span className="text-5xl mb-3 block">
              {MODULES.find((m) => m.code === flipped)?.icon}
            </span>
            <p className="text-gray-500 text-sm">
              这部分需要对应的教学素材，将由美工团队制作后接入。
            </p>
            <p className="text-gray-400 text-xs mt-2">
              共需要123个素材，知识卡片是其中的一部分。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
