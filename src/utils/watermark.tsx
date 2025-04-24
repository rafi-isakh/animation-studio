"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { getImageUrl } from "@/utils/urls"

interface WatermarkedImageProps {
    imageUrl: string
    watermarkUrl: string
    webnovelTitle?: string
    chapterTitle?: string
    quote?: string
    width?: number
    height?: number
    watermarkOpacity?: number
    watermarkPosition?: "center" | "centerLeft" | "centerRight" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "bottomCenter"
    titlePosition?: "top" | "bottom" | "centerLeft" | "centerRight"
    titleColor?: string
    titleFontSize?: number
    chapterFontSize?: number
    quoteFontSize?: number
    quotePosition?: "top" | "bottom"
    className?: string
    fallbackUrl?: string
    onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void
}

export default function WatermarkedImage({
    imageUrl,
    watermarkUrl,
    webnovelTitle,
    chapterTitle,
    quote,
    width = 1280,
    height = 1280,
    watermarkOpacity = 0.3,
    watermarkPosition = "center",
    titlePosition = "bottom",
    titleColor = "white",
    titleFontSize = 24,
    chapterFontSize = 18,
    quoteFontSize = 18,
    quotePosition = "bottom",
    className = "",
    fallbackUrl,
    onError,
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
        const img = new window.Image()
        img.crossOrigin = "anonymous" // Important for CORS
        const processedImageUrl = imageUrl

        // Try using fetch to preload the image with CORS headers
        const preloadImage = async (url: string) => {
            try {
                const response = await fetch(url, { mode: 'cors' });
                if (!response.ok) throw new Error('Network response was not ok');
                return url;
            } catch (err) {
                console.error('Image preload error:', err);
                return fallbackUrl || url;
            }
        }

        // Preload the image to ensure CORS is handled properly
        preloadImage(processedImageUrl).then(finalUrl => {
            img.src = finalUrl;
            console.log("Loading image from:", finalUrl);
        });

        img.onload = () => {
            // Draw the main image
            ctx.drawImage(img, 0, 0, width, height)

            // Load the watermark SVG
            const watermarkImg = new window.Image()
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
                if (webnovelTitle || chapterTitle || quote) {
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
                        x = 50; // Margin from left edge
                    } else if (titlePosition === "centerRight") {
                        x = width - 50; // Margin from right edge
                    }

                    // Calculate y coordinate based on position
                    let y = titlePosition === "top" ? 40 : height - 40;
                    if (titlePosition === "centerLeft" || titlePosition === "centerRight") {
                        y = height / 2; // Center vertically
                    }

                    if (webnovelTitle) {
                        ctx.font = `bold ${titleFontSize}px Arial`
                        ctx.fillText(webnovelTitle, x, y - (titlePosition === "bottom" ? 30 :
                            (titlePosition === "centerLeft" || titlePosition === "centerRight") ? 15 : 0))
                    }

                    if (chapterTitle) {
                        ctx.font = `${chapterFontSize}px Arial`
                        ctx.fillText(chapterTitle, x, (titlePosition === "top") ? y + 30 :
                            (titlePosition === "centerLeft" || titlePosition === "centerRight") ? y + 15 : y)
                    }

                    if (quote) {
                        // Set the font first
                        ctx.font = `${quoteFontSize}px Arial`;

                        // Measure text width
                        const metrics = ctx.measureText(quote);
                        const textWidth = metrics.width;

                        // Calculate text height (approximation based on font size)
                        // This is more accurate than just using fontSize
                        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

                        // Alternative height calculation if the above isn't supported in all browsers
                        const approxTextHeight = quoteFontSize * 1.2; // 1.2 is a common line-height multiplier

                        // Calculate position based on dimensions
                        let textX = x;
                        let textY = y;

                        // Adjust positions based on alignment
                        if (quotePosition === "bottom") {
                            textX = x + 20; // Left-aligned with 20px padding from left edge
                            textY = y + height - approxTextHeight - 20; // Position at bottom with 20px padding
                        } else if (quotePosition === "top") {
                            textX = x + (width - textWidth) / 2; // Center horizontally
                            textY = y + (height - approxTextHeight) / 2; // Center vertically
                        }

                        // For multi-line prose text (if needed)
                        const lineHeight = approxTextHeight * 1.2;
                        const words = quote.split(' ');
                        let line = '';
                        let yOffset = 0;

                        for (let i = 0; i < words.length; i++) {
                            const testLine = line + words[i] + ' ';
                            const metrics = ctx.measureText(testLine);

                            if (metrics.width > width - 40 && i > 0) {
                                // Draw the line and move to next line
                                ctx.fillText(line, textX, textY + yOffset);
                                line = words[i] + ' ';
                                yOffset += lineHeight;
                            } else {
                                line = testLine;
                            }
                        }
                        // Draw the last line
                        ctx.fillText(line, textX, textY + yOffset);
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
            if (fallbackUrl && img.src !== fallbackUrl) {
                img.src = fallbackUrl;
            } else {
                setError(`Failed to load image: ${img.src}`);
                setIsLoading(false);
            }
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
        fallbackUrl,
        onError,
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
                <Image
                    src={dataUrl || "/placeholder.svg"}
                    alt={webnovelTitle ? `${webnovelTitle} - ${chapterTitle}` : "Toonyz"}
                    width={width}
                    height={height}
                    quality={100}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                        if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
                            e.currentTarget.src = fallbackUrl;
                        }
                        if (onError) onError(e);
                    }}
                />
            )}
        </div>
    )
}

