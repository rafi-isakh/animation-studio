"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/shadcnUI/Card"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/shadcnUI/Button"
import { ToonyzPost, Webnovel, } from "@/components/Types"
import { getImageUrl, getVideoUrl } from "@/utils/urls"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { truncateText } from "@/utils/truncateText"
import { phrase } from "@/utils/phrases"
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import UserInfoCard from "@/components/UI/UserInfoCard";

export default function MyLibraryToonyzPostCard({ library, toonyzPosts, webnovel_id, mode }: { library?: Webnovel[], toonyzPosts: ToonyzPost[], webnovel_id?: number, mode: 'library' | 'view_webnovels' }) {
  const { dictionary, language } = useLanguage()
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<number, number>>({});
  const [currentPost, setCurrentPost] = useState<ToonyzPost | null>(null);

  useEffect(() => {
    if (library) {
      const initialIndices = library.reduce((acc, item) => {
        const posts = toonyzPosts
          .filter(post => String(post.webnovel_id) === String(item.id))
          .slice(0, 4); // Match the slice used for display
        if (posts.length > 0) {
          acc[item.id] = 0; // Start at index 0 for items with posts
        }
        return acc;
      }, {} as Record<number, number>);
      setCurrentImageIndices(initialIndices);
    }
  }, [library, toonyzPosts]);


  useEffect(() => {
    if (mode === 'view_webnovels' && webnovel_id) {
      const filteredPosts = toonyzPosts.filter(post => post.webnovel_id === String(webnovel_id))
      if (filteredPosts.length > 0) {
        setCurrentPost(filteredPosts[0]);
      }
    }
  }, [mode, toonyzPosts, webnovel_id]);


  const changeCoverImage = (libraryItemId: number, direction: "prev" | "next") => {
    const relevantPosts = toonyzPosts
      .filter(post => String(post.webnovel_id) === String(libraryItemId))
      .slice(0, 4); // Use the same slice as the display row
    const totalItems = relevantPosts.length;

    if (totalItems <= 1) return; // No change needed if 0 or 1 item

    setCurrentImageIndices((prev) => {
      // Ensure the library item exists in the state before trying to update
      if (!prev.hasOwnProperty(libraryItemId)) {
        console.warn(`Library item ${libraryItemId} not found in currentImageIndices state.`);
        return prev; // Should not happen with proper initialization, but safety check
      }

      const currentIndex = prev[libraryItemId];
      let newIndex;

      if (direction === "prev") {
        newIndex = (currentIndex - 1 + totalItems) % totalItems;
      } else { // direction === "next"
        newIndex = (currentIndex + 1) % totalItems;
      }

      return { ...prev, [libraryItemId]: newIndex };
    });
  };

  return (
    <div className="relative ">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {mode === 'library' && library?.map((libraryItem: Webnovel) => {
          const matchingPosts = toonyzPosts
            .filter(post => String(post.webnovel_id) === String(libraryItem.id))
            .slice(0, 4);
          return matchingPosts.length > 0 ? (
            <Card
              key={libraryItem.id}
              className="rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-all duration-300 aspect-square min-w-[300px] w-[300px] h-[300px] sm:h-[300px] border-none relative group flex-shrink-0"
              onMouseEnter={() => setHoveredCard(libraryItem.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Determine the current post to display based on the index state */}
              {(() => {
                const currentIndex = currentImageIndices[libraryItem.id] ?? 0;
                const currentPost = matchingPosts[currentIndex];
                const mediaSource = currentPost?.video
                  ? { type: 'video', url: getVideoUrl(currentPost.video) }
                  : currentPost?.image
                    ? { type: 'image', url: getImageUrl(currentPost.image) }
                    : { type: 'image', url: getImageUrl(libraryItem.cover_art) }; // Fallback

                return (
                  <div className="rounded-xl relative aspect-square w-full h-[300px] sm:h-[300px] overflow-hidden">
                    {/* Background media - Video or Image */}
                    {mediaSource.type === 'video' ? (
                      <video
                        key={currentPost?.id || libraryItem.id} // Key for re-rendering
                        src={mediaSource.url || ""}
                        playsInline
                        autoPlay
                        muted
                        loop
                        className="absolute inset-0 w-full h-full object-cover z-10"
                      />
                    ) : (
                      <Image
                        key={currentPost?.id || libraryItem.id} // Key for re-rendering
                        src={mediaSource.url || ""}
                        alt={libraryItem.title}
                        fill
                        className="object-cover transition-opacity duration-300 z-10"
                        priority
                      />
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

                    {/* Image indicator dots */}
                    {matchingPosts.length > 1 && (
                      <div className="absolute top-3 right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        {matchingPosts.map((_, index) => (
                          <div
                            key={index}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              currentImageIndices[libraryItem.id] === index ? "bg-white" : "bg-white/40",
                            )}
                          />
                        ))}
                      </div>
                    )}
                    {/* Cover image navigation buttons */}
                    {matchingPosts.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => {
                            e.stopPropagation()
                            changeCoverImage(libraryItem.id, "prev")
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => {
                            e.stopPropagation()
                            changeCoverImage(libraryItem.id, "next")
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    <div className="relative w-full p-2 text-center flex flex-row items-center gap-2">
                      {/* Thumbnail with title */}
                      <div className="absolute top-4 left-4 flex items-start gap-3 z-10">
                        <div className="w-16 h-16 rounded-md overflow-hidden relative flex-shrink-0">
                          <Link href={`/view_webnovels/${libraryItem.id}`}>
                            <Image
                              src={getImageUrl(libraryItem.cover_art) || ""}
                              alt={libraryItem.title}
                              width={64}
                              height={64}
                              className="object-cover opacity-70"
                            />
                          </Link>
                        </div>

                        {/* Title next to thumbnail */}
                        <div className="text-white pt-1">
                          <h4 className="font-bold text-sm">
                            <Link href={`/view_webnovels/${libraryItem.id}`}>
                              <OtherTranslateComponent
                                element={libraryItem}
                                content={libraryItem.title}
                                elementId={libraryItem.id.toString()}
                                elementType='webnovel'
                                elementSubtype="title"
                                classParams={language === 'ko'
                                  ? "text-lg break-keep korean truncate text-center"
                                  : "text-lg break-words truncate text-center"}
                              />
                            </Link>
                          </h4>
                          <p className="text-xs text-white text-left "> {toonyzPosts.filter(post => String(post.webnovel_id) === String(libraryItem.id)).length} Pins </p>
                        </div>
                      </div>
                    </div>

                    {/* Content - description and upvotes */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-50">
                      {currentPost.title ? <h3 className="text-2xl font-bold mb-1">{currentPost?.title}</h3>
                        : <h3 className="text-2xl font-bold mb-1">Post {currentPost?.id}</h3>}
                      <p className="text-sm text-gray-300 mb-3">{currentPost?.content}</p>


                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity border-white dark:border-white"
                        >
                          <Link href={`/toonyz_posts/${currentPost?.id}`}>
                            {phrase(dictionary, "viewPost", language)}
                          </Link>
                        </Button>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* user card */}
                          <UserInfoCard post={currentPost} />
                          <div className="flex flex-col">
                            {currentPost.user.nickname && (
                              <p className="text-sm font-extrabold flex flex-row items-center dark:text-white text-white">
                                {currentPost.user.nickname}
                              </p>
                            )}
                            {currentPost.created_at && (
                              <p className="text-sm flex flex-row items-center dark:text-white text-white">
                                {new Date(currentPost.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}
            </Card>
          ) : <></>;
        })}
        {mode === 'view_webnovels' && toonyzPosts.map(post => (
          <Card
            key={post.id}
            className="rounded-xl bg-transparent hover:bg-neutral-700 transition-all duration-300 aspect-square min-w-[300px] w-[300px] h-[300px] sm:h-[300px] border-none relative group flex-shrink-0"
            onMouseEnter={() => setHoveredCard(post.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="rounded-xl absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
            <div className="rounded-xl relative aspect-square w-full h-[300px] sm:h-[300px] overflow-hidden">
              {post.image ? <Image src={getImageUrl(post.image) || ""} alt={post.title} fill priority className="object-cover transition-opacity duration-300 z-10" />
                : <video src={getVideoUrl(post.video) || ""} autoPlay muted loop className="object-cover transition-opacity duration-300 z-10 " />}

              {/* user card */}
              <div className="absolute top-1 left-1 w-full p-2 z-20">
                <div className="flex justify-start items-start gap-3">
                  <div className="w-10 h-10 overflow-hidden relative flex-shrink-0 self-center">
                    <UserInfoCard post={post} />
                  </div>

                  {/* Title next to thumbnail */}
                  <div className="text-white">
                    <h4 className="font-bold text-sm">
                      {post.user.nickname && (
                        <p className="text-sm font-extrabold text-white">
                          {post.user.nickname}
                        </p>
                      )}
                    </h4>
                    {post.created_at && (
                      <p className="text-xs text-white/80">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Content - description and upvotes */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-50">
                {post.title ? <h3 className="text-2xl font-bold mb-1">{post?.title}</h3>
                  : <h3 className="text-2xl font-bold mb-1">Post {post?.id}</h3>}
                <p className="text-sm text-gray-300 mb-3">{post?.content}</p>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity border-white dark:border-white"
                  >
                    <Link href={`/toonyz_posts/${post?.id}`}>
                      {phrase(dictionary, "viewPost", language)}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
