"use client"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar"
import { User, UserStripped, Author } from "@/components/Types"
import { Button } from "@/components/shadcnUI/Button"
import { koreanToEnglishAuthorName } from "@/utils/webnovelUtils"


export default function ActiveUserAvatar({ user, author, language }: { user: UserStripped, author: Author, language: string }) {
  const [imageError, setImageError] = useState(false)
  const [size, setSize] = useState(100)
  const [hasStory, setHasStory] = useState(true)
  const [isViewed, setIsViewed] = useState(false)

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        onClick={() => {
          console.log("clicked")
          setIsViewed(!isViewed)
        }}
        className="relative flex items-center justify-center cursor-pointer" style={{ width: size + 8, height: size + 8 }}>

        {hasStory && (
          <div className="absolute inset-0 rounded-full p-[2px]">
            <svg
              width={size + 8}
              height={size + 8}
              className="absolute inset-0 spin-in-12"
              style={{
                animation: hasStory && !isViewed ? "" : "none",
              }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FCAF45" />
                  <stop offset="25%" stopColor="#FD1D1D" />
                  <stop offset="50%" stopColor="#E1306C" />
                  <stop offset="75%" stopColor="#C13584" />
                  <stop offset="100%" stopColor="#833AB4" />
                </linearGradient>
              </defs>
              <circle
                cx={(size + 8) / 2}
                cy={(size + 8) / 2}
                r={(size + 8) / 2 - 2}
                fill="none"
                stroke={isViewed ? "#c7c7c7" : `url(#${gradientId})`}
                strokeWidth="3"
              />
            </svg>
          </div>
        )}

        <div className="relative rounded-full overflow-hidden bg-white p-[2px]" style={{ width: size, height: size }}>
          {!imageError ? (
            <Avatar
              className="w-full h-full object-cover rounded-full"
              onError={() => setImageError(true)}
            >
              <AvatarImage src={user.picture} alt={user.nickname} />
              <AvatarFallback className="dark:bg-gray-500">
                <span className="text-gray-400 text-xs">
                  {author.nickname === 'Anonymous' ? '' :
                    language == 'ko' ?
                      author.nickname :
                      koreanToEnglishAuthorName[author.nickname as string] ?
                        koreanToEnglishAuthorName[author.nickname as string].charAt(0).toUpperCase() + koreanToEnglishAuthorName[author.nickname as string].charAt(1).toUpperCase()
                        :
                        author.nickname.charAt(0).toUpperCase() + author.nickname.charAt(1).toUpperCase()

                  }
                </span>
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center"
              style={{ width: size - 4, height: size - 4 }}
            >
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

    </div>
  )
}
