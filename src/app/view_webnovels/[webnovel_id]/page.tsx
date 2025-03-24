"use client"
import { Webnovel, ToonyzPost } from "@/components/Types";
import ViewWebnovelsComponent from "@/components/ViewWebnovelsComponent";
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { useAuth } from "@/contexts/AuthContext";
const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});
import animationData from '@/assets/N_logo_with_heart.json';
import { useWebnovels } from "@/contexts/WebnovelsContext";
import { useSearchParams } from "next/navigation";

const ViewWebnovels = ({ params: { webnovel_id } }: { params: { webnovel_id: string } }) => {
    const [webnovel, setWebnovel] = useState<Webnovel | null>(null);
    const [userWebnovels, setUserWebnovels] = useState<Webnovel[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingUsersOtherWebnovels, setLoadingUsersOtherWebnovels] = useState(true);
    const { isLoggedIn } = useAuth();
    const { getWebnovelByIdWithContent, getWebnovelsMetadataByAuthorId, fetchChaptersLikelyNeededWebnovel } = useWebnovels();
    const searchParams = useSearchParams();
    const searchParamsObject = Object.fromEntries(searchParams.entries());
    const [posts, setPosts] = useState<ToonyzPost[]>([]);

    useEffect(() => {
        const setData = async () => {
            const webnovel = await getWebnovelByIdWithContent(webnovel_id);
            let author_id = "";
            if (webnovel) {
                setWebnovel(webnovel);
                setLoading(false);
                author_id = webnovel.author.id.toString();
            }
            if (author_id) {
                const userWebnovels = await getWebnovelsMetadataByAuthorId(author_id);
                setUserWebnovels(userWebnovels);
                setLoadingUsersOtherWebnovels(false);
            }
                
            const response = await fetch('/api/get_toonyz_posts');
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            
            const data = await response.json();
            const filteredPosts = data.filter((post: any) => 
                post.webnovel_id === webnovel?.id
            );
            
            setPosts(filteredPosts);
            setLoading(false);
            if (isLoggedIn) {
                fetch(`/api/add_to_library?webnovel_id=${webnovel_id}`)
            }
        }
        setData();
    }, [searchParams])

    return (
        <>
            {loading ? (
                <div role="status" className={`flex items-center justify-center min-h-screen`}>
                    <LottieLoader
                        animationData={animationData}
                        width="w-40"
                        centered={true}
                        pulseEffect={true}
                    />
                </div>
            ) : (
                <ViewWebnovelsComponent webnovel_id={webnovel_id} webnovel={webnovel} userWebnovels={userWebnovels} loadingUsersOtherWebnovels={loadingUsersOtherWebnovels} posts={posts} />
            )
            }
        </>
    )
}

export default ViewWebnovels;