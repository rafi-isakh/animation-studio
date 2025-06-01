"use client"
import { useEffect, useState } from "react";
import ToonyzPostGrid from "@/components/UI/ToonyzPostGrid";
import { ToonyzPost } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import useSWR from "swr";
import dynamic from "next/dynamic";
const LottieLoader = dynamic(() => import("@/components/LottieLoader"), {
    ssr: false,
});
import animationData from "@/assets/N_logo_with_heart.json";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getRandomDimensions() {
    const widths = [900, 1000, 1200]
    const heights = [1000, 1200, 1400, 1600]
    return {
        width: widths[Math.floor(Math.random() * widths.length)],
        height: heights[Math.floor(Math.random() * heights.length)],
    }
}

export default function ToonyzPosts() {
    const { language, dictionary } = useLanguage();
    const [initialPosts, setInitialPosts] = useState<ToonyzPost[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { data, error: fetchError, isLoading } = useSWR('/api/get_toonyz_posts', fetcher);

    useEffect(() => {
        if (data) {
            const postsWithDimensions = data.map((post: ToonyzPost) => ({
                ...post,
                ...getRandomDimensions()
            }));
            setInitialPosts(postsWithDimensions);
        } else if (fetchError) {
            setError('Failed to load posts. Please try again later.');
        }
    }, [data, fetchError]);


    if (isLoading) {
        return (
            <div className="loader-container flex justify-center items-center h-48">
                <LottieLoader width="w-40" centered={true} animationData={animationData} />
            </div>
        );
    }
    if (error) {
        return (
            <div className="text-center text-red-500 py-8">
                {error}
            </div>
        );
    }
    return (
        <div className="relative md:max-w-screen-xl mx-auto w-full min-h-screen">
            <ToonyzPostGrid posts={initialPosts} language={language} dictionary={dictionary} />
        </div>
    );
}
