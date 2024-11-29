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
        <Link href={`/view_webnovels?id=${webnovel.id} block w-full`}>
            <div className='flex items-center space-x-4 md:w-full w-50 border border-gray-100 dark:border-gray-700 p-4 text-sm overflow-x-auto'>
                <div className="relative w-12 h-20 flex-shrink-0 rounded-md overflow-hidden ">     
                    {/* overflow-hidden  */}
                    {/* Add this wrapper div */}
                    <Image
                        src={imageSrc}
                        width={imageWidth}
                        height={imageHeight}
                        // fill
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

                    <div className="items-center content-center">
                    {/* Genre */}
                        <OtherTranslateComponent
                            key={key}
                            content={webnovel.title}
                            elementId={webnovel.id.toString()}
                            elementType='webnovel'
                            elementSubtype="title"
                            classParams="text-md md:text-lg w-64 md:max-w-32 lg:max-w-48 break-words"
                        />
                        <div className="flex flex-col">
                            <p className="text-[10px] md:text-[12px] font-bold w-full truncate text-gray-500">
                                {webnovel.user.nickname} • {phrase(dictionary, webnovel.genre, language)}
                            </p>
                            <p className="flex flex-row justify-start font-bold">
                                <span className="text-[10px] md:text-[12px] text-black">
                                    {phrase(dictionary, "totalchapters", language)} {webnovel.chapters.length} {phrase(dictionary, "numchapters", language)} {/* 총 x 화 */}
                                </span>
                            </p>
                        </div>
                    {/* <span className="text-[10px] text-black ml-2">
                <i className="fa-solid fa-eye mr-1"></i> {webnovel.views}
                </span> */}
                  </div>
                <div className="text-[10px]  md:text-xl text-gray-200 self-center justify-end">
                   <i className="fas fa-heart"></i>
                     {/* {webnovel.upvotes} */}
                </div>
            </div>
        </Link >
    )
}

export default WebnovelComponent