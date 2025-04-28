"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { CircleFlag } from 'react-circle-flags'
import Image from "next/image"
import AppIcon from "./AppIcon"

// Icon data structure
interface IconData {
  id: number
  x: number
  y: number
  icon: JSX.Element
  color: string
  ring: number // 0 = center, 1 = first ring, 2 = second ring
}


// Honeycomb layout positions
const getHoneycombPositions = () => {
  // Center position
  const center = { x: 0, y: 0, ring: 0 }

  // First ring - 6 positions
  const ring1Radius = 100
  const ring1Positions = Array.from({ length: 6 }).map((_, i) => {
    const angle = (Math.PI / 3) * i
    return {
      x: center.x + Math.sin(angle) * ring1Radius,
      y: center.y - Math.cos(angle) * ring1Radius,
      ring: 1,
    }
  })

  // Second ring - 12 positions
  const ring2Radius = 200
  const ring2Positions = Array.from({ length: 12 }).map((_, i) => {
    const angle = (Math.PI / 6) * i
    return {
      x: center.x + Math.sin(angle) * ring2Radius,
      y: center.y - Math.cos(angle) * ring2Radius,
      ring: 2,
    }
  })

  // Return all positions
  return [center, ...ring1Positions, ...ring2Positions]
}

export default function SpatialUI() {
  const [viewportX, setViewportX] = useState(0)
  const [viewportY, setViewportY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [activeIcon, setActiveIcon] = useState<number | null>(null)
  const [icons, setIcons] = useState<IconData[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize icons with honeycomb positions
  useEffect(() => {
    const iconElements = [
      // Center icon (Clock)
      { icon: <Image src='/toonyz_logo_pink.svg' width="35" height="35" alt="Toonyz Logo" />, color: "bg-white", ring: 0 },

      // First ring
      { icon: <CircleFlag countryCode="es" height="35" />, color: "bg-blue-500", ring: 1 },
      { icon: <CircleFlag countryCode="us" height="35" />, color: "bg-green-500", ring: 1 },
      { icon: <CircleFlag countryCode="jp" height="35" />, color: "bg-red-500", ring: 1 },
      { icon: <CircleFlag countryCode="fr" height="35" />, color: "bg-green-500", ring: 1 },
      { icon: <CircleFlag countryCode="de" height="35" />, color: "bg-orange-500", ring: 1 },
      { icon: <CircleFlag countryCode="gb" height="35" />, color: "bg-orange-500", ring: 1 },

      // Second ring
      { icon: <CircleFlag countryCode="au" height="35" />, color: "bg-blue-500", ring: 2 },
      { icon: <CircleFlag countryCode="uk" height="35" />, color: "bg-white", ring: 2 },
      { icon: <CircleFlag countryCode="ca" height="35" />, color: "bg-gray-700", ring: 2 },
      { icon: <CircleFlag countryCode="nz" height="35" />, color: "bg-lime-500", ring: 2 },
      { icon: <CircleFlag countryCode="mx" height="35" />, color: "bg-yellow-500", ring: 2 },
      { icon: <CircleFlag countryCode="it" height="35" />, color: "bg-green-500", ring: 2 },
      { icon: <CircleFlag countryCode="eg" height="35" />, color: "bg-blue-500", ring: 2 },
      { icon: <CircleFlag countryCode="ua" height="35" />, color: "bg-gray-500", ring: 2 },
      { icon: <CircleFlag countryCode="id" height="35" />, color: "bg-pink-500", ring: 2 },
      { icon: <CircleFlag countryCode="ph" height="35" />, color: "bg-cyan-500", ring: 2 },
      { icon: <CircleFlag countryCode="nz" height="35" />, color: "bg-amber-500", ring: 2 },
      { icon: <CircleFlag countryCode="ru" height="35" />, color: "bg-purple-500", ring: 2 },
    ]

    const positions = getHoneycombPositions()

    // Create icons with honeycomb positions
    const newIcons = iconElements.map((item, index) => {
      // Start all icons in the center
      return {
        id: index,
        x: 0,
        y: 0,
        icon: item.icon,
        color: item.color,
        ring: item.ring,
      }
    })

    setIcons(newIcons)

    // After a short delay, spread the icons to honeycomb positions
    setTimeout(() => {
      setIcons((prevIcons) =>
        prevIcons.map((icon, index) => {
          if (index < positions.length) {
            return {
              ...icon,
              x: positions[index].x,
              y: positions[index].y,
              ring: positions[index].ring,
            }
          }
          return icon
        }),
      )
    }, 500)
  }, [])

  // Handle touch/mouse start
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    setStartX(clientX)
    setStartY(clientY)
  }

  // Handle touch/mouse move
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return

    const deltaX = clientX - startX
    const deltaY = clientY - startY

    setViewportX((prev) => prev + deltaX)
    setViewportY((prev) => prev + deltaY)

    setStartX(clientX)
    setStartY(clientY)
  }

  // Handle touch/mouse end
  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
  }

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY)
  }

  // Handle icon click
  const handleIconClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation() // Prevent triggering drag
    setActiveIcon(id)
    setTimeout(() => {
      setActiveIcon(null)
    }, 500)
  }

  // Calculate distance from viewport center
  const getDistanceFromCenter = (x: number, y: number) => {
    if (!containerRef.current) return 1000 // Default large distance if container not available

    // Get the container dimensions
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight

    // Calculate the center of the viewport
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2

    // Calculate the position of the icon in the viewport
    const iconViewportX = x + viewportX + centerX
    const iconViewportY = y + viewportY + centerY

    // Calculate distance from center of viewport
    const distanceX = iconViewportX - centerX
    const distanceY = iconViewportY - centerY

    return Math.sqrt(distanceX * distanceX + distanceY * distanceY)
  }

  // Calculate size factor based on distance from center
  const getSizeFactor = (distance: number) => {
    // Max distance for scaling effect (in pixels)
    const maxDistance = 150

    // More dramatic scaling - from 0.3 to 2.0
    if (distance < 50) {
      // Close to center - large size (up to 2x)
      return 2.0 - (distance / 50) * 0.5
    } else if (distance < maxDistance) {
      // Medium distance - medium size (1.5x to 0.8x)
      return 1.5 - ((distance - 50) / (maxDistance - 50)) * 0.7
    } else {
      // Far from center - small size (0.8x to 0.3x)
      return Math.max(0.3, 0.8 - ((distance - maxDistance) / 200) * 0.5)
    }
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative w-full h-[500px] bg-white overflow-hidden rounded-xl border-none cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Center marker (for reference) */}
        <div className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full border-2 border-red-500 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10" />

        <div
          className="absolute"
          style={{
            transform: `translate(${viewportX}px, ${viewportY}px)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
            left: "50%",
            top: "50%",
          }}
        >
          {/* Icons */}
          {icons.map((icon) => {
            // Calculate distance from center of viewport
            const distance = getDistanceFromCenter(icon.x, icon.y)

            // Calculate size factor based on distance
            const sizeFactor = getSizeFactor(distance)

            // Determine if icon should show details based on proximity to center
            const showDetails = distance < 150

            return (
              <div
                key={icon.id}
                className="absolute transition-all duration-200 ease-out"
                style={{
                  transform: `translate(${icon.x}px, ${icon.y}px)`,
                  left: "0",
                  top: "0",
                }}
                onClick={(e) => handleIconClick(e, icon.id)}
              >
                <AppIcon
                  icon={icon.icon}
                  color={icon.color}
                  isActive={activeIcon === icon.id}
                  sizeFactor={sizeFactor}
                  baseSize={icon.ring === 0 ? 60 : 40}
                  showIcon={showDetails}
                />
              </div>
            )
          })}
        </div>

        {/* <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm opacity-70 pointer-events-none">
         
        </div> */}
      </div>
    </div>
  )
}
