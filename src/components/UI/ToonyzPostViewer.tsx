'use client'
import { useEffect, useState } from "react";
import ToonyzPostGrid from "@/components/UI/ToonyzPostGrid";
import { ToonyzPost, Language, Dictionary } from "@/components/Types";
import { ScrollArea, ScrollBar } from "@/components/shadcnUI/ScrollArea";


function getRandomDimensions() {
    const widths = [900, 1000, 1200]
    const heights = [1000, 1200, 1400, 1600]
    return {
        width: widths[Math.floor(Math.random() * widths.length)],
        height: heights[Math.floor(Math.random() * heights.length)],
    }
}

const ToonyzPostViewer = ({ posts, language, dictionary }: { posts: ToonyzPost[], language: Language, dictionary: Dictionary }) => {
    const [toonyzPosts, setToonyzPosts] = useState<ToonyzPost[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        console.log("Received posts:", posts);

        if (!posts || posts.length === 0) {
            console.log("No posts received or empty array");
            setInitialLoading(false);
            return;
        }

        const postsWithDimensions = posts.map((post: ToonyzPost) => ({
            ...post,
            ...getRandomDimensions()
        }));
        console.log("Posts with dimensions:", postsWithDimensions);
        setToonyzPosts(postsWithDimensions);
        setInitialLoading(false);
    }, [posts]);


    return (
        <div className="relative w-full overflow-x-auto">
            <main className="relative  px-4 py-8 w-full">
                {initialLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="loader h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-blue-500 animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-8">
                        {error}
                    </div>
                ) : (
                    <ScrollArea className="w-full h-screen overflow-y-auto whitespace-nowrap">
                        <div className="flex gap-2 p-2">
                            <ToonyzPostGrid posts={toonyzPosts} language={language} dictionary={dictionary} />
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                )}
        </main>
        </div >
    )
}

export default ToonyzPostViewer;