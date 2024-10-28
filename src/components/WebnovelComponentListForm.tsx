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

const WebnovelComponentListForm = ({ webnovel, index, ranking }: { webnovel: Webnovel, index: number, ranking: boolean }) => {
   
    const imageSrc = getCloudfrontImageURL(webnovel.cover_art);
    const [key, setKey] = useState(0);
    const { language, dictionary } = useLanguage();
    const [imageWidth, setImageWidth] = useState(83)
    const [imageHeight, setImageHeight] = useState(135)
    const isMediumScreen = useMediaQuery('(min-width:768px)')

    // useEffect(() => {
    //     setImageWidth(isMediumScreen ? 50 : 50) // Adjust these values as needed
    //     setImageHeight(isMediumScreen ? 50  : 50) // Adjust these values as needed
    // }, [isMediumScreen])

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language, webnovel])

    return (
     <Link href={`/view_webnovels?id=${webnovel.id}`}>
       <div className='border-t'>
         <div className="flex items-center px-3 ">
            <div className="flex flex-row mt-2 space-x-4 items-center">
                <div className="relative"> {/* Add this wrapper div */}
                    <Image 
                        src={imageSrc} 
                        width={50} 
                        height={50} 
                        alt={webnovel.cover_art} 
                        className=""
                        placeholder="blur" 
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                    />
                    <span className="absolute bottom-0 left-0 text-[10px] text-white bg-purple-500 px-1 py-1">
                        UP
                    </span>
                </div>

                {ranking && <p className={`text-3xl md:text-2xl`}>{index + 1}</p>}
                <div className="mt-1 mb-5">
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
                        classParams="text-md md:text-lg w-64 md:max-w-32 lg:max-w-48 break-words" 
                    />
                    <p className="text-xs md:text-sm font-bold flex flex-row items-center">
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
      </div>
  </Link>
    )
}

export default WebnovelComponentListForm