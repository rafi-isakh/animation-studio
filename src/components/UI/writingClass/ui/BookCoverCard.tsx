import Image from "next/image"
import { Language } from "@/components/Types"
interface BookCoverCardProps {
  title: string
  description: string
  coverImage: string
  language: Language
  id?: number
}

export function BookCoverCard({ title, description, coverImage, language, id }: BookCoverCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl shadow-lg group h-64">
      <Image
        src={coverImage || "/placeholder.svg"}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex flex-col justify-end p-6 text-white">
        <h3 className="text-xl font-bold mb-1">
          {language === "en" ? <>Chapter {id} </> : <></>} <br/>
          {title}
        </h3>
        <p className="text-sm text-gray-200">{description}</p>
      </div>
    </div>
  )
}
