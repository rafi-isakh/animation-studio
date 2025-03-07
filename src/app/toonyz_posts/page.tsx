"use client"
import { useEffect, useState, useCallback } from "react";
import { Pin } from "@/components/UI/Pin";
import Masonry from "react-masonry-css"
import { ToonyzPost } from "@/components/Types";

function getRandomDimensions() {
    const widths = [900, 1000, 1200]
    const heights = [1000, 1200, 1400, 1600]
    return {
        width: widths[Math.floor(Math.random() * widths.length)],
        height: heights[Math.floor(Math.random() * heights.length)],
    }
}

export default function ToonyzPosts() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchPosts = useCallback(async () => {
        const response = await fetch(`/api/get_toonyz_posts`);
        const data = await response.json();
        return data;
    }, []);

    const loadMorePosts = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const newPosts = await fetchPosts();
            if (newPosts.length === 0) {
                setHasMore(false);
            } else {
                // Add random dimensions to each new post
                const postsWithDimensions = newPosts.map((post: ToonyzPost) => ({
                    ...post,
                    ...getRandomDimensions()
                }));

                // Filter out posts with duplicate IDs
                const uniquePosts = postsWithDimensions.filter(
                    (newPost: ToonyzPost) => !posts.some((existingPost: ToonyzPost) => existingPost.id === newPost.id)
                );

                setPosts(prev => [...prev, ...uniquePosts]);
            }
        } catch (error) {
            console.error('Error loading more posts:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchPosts, loading, hasMore, posts]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop + 100 >= document.documentElement.offsetHeight) {
                loadMorePosts();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMorePosts]);

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
                    {posts.map((post: ToonyzPost, index: number) => (
                        <Pin key={post.id} post={post} isLastItem={index === posts.length - 1} onView={loadMorePosts} />
                    ))}
                </Masonry>
            </main>
        </div>
    )
}
