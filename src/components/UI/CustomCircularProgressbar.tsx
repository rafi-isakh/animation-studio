"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  progress: number // 0 to 100
  size?: number
  strokeWidth?: number
  backgroundColor?: string
  progressColor?: string
  innerSize?: number
  children?: React.ReactNode
  className?: string
}

export const CustomCircularProgressbar = ({
  progress,
  size = 80,
  strokeWidth = 8,
  backgroundColor = "#000000",
  progressColor = "#4287f5",
  innerSize,
  children,
  className,
}: CircularProgressProps) => {
  // Calculate the radius and center point
  const outerRadius = size / 2
  const innerRadius = outerRadius - strokeWidth
  const circumference = innerRadius * 2 * Math.PI
  const center = size / 2

  // Calculate the inner content size (default to the inner circle size if not specified)
  const contentSize = innerSize || innerRadius * 2

  // Calculate the stroke dash offset based on progress
  const progressOffset = circumference - (progress / 100) * circumference

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* SVG for the progress arc and background circle */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute">
        {/* Background circle */}
        <circle cx={center} cy={center} r={innerRadius} fill={backgroundColor} />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>

      {/* Content in the center with controlled size */}
      <div
        className="relative z-10 flex items-center justify-center"
        style={{
          width: contentSize,
          height: contentSize,
        }}
      >
        {children}
      </div>
    </div>
  )
}

