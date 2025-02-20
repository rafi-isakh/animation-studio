import { User, ToonyzPost } from "@/components/Types";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { getImageUrl } from "@/utils/urls";

async function getUser(id: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_user_by_id?id=${id}`);
    if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData);
        return null;
    }
    const user: User = await response.json();
    return user;
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

const ToonyzPostPage = async ({ params }: { params: { id: string } }) => {
    console.log(params);
    // const user = await getUser(params.id);
    // if (!user) {
    //     return <div>User not found</div>
    // }

    const post = await getPost(params.id);
    if (!post) {
        return <div>Post not found</div>
    }

    return (
        <div className="relative md:max-w-screen-xl mx-auto w-full min-h-screen">
            <h1>Toonyz Post Page</h1>
            <p>{params.id}</p>
            <Link href={`/view_profile/${post.user.id}`}>
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
            </Link>
        </div>
    )
}

export default ToonyzPostPage;