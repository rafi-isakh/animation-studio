"use client"
import { useState, useRef, useEffect, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import { Pin } from "@/components/UI/Pin";
import { ToonyzPost } from '@/components/Types';

function getRandomDimensions() {
    const widths = [900, 1000, 1200]
    const heights = [1000, 1200, 1400, 1600]
    return {
        width: widths[Math.floor(Math.random() * widths.length)],
        height: heights[Math.floor(Math.random() * heights.length)],
    }
}

const breakpointColumnsObj = {
    default: 5,
    1280: 4,
    1024: 3,
    768: 2,
    640: 1,
}

interface ToonyzPostGridProps {
    initialPosts?: ToonyzPost[];
    className?: string;
    key?: string;
}

const ToonyzPostGrid = ({ initialPosts, className = "", key }: ToonyzPostGridProps) => {
    const [posts, setPosts] = useState<ToonyzPost[]>(initialPosts || []);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    // TODO: add infinite scroll 
    //
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

    return (
        <div key={key} className={className}>
            <Masonry
                breakpointCols={breakpointColumnsObj}
                className="my-masonry-grid flex w-auto -ml-4 gap-5"
                columnClassName="my-masonry-grid_column pl-4 bg-clip-padding"
            >
                {posts.map((post) => (
                    <Pin key={post.id} post={post} />
                ))}
            </Masonry>

            {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                    {loading ? (
                        <div className="loader h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-blue-500 animate-spin"></div>
                    ) : (
                        <div className="h-10" />
                    )}
                </div>
            )}
        </div>
    );
};

export default ToonyzPostGrid;