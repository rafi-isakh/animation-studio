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
import { ChevronLeft, ChevronRight } from "lucide-react"


const oleoScriptSwashCaps = Oleo_Script_Swash_Caps({ subsets: ['latin'], weight: '400' })

const WebnovelComponentPicture = ({ webnovel, index, ranking }: { webnovel: Webnovel, index: number, ranking: boolean }) => {
    const [key, setKey] = useState(0);
    const { language, dictionary } = useLanguage();
    const isMediumScreen = useMediaQuery('(min-width:768px)')
    const imageSrc = getImageUrl(webnovel.cover_art)

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language, webnovel])


    return (
        <Link href={`/view_webnovels?id=${webnovel.id}`}>
            <div className="group relative flex flex-col items-center w-[100px] md:w-[240px]">
                {/* Image Container */}
                <div className="relative shrink-0 w-[83px] h-[135px] md:w-[240px] md:h-[380px] md:aspect-[3/4] overflow-hidden rounded-xl">
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
                    <div className="flex flex-col items-center text-center gap-1">
                        {/* Genre */}
                        <OtherTranslateComponent
                            key={key}
                            content={webnovel.title}
                            elementId={webnovel.id.toString()}
                            elementType="webnovel"
                            elementSubtype="title"
                            classParams="text-[12px] md:text-base font-medium line-clamp-2 w-full"
                        />
                        <p className="text-[10px] md:text-[12px] font-bold w-full truncate text-gray-500 flex flex-col md:flex-row justify-center">
                            {webnovel.user.nickname} 
                            <span className="hidden md:block"> • </span>
                            <span className="">{phrase(dictionary, webnovel.genre, language)}</span>                   
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default WebnovelComponentPicture