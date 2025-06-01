"use client"
import { useState, useEffect, useRef } from "react"
import { ToonyzPost } from "@/components/Types"
import { Pin } from "@/components/UI/Pin"
import useSWR from "swr"
import { useLanguage } from "@/contexts/LanguageContext"

const fetcher = (url: string) => fetch(url).then(res => res.json())
const PAGE_SIZE = 10;

export default function ToonyzPosts() {
    const { language } = useLanguage()
    const { data: allPosts, error, isLoading } = useSWR('/api/get_toonyz_posts', fetcher)
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const visiblePosts = allPosts ? allPosts.slice(0, visibleCount) : [];
    const hasMore = allPosts && visibleCount < allPosts.length;

    useEffect(() => {
        if (!allPosts) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                setVisibleCount(prevCount => prevCount + PAGE_SIZE);
            }
        }, { threshold: 0.1 });

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        }
    }, [allPosts, visibleCount, hasMore]);

    if (error) return <div>Error: {error}</div>
    if (isLoading) return <div>Loading...</div>

    return (
        <div className="relative md:max-w-screen-xl mx-auto w-full min-h-screen flex flex-col items-center justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full place-items-center">
                {visiblePosts.map((post: ToonyzPost) => (
                    <Pin key={post.id} post={post} language={language} />
                ))}
            </div>
            <div ref={loadMoreRef as React.RefObject<HTMLDivElement>} />
            {!hasMore && <p>No more posts to load</p>}
        </div>
    )
}