"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  size?: number
  thickness?: number
  showValue?: boolean
  valuePrefix?: string
  valueSuffix?: string
  color?: string
  trackColor?: string
  valueSize?: number
  animate?: boolean
}

export function CircularProgress({
  value,
  size = 100,
  thickness = 8,
  showValue = true,
  valuePrefix = "",
  valueSuffix = "%",
  color = "stroke-primary",
  trackColor = "stroke-muted",
  valueSize = 24,
  animate = true,
  className,
  ...props
}: CircularProgressProps) {
  // Ensure value is between 0 and 100
  const normalizedValue = Math.min(Math.max(value, 0), 100)

  // Calculate SVG parameters
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference
  const center = size / 2

  // Animation ref
  const progressRef = React.useRef<SVGCircleElement>(null)

  React.useEffect(() => {
    if (animate && progressRef.current) {
      progressRef.current.style.transition = "stroke-dashoffset 0.5s ease-in-out"
      progressRef.current.style.strokeDashoffset = `${strokeDashoffset}`
    }
  }, [animate, strokeDashoffset])

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={thickness} className={cn(trackColor)} />

        {/* Progress circle */}
        <circle
          ref={progressRef}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : strokeDashoffset}
          className={cn(color)}
          style={{
            transformOrigin: "center",
            transform: "rotate(-90deg)",
            ...(animate ? {} : { strokeDashoffset }),
          }}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center font-medium" style={{ fontSize: valueSize }}>
          {valuePrefix}
          {Math.round(normalizedValue)}
          {valueSuffix}
        </div>
      )}
    </div>
  )
}

