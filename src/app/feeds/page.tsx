"use client"
import { useState, useEffect } from "react"
import { ToonyzPost } from "@/components/Types"
import { Pin } from "@/components/UI/Pin"
import Masonry from "react-masonry-css"


export default function ToonyzPosts() {
    const [posts, setPosts] = useState<ToonyzPost[]>([]);

    // useEffect(() => {
    //     fetch('/api/get_toonyz_posts')
    //         .then(res => res.json())
    //         .then(data => setPosts(data));
    // }, []);

    useEffect(() => {
        fetch('/api/get_toonyz_posts')
            .then(res => res.json())
            .then(data => {
                // Add random dimensions to each post
                const postsWithDimensions = data.map((post: Post) => ({
                    ...post,
                    ...getRandomDimensions()
                }));
                setPosts(postsWithDimensions);
            });
    }, []);


    const breakpointColumnsObj = {
        default: 5,
        1280: 4,
        1024: 3,
        768: 2,
        640: 1,
    }


    return (
        <div className="relative md:max-w-screen-xl mx-auto w-full min-h-screen">
            <main className="container p-4 mx-auto">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {posts.map((post: any) => (
                        <Pin key={post.id} post={post} />
                    ))}
                </div>
            </main>
        </div>
    )
}