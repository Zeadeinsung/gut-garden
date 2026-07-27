import GardenStage from '../components/garden/GardenStage'
import FoodToolbar from '../components/garden/FoodToolbar'

export default function GardenPage() {
  return (
    <div className="relative w-full h-full">
      <GardenStage />
      <FoodToolbar />
    </div>
  )
}
