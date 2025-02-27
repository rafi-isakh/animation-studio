"use client"

import { useEffect, useRef, useState } from "react"

interface WatermarkedImageProps {
  imageUrl: string
  watermarkUrl: string
  webnovelTitle?: string
  chapterTitle?: string
  width?: number
  height?: number
  watermarkOpacity?: number
  watermarkPosition?: "center" | "centerLeft" | "centerRight" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "bottomCenter"
  titlePosition?: "top" | "bottom" | "centerLeft" | "centerRight"
  titleColor?: string
  titleFontSize?: number
  chapterFontSize?: number
  className?: string
}

export default function WatermarkedImage({
  imageUrl,
  watermarkUrl,
  webnovelTitle,
  chapterTitle,
  width = 800,
  height = 600,
  watermarkOpacity = 0.3,
  watermarkPosition = "center",
  titlePosition = "bottom",
  titleColor = "white",
  titleFontSize = 24,
  chapterFontSize = 18,
  className = "",
}: WatermarkedImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsLoading(true)
    setError(null)

    // Set canvas dimensions
    canvas.width = width
    canvas.height = height

    // Load the main image
    const img = new Image()
    img.crossOrigin = "anonymous" // Important for CORS
    img.src = imageUrl

    img.onload = () => {
      // Draw the main image
      ctx.drawImage(img, 0, 0, width, height)

      // Load the watermark SVG
      const watermarkImg = new Image()
      watermarkImg.crossOrigin = "anonymous"
      watermarkImg.src = watermarkUrl

      watermarkImg.onload = () => {
        // Apply watermark with position
        ctx.globalAlpha = watermarkOpacity

        let x = 0
        let y = 0
        const wWidth = 120 // Fixed width of 100px
        const wHeight = 30 // Fixed height of 20px
        // const wWidth = width / 3
        // const wHeight = (watermarkImg.height / watermarkImg.width) * wWidth

        switch (watermarkPosition) {
          case "center":
            x = (width - wWidth) / 2
            y = (height - wHeight) / 2
            break
          case "centerLeft":
            x = 20
            y = (height - wHeight) / 2
            break
          case "centerRight":
            x = width - wWidth - 20
            y = (height - wHeight) / 2
            break
          case "topLeft":
            x = 20
            y = 20
            break
          case "topRight":
            x = width - wWidth - 20
            y = 20
            break
          case "bottomLeft":
            x = 20
            y = height - wHeight - 20
            break
          case "bottomRight":
            x = width - wWidth - 20
            y = height - wHeight - 20
            break
          case "bottomCenter":
            x = (width - wWidth) / 2
            y = height - wHeight - 20
            break
        }

        ctx.drawImage(watermarkImg, x, y, wWidth, wHeight)
        ctx.globalAlpha = 1.0

        // Add text overlays if provided
        if (webnovelTitle || chapterTitle) {
          ctx.fillStyle = titleColor
          
          // Set text alignment based on position
          if (titlePosition === "centerLeft") {
            ctx.textAlign = "left"
          } else if (titlePosition === "centerRight") {
            ctx.textAlign = "right"
          } else {
            ctx.textAlign = "center"
          }

          // Calculate x coordinate based on position
          let x = width / 2;
          if (titlePosition === "centerLeft") {
            x = 30; // Margin from left edge
          } else if (titlePosition === "centerRight") {
            x = width - 30; // Margin from right edge
          }

          // Calculate y coordinate based on position
          let y = titlePosition === "top" ? 40 : height - 40;
          if (titlePosition === "centerLeft" || titlePosition === "centerRight") {
            y = height / 2; // Center vertically
          }

          if (webnovelTitle) {
            ctx.font = `bold ${titleFontSize}px Arial`
            ctx.fillText(webnovelTitle, x, y - (titlePosition === "bottom" ? 30 : (titlePosition === "centerLeft" || titlePosition === "centerRight") ? 15 : 0))
          }

          if (chapterTitle) {
            ctx.font = `${chapterFontSize}px Arial`
            ctx.fillText(chapterTitle, x, (titlePosition === "top") ? y + 30 : 
                                         (titlePosition === "centerLeft" || titlePosition === "centerRight") ? y + 15 : y)
          }
        }

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
        setDataUrl(dataUrl)
        setIsLoading(false)
      }

      watermarkImg.onerror = () => {
        setError("Failed to load watermark")
        setIsLoading(false)
      }
    }

    img.onerror = () => {
      setError("Failed to load image")
      setIsLoading(false)
    }
  }, [
    imageUrl,
    watermarkUrl,
    width,
    height,
    watermarkOpacity,
    watermarkPosition,
    webnovelTitle,
    chapterTitle,
    titlePosition,
    titleColor,
    titleFontSize,
    chapterFontSize,
  ])

  return (
    <div className={`relative ${className}`}>
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
        </div>
      )}

      {error && <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-500">{error}</div>}

      {dataUrl && !isLoading && (
        <img
          src={dataUrl || "/placeholder.svg"}
          alt={webnovelTitle ? `${webnovelTitle} - ${chapterTitle}` : "Watermarked image"}
          width={width}
          height={height}
          className="object-cover w-full h-full"
        />
      )}
    </div>
  )
}

