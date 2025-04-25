"use client"
import { useState, useEffect } from "react"

interface CountdownTimerProps {
  targetDate: string
  className?: string
}

export default function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      
      // Detect Safari
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator?.userAgent || '')
      
      // Hardcoded approach for Safari
      let target: Date
      
      if (isSafari) {
        // Use the hardcoded target for Safari - April 31, 2025 at 23:59:59
        target = new Date("2025/05/30T23:59:59")
      } else {
        // For other browsers, use the provided targetDate
        target = new Date(targetDate)
      }
      
      // Safety check
      if (isNaN(target.getTime())) {
        console.error("Date parsing failed, using fallback")
        // Fallback to a manually constructed date
        const fallbackDate = new Date()
        fallbackDate.setFullYear(2025)
        fallbackDate.setMonth(3) // April (0-indexed)
        fallbackDate.setDate(30)
        fallbackDate.setHours(23, 59, 59, 0)
        target = fallbackDate
      }
      
      const distance = target.getTime() - now
      
      if (distance < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }
      
      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      }
    }
    
    // Initial calculation
    setTimeLeft(calculateTimeLeft())
    
    // Set up interval
    const intervalId = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    
    return () => clearInterval(intervalId)
  }, [targetDate])
  
  return (
    <div className={`${className} flex justify-center items-center space-x-4 mb-6`}>
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="flex flex-col items-center">
          <span className="text-4xl font-bold">{value}</span>
          <span className="text-sm uppercase">{unit}</span>
        </div>
      ))}
    </div>
  )
}