import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import GardenStage from '@/components/garden/GardenStage'
import FoodToolbar from '@/components/garden/FoodToolbar'
import { DropZone } from '@/components/garden/DropZone'
import { Character } from '@/components/garden/Character'
import { useFeedLogic } from '@/hooks/useFeedLogic'

export default function GardenPage() {
  const { handleDrop } = useFeedLogic()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && over.id === 'garden-drop-zone') {
      handleDrop(String(active.id))
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="relative w-full h-full overflow-hidden">
        <GardenStage />
        <DropZone />
        <Character />
      </div>
      <FoodToolbar />
    </DndContext>
  )
}
