"use client"
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { phrase } from "@/utils/phrases";
import { X, ArrowRight } from "lucide-react";

const ApplyCreatorBanner = () => {
    const { dictionary, language } = useLanguage();
    const { isLoggedIn } = useAuth();
    const [isBannerVisible, setIsBannerVisible] = useState(true);

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault(); // Prevent the default browser navigation
        console.log("Link clicked, but it does nothing.");
    };

    const handleCloseBanner = () => {
        setIsBannerVisible(false);
    };

    if (!isBannerVisible) {
        return null;
    }

    return (
        <div className='relative max-w-screen-lg mx-auto rounded-sm h-[70px] mb-4 mt-0 z-10 bg-[#FFF0EC]'>
            <button
                onClick={handleCloseBanner}
                className="absolute z-[99] right-0 top-0 bg-white border-gray-200 border w-5 h-5 flex items-center justify-center">
                <X className="w-4 h-4 text-black" />
            </button>

            <Link onClick={handleClick} href={isLoggedIn ? '#' : '/signin'} className="block h-full">

                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-row">
                        <div className="flex flex-col justify-center items-center gap-1 text-sm font-pretendard">
                            <p className="text-black text-center font-bold">
                                {/* 투니즈의 크리에이터가 되어보세요! */}
                                {phrase(dictionary, "applyCreator", language)}
                            </p>
                            <button className="flex flex-row justify-center items-center gap-1 border-black text-black border-2 px-2 py-0 rounded-md text-sm font-pretendard self-start">
                                <span className="text-sm">
                                    {/* 지금 신청하기 */}
                                    {phrase(dictionary, "applyCreator_button", language)}
                                </span>
                                <ArrowRight className="w-4 h-4 text-black" />
                            </button>
                        </div>
                        <Image
                            src='/stelli/stelli_5.png'
                            alt='Toonyz event banner'
                            sizes="cover"
                            width={0}
                            height={0}
                            className='relative mx-auto z-10'
                            style={{
                                width: '100px',
                                height: 'auto'
                            }}
                        />
                    </div>
                </div>
            </Link>
        </div>
    )
}


export default ApplyCreatorBanner