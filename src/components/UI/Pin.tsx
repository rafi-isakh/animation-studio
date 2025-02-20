import Image from "next/image"
import { getImageUrl, getVideoUrl } from "@/utils/urls"
import { Heart, MessageCircle, Share, Share2, Film } from "lucide-react"
import { IconButton } from "@mui/material"
import Link from "next/link"
import { useWebnovels } from "@/contexts/WebnovelsContext"
import { useRef } from "react";

interface PinProps {
  post: any
}

export function Pin({ post }: PinProps) {
  const aspectRatio = post.height / post.width
  const { getWebnovelById } = useWebnovels()
  const truncateText = (text: string, maxLength: number = 15) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <Link href={`/toonyz_posts/${post.id}`} className="relative group shadow-sm" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="mb-4 break-inside-avoid">
        <div className="relative group overflow-hidden rounded-xl" style={{ paddingBottom: `${aspectRatio * 100}%` }}>
          <div className="absolute inset-0">
            {
              post.image ?
                <Image
                  src={getImageUrl(post.image) || "/placeholder.svg"}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover scale-125 transition-transform duration-200 group-hover:scale-[1.35]"
                />
                :
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={getImageUrl(post.video)}
                    muted
                    loop
                    className="w-full h-full object-cover scale-125 transition-transform duration-200 group-hover:scale-[1.35]"
                  />
                  <Film size={20} className="absolute top-2 left-2 text-white z-50" />
                </div>
            }
          </div>

          <div className="absolute inset-0 flex flex-col justify-end
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-200
                        bg-gradient-to-t from-black/60 to-transparent ">

            <div className="absolute right-0 top-0">
              <IconButton
                aria-label="share"
              // className="bg-[#DE2B74]"
              >
                <Share2 size={20} className="text-white z-10" />
              </IconButton>
            </div>


            {post.quote && (
              <p
                style={{ paddingBottom: `${aspectRatio * 100}%` }}
                className="absolute left-1/2 top-[20%] -translate-x-1/2 text-sm font-extrabold text-white text-center max-w-[80%]">
                {truncateText(post.quote)}
              </p>
            )}

            <div className="absolute left-1/2 bottom-[7.5rem] -translate-x-1/2">
              {post.user.picture ? (
                <Image
                  src={getImageUrl(post.user.picture)}
                  alt={post.user.nickname || 'User'}
                  width={30}
                  height={30}
                  className='rounded-full'
                />
              ) : (
                <div className="bg-gray-400 rounded-full w-8 h-8 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-100 rounded-full"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                  </svg>
                </div>
              )}
            </div>

            <div className="bg-white rounded-b-xl p-4">

              <h3 className="mb-2 text-lg font-semibold text-black line-clamp-2">
                {truncateText(post.title)}
              </h3>
              <div className="flex flex-col items-center justify-between text-white">

                <p className="text-sm text-gray-500">{post.user.nickname}</p>
                <p className="text-sm text-gray-500">{getWebnovelById(post.webnovel_id).then(webnovel => webnovel?.title)}</p>


                <div className="flex flex-row space-x-2 text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5" />
                    <span>{post.upvotes}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments.length}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}




{/* {post.content} */ }
{/* {post.quote && (
                    <p className="text-white whitespace-pre-wrap mb-2">
                        {post.quote}
                    </p>
                )} */}

{/* 
                <p className="text-sm text-gray-500">Webnovel ID: {post.webnovel_id}</p>
                <p className="text-sm text-gray-500">Chapter ID: {post.chapter_id}</p>
            */}
