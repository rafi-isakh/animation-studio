'use client'
import Image from "next/image"
import Link from "next/link"
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import { formatRelativeTime } from "@/utils/formatTime";
import { User, ToonyzPost } from "@/components/Types";
import { useWebnovels } from "@/contexts/WebnovelsContext";
import { useState, useEffect } from "react";
import { Webnovel } from "@/components/Types";
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { truncateText } from "@/utils/truncateText";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar";


interface CollectionCardProps {
  id: string
  title: string
  pinCount: number
  created_at: string
  webnovel_id: string
  commentCount: number
  images: {
    image: string
    type?: 'image' | 'video'
    thumbnail?: string
  }[]
  commentedBy?: {
    id: string
    nickname: string
    picture: string
  }[]
}

export default function CollectionCard({ id, title, pinCount, webnovel_id, created_at, images, commentedBy = [], commentCount }: CollectionCardProps) {
  const { getWebnovelById } = useWebnovels();
  const [webnovel, setWebnovel] = useState<Webnovel | undefined>(undefined);
  const [hoveredVideo, setHoveredVideo] = useState<number | null>(null);

  // Create refs for the videos
  const videoRefs = [
    useState<HTMLVideoElement | null>(null),
    useState<HTMLVideoElement | null>(null),
    useState<HTMLVideoElement | null>(null)
  ];

  useEffect(() => {
    const fetchWebnovel = async () => {
      const novel = await getWebnovelById(webnovel_id);
      setWebnovel(novel);
    };
    fetchWebnovel();
  }, [webnovel_id]);

  // Handle mouse enter to play video
  const handleMouseEnter = (index: number) => {
    setHoveredVideo(index);
    if (videoRefs[index][0]) {
      videoRefs[index][0].play().catch(e => console.log("Video play error:", e));
    }
  };

  // Handle mouse leave to pause video
  const handleMouseLeave = (index: number) => {
    setHoveredVideo(null);
    if (videoRefs[index][0]) {
      videoRefs[index][0].pause();
    }
  };

  return (
    <div className="max-w-[400px] w-fit rounded-xl overflow-hidden shadow-md bg-white dark:bg-[#211F21] flex-shrink-0 flex-grow-0">
      <Link href={webnovel_id ? `/toonyz_posts/${id}` : "#"} className="block">
        <div className="relative h-64 w-full">
          {/* Three equal-width images in a row */}
          <div className="absolute left-0 top-0 w-1/3 h-full p-0.5">
            <div className="relative h-full w-full overflow-hidden">
              {images[0]?.type === 'video' ? (
                <div
                  className="relative h-full w-full"
                  onMouseEnter={() => handleMouseEnter(0)}
                  onMouseLeave={() => handleMouseLeave(0)}
                >
                  <video
                    ref={el => videoRefs[0][1](el)}
                    src={getVideoUrl(images[0]?.image) || ""}
                    className="object-cover rounded-tl-xl w-full h-full"
                    muted
                    loop
                    playsInline
                  />
                  <div className={`absolute inset-0 flex items-center justify-center ${hoveredVideo === 0 ? 'opacity-0' : ''}`}>
                    <div className="bg-white bg-opacity-70 rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <Image
                  src={getImageUrl(images[0]?.image) || "/coverArt_thumbnail.png"}
                  alt={images[0]?.image || "Collection image"}
                  fill
                  className="object-cover rounded-tl-xl"
                  priority
                />
              )}
            </div>
          </div>

          {/* Middle image */}
          <div className="absolute left-1/3 top-0 w-1/3 h-full p-0.5">
            <div className="relative h-full w-full overflow-hidden">
              {images[1]?.type === 'video' ? (
                <div
                  className="relative h-full w-full"
                  onMouseEnter={() => handleMouseEnter(1)}
                  onMouseLeave={() => handleMouseLeave(1)}
                >
                  <video
                    ref={el => videoRefs[1][1](el)}
                    src={getVideoUrl(images[1]?.image) || ""}
                    className="object-cover w-full h-full"
                    muted
                    loop
                    playsInline
                  />
                  <div className={`absolute inset-0 flex items-center justify-center ${hoveredVideo === 1 ? 'opacity-0' : ''}`}>
                    <div className="bg-white bg-opacity-70 rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <Image
                  src={getImageUrl(images[1]?.image) || "/coverArt_thumbnail.png"}
                  alt={images[1]?.image || "Collection image"}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          </div>

          {/* Right image */}
          <div className="absolute right-0 top-0 w-1/3 h-full p-0.5">
            <div className="relative h-full w-full overflow-hidden">
              {images[2]?.type === 'video' ? (
                <div
                  className="relative h-full w-full"
                  onMouseEnter={() => handleMouseEnter(2)}
                  onMouseLeave={() => handleMouseLeave(2)}
                >
                  <video
                    ref={el => videoRefs[2][1](el)}
                    src={getVideoUrl(images[2]?.image) || ""}
                    className="object-cover rounded-tr-xl w-full h-full"
                    muted
                    loop
                    playsInline
                  />
                  <div className={`absolute inset-0 flex items-center justify-center ${hoveredVideo === 2 ? 'opacity-0' : ''}`}>
                    <div className="bg-white bg-opacity-70 rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <Image
                  src={getImageUrl(images[2]?.image) || "/coverArt_thumbnail.png"}
                  alt={images[2]?.image || "Collection image"}
                  fill
                  className="object-cover rounded-tr-xl"
                />
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link href={webnovel_id ? `/view_webnovels?id=${webnovel_id}` : "#"}>
          <h2 className="text-2xl font-bold mb-1 text-black dark:text-white">
            {/* {webnovel?.title} */}
            <OtherTranslateComponent
              content={truncateText(webnovel?.title || "", 8)}
              elementId={webnovel?.id.toString() || ""}
              elementType="webnovel"
              elementSubtype="title"
              classParams="truncate"
            />
          </h2>
        </Link>
        <div className="flex flex-col items-start justify-between">
          <div className="flex flex-row items-center text-gray-500 text-sm">
            <span>{pinCount} Pins</span>
            <span className="mx-1">•</span>
            <span>{formatRelativeTime(created_at)}</span>
            <span className="mx-1"><MessageCircle className="w-4 h-4" /></span>
            <span>{commentCount} Comments</span>
          </div>
          {/* <div className="flex flex-row items-start text-gray-500 text-sm">
            <span className="mx-1"><MessageCircle className="w-4 h-4" /></span>
            <span>{commentCount} Comments</span>
          </div> */}
          {commentedBy.length > 0 && (
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-2">
                {commentedBy.slice(0, 3).map((user) => (
                  <Avatar key={user.id} className="relative w-6 h-6 rounded-full border border-white overflow-hidden">
                    <AvatarImage src={getImageUrl(user.picture) || ""} alt={user.nickname} />
                    <AvatarFallback className="bg-gray-300 flex items-center justify-center text-xs text-black dark:text-black">
                      {user.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {commentedBy.length > 0 && (
                <span className="text-xs text-gray-500">
                  {commentedBy.length > 3
                    ? `+${commentedBy.length - 3} more`
                    : commentedBy.length === 1
                      ? `${commentedBy[0].nickname} engaged`
                      : `${commentedBy.length} engaged`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

