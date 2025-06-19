"use client"
import { Webnovel, ToonyzPost, Chapter } from "@/components/Types";
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
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ViewWebnovels = ({ params: { webnovel_id } }: { params: { webnovel_id: string } }) => {
    const [webnovel, setWebnovel] = useState<Webnovel | null>(null);
    const [userWebnovels, setUserWebnovels] = useState<Webnovel[] | null>(null);
    const [loadingUsersOtherWebnovels, setLoadingUsersOtherWebnovels] = useState(true);
    const { isLoggedIn } = useAuth();
    const { getWebnovelMetadataById, getWebnovelsMetadataByAuthorId, getChaptersMetadataByWebnovelId } = useWebnovels();
    const searchParams = useSearchParams();
    const [posts, setPosts] = useState<ToonyzPost[]>([]);
    const { data, error, isLoading } = useSWR('/api/get_toonyz_posts', fetcher);

    useEffect(() => {
        const setData = async () => {
            const webnovel = await getWebnovelMetadataById(webnovel_id);
            if (!webnovel) return;

            setWebnovel(webnovel); // Set basic metadata immediately

            const author_id = webnovel.author.id.toString();
            getChaptersMetadataByWebnovelId(webnovel_id, 10, 0)
                .then(chapters => {
                    if (chapters) {
                        setWebnovel(prev => prev ? { ...prev, chapters } : prev);
                    }
                })
                .catch(err => console.error("Error loading chapters:", err));

            getWebnovelsMetadataByAuthorId(author_id)
                .then(userWebnovels => {
                    setUserWebnovels(userWebnovels);
                    setLoadingUsersOtherWebnovels(false);
                })
                .catch(err => console.error("Error loading author webnovels:", err));

            fetch('/api/get_toonyz_posts')
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch posts');
                    return response.json();
                })
                .then(data => {
                    const filteredPosts = data.filter((post: any) =>
                        post.webnovel_id === webnovel.id
                    );
                    setPosts(filteredPosts);
                })
                .catch(err => console.error("Error fetching posts:", err));

            if (isLoggedIn) {
                fetch(`/api/add_to_library?webnovel_id=${webnovel_id}`)
                    .catch(err => console.error("Error adding to library:", err));
            }
        };

        setData();
    }, [searchParams]);


    if (isLoading) {
        return (
            <div role="status" className={`flex items-center justify-center min-h-screen`}>
                <LottieLoader
                    animationData={animationData}
                    width="w-40"
                    centered={true}
                    pulseEffect={true}
                />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Error: {error.message}</p>
            </div>
        )
    }

    return (
        <ViewWebnovelsComponent webnovel_id={webnovel_id} webnovel={webnovel} userWebnovels={userWebnovels} loadingUsersOtherWebnovels={loadingUsersOtherWebnovels} posts={posts} />
    )
}

export default ViewWebnovels;