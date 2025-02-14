"use client"
import { Webnovel } from "@/components/Types";
import ViewWebnovelsComponent from "@/components/ViewWebnovelsComponent";
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { useAuth } from "@/contexts/AuthContext";
const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
  });
import animationData from '@/assets/stelli_loader.json';

async function getWebnovel(id: string | string[] | undefined) {
    if (Array.isArray(id)) {
        throw new Error("there should be just one id")
    } if (id == undefined) {
        return null;
    }
    try {
        const webnovelResponse = await fetch(`/api/get_webnovel_metadata_by_id?id=${id}`);
        if (!webnovelResponse.ok) {
            console.error("Failed to fetch webnovel")
            return null;
        }
        const data = await webnovelResponse.json();
        return data;
    } catch {
        console.error(`Error fetching webnovel ${id}`)
    }
}

async function getUserWebnovels(email_hash: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_metadata_by_email_hash?email_hash=${email_hash}`);
    if (!response.ok) {
        console.error("Failed to fetch webnovels");
        return null;
    }
    const data = await response.json();
    return data;
}

const ViewWebnovels = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const [webnovel, setWebnovel] = useState<Webnovel | null>(null);
    const [userWebnovels, setUserWebnovels] = useState<Webnovel[] | null>(null);
    const [loading, setLoading] = useState(true);
<<<<<<< Updated upstream
    const [loadingUsersOtherWebnovels, setLoadingUsersOtherWebnovels] = useState(true);
=======
    const { isLoggedIn } = useAuth();
>>>>>>> Stashed changes

    useEffect(() => {
        const fetchData = async () => {
            const webnovel = await getWebnovel(searchParams.id);
            if (webnovel) {
                setWebnovel(webnovel);
                setLoading(false);
            }
            const { email_hash: author_email_hash } = webnovel.user;
            if (author_email_hash) {
                const userWebnovels = await getUserWebnovels(author_email_hash);
                setUserWebnovels(userWebnovels);
                setLoadingUsersOtherWebnovels(false);
            }
<<<<<<< Updated upstream
            fetch(`/api/add_to_library?webnovel_id=${searchParams.id}`)
=======
            setLoading(false);
            if (isLoggedIn) {
                fetch(`/api/add_to_library?webnovel_id=${searchParams.id}`)
            }
>>>>>>> Stashed changes
        }
        fetchData();
    }, [searchParams.id])

    return (
        <>
        {loading? (
               <div role="status" className={`flex items-center justify-center min-h-screen`}>    
                   <LottieLoader 
                       animationData={animationData}
                       width="w-32"
                       centered={true}
                       pulseEffect={true}
                   />
               </div>
           ) : (
               <ViewWebnovelsComponent searchParams={searchParams} webnovel={webnovel} userWebnovels={userWebnovels} loadingUsersOtherWebnovels={loadingUsersOtherWebnovels} />
           )
        }
        </>
    )
}

export default ViewWebnovels;