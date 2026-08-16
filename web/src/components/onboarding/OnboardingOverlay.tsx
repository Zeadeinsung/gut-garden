import { useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { UiIcon } from '@/lib/uiIcons'

interface Step {
  title: string
  icon: string
  description: string
  highlight: string
}

const STEPS: Step[] = [
  {
    title: '认识你的花园',
    icon: 'sprout',
    description: '这是你的肠道花园，每天来看看它吧！花园的状态会随着你的生活习惯变化哦～',
    highlight: '左侧花园状态看板 + 菌小园角色',
  },
  {
    title: '逛逛知识花园',
    icon: 'book',
    description: '这里有5个知识模块等你探索，每完成一个都能收集星星，解锁超酷的宝箱奖励！',
    highlight: '知识课堂入口（首页底部）',
  },
  {
    title: '记录便便观察',
    icon: 'camera',
    description: '每天观察便便，它告诉你花园的健康秘密！点击底部大按钮就可以记录～',
    highlight: '底部Dock中间的按钮',
  },
  {
    title: '收集成长徽章',
    icon: 'trophy',
    description: '坚持打卡就能解锁超酷徽章，花园也会升级哦！看看你能收集多少枚吧！',
    highlight: '成长徽章入口（首页底部）',
  },
]

export default function OnboardingOverlay() {
  const setOnboardingComplete = useUIStore((s) => s.setOnboardingComplete)
  const [step, setStep] = useState(0)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  const handleNext = () => {
    if (isLast) {
      setOnboardingComplete(true)
    } else {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirst) setStep(step - 1)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75">
      {/* Simulated spotlight effect */}
      <div className="absolute inset-0" />

      {/* Step card */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[600px] mx-4 p-8 text-center">
        {/* Step icon */}
        <span className="mb-4 block text-garden-forest"><UiIcon name={current.icon} size={56} /></span>

        {/* Step indicator */}
        <p className="text-xs text-gray-400 mb-2">
          Step {step + 1}/{STEPS.length}
        </p>

        {/* Title */}
        <h2 className="text-xl font-bold text-garden-forest mb-3">{current.title}</h2>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-4 leading-relaxed">
          {current.description}
        </p>

        {/* Highlight box */}
        <div className="bg-garden-cream rounded-xl px-4 py-2 inline-block mb-6">
          <span className="text-xs text-garden-forest inline-flex items-center gap-1">
            <UiIcon name="lightbulb" size={13} /> 高亮区域：{current.highlight}
          </span>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-garden-mascot w-6' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            className={`text-sm font-medium transition-colors ${
              isFirst
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-400 hover:text-garden-forest'
            }`}
            onClick={handlePrev}
            disabled={isFirst}
          >
            <UiIcon name="chevronLeft" size={16} /> 上一页
          </button>

          <button
            className="text-sm text-gray-400 hover:text-garden-forest transition-colors"
            onClick={() => setOnboardingComplete(true)}
          >
            跳过
          </button>

          <button
            className="px-6 py-2.5 bg-garden-mascot text-white text-sm font-bold rounded-xl hover:bg-[#7A9538] transition-colors active:scale-95"
            onClick={handleNext}
          >
            {isLast ? <span className="inline-flex items-center gap-1.5">开始探索！<UiIcon name="party" size={16} /></span> : '下一步'}
          </button>
        </div>
      </div>
    </div>
  )
}
