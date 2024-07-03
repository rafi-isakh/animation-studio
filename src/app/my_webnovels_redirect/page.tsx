"use client"

import { redirect, useRouter } from "next/navigation";
import { useAuth } from '@/components/AuthContext';
import MyWebnovelsComponent from "@/components/MyWebnovelsComponent";
import { useEffect } from "react";
import { Webnovel } from "@/components/Types";

const MyWebnovelsRedirect = () => {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    useEffect(() => {
        fetch(`http://localhost:5000/api/get_webnovel_byuser?user_email=${email}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const ids = data.map((w: Webnovel) => w.id);
                    const first = Math.min(...ids)
                    router.push(`/my_webnovels?id=${first}`)
                }
            })
    }, [isLoggedIn])
}

export default MyWebnovelsRedirect;