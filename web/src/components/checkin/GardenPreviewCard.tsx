interface Props {
  level: number
}

export default function GardenPreviewCard({ level }: Props) {
  return (
    <div className="ggc-card bg-[rgba(255,250,235,0.9)] backdrop-blur-md flex flex-col items-center justify-center h-full p-2 relative overflow-hidden">
      <h3 className="text-[14px] font-bold text-gray-500 mb-0.5">花园预览</h3>
      <img
        src="/assets/ui/ui_kingkong_garden.webp"
        alt="花园预览"
        className="w-[82%] object-contain drop-shadow-md"
        draggable={false}
      />
      <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-white bg-[#4CAF50]/90 rounded-full px-1.5 py-0.5 shadow-sm">
        Lv.{level}
      </span>
    </div>
  )
}
