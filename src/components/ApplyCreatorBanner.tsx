"use client"
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

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
        <div className='relative bg-black w-full h-[3rem] mb-4 mt-0 z-10'> 
            <button 
                onClick={handleCloseBanner}
                className="absolute right-0 top-0 bg-white border-gray-200 border w-6 h-6 flex items-center justify-center">
                 <X className="w-4 h-4 text-black" />
            </button>

            <Link onClick={handleClick} href={isLoggedIn? '#': '/signin'} className="block h-full">
                   {language == 'ko' ? (
                            <>
                            <Image
                                src='/apply_creator_banner_KR.svg' 
                                alt='Toonyz event banner'
                                sizes="cover"
                                width={0}
                                height={0}
                                className='relative top-[-2px] mx-auto md:block lg:block hidden hover:opacity-[0.8]'
                                style={{
                                    width: '400px',
                                    height: 'auto'
                                }}
                                />
                            <Image
                                src='/apply_creator_banner_mobile_KR.svg' 
                                alt='Toonyz event banner'
                                sizes="cover"
                                width={0}
                                height={0}
                                className='relative top-[-12px] mx-auto md:hidden lg:hidden hover:opacity-[0.8]'
                                style={{
                                    width: '400px',
                                    height: 'auto'
                                }}
                                />
                             </>
                               ) 
                             : (
                                <>
                                <Image
                                src='/apply_creator_banner_EN.svg' 
                                alt='Toonyz event banner'
                                sizes="cover"
                                width={0}
                                height={0}
                                className='relative top-[-2px] mx-auto md:block lg:block hidden hover:opacity-[0.8]'
                                style={{
                                    width: '400px',
                                    height: 'auto'
                                }}
                            />
                                <Image
                                src='/apply_creator_banner_mobile_EN.svg' 
                                alt='Toonyz event banner'
                                sizes="cover"
                                width={0}
                                height={0}
                                className='relative top-[-12px] mx-auto md:hidden lg:hidden hover:opacity-[0.8]'
                                style={{
                                    width: '400px',
                                    height: 'auto'
                                }}
                                />
                            </>
                     )
                 }
            </Link>
        </div>
    )
}


export default ApplyCreatorBanner