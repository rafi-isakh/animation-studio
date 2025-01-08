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
import FavoriteIcon from '@mui/icons-material/Favorite';

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

    return (
        <Link href={`/view_webnovels?id=${webnovel.id}`} className="w-full">
            <div className='flex flex-shrink-0 flex-nowrap justify-center items-center space-x-4 w-full p-2 text-sm font-pretendard'>
                <div className="relative w-[45px] md:w-[75px] md:h-[105px] flex-shrink-0 rounded-lg">
                    <Image
                        src={imageSrc}
                        fill
                        alt={webnovel.cover_art}
                        className="object-cover w-full h-full rounded-lg"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                    />
                </div>

                {ranking && <p className={`text-xl md:text-2xl self-center p-3`}>{index}</p>}

                <div className="flex-grow overflow-hidden self-center">
                    {/* Genre & Title */}
                    <OtherTranslateComponent
                        content={webnovel.title}
                        elementId={webnovel.id.toString()}
                        elementType='webnovel'
                        elementSubtype="title"
                        classParams={language === 'ko' ? "text-md md:text-lg w-full break-words" : "text-md md:text-md w-full break-words"}
                    />
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] md:text-[12px] font-bold w-full truncate text-gray-500">
                            {webnovel.user.nickname} • {phrase(dictionary, webnovel.genre, language)}
                        </p>
                        {/* total chapters and num chapters */}
                        <div className="flex flex-row gap-1 text-[10px] md:text-[12px] text-gray-500 font-bold dark:text-gray-500 ">
                            <p> {phrase(dictionary, "totalchapters", language)} {webnovel.chapters.length} {phrase(dictionary, "numchapters", language)}</p>
                            <p className="flex flex-row gap-1 items-center text-gray-500 dark:text-gray-500">
                                <FavoriteIcon sx={{ fontSize: 12 }} />
                                {webnovel.upvotes}
                            </p>
                        </div>
                     
                    </div>

                </div>
                <div className="text-[12px] md:text-xl text-gray-200 dark:text-gray-500 self-center">
                   {/* the left side of the webnovel */}
                </div>
            </div>
        </Link >
    )
}

export default WebnovelComponent