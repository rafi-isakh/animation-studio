"use client"
import { useEffect, useState, useCallback } from "react";
import ToonyzPostGrid from "@/components/UI/ToonyzPostGrid";
import { ToonyzPost } from "@/components/Types";
import dynamic from "next/dynamic";
const LottieLoader = dynamic(() => import("@/components/LottieLoader"), {
    ssr: false,
});
import animationData from "@/assets/N_logo_with_heart.json";


function getRandomDimensions() {
    const widths = [900, 1000, 1200]
    const heights = [1000, 1200, 1400, 1600]
    return {
        width: widths[Math.floor(Math.random() * widths.length)],
        height: heights[Math.floor(Math.random() * heights.length)],
    }
}


export default function ToonyzPosts() {
    const [initialPosts, setInitialPosts] = useState<ToonyzPost[]>([]);
    const [additionalPosts, setAdditionalPosts] = useState<ToonyzPost[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/get_toonyz_posts')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch posts');
                }
                return res.json();
            })
            .then(data => {
                // Add random dimensions to each post
                const postsWithDimensions = data.map((post: ToonyzPost) => ({
                    ...post,
                    ...getRandomDimensions()
                }));
                setInitialPosts(postsWithDimensions);
                setInitialLoading(false);
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
                setError('Failed to load posts. Please try again later.');
                setInitialLoading(false);
            });
    }, []);


    return (
        <div className="relative md:max-w-screen-xl mx-auto w-full min-h-screen">
            <main className="relative md:max-w-screen-xl w-full mx-auto px-4 py-8">
                {initialLoading ? (
                    <div className="loader-container flex justify-center items-center h-48">
                        <LottieLoader width="w-40" centered={true} animationData={animationData} />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-8">
                        {error}
                    </div>
                ) : (
                    <ToonyzPostGrid posts={initialPosts} />
                )}
            </main>
        </div>
    );
}
