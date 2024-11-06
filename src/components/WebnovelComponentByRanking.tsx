import { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getCloudfrontImageURL } from "@/utils/cloudfront"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { Oleo_Script_Swash_Caps } from 'next/font/google'
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases'
import { Card, useMediaQuery } from "@mui/material"
import { TrendingUp } from 'lucide-react'
const oleoScriptSwashCaps = Oleo_Script_Swash_Caps({ subsets: ['latin'], weight: '400' })

const WebnovelComponentByRanking = ({ webnovel, index, ranking }: { webnovel: Webnovel, index: number, ranking: boolean }) => {
   
    const imageSrc = getCloudfrontImageURL(webnovel.cover_art);
    const [key, setKey] = useState(0);
    const { language, dictionary } = useLanguage();
    const isMediumScreen = useMediaQuery('(min-width:768px)')

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language, webnovel])

    return (
         <Link href={`/view_webnovels?id=${webnovel.id}`}>
           <div className="group relative flex flex-col items-center w-[100px] md:w-[240px]">
                 {/* Image Container with Ranking Overlay */}
                 <div className="relative shrink-0 w-[83px] h-[135px] md:w-[240px] md:h-[380px] md:aspect-[3/4] overflow-hidden rounded-xl">
                        <Image 
                            src={imageSrc} 
                            alt={webnovel.cover_art}
                            fill
                            quality={85}
                            sizes="(max-width: 768px) 83px, 240px"
                            className="object-cover"
                            placeholder="blur" 
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                        />
                        {/* UP Badge */}
                        <span className="absolute bottom-0 left-0 text-[10px] text-white bg-pink-600 px-1 py-1">
                            UP
                        </span>
                        {/* Ranking Number Overlay */}
                        {ranking && (
                            <div className="absolute top-0 left-0 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 opacity-90"></div>
                                <p className="relative text-xl md:text-3xl font-bold text-white">
                                    {index}
                                </p>
                            </div>
                        )}
                    </div>

                <div className="mt-1 mb-5">
                  <div className="flex flex-col items-center text-center">
                  {/* Genre */}
                    <span className="text-[9px] self-center rounded text-gray-400">
                        {phrase(dictionary, webnovel.genre, language)}
                        </span>
                        <OtherTranslateComponent 
                            key={key} 
                            content={webnovel.title}
                            elementId={webnovel.id.toString()} 
                            elementType='webnovel' 
                            elementSubtype="title" 
                            classParams="text-[12px] md:text-base w-64 md:max-w-32 lg:max-w-48 break-words" 

                            // text-[12px] md:text-base font-medium line-clamp-2 w-full"
                        />
                        <p className="text-xs md:text-sm font-bold flex md:flex-row flex-col items-center">
                            {webnovel.user.nickname}
                        <span className="text-[10px] text-black ml-2">
                            총 {webnovel.chapters.length} 화
                        </span>
                        <span className="text-[10px] text-black flex flex-row items-center ml-2">
                            {/* <i className="fa-solid fa-eye mr-1"></i>  */}
                            <TrendingUp size={10} className="mr-1" /> 
                            {webnovel.views}
                        </span>
                        
                        </p>
                    </div>
                </div>
           </div>
        </Link>
    )
}

export default WebnovelComponentByRanking