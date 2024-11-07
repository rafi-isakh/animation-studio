"use client"
import { Webnovel } from "@/components/Types";
import ViewWebnovelsComponent from "@/components/ViewWebnovelsComponent";
import { decrypt } from "@/utils/cryptography";
import { useEffect, useState } from "react";

async function getWebnovel(id: string | string[] | undefined) {
    if (Array.isArray(id)) {
        throw new Error("there should be just one id")
    } if (id == undefined) {
        return null;
    }
    try {
        const webnovelResponse = await fetch(`/api/get_webnovel_by_id?id=${id}`);
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

async function getUserWebnovels(email: string) {
    const decryptedEmail = await decrypt(email); // necessary because email comes from webnovel.user.email, which is retrieved from db (encrypted)
    const response = await fetch(`/api/get_webnovels_by_email?email=${decryptedEmail}`);
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
    useEffect(() => {
        const fetchData = async () => {
            const webnovel = await getWebnovel(searchParams.id);
            if (webnovel) {
                setWebnovel(webnovel);
                const { email: author_email, nickname: user_nickname } = webnovel.user;
                
                const userWebnovels = await getUserWebnovels(author_email);
                setUserWebnovels(userWebnovels);

                await fetch(`/api/add_to_library?webnovel_id=${searchParams.id}`)
            }
        }
        fetchData();
    }, [])
    return (
        <ViewWebnovelsComponent searchParams={searchParams} webnovel={webnovel} userWebnovels={userWebnovels} />
    )
}

export default ViewWebnovels;