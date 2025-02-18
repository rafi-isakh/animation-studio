import { Pin } from "@/components/UI/Pin"
// import { Header } from "../components/header"

// Placeholder data for pins
const pins = [
  { id: 1, imageUrl: "/placeholder.svg?height=400&width=300", title: "Beautiful Landscape", likes: 156, comments: 23 },
  { id: 2, imageUrl: "/placeholder.svg?height=400&width=300", title: "Delicious Food", likes: 89, comments: 12 },
  { id: 3, imageUrl: "/placeholder.svg?height=400&width=300", title: "Cute Animals", likes: 234, comments: 45 },
  { id: 4, imageUrl: "/placeholder.svg?height=400&width=300", title: "Fashion Trends", likes: 78, comments: 8 },
  { id: 5, imageUrl: "/placeholder.svg?height=400&width=300", title: "Travel Destinations", likes: 189, comments: 34 },
  { id: 6, imageUrl: "/placeholder.svg?height=400&width=300", title: "DIY Projects", likes: 67, comments: 15 },
  { id: 7, imageUrl: "/placeholder.svg?height=400&width=300", title: "Technology Gadgets", likes: 112, comments: 19 },
  { id: 8, imageUrl: "/placeholder.svg?height=400&width=300", title: "Fitness Tips", likes: 95, comments: 27 },
  // Add more pins as needed
]

export default function Home() {
  return (
    <div className="relative min-h-screen w-full md:max-w-screen-xl mx-auto">
      {/* <Header /> */}
      <main className="container p-4 mx-auto">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {pins.map((pin) => (
            <Pin key={pin.id} post={pin} />
          ))}
        </div>
      </main>
    </div>
  )
}

