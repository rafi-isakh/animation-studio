"use client"
import { useEffect, useState } from "react";
import { Pin } from "@/components/UI/Pin";


export default function ToonyzPosts() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetch('/api/get_toonyz_posts')
            .then(res => res.json())
            .then(data => setPosts(data));
    }, []);

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