"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import Link from "next/link";

const ApplyCreatorBanner = () => {
    const { dictionary, language } = useLanguage();

    return (
        <Link href='/signin' className="">
        <div className='bg-black w-full h-[3rem] mb-4 mt-0 -z-[99]'> 
        {language == 'ko' ? (
                            <>
                            <Image
                                src='/apply_creator_banner_KR.svg' 
                                alt='Toonyz event banner'
                                sizes="cover"
                                width={0}
                                height={0}
                                className='mx-auto md:block lg:block hidden hover:opacity-[0.8]'
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
                                className='relative top-[-10px] mx-auto md:hidden lg:hidden hover:opacity-[0.8]'
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
                                className='mx-auto md:block lg:block hidden hover:opacity-[0.8]'
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
                                className='relative top-[-10px] mx-auto md:hidden lg:hidden hover:opacity-[0.8]'
                                style={{
                                    width: '400px',
                                    height: 'auto'
                                }}
                                />
                            </>
                     )
                 }
        </div>
     </Link>
    )
}


export default ApplyCreatorBanner