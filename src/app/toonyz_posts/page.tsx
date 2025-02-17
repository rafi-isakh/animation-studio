"use client"
import { useEffect, useState } from "react";
import Image from "next/image";
import { getImageUrl } from "@/utils/urls";

export default function ToonyzPosts() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetch('/api/get_toonyz_posts')
            .then(res => res.json())
            .then(data => setPosts(data));
    }, []);

    return (
        <div className="max-w-screen-lg mx-auto w-full flex flex-col gap-4">
            {posts.map((post: any) => (
                <div key={post.id} className="grid grid-cols-2 gap-4">
                    <div>
                        <Image src={getImageUrl(post.image)} alt={post.title} width={100} height={100} />
                        <h2 className="text-2xl font-bold">{post.title}</h2>
                        <p className="text-sm text-gray-500">{post.content}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}