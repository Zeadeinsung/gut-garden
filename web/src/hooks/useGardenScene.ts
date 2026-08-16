import { useCallback } from 'react'
import { useGardenStore } from '@/stores/gardenStore'
import type { GardenState } from '@/types/garden'

const STATE_DECAY: Record<string, { timeout: number; next: GardenState }> = {
  high_sugar: { timeout: 60000, next: 'recovering' },
  dry: { timeout: 30000, next: 'recovering' },
  recovering: { timeout: 45000, next: 'healthy' },
}

export function useGardenScene() {
  const currentState = useGardenStore((s) => s.currentState)
  const moistureLevel = useGardenStore((s) => s.moistureLevel)
  const setState = useGardenStore((s) => s.setState)

  const applyFeed = useCallback((effect: 'healthy' | 'high_sugar') => {
    const store = useGardenStore.getState()

    if (effect === 'high_sugar') {
      store.setState('high_sugar')
      return
    }

    // Healthy food: increase moisture, possibly recover
    const newMoisture = Math.min(100, store.moistureLevel + 10)
    const newXp = store.gardenXp + 5
    const newInteractions = store.interactionCount + 1

    useGardenStore.setState({
      moistureLevel: newMoisture,
      gardenXp: newXp,
      interactionCount: newInteractions,
    })

    if (store.currentState !== 'healthy' && newMoisture >= 60) {
      store.setState('recovering')
    }
  }, [])

  const layerSrc = (layer: 'sky' | 'mid' | 'front') => {
    const suffix =
      currentState === 'high_sugar' ? '_high_sugar'
      : currentState === 'dry' ? '_dry'
      : ''
    return `/assets/scenes/scene_garden_${layer}${suffix}.png`
  }

  const skySrc = layerSrc('sky')
  const midSrc = layerSrc('mid')
  const frontSrc = layerSrc('front')

  return { currentState, moistureLevel, skySrc, midSrc, frontSrc, applyFeed }
}
