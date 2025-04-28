import type { ReactNode } from "react"

interface AppIconProps {
  icon: ReactNode
  color: string
  isActive?: boolean
  baseSize?: number
  sizeFactor?: number
  showIcon?: boolean
}

export default function AppIcon({
  icon,
  color,
  isActive = false,
  baseSize = 40,
  sizeFactor = 1,
  showIcon = true,
}: AppIconProps) {
  // Calculate final size
  const size = baseSize * sizeFactor

  return (
    <div
      className={`rounded-full ${color} flex items-center justify-center shadow-md`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(-${size / 2}px, -${size / 2}px) ${isActive ? "scale(1.25)" : ""}`,
        boxShadow: isActive
          ? "0 0 15px rgba(255, 255, 255, 0.5)"
          : sizeFactor > 1.5
            ? "0 8px 16px rgba(0, 0, 0, 0.3)"
            : "0 4px 6px rgba(0, 0, 0, 0.1)",
        transition: "all 0.2s ease-out",
        opacity: sizeFactor < 0.5 ? 0.7 : 1,
      }}
    >
      {showIcon && (
        <div
          style={{
            transform: `scale(${Math.min(1, sizeFactor)})`,
            opacity: sizeFactor < 0.7 ? sizeFactor : 1,
            transition: "all 0.2s ease-out",
          }}
        >
          {icon}
        </div>
      )}
    </div>
  )
}
