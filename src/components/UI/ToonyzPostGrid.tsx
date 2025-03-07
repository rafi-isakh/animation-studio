"use client"
import { useState, useRef, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { Pin } from "@/components/UI/Pin";
import { ToonyzPost } from '@/components/Types';

const breakpointColumnsObj = {
    default: 5,
    1280: 4,
    1024: 3,
    768: 2,
    640: 1,
}

interface ToonyzPostGridProps {
    initialPosts: ToonyzPost[];
    fetchMorePosts?: () => Promise<ToonyzPost[]>;
    className?: string;
}

const ToonyzPostGrid = ({ initialPosts, fetchMorePosts, className = "" }: ToonyzPostGridProps) => {
    const [posts, setPosts] = useState<ToonyzPost[]>(initialPosts);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const loadMorePosts = async () => {
        if (isLoading || !hasMore) return;
        
        setIsLoading(true);
        try {
            const newPosts = await fetchMorePosts();
            
            if (newPosts.length === 0) {
                setHasMore(false);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }
        } catch (error) {
            console.error("Error loading more posts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMorePosts();
                }
            },
            { threshold: 0.1 }
        );
        
        observerRef.current = observer;
        
        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }
        
        return () => {
            if (observerRef.current && loadMoreRef.current) {
                observerRef.current.unobserve(loadMoreRef.current);
            }
        };
    }, [hasMore, isLoading]);

    return (
        <div className={className}>
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
                    {isLoading ? (
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