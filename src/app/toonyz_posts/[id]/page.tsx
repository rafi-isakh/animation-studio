"use client"
import { User, ToonyzPost, Webnovel } from "@/components/Types";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
import { MoveLeft, Heart, MessageCircle, Share2, Film, Clock4, Eye } from "lucide-react";
import { IconButton } from "@mui/material";
import { useWebnovels } from '@/contexts/WebnovelsContext';
import { CommentList } from "@/components/CommentList";

async function getPost(id: string) {
    // get_toonyz_post_by_id?id=${id}
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_toonyz_post_by_id?id=${id}`);
    if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData);
        return null;
    }
    const post: ToonyzPost = await response.json();
    return post;
}

const getWebnovelWithContentById = async (id: string) => {
    const response = await fetch(`/api/get_webnovel_by_id?id=${id}`)
    if (!response.ok) {
        throw new Error("Failed to fetch webnovel")
    }
    const data = await response.json();
    return data;
};


const ToonyzPostPage = ({ params }: { params: { id: string } }) => {
    // const post = await getPost(params.id);
    const [post, setPost] = useState<ToonyzPost | undefined>(undefined);
    const { getWebnovelById, } = useWebnovels();
    const [webnovel, setWebnovel] = useState<Webnovel | undefined>(undefined);
    const [showQuote, setShowQuote] = useState(false);

    useEffect(() => {
        const fetchWebnovel = async () => {
            if (post?.webnovel_id) {
                const novel = await getWebnovelWithContentById(post.webnovel_id);
                setWebnovel(novel);
            }
        };
        fetchWebnovel();
    }, [post?.webnovel_id, getWebnovelById]);


    useEffect(() => {
        const fetchPost = async () => {
            const post = await getPost(params.id);
            if (post) {
                if (post) {
                }
                setPost(post);
            }
        };
        fetchPost();
    }, [params.id]);

    const truncateText = (text: string, maxLength: number = 15) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };


    if (!post) {
        return <div>Post not found</div>
    }
    return (
        <div className="flex flex-col mx-auto w-full min-h-screen">
            {/* header */}
            <div className="sticky top-0 z-50 w-full mx-auto bg-background backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
                <div className="flex flex-row items-center justify-between gap-2 md:px-5 px-4 md:max-w-screen-xl mx-auto">
                    <Link href="/feeds" className="self-start my-5 flex flex-row items-center gap-2">
                        <MoveLeft size={20} className='dark:text-white text-gray-500' />
                        <p className="text-sm font-base">Back</p>
                    </Link>
                    {/* <p className="text-2xl font-bold">{post.title}</p> */}
                    <IconButton
                        aria-label="share"
                    // className="bg-[#DE2B74]"
                    >
                        <Share2 size={20} className="dark:text-white text-gray-500 z-10" />
                    </IconButton>
                </div>
            </div>
            {/* Image Container */}
            <div className="relative md:max-w-screen-xl mx-auto w-full h-screen group pt-14 md:pt-14 ">
                {/* top margin is 14 */}
                {post.image ? (
                    <Image
                        src={getImageUrl(post.image)}
                        alt={post.title}
                        fill
                        className="object-cover transition-all duration-300 group-hover:blur-sm  overflow-hidden"
                    />
                ) : (
                    <div className="relative group h-full">
                        <video
                            src={getImageUrl(post.video)}
                            muted
                            loop
                            autoPlay
                            className="w-full h-full object-cover scale-125 transition-transform duration-200 group-hover:scale-[1.35] pt-14 md:pt-14 overflow-hidden"
                        />
                    </div>
                )}
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white mix-blend-difference font-bold text-lg md:text-3xl leading-loose text-center max-w-[80%] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {post.quote}
                </p>
            </div>

            {/* Description Container */}
            <div className="flex flex-col gap-4 p-5 bg-white dark:bg-[#211F21] sticky bottom-0 z-50">
                <div className="md:max-w-screen-xl mx-auto w-full flex flex-col items-center gap-y-4">
                    <div className="relative -top-[3.5rem] flex justify-center ">
                        <Link href={`/view_profile/${post.user.id}`}>
                            {post.user.picture ? (
                                <div className="dark:bg-[#211F21] bg-white rounded-full w-20 h-20 flex items-center justify-center overflow-hidden">
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
                                <div className="bg-gray-400 rounded-full w-20 h-20 flex items-center justify-center">
                                    <svg
                                        className="w-20 h-20 text-gray-100 rounded-full"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                            )}
                        </Link>
                    </div>
                    <p className="relative -top-5 text-center text-xl md:text-4xl font-bold">{truncateText(post.title, 100)}</p>
                    {/* views, comments likes and date */}
                    <div className='flex flex-row gap-2'>
                        <div className="text-sm text-gray-500 flex flex-row items-center">
                            <Eye size={16} className="mr-2" />
                            <span>{post.views}</span>
                        </div>

                        <div className="text-sm text-gray-500 flex flex-row items-center">
                            <MessageCircle size={16} className="mr-2" />
                            <span>{post.comments.length}</span>
                        </div>

                        <div className="text-sm text-gray-500 flex flex-row items-center">
                            <Heart size={16} className="mr-2" />
                            <span>{post.upvotes}</span>
                        </div>

                        {post.created_at && (
                            <p className="text-sm text-gray-500 flex flex-row items-center">
                                <Clock4 size={16} className="mr-2" />   {new Date(post.created_at).toLocaleDateString()}
                            </p>
                        )}
                    </div>


                    {webnovel && (
                        <div className="flex flex-row gap-2">
                            <p className="text-sm text-gray-500">Novel: {webnovel.title} &#62;</p>
                            {post.chapter_id && (
                                <p className="text-sm text-gray-500">Chapter {post.chapter_id}</p>
                            )}
                        </div>
                    )}

                    {post.content && (<p className="text-blackdark:text-white whitespace-pre-wrap mb-2 text-start self-start">{post.content}</p>)}

                    {/* quote */}
                    {/* quote toggle */}
                    <div className="flex flex-col self-start">
                        <button
                            onClick={() => setShowQuote(!showQuote)}
                            className="text-sm text-gray-500 flex items-center gap-1"
                        >
                            <span className="transform transition-transform duration-200" style={{
                                display: 'inline-block',
                                transform: showQuote ? 'rotate(90deg)' : 'rotate(0deg)'
                            }}>
                                ▶
                            </span>
                            Quote
                        </button>

                        {post.quote && showQuote && (
                            <p className="text-black dark:text-white whitespace-pre-wrap mb-2 text-start self-start">
                                {post.quote}
                            </p>
                        )}
                    </div>


                    {post.tags && (
                        <div className="flex flex-row flex-wrap gap-2 items-center justify-start">
                            <span className="text-sm font-bold">Tags: </span>
                            {(typeof post.tags === 'string'
                                ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                                : Array.isArray(post.tags)
                                    ? post.tags
                                    : []
                            ).map((tag, index) => {
                                const colors = [
                                    'bg-pink-200',
                                    'bg-blue-200',
                                    'bg-green-200',
                                    'bg-purple-200',
                                    'bg-yellow-200',
                                    'bg-orange-200',
                                    'bg-red-200',
                                    'bg-indigo-200',
                                ];
                                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                                return (
                                    <span
                                        key={index}
                                        className={`text-sm font-base text-gray-500 dark:text-gray-500 rounded-lg border border-gray-500 ${randomColor} px-2 py-1`}
                                    >
                                        {tag}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    <hr className="w-full border-gray-500" />

                    <CommentList content={webnovel} chapter={webnovel.chapters[0]} webnovelOrWebtoon={false} />
                </div>

            </div>
        </div>
    )
}

export default ToonyzPostPage;