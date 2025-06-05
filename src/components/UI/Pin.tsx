import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image"
import { ToonyzPost, Webnovel, Language, Dictionary } from "@/components/Types"
import { getImageUrl, getVideoUrl } from "@/utils/urls"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/shadcnUI/Card"
import { Heart, MessageCircle, Share, Share2, Film } from "lucide-react"
import { Button } from "@/components/shadcnUI/Button"
import Link from "next/link"
import { useWebnovels } from "@/contexts/WebnovelsContext"
import { truncateText } from "@/utils/truncateText"
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { phrase } from "@/utils/phrases";

export function Pin({ post, language, dictionary }: { post: ToonyzPost, language: Language, dictionary: Dictionary }) {
  const { getWebnovelById } = useWebnovels()
  const videoRef = useRef<HTMLVideoElement>(null);
  const [webnovelTitle, setWebnovelTitle] = useState<string>('');
  const [webnovel, setWebnovel] = useState<Webnovel | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchWebnovelTitle = async () => {
      const webnovel = await getWebnovelById(post.webnovel_id);
      setWebnovelTitle(webnovel?.title || '');
    };
    const fetchWebnovel = async () => {
      const webnovel = await getWebnovelById(post.webnovel_id);
      setWebnovel(webnovel || null);
    };
    fetchWebnovelTitle();
    fetchWebnovel();
  }, [post.webnovel_id, getWebnovelById]);

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

  const handleShareClick = async () => {
    if (isSharing) return;
    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: post.title,
          text: phrase(dictionary, "share_post", language),
          url: `/toonyz_posts/${post.id}`
        });
      } catch (error) {
        console.log('Share failed:', error);
      } finally {
        setIsSharing(false);
      }
    } else {
      setShowShareModal(true);
    }
  }

  return (
    <Link
      key={post.id}
      href={`/toonyz_posts/${post.id}`}
      className="inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card className="group w-[300px] overflow-hidden border-none">
        {/* Main Image/Video Section */}
        <div className="relative aspect-square w-full">
          {
            post.image ?
              <Image
                src={getImageUrl(post.image) || "/placeholder.svg"}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
              :
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={getVideoUrl(post.video)}
                  muted
                  loop
                  playsInline
                  autoPlay={true}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  poster="/placeholder.svg"
                />
                <Film size={20} className="absolute top-2 right-2 text-white z-10" />
              </div>
          }

          {/* Quote overlay */}
          {post.quote && (
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
              <p className="text-white text-sm font-bold text-center max-w-[85%] break-words px-4">
                &quot;{truncateText(post.quote, 50)}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Bottom Section with Description and User Info */}
        {/* Webnovel thumbnail overlay */}
        <CardContent className="p-4">
          <Link href={`/view_webnovels/${post.webnovel_id}`} className="">
            <div className="relative flex flex-row justify-between items-center gap-2 z-10">
              <div className="flex flex-row items-center gap-2">
                <div className="w-12 h-12 rounded-md overflow-hidden relative flex-shrink-0">
                  <Link href={`/view_webnovels/${post.webnovel_id}`}>
                    <Image
                      src={getImageUrl(webnovel?.cover_art || "") || "/placeholder.svg"}
                      alt={webnovel?.title || ""}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </Link>
                </div>
                <div className="flex flex-col text-xs text-black dark:text-white">
                  <p className='truncate text-ellipsis'>
                    {webnovel ? (
                      <OtherTranslateComponent
                        element={webnovel}
                        elementId={post.webnovel_id.toString()}
                        content={webnovelTitle || ''}
                        elementType='webnovel'
                        elementSubtype="title"
                        classParams={language === 'ko'
                          ? "break-keep korean"
                          : "break-words"}
                      />
                    ) : (
                      webnovelTitle
                    )}
                  </p>
                  <p>{webnovel?.author?.nickname}</p>
                </div>
              </div>
              <Button
                className="rounded-full bg-[#DE2B74] p-1 text-white"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleShareClick()
                }}>
                <Share2 size={10} className="w-6 h-6 text-white" />
              </Button>
            </div>
          </Link>

          {/* Post Title */}
          <CardTitle className="text-sm font-bold py-4 line-clamp-2">
            <div className="flex items-center justify-between">
              {post.title ? (
                <OtherTranslateComponent
                  element={post}
                  content={post.title}
                  elementId={post.webnovel_id.toString()}
                  elementType='webnovel'
                  elementSubtype="title"
                  classParams={language === 'ko'
                    ? "break-keep korean"
                    : "break-words"}
                />
              ) : (
                post.id
              )}
            </div>
          </CardTitle>


          {/* User Info and Stats */}
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center gap-2">
              {post.user.picture ? (
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <Image
                    src={getImageUrl(post.user.picture)}
                    alt={post.user.nickname || 'User'}
                    width={24}
                    height={24}
                    className='object-cover'
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                  </svg>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {truncateText(post.user.nickname || 'Anonymous', 15)}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#DE2B74] dark:text-[#DE2B74]">
                  <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z"
                    fill="#DE2B74" />
                </svg>
                <span className="text-xs text-muted-foreground">
                  {post.upvotes || 0}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {post.comments?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

