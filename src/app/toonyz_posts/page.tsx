"use client"
import { useEffect, useState } from "react";
import { Pin } from "@/components/UI/Pin";
import Masonry from "react-masonry-css"

interface Post {
    id: number;
    width: number;
    height: number;
    [key: string]: any;
}

function getRandomDimensions() {
    const widths = [300, 400, 500]
    const heights = [300, 400, 500, 600, 700]
    return {
        width: widths[Math.floor(Math.random() * widths.length)],
        height: heights[Math.floor(Math.random() * heights.length)],
    }
}

export default function ToonyzPosts() {
    const [posts, setPosts] = useState([]);

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


// <style>{`
//     .my-masonry-grid {
//         display: flex;
//         margin-left: -30px;  /* gutter size offset */
//         width: auto;
//     }
//     .my-masonry-grid_column {
//         padding-left: 30px; /* gutter size */
//         background-clip: padding-box;
//     }

//     /* Optional: Add vertical gap between items */
//     .my-masonry-grid_column > div {
//         margin-bottom: 16px; /* Adjust this value to control vertical spacing */
//     }
//   `}</style>