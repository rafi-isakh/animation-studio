"use client"

import { redirect } from "next/navigation";
import { useAuth } from '@/components/AuthContext';
import MyWebnovelsComponent from "@/components/MyWebnovelsComponent";
import { useEffect } from "react";

const MyWebnovels = () => {

    const { isLoggedIn } = useAuth();
    if (isLoggedIn) {
        useEffect(() => {
            if (!isLoggedIn) {
                redirect('/signin');
            }
        })
        return (
            <MyWebnovelsComponent />
        )
    }
    return (
        <div></div>
    )
}

export default MyWebnovels;