"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Link } from "@mui/material";
import { Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function UserBlockedComponent({id}: {id: string}) {
    const { dictionary, language } = useLanguage();
    const router = useRouter();
    const handleUnblock = async () => {
        const response = await fetch(`/api/unblock_user?id=${id}`)
        if (response.ok) {
            router.refresh()
        }
    }
    return (
        <div className="flex flex-col space-y-4 items-center justify-center h-screen md:mt-[-96px] mt-[-80px]">
            <div className="flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold">{phrase(dictionary, "userBlocked", language)}</h1>
            <p className="text-lg text-gray-500">{phrase(dictionary, "userBlocked_subtitle", language)}</p>
            </div>
            <Button color='gray' variant="outlined" onClick={handleUnblock}>
                {phrase(dictionary, "unblock", language)}
            </Button>
        </div>
    )
}