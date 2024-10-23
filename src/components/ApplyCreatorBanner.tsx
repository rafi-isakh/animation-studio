"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import Link from "next/link";

const ApplyCreatorBanner = () => {
    const { dictionary, language } = useLanguage();

    return (
        <div className='bg-black w-full h-[3rem] mb-4'>
        <Link href='/signin'>
        {language == 'ko' ? (
                            <Image
                                src='/apply_creator_banner_KR.svg' 
                                alt='Toonyz event banner'
                                sizes="cover"
                                width={0}
                                height={0}
                                className='relative md:-top-[19px] top-1 mx-auto'
                                style={{
                                    width: '1280px',
                                    height: 'auto'
                                }}
                                />
                               ) 
                             : (
                                <Image
                                src='/apply_creator_banner_EN.svg' 
                                alt='Toonyz event banner'
                                sizes="cover"
                                width={0}
                                height={0}
                                className='relative md:-top-[19px] top-1 mx-auto'
                                style={{
                                    width: '1280px',
                                    height: 'auto'
                                }}
                            />
                          )
                 }
            </Link>
        </div>
    )
}


export default ApplyCreatorBanner