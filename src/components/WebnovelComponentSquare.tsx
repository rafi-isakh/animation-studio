import { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getCloudfrontImageURL } from "@/utils/cloudfront"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { Oleo_Script_Swash_Caps } from 'next/font/google'
import { useLanguage } from "@/contexts/LanguageContext"
import { Card, useMediaQuery } from "@mui/material"
const oleoScriptSwashCaps = Oleo_Script_Swash_Caps({ subsets: ['latin'], weight: '400' })

const WebnovelComponentSquare = ({ webnovel, index, ranking }: { webnovel: Webnovel, index: number, ranking: boolean }) => {
    const imageSrc = getCloudfrontImageURL(webnovel.cover_art);
    const [key, setKey] = useState(0);
    const { language } = useLanguage();
    const [imageWidth, setImageWidth] = useState(83)
    const [imageHeight, setImageHeight] = useState(135)
    const isMediumScreen = useMediaQuery('(min-width:768px)')

    useEffect(() => {
        setImageWidth(isMediumScreen ? 50 : 50) 
        setImageHeight(isMediumScreen ? 50 : 50)
    }, [isMediumScreen])

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language, webnovel])

    return (
        <Link href={`/view_webnovels?id=${webnovel.id}`}>
                <div className="group relative overflow-hidden flex items-center w-full h-[116px] md:w-[300px] md:h-[155px] border border-white">
                    <div className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:scale-110">
                        <Image 
                            src={imageSrc} 
                            // width={imageWidth} 
                            // height={imageHeight} 
                            alt={webnovel.cover_art} 
                            sizes="100vw"
                            fill
                            className="w-full h-full object-cover object-center "
                            placeholder="blur"
                            quality={85}
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
                        />
                      </div>
                        
                        {/* {ranking && <p className={`text-3xl md:text-2xl`}>{index + 1}</p>} */}

                        {/* Text container */}
                        <div className="relative z-10 text-white p-4 transition-opacity duration-300 ease-in-out group-hover:opacity-0" style={{ marginLeft: '20px' }}>
                            <OtherTranslateComponent 
                                key={key} 
                                content={webnovel.title}
                                elementId={webnovel.id.toString()} 
                                elementType='webnovel' elementSubtype="title" 
                                classParams="text-md md:text-lg w-64 md:max-w-32 lg:max-w-48 break-words " 
                                />
                            <p className="text-xs md:text-sm font-bold ">{webnovel.user.nickname}</p>
                      </div>
                </div>
        </Link>
    )
}

export default WebnovelComponentSquare