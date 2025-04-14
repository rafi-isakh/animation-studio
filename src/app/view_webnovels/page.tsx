"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function ViewWebnovels() {
    const { dictionary, language } = useLanguage();
    const router = useRouter();
    return (
        <div className="md:max-w-screen-lg w-full flex flex-row justify-center mx-auto h-screen md:mt-[-96px] mt-[-80px]">
            <div className="flex flex-col justify-center items-center">
                <div className="flex flex-col justify-center items-center space-y-2">
                    <Image src="/stelli/stelli_3.png" alt="noWebnovelsFound" width={150} height={100} />
                    <p className="pt-3 text-md font-bold"> {phrase(dictionary, "noWebnovelsFound", language)} </p>

                    <Button onClick={() => {
                        router.push("/new_webnovel");
                    }} className="bg-[#8A2BE2] text-md text-white px-4 py-2 rounded-md mb-10 ">
                        {/* 보고 있는 웹소설이 없습니다.  */}
                        {/*  (8A2BE2) */}
                        {phrase(dictionary, "writeYourStory", language)}
                    </Button>
                </div>
            </div>
        </div>
    )
}