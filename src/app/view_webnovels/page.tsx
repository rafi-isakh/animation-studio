"use client"
import { Webnovel } from "@/components/Types";
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

const getWebnovelWithContentById = async (id: string) => {
    const response = await fetch(`/api/get_webnovel_by_id?id=${id}`)
    if (!response.ok) {
        throw new Error("Failed to fetch webnovel")
    }
    const data = await response.json();
    return data;
};

const ViewWebnovels = () => {
    const [webnovel, setWebnovel] = useState<Webnovel | null>(null);
    const [userWebnovels, setUserWebnovels] = useState<Webnovel[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingUsersOtherWebnovels, setLoadingUsersOtherWebnovels] = useState(true);
    const { isLoggedIn } = useAuth();
    const { getWebnovelById, getWebnovelsMetadataByUserId, fetchChaptersLikelyNeededWebnovel } = useWebnovels();
    const searchParams = useSearchParams();
    const searchParamsObject = Object.fromEntries(searchParams.entries());

    useEffect(() => {
        const setData = async () => {
            const webnovel = await getWebnovelById(searchParams.get("id")!);
            let author_id = "";
            if (webnovel) {
                setWebnovel(webnovel);
                setLoading(false);
                author_id = webnovel.user.id.toString();
                fetchChaptersLikelyNeededWebnovel(webnovel);
            }
            if (author_id) {
                const userWebnovels = await getWebnovelsMetadataByUserId(author_id);
                setUserWebnovels(userWebnovels);
                setLoadingUsersOtherWebnovels(false);
            }
            setLoading(false);
            if (isLoggedIn) {
                fetch(`/api/add_to_library?webnovel_id=${searchParams.get("id")}`)
            }
        }
        setData();
    }, [searchParams])

    return (
        <>
        {loading? (
               <div role="status" className={`flex items-center justify-center min-h-screen`}>    
                   <LottieLoader 
                       animationData={animationData}
                       width="w-40"
                       centered={true}
                       pulseEffect={true}
                   />
               </div>
           ) : (
            <ViewWebnovelsComponent searchParams={searchParamsObject} webnovel={webnovel} userWebnovels={userWebnovels} loadingUsersOtherWebnovels={loadingUsersOtherWebnovels} />
           )
        }
        </>
    )
}

export default ViewWebnovels;