"use client"
import { useEffect, useState } from "react"
import type React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/shadcnUI/Button"
import { ArrowRight, ArrowLeft } from "lucide-react"

let interval: any

type Card = {
  id: number
  content: React.ReactNode
}

export const CardStack = ({
  items,
  offset,
  scaleFactor,
  autoRotate = true,
}: {
  items: Card[]
  offset?: number
  scaleFactor?: number
  autoRotate?: boolean
}) => {
  const CARD_OFFSET = offset || 10
  const SCALE_FACTOR = scaleFactor || 0.06
  const [cards, setCards] = useState<Card[]>(items)

  useEffect(() => {
    if (autoRotate) {
      startFlipping()
    }
    return () => clearInterval(interval)
  }, [autoRotate])

  const startFlipping = () => {
    interval = setInterval(() => {
      moveForward()
    }, 10000)
  }

  const moveForward = () => {
    setCards((prevCards: Card[]) => {
      const newArray = [...prevCards]
      newArray.unshift(newArray.pop()!)
      return newArray
    })
  }

  const moveBackward = () => {
    setCards((prevCards: Card[]) => {
      const newArray = [...prevCards]
      newArray.push(newArray.shift()!)
      return newArray
    })
  }

  const handleCardClick = (cardId: number) => {
    if (autoRotate) {
      clearInterval(interval)
      setTimeout(startFlipping, 5000)
    }
    
    setCards((prevCards: Card[]) => {
      const cardIndex = prevCards.findIndex(card => card.id === cardId)
      if (cardIndex === 0) return prevCards
      
      const newArray = [...prevCards]
      const [clickedCard] = newArray.splice(cardIndex, 1)
      return [clickedCard, ...newArray]
    })
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[250px] w-[200px] md:h-[300px] md:w-[400px]">
        {cards.map((card, index) => {
          return (
            <motion.div
              key={card.id}
              className="absolute bg-transparent h-full w-full rounded-3xl border-none flex flex-col justify-between overflow-hidden"
              //  shadow-black/[0.1] dark:shadow-white/[0.05] 
              style={{
                transformOrigin: "top center",
                cursor: "pointer"
              }}
              animate={{
                top: index * -CARD_OFFSET,
                scale: 1 - index * SCALE_FACTOR,
                zIndex: cards.length - index,
              }}
              onClick={() => handleCardClick(card.id)}
            >
              {card.content}
            </motion.div>
          )
        })}
      </div>
      {/* <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={moveBackward}
          className="z-50 px-4 py-2 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors"
        >
           <ArrowLeft className='w-4 h-4' />
        </Button>
        <Button
          variant="outline"
          onClick={moveForward}
          className="z-50 px-4 py-2 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors"
        >
          <ArrowRight className='w-4 h-4' />
        </Button>
      </div> */}
    </div>
  )
}

