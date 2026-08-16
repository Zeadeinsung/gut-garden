import { useCallback } from 'react'
import { useGardenStore } from '@/stores/gardenStore'
import { toast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import { applyGardenState, isRegistered, getActiveChildId, type GardenApi } from '@/hooks/useApiSync'

const FOOD_EFFECTS: Record<string, 'healthy' | 'high_sugar'> = {
  broccoli: 'healthy',
  carrot: 'healthy',
  yogurt: 'healthy',
  apple: 'healthy',
  corn: 'healthy',
  candy: 'high_sugar',
  cake: 'high_sugar',
}

const FOOD_LABELS: Record<string, string> = {
  broccoli: '西兰花',
  carrot: '胡萝卜',
  yogurt: '酸奶',
  apple: '苹果',
  corn: '玉米',
  candy: '糖果',
  cake: '蛋糕',
}

export function useFeedLogic() {
  const handleDrop = useCallback((foodId: string) => {
    const effect = FOOD_EFFECTS[foodId]
    if (!effect) return

    const store = useGardenStore.getState()
    const foodLabel = FOOD_LABELS[foodId] || foodId

    if (isRegistered()) {
      const childId = getActiveChildId()
      if (childId) {
        api
          .post<GardenApi & { xp_gained: number }>('/garden/log-action', { child_id: childId, action_type: 'feed', action_detail: { food_type: foodId } })
          .then((data) => {
            applyGardenState(data)
            if (effect === 'high_sugar') toast(`吃了${foodLabel}...花园有点不舒服了`, 'error')
            else toast(`${foodLabel}让花园更健康了！+${data.xp_gained}XP`, 'success')
          })
          .catch(() => {})
      }
      return
    }

    if (effect === 'high_sugar') {
      store.setState('high_sugar')
      toast(`吃了${foodLabel}...花园有点不舒服了`, 'error')
      return
    }

    const newMoisture = Math.min(100, store.moistureLevel + 10)
    const newXp = store.gardenXp + 5
    const newInteractions = store.interactionCount + 1

    useGardenStore.setState({
      moistureLevel: newMoisture,
      gardenXp: newXp,
      interactionCount: newInteractions,
    })

    if (store.currentState !== 'healthy') {
      if (newMoisture >= 60) {
        store.setState('recovering')
        toast('正在恢复中...继续喂健康食物吧！', 'info')
      }
    } else {
      toast(`${foodLabel}让花园更健康了！+5XP`, 'success')
    }
  }, [])

  return { handleDrop, FOOD_EFFECTS }
}
