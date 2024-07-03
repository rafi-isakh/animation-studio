"use client"

import { redirect } from "next/navigation";
import { useAuth } from '@/components/AuthContext';
import MyWebnovelsComponent from "@/components/MyWebnovelsComponent";
import { useEffect } from "react";

const MyWebnovels = () => {
    return (
        <MyWebnovelsComponent />
    )
}

export default MyWebnovels;