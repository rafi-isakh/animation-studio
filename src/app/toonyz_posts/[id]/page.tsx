"use client"
import { User, ToonyzPost, Webnovel } from "@/components/Types";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import { MoveLeft, Heart, MessageCircle, Share2, Film, Clock4, Eye } from "lucide-react";
import { Button } from "@/components/shadcnUI/Button"
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "@/components/shadcnUI/Popover";

import { useWebnovels } from '@/contexts/WebnovelsContext';
import Masonry from 'react-masonry-css';
import { Pin } from "@/components/UI/Pin";
import CommentsComponent from "@/components/CommentsComponent";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import WatermarkedImage from "@/utils/watermark";

const breakpointColumnsObj = {
    default: 5,
    1280: 4,
    1024: 3,
    768: 2,
    640: 1,
}


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

function getRandomDimensions() {
    const widths = [900, 1000, 1200]
    const heights = [1000, 1200, 1400, 1600]
    return {
        width: widths[Math.floor(Math.random() * widths.length)],
        height: heights[Math.floor(Math.random() * heights.length)],
    }
}

const ToonyzLogo = () => {
    return <Image src="/toonyz_logo_pink.svg" alt="Toonyz Logo" width={100} height={30} />
}

const ToonyzPostPage = ({ params }: { params: { id: string } }) => {
    // const post = await getPost(params.id);
    const [post, setPost] = useState<ToonyzPost | undefined>(undefined);
    const [allPosts, setAllPosts] = useState<ToonyzPost[] | undefined>(undefined);
    const { getWebnovelById } = useWebnovels();
    const [webnovel, setWebnovel] = useState<Webnovel | undefined>(undefined);
    const quoteRef = useRef<HTMLParagraphElement>(null);
    const arrowRef = useRef<HTMLSpanElement>(null);


    useEffect(() => {
        const fetchWebnovel = async () => {
            if (post?.webnovel_id) {
                const novel = await getWebnovelById(post.webnovel_id);
                setWebnovel(novel);
            }
        };
        fetchWebnovel();
    }, [post?.webnovel_id]);


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

    useEffect(() => {
        fetch('/api/get_toonyz_posts')
            .then(res => res.json())
            .then(data => {
                // Add random dimensions to each post
                const postsWithDimensions = data.map((post: ToonyzPost) => ({
                    ...post,
                    ...getRandomDimensions()
                }));
                setAllPosts(postsWithDimensions);
            });
    }, []);

    const truncateText = (text: string, maxLength: number = 15) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    const toggleQuote = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (quoteRef.current && arrowRef.current) {
            if (quoteRef.current.classList.contains('max-h-0')) {
                quoteRef.current.classList.remove('max-h-0', 'opacity-0', 'overflow-hidden');
                quoteRef.current.classList.add('max-h-[1000px]', 'opacity-100');
                arrowRef.current.style.transform = 'rotate(90deg)';
            } else {
                quoteRef.current.classList.remove('max-h-[1000px]', 'opacity-100');
                quoteRef.current.classList.add('max-h-0', 'opacity-0', 'overflow-hidden');
                arrowRef.current.style.transform = 'rotate(0deg)';
            }
        }
    }, []);

    if (!post) {
        return <></>
    }

    return (
        <div className="flex flex-col mx-auto w-full min-h-screen">
            {/* header fixed */}
            <div className="fixed top-0 z-[99] w-full mx-auto bg-background backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
                <div className="flex flex-row items-center justify-between gap-2 md:px-5 px-4 md:max-w-screen-xl mx-auto">
                    <Link href="/feeds" className="self-start my-5 flex flex-row items-center gap-2">
                        <MoveLeft size={20} className='dark:text-white text-gray-500' />
                        <p className="text-sm font-base">Back</p>
                    </Link>
                    {/* <p className="text-2xl font-bold">{post.title}</p> */}
                    <Popover >
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                            // className="bg-[#DE2B74]"
                            >
                                <Share2 size={20} className="dark:text-white text-gray-500 z-10" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-24">
                            <p>Share</p>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Image Container */}
            <div className="relative md:max-w-screen-xl mx-auto w-full h-screen group mt-14 md:mt-14 ">
                {/* top margin is 14 */}
                {post.image ? (
                    <WatermarkedImage
                        imageUrl={getImageUrl(post.image)}
                        watermarkUrl="/toonyz_logo_pink.svg"
                        webnovelTitle={webnovel?.title}
                        chapterTitle={webnovel?.chapters.find(chapter => chapter.id.toString() === post.chapter_id)?.title || post.chapter_id}
                        watermarkOpacity={0.2}
                        watermarkPosition="centerRight"
                        titlePosition="centerLeft"
                        titleColor="white"
                        className="object-cover overflow-hidden scale-125 transition-all duration-300 group-hover:blur-sm"
                    />
                ) : (
                    <div className="relative group h-full mt-14 md:mt-14">
                        <video
                            src={getVideoUrl(post.video)}
                            muted
                            loop
                            autoPlay
                            className="w-full h-full object-cover scale-125 transition-transform duration-200  pt-14 md:pt-14 overflow-hidden"
                        />
                    </div>
                )}
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white mix-blend-difference font-bold text-lg md:text-3xl leading-loose text-center max-w-[80%] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {/*TODO: this translation should actually come from the novel. It shouldn't be a new translation.*/}
                    <OtherTranslateComponent content={post.quote!} elementId={post.id.toString()} elementType="toonyz_post" elementSubtype="quote" />
                </p>
            </div>

            {/* Description Container */}
            <div className="w-full flex flex-col gap-4 p-5 bg-white dark:bg-[#211F21] sticky bottom-0 z-50">
                <div className="md:max-w-screen-md mx-auto w-full flex flex-col items-center gap-y-5">
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
                    <p className="relative -top-5 text-center text-xl md:text-4xl font-bold">
                        <OtherTranslateComponent content={post.title} elementId={post.id.toString()} elementType="toonyz_post" elementSubtype="title" />
                    </p>
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
                                <p className="text-sm text-gray-500">
                                    Chapter {webnovel.chapters.find(chapter => chapter.id.toString() === post.chapter_id)?.title || post.chapter_id}
                                </p>
                            )}
                        </div>
                    )}

                    {post.content && (<p className="text-blackdark:text-white whitespace-pre-wrap mb-2 text-start self-start">
                        <OtherTranslateComponent content={post.content} elementId={post.id.toString()} elementType="toonyz_post" elementSubtype="content" />
                    </p>)}

                    {/* quote */}
                    {/* quote toggle */}
                    <div className="flex flex-col self-start">
                        <button
                            type="button"
                            onClick={toggleQuote}
                            className="text-sm text-gray-500 flex items-center gap-1 cursor-pointer"
                        >
                            <span
                                ref={arrowRef}
                                className="transform transition-transform duration-200"
                                style={{
                                    display: 'inline-block',
                                    transform: 'rotate(0deg)'
                                }}
                            >
                                ▶
                            </span>
                            Quote
                        </button>

                        {post.quote && (
                            <p
                                ref={quoteRef}
                                className="text-black dark:text-white whitespace-pre-wrap mb-2 text-start self-start transition-opacity duration-300 max-h-0 opacity-0 overflow-hidden"
                            >
                                <OtherTranslateComponent content={post.quote!} elementId={post.id.toString()} elementType="toonyz_post" elementSubtype="quote" />
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

                    <CommentsComponent contentToAttachTo={post} webnovelOrPost={true} addCommentEnabled={true} />
                </div>
                <div className="h-[10vh]" />
                <div className="relative md:max-w-screen-xl w-full mx-auto px-4 py-8">
                    {/* reusable component for the feed */}
                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="my-masonry-grid flex w-auto -ml-4 gap-5"
                        columnClassName="my-masonry-grid_column pl-4 bg-clip-padding"
                    >
                        {allPosts?.map((post: any) => (
                            <Pin key={post.id} post={post} />
                        ))}
                    </Masonry>
                </div>
            </div>
        </div>
    )
}

export default ToonyzPostPage;