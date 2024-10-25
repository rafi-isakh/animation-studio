"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import Link from "next/link";

const ApplyCreatorBanner = () => {
    const { dictionary, language } = useLanguage();

    return (
        <div className='bg-black w-full h-[3rem] mb-4 mt-2 max-[520px]:mt-[10px]'> 
        {/*  <div className='flex justify-center self-center'>  */}
        <Link href='/signin'>
        {language == 'ko' ? (
                            <>
                            <Image
                                src='/apply_creator_banner_KR.svg' 
                                alt='Toonyz event banner'
                                sizes="cover"
                                width={0}
                                height={0}
                                className='relative md:-top-[19px] top-1 mx-auto md:block lg:block hidden hover:opacity-[0.8]'
                                style={{
                                    width: '1280px',
                                    height: 'auto'
                                }}
                                />
                            <Image
                                src='/apply_creator_banner_mobile_KR.svg' 
                                alt='Toonyz event banner'
                                sizes="cover"
                                width={0}
                                height={0}
                                className='relative w-full md:-top-[19px] -top-[17px] max-[430px]:-top-[15px] max-[400px]:-top-[10px] max-[520px]:-top-[22px] mx-auto md:hidden lg:hidden hover:opacity-[0.8]'
                                style={{
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
                                className='relative md:-top-[19px] top-1 mx-auto md:block lg:block hidden hover:opacity-[0.8]'
                                style={{
                                    width: '1280px',
                                    height: 'auto'
                                }}
                            />
                                <Image
                                src='/apply_creator_banner_mobile_EN.svg' 
                                alt='Toonyz event banner'
                                sizes="cover"
                                width={0}
                                height={0}
                                className='relative md:-top-[19px] -top-[18px] mx-auto md:hidden lg:hidden hover:opacity-[0.8]'
                                style={{
                                    width: '450px',
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