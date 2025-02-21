import { User, ToonyzPost } from "@/components/Types";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
import { MoveLeft, Heart, MessageCircle, Share2, Film, Clock4, Eye } from "lucide-react";
import { IconButton } from "@mui/material";

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

const ToonyzPostPage = async ({ params }: { params: { id: string } }) => {
    const post = await getPost(params.id);
    if (!post) {
        return <div>Post not found</div>
    }

    return (
        <div className="flex flex-col md:max-w-screen-xl mx-auto w-full">
            {/* header */}
            <div className="sticky top-0 z-50 w-full bg-background backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
                <div className="flex flex-row items-center justify-between gap-2">
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
            <div className="relative w-full h-[70vh] group">
                <Image
                    src={getImageUrl(post.image)}
                    alt={post.title}
                    fill
                    className="object-cover transition-all duration-300 group-hover:blur-sm  overflow-hidden"
                />

                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white mix-blend-difference text-3xl leading-loose text-center max-w-[80%] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {post.quote}
                </p>
            </div>

            {/* Description Container */}
            <div className="flex flex-col gap-4 p-5 bg-white dark:bg-[#211F21] z-50">
                <div className="flex flex-col items-center gap-y-4">
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
                    <p className="relative -top-5 text-center text-4xl font-bold">{post.title}</p>
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

                    {post.content && (<p className="text-blackdark:text-white whitespace-pre-wrap mb-2 text-start self-start">{post.content}</p>)}

                    {post.tags && (
                        <p className="">
                          <span className="text-sm font-bold">Tags: </span>
                           
                           <span className="text-sm font-base text-black dark:text-black rounded-full border border-gray-500  bg-pink-200 px-2 py-1">
                             {typeof post.tags === 'string' 
                                ? post.tags 
                                : Array.isArray(post.tags) 
                                    ? (post.tags as string[]).join(', ') 
                                    : ''}</span>
                        </p>
                    )}

                    {post.quote && (
                        <p className="text-black dark:text-white whitespace-pre-wrap mb-2 text-start self-start">
                            {post.quote}
                        </p>
                    )}
                </div>

                {/* <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-500">Webnovel ID: {post.webnovel_id}</p>
                    <p className="text-sm text-gray-500">Chapter ID: {post.chapter_id}</p>
                </div> */}

            </div>
        </div>
    )
}

export default ToonyzPostPage;