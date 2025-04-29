"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Clock,
  Cloud,
  Globe,
  Heart,
  ImageIcon,
  Mail,
  MessageCircle,
  Music,
  Phone,
  Play,
  Timer,
  Zap,
} from "lucide-react"
import AppIcon from "./AppIcon"
import { cn } from "@/lib/utils"

export default function AppleWatchUI() {
  const [time, setTime] = useState(new Date())
  const [date, setDate] = useState("")
  const [isScrolling, setIsScrolling] = useState(false)
  const [startY, setStartY] = useState(0)
  const [startX, setStartX] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [scrollX, setScrollX] = useState(0)
  const [activeIcon, setActiveIcon] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const watchRef = useRef<HTMLDivElement>(null)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    setDate(time.getDate().toString())

    return () => {
      clearInterval(timer)
    }
  }, [time])

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsScrolling(true)
    setStartY(e.touches[0].clientY)
    setStartX(e.touches[0].clientX)
  }

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartY(e.clientY)
    setStartX(e.clientX)
  }

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isScrolling) return

    const currentY = e.touches[0].clientY
    const currentX = e.touches[0].clientX
    const diffY = currentY - startY
    const diffX = currentX - startX

    // Determine if scrolling is more horizontal or vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal scrolling
      setScrollX((prev) => prev + diffX * 0.1)
      setStartX(currentX)
    } else {
      // Vertical scrolling
      setScrollY((prev) => prev + diffY * 0.1)
      setStartY(currentY)
    }
  }

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const currentY = e.clientY
    const currentX = e.clientX
    const diffY = currentY - startY
    const diffX = currentX - startX

    // Determine if scrolling is more horizontal or vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal scrolling
      setScrollX((prev) => prev + diffX * 0.1)
      setStartX(currentX)
    } else {
      // Vertical scrolling
      setScrollY((prev) => prev + diffY * 0.1)
      setStartY(currentY)
    }
  }

  // Handle touch end
  const handleTouchEnd = () => {
    setIsScrolling(false)
  }

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle icon click/tap
  const handleIconClick = (index: number) => {
    setActiveIcon(index)
    setTimeout(() => {
      setActiveIcon(null)
    }, 500)
  }

  // Calculate rotation based on scroll position
  const getRotation = (baseRotation: number) => {
    return baseRotation + scrollX * 0.5
  }

  // Calculate vertical position adjustment based on scroll
  const getVerticalAdjustment = () => {
    return scrollY * 0.5
  }

  return (
    <div
      ref={watchRef}
      className="relative w-full max-w-[320px] aspect-square rounded-full bg-black border-8 border-gray-800 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 rounded-full flex items-center justify-center">
        {/* Clock in center */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className={cn(
              "w-16 h-16 rounded-full bg-white flex items-center justify-center transition-all duration-300",
              activeIcon === -1 ? "scale-110 shadow-lg" : "",
            )}
            onClick={() => handleIconClick(-1)}
          >
            <Clock className="w-10 h-10 text-black" />
          </div>
        </div>

        {/* Inner circle of apps */}
        <div
          className="w-[65%] h-[65%] absolute transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(${getVerticalAdjustment()}px)`,
          }}
        >
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <div
              key={`inner-${i}`}
              className="absolute w-12 h-12 transition-transform duration-300 ease-out"
              style={{
                transform: `rotate(${getRotation(deg)}deg) translate(90px) rotate(-${getRotation(deg)}deg)`,
              }}
              onClick={() => handleIconClick(i)}
            >
              <AppIcon
                icon={
                  i === 0 ? (
                    <Mail className="w-6 h-6" />
                  ) : i === 1 ? (
                    <Phone className="w-6 h-6 text-green-500" />
                  ) : i === 2 ? (
                    <Music className="w-6 h-6 text-red-500" />
                  ) : i === 3 ? (
                    <MessageCircle className="w-6 h-6 text-green-500" />
                  ) : i === 4 ? (
                    <Play className="w-6 h-6 text-blue-500" />
                  ) : (
                    <Timer className="w-6 h-6 text-orange-500" />
                  )
                }
                color={
                  i === 0
                    ? "bg-blue-500"
                    : i === 1
                      ? "bg-green-500"
                      : i === 2
                        ? "bg-red-500"
                        : i === 3
                          ? "bg-green-500"
                          : i === 4
                            ? "bg-blue-500"
                            : "bg-orange-500"
                }
                isActive={activeIcon === i}
              />
            </div>
          ))}
        </div>

        {/* Outer circle of apps */}
        <div
          className="w-full h-full absolute transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(${getVerticalAdjustment()}px)`,
          }}
        >
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
            <div
              key={`outer-${i}`}
              className="absolute w-12 h-12 transition-transform duration-300 ease-out"
              style={{
                transform: `rotate(${getRotation(deg)}deg) translate(130px) rotate(-${getRotation(deg)}deg)`,
              }}
              onClick={() => handleIconClick(i + 100)}
            >
              <AppIcon
                icon={
                  i === 0 ? (
                    <Cloud className="w-6 h-6 text-white" />
                  ) : i === 1 ? (
                    <div className="text-xs font-bold">{date}</div>
                  ) : i === 2 ? (
                    <ImageIcon className="w-6 h-6" />
                  ) : i === 3 ? (
                    <Zap className="w-6 h-6 text-yellow-500" />
                  ) : i === 4 ? (
                    <Globe className="w-6 h-6 text-orange-500" />
                  ) : i === 5 ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full border-2 border-red-500"></div>
                    </div>
                  ) : i === 6 ? (
                    <Heart className="w-6 h-6 text-green-500" />
                  ) : i === 7 ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500"></div>
                    </div>
                  ) : i === 8 ? (
                    <MessageCircle className="w-6 h-6 text-white" />
                  ) : i === 9 ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full border-2 border-white"></div>
                    </div>
                  ) : i === 10 ? (
                    <ImageIcon className="w-6 h-6 text-pink-500" />
                  ) : (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    </div>
                  )
                }
                color={
                  i === 0
                    ? "bg-blue-500"
                    : i === 1
                      ? "bg-white"
                      : i === 2
                        ? "bg-gray-700"
                        : i === 3
                          ? "bg-yellow-500"
                          : i === 4
                            ? "bg-orange-500"
                            : i === 5
                              ? "bg-black"
                              : i === 6
                                ? "bg-green-500"
                                : i === 7
                                  ? "bg-black"
                                  : i === 8
                                    ? "bg-green-500"
                                    : i === 9
                                      ? "bg-gray-700"
                                      : i === 10
                                        ? "bg-pink-500"
                                        : "bg-blue-500"
                }
                isActive={activeIcon === i + 100}
              />
            </div>
          ))}
        </div>

        {/* Side dots */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex flex-col gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
        </div>
      </div>
    </div>
  )
}
