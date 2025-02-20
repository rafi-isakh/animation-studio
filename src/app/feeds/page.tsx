"use client"
import { useState, useEffect } from "react"
import { ToonyzPost } from "@/components/Types"
import { Pin } from "@/components/UI/Pin"
import Masonry from "react-masonry-css"

function getRandomDimensions() {
    const widths = [600, 400, 500, 700]
    const heights = [600, 700, 800]
    return {
        width: widths[Math.floor(Math.random() * widths.length)],
        height: heights[Math.floor(Math.random() * heights.length)],
    }
}

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
                const postsWithDimensions = data.map((post: ToonyzPost) => ({
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
        640: 2,
    }


    return (
        <div className="relative md:max-w-screen-xl mx-auto w-full min-h-screen">
            <main className="relative md:max-w-screen-xl w-full mx-auto px-4 py-8">
                <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="my-masonry-grid flex w-auto -ml-4 gap-5"
                    columnClassName="my-masonry-grid_column pl-4 bg-clip-padding"
                >
                    {posts.map((post: any) => (
                        <Pin key={post.id} post={post} />
                    ))}
                </Masonry>
            </main>
        </div>
    )
}