import Image from "next/image"

interface BookCardProps {
  title: string
  author: string
  color: string
  imageUrl: string
}

export function BookCard({ title, author, color, imageUrl }: BookCardProps) {
  return (
    <div className={`${color} p-4 rounded-xl shadow-md transform transition-transform hover:scale-105`}>
      <div className="bg-transparent rounded-lg shadow-none p-2">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          width={150}
          height={220}
          className="w-full h-auto object-cover rounded"
        />
      </div>
      <div className="mt-2 text-xs">
        <p className="font-bold text-gray-700">{title}</p>
        <p className="text-gray-500">{author}</p>
      </div>
    </div>
  )
}

export default BookCard;
