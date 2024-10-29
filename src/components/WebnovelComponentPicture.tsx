import { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getCloudfrontImageURL } from "@/utils/cloudfront"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { Oleo_Script_Swash_Caps } from 'next/font/google'
import { useLanguage } from "@/contexts/LanguageContext"
import { Card, useMediaQuery } from "@mui/material"
import { ChevronLeft, ChevronRight } from "lucide-react"

const oleoScriptSwashCaps = Oleo_Script_Swash_Caps({ subsets: ['latin'], weight: '400' })

const WebnovelComponentPicture = ({ webnovel, index, ranking }: { webnovel: Webnovel, index: number, ranking: boolean }) => {
    const imageSrc = getCloudfrontImageURL(webnovel.cover_art);
    const [key, setKey] = useState(0);
    const { language } = useLanguage();
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
        <div className="min-w-[200px] px-2 mb-10">
            <Link href={`/view_webnovels?id=${webnovel.id}`}>
                    <div className="flex flex-col items-center">
                        <div className="flex flex-col mt-2 items-center">
                            <Image 
                                src={imageSrc} 
                                width={imageWidth} 
                                height={imageHeight}
                                alt={webnovel.cover_art}
                                // sizes="100vw"
                                // fill 
                                quality={85}
                                className="w-full h-full rounded-xl"
                                placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
                            />
                            {/* {ranking && <p className={`text-3xl md:text-2xl`}>{index + 1}</p>} */}
                            <div className="mt-1">
                                <OtherTranslateComponent key={key} content={webnovel.title}
                                    elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="title" classParams="text-md md:text-lg w-64 md:max-w-32 lg:max-w-48 break-words" />
                                <p className="text-xs md:text-sm font-bold">{webnovel.user.nickname}</p>
                            </div>
                        </div>
                    </div>
            </Link>
        </div>
    )
}

export default WebnovelComponentPicture