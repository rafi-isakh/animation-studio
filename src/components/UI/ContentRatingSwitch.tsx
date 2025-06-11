"use client"
import { useState, useEffect } from "react"
import { Switch } from "@/components/shadcnUI/Switch"
import { useWebnovels } from "@/contexts/WebnovelsContext"

interface ContentRatingSwitchProps {
    language: string
    onToggle?: (enabled: boolean) => void
    defaultRestrictedChecked?: boolean | null
    className?: string
}

export function ContentRatingSwitch({ language, onToggle, defaultRestrictedChecked = false, className }: ContentRatingSwitchProps) {
    const { restricted, setRestricted } = useWebnovels()

    const handleToggle = (prev: boolean) => {
        const newState = !prev
        setRestricted(newState)
        onToggle?.(newState)
    }

    return (
        <div className={`flex items-center space-x-4 ${className}`}>
            <div className="relative">
                <Switch
                    id="pg-19-content"
                    checked={!restricted}
                    onCheckedChange={handleToggle}
                    className="h-6 rounded-full data-[state=unchecked]:bg-red-700 data-[state=checked]:bg-gray-200 duration-300 ease-in-out transition-colors"
                />
                <div
                    onClick={() => {
                        setRestricted(!restricted)
                        onToggle?.(!restricted)
                    }
                    }
                    className={`absolute top-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-200 cursor-pointer
                        ${!restricted ? "translate-x-4 text-red-500 border-2 border-red-500 bg-white data-[state=checked]:bg-white"
                                      : "bg-white border-2 border-red-500"
                        }`}
                >
                    {!restricted ? (
                        <span className="text-xs font-bold text-red-500">
                            {language === 'ko' ? '19' : 'R'}
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-red-500">
                            {language === 'ko' ? '19' : 'R'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
