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

const WebnovelComponent = ({ webnovel, index, ranking, chunkIndex }: { webnovel: Webnovel, index: number, ranking: boolean, chunkIndex: number }) => {

    const [key, setKey] = useState(0);
    const { language, dictionary } = useLanguage();
    const [imageWidth, setImageWidth] = useState(83)
    const [imageHeight, setImageHeight] = useState(135)
    const isMediumScreen = useMediaQuery('(min-width:768px)')
    const imageSrc = getImageUrl(webnovel.cover_art)

    useEffect(() => {
        setImageWidth(isMediumScreen ? 83 : 60) // Adjust these values as needed
        setImageHeight(isMediumScreen ? 135 : 100) // Adjust these values as needed
    }, [isMediumScreen])

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language, webnovel])

    return (
        <Link href={`/view_webnovels?id=${webnovel.id}`} className="w-full">
            <div className='flex flex-shrink-0 flex-nowrap justify-start items-start space-x-4 w-full  p-4 text-sm'>
                <div className="relative w-[45px] md:w-[45px] h-[60px] md:h-[60px] flex-shrink-0 rounded-sm overflow-hidden">
                    <Image
                        src={imageSrc}
                        // width={imageWidth}
                        // height={imageHeight}
                        fill
                        alt={webnovel.cover_art}
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                    />
                    {/* <span className="absolute bottom-0 left-0 text-[10px] text-white bg-pink-500 px-1 py-1">
                        NEW
                    </span> */}
                </div>

                {ranking && <p className={`text-xl md:text-2xl self-center p-3`}>{index}</p>}
                {/* {chunkIndex * 3 + index + 1} */}

                <div className="flex-grow overflow-hidden">
                    {/* Genre */}
                    <OtherTranslateComponent
                        key={key}
                        content={webnovel.title}
                        elementId={webnovel.id.toString()}
                        elementType='webnovel'
                        elementSubtype="title"
                        classParams={language === 'ko' ? "text-md md:text-lg w-full break-words" : "text-md md:text-md w-full break-words"}
                    />
                    <div className="flex flex-col">
                        <p className="text-[10px] md:text-[12px] font-bold w-full truncate text-gray-500">
                            {webnovel.user.nickname} • {phrase(dictionary, webnovel.genre, language)}
                        </p>
                        {/* total chapters and num chapters */}
                        <p className="text-[10px] md:text-[11px] text-gray-500 font-bold dark:text-gray-500 ">
                            <span> {phrase(dictionary, "totalchapters", language)} {webnovel.chapters.length} </span>
                            <span>{phrase(dictionary, "numchapters", language)}</span>
                        </p>
                    </div>

                </div>
                <div className="text-[10px] md:text-xl text-gray-200 dark:text-gray-500 self-center">
                    <i className="fas fa-heart"></i>
                    <p className="block text-[10px] text-black dark:text-gray-500 text-center -mt-2">
                        {webnovel.upvotes}
                    </p>
                </div>
            </div>
        </Link >
    )
}

export default WebnovelComponent