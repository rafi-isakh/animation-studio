import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image"
import { getImageUrl, getVideoUrl } from "@/utils/urls"
import { Heart, MessageCircle, Share, Share2, Film } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/shadcnUI/Dialog"
import { Button } from "@/components/shadcnUI/Button"
import Link from "next/link"
import { useWebnovels } from "@/contexts/WebnovelsContext"
import { truncateText } from "@/utils/truncateText"
import ShareToSocialMediaCard from "@/components/UI/ShareToSocialMediaCard"

interface PinProps {
  post: any
}

export function Pin({ post }: PinProps) {
  const aspectRatio = post.height / post.width
  const { getWebnovelById } = useWebnovels()
  const videoRef = useRef<HTMLVideoElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [webnovelTitle, setWebnovelTitle] = useState<string>("");

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

  const MemoizedShareToSocialMediaCard = React.memo(ShareToSocialMediaCard);

  const handleDialogOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShareDialogOpen(true);
  }

  const handleDialogClose = useCallback(() => {
    setShareDialogOpen(false);
  }, []);


  const WebnovelTitle = getWebnovelById(post.webnovel_id).then(webnovel => webnovel?.title) 

  return (
    <div className="relative group shadow-sm">
      <div ref={pinRef} className="mb-4 break-inside-avoid">
        <Link href={`/toonyz_posts/${post.id}`} onClick={() => { console.log("") }} className="block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
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
                    src={getVideoUrl(post.video)}
                    muted
                    loop
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover max-h-[50vh] md:max-h-none scale-100 md:scale-125 transition-transform duration-200 md:group-hover:scale-[1.35]"
                    poster="/video-placeholder.jpg" // Optional placeholder image
                    />
                    <Film size={20} className="absolute top-2 left-2 text-white z-50" />
                  </div>
              }
            </div>

            <div className="absolute inset-0 flex flex-col justify-end
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-200
                        bg-gradient-to-t from-black/60 to-transparent ">
              {post.quote && (
                <p
                  // style={{ paddingBottom: `${aspectRatio * 100}%` }}
                  className="absolute left-1/2 top-[25%] -translate-x-1/2 text-sm font-extrabold text-white text-center w-fit max-w-[85%] break-keep">
                  {/* */}
                  {truncateText(post.quote, 15)}
                </p>
              )}

              <div className="absolute right-5 bottom-[4.3rem] z-50">
                {post.user.picture ? (
                  <div className="dark:bg-[#211F21] bg-white rounded-full w-8 h-8 flex items-center justify-center overflow-hidden">
                    <div className="relative w-full h-full">
                      <Image
                        src={getImageUrl(post.user.picture)}
                        alt={post.user.nickname || 'User'}
                        fill
                        className='object-cover'
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#211F21] rounded-full w-8 h-8 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-500 dark:text-gray-200 rounded-full"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-[#211F21] rounded-b-xl p-4 z-30">
                <h3 className="mb-1 text-sm font-bold text-black dark:text-white line-clamp-2">
                  {truncateText(post.title, 10)}
                </h3>
                <div className="flex flex-col items-center justify-between text-white">
                  {/* <p className="text-sm text-gray-500">{truncateText(webnovelTitle, 10)}</p> */}
                  <div className="flex flex-row space-x-2 text-gray-500">
                    <div className="flex flex-row items-center space-x-2 text-sm">
                      <Heart size={14} className="" />
                      <span>{post.upvotes ? post.upvotes : 0}</span>
                    </div>
                    <div className="flex flex-row items-center space-x-2 text-sm">
                      <MessageCircle size={14} className="" />
                      <span>{post.comments ? post.comments.length : 0}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{post.user.nickname}</p>
                </div>

              </div>
            </div>
          </div>
        </Link >
      </div >
    </div >
  )
}

