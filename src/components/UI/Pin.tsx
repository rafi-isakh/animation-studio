import Image from "next/image";
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import { Heart, MessageCircle, Share } from "lucide-react"
import { useRef } from "react";

interface PinProps {
    post: any
}

{/* {posts.map((post: any) => (
                <div key={post.id} className="grid grid-cols-2 gap-4">
                    <div>
                        <Image src={getImageUrl(post.image)} alt={post.title} width={100} height={100} />
                        <h2 className="text-2xl font-bold">{post.title}</h2>
                        <p className="text-sm text-gray-500">{post.content}</p>
                    </div>
                </div>
            ))} 
*/}

export function Pin({ post }: PinProps) {
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
        <div className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="relative w-full overflow-hidden rounded-xl aspect-[3/4]">
                {
                    post.image?
                    <Image
                        src={getImageUrl(post.image) || "/placeholder.svg"}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        className="object-cover scale-125 transition-transform duration-200 group-hover:scale-[1.35]"
                    />
                    :
                    <video
                        ref={videoRef}
                        src={getImageUrl(post.video)}
                        muted
                        loop
                        className="object-cover scale-125 transition-transform duration-200 group-hover:scale-[1.35]"
                    />
                }
            </div>

            {/* {post.content} */}

            {post.quote && (
                <p className="text-white whitespace-pre-wrap mb-2">
                    {post.quote}
                </p>
            )}

            {/* 
                <p className="text-sm text-gray-500">Webnovel ID: {post.webnovel_id}</p>
                <p className="text-sm text-gray-500">Chapter ID: {post.chapter_id}</p>
            */}
            <div className="absolute rounded-xl inset-0 flex flex-col justify-end p-4 transition-opacity duration-200 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100">
                <h3 className="mb-2 text-lg font-semibold text-white">
                    {post.title.length > 25 ? `${post.title.slice(0, 25)}...` : post.title}
                </h3>

                <div className="flex items-center justify-between text-white">
                    <div className="flex flex-row space-x-2">
                        <div className="flex items-center space-x-2">
                            <Heart className="w-5 h-5" />
                            <span>{post.upvotes}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <MessageCircle className="w-5 h-5" />
                            <span>{post.comments}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Share className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    )
}

