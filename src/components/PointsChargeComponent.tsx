"use client"
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from "@/utils/phrases"
import { IoStar } from "react-icons/io5";


export default function PointsChargeComponent() {
    const {dictionary, language} = useLanguage();

    return (
        <div className="flex flex-col items-center mx-auto justify-center h-96">
            <h1 className="text-2xl font-bold">준비중입니다.</h1>
        </div>
    )
}