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
        <div className="px-2 mb-10">
            <Link href={`/view_webnovels?id=${webnovel.id}`}>
                <div className="group relative flex flex-col items-center w-[100px] md:w-[240px]">
                {/* Image Container */}
                <div className="relative w-[83px] h-[135px] md:w-[240px] md:h-[380px] md:aspect-[3/4] overflow-hidden rounded-xl ">
                    <Image
                    src={imageSrc}
                    alt={webnovel.cover_art}
                    fill
                    quality={85}
                    className="object-cover"
                    sizes="(max-width: 768px) 83px, 240px"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                    />
                </div>

                {/* Text Content Container */}
                <div className="mt-2 w-full">
                    <div className="flex flex-col items-center text-center">
                    <OtherTranslateComponent
                        key={key}
                        content={webnovel.title}
                        elementId={webnovel.id.toString()}
                        elementType="webnovel"
                        elementSubtype="title"
                        classParams="text-sm md:text-base font-medium line-clamp-2 w-full"
                    />
                    <p className="text-xs md:text-sm font-bold mt-1 w-full truncate">
                        {webnovel.user.nickname}
                    </p>
                    </div>
                </div>
                </div>
            </Link>
        </div>
    )
}

export default WebnovelComponentPicture