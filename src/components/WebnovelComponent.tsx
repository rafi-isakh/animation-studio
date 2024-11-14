import { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getImageUrl } from "@/utils/urls"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { Oleo_Script_Swash_Caps } from 'next/font/google'
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases'
import { Card, useMediaQuery } from "@mui/material"
const oleoScriptSwashCaps = Oleo_Script_Swash_Caps({ subsets: ['latin'], weight: '400' })

const WebnovelComponent = ({ webnovel, index, ranking }: { webnovel: Webnovel, index: number, ranking: boolean }) => {
   
    const imageSrc = getImageUrl(webnovel.cover_art);
    const [key, setKey] = useState(0);
    const { language, dictionary } = useLanguage();
    const [imageWidth, setImageWidth] = useState(83)
    const [imageHeight, setImageHeight] = useState(135)
    const isMediumScreen = useMediaQuery('(min-width:768px)')

    useEffect(() => {
        setImageWidth(isMediumScreen ? 83 : 60) // Adjust these values as needed
        setImageHeight(isMediumScreen ? 135 : 100) // Adjust these values as needed
    }, [isMediumScreen])

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language, webnovel])

    return (
     <Link href={`/view_webnovels?id=${webnovel.id}`}>
       <div className='border border-gray-100 rounded'>
         <div className="flex items-center w-full h-[116px] md:w-[325px] md:h-[155px]">
            <div className="flex flex-row mt-2 space-x-4 items-center">
                <div className="relative"> {/* Add this wrapper div */}
                    <Image 
                        src={imageSrc} 
                        width={imageWidth} 
                        height={imageHeight} 
                        alt={webnovel.cover_art} 
                        className="rounded"
                        placeholder="blur" 
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                    />
                    <span className="absolute bottom-0 left-0 text-[10px] text-white bg-pink-500 px-1 py-1">
                        NEW
                    </span>
                </div>

                {ranking && <p className={`text-3xl md:text-2xl`}>{index}</p>}
                <div className="mt-1">
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
                    <p className="text-xs md:text-sm font-bold">
                        {webnovel.user.nickname}
                       <span className="text-[10px] text-black ml-2">
                        총 {webnovel.chapters.length} 화
                       </span>
                       <span className="text-[10px] text-black ml-2">
                       <i className="fa-regular fa-heart mr-1"></i> {webnovel.upvotes}
                       </span>

                      

                        {/* <span className="text-[10px] text-black ml-2">
                        <i className="fa-solid fa-eye mr-1"></i> {webnovel.views}
                       </span> */}
                        
                    </p>
                </div>
            </div>
        </div>
      </div>
  </Link>
    )
}

export default WebnovelComponent