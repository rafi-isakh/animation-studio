import { Webnovel } from "@/components/Types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { getImageUrl } from "@/utils/urls"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases'
import { useMediaQuery } from "@mui/material"
import FavoriteIcon from '@mui/icons-material/Favorite';
import { truncateText } from "@/utils/truncateText"
import { Button } from "@/components/shadcnUI/Button"
import { ChevronRight } from 'lucide-react'

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
        <Link href={`/view_webnovels?id=${webnovel.id}`} className="relative flex flex-col justify-center items-center">
            <div className='flex flex-col justify-center items-center w-[160px] p-1 text-sm font-pretendard'>
                <div className="flex justify-center items-center w-full">
                    <div className="relative w-[150px] h-[200px] rounded-lg">
                        <Image 
                            src={imageSrc}
                            fill
                            alt={webnovel.cover_art}
                            className="object-cover object-center rounded-lg"
                            placeholder="blur"
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQpoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                        />
                    </div>
                </div>

                {ranking && <p className={`text-xl md:text-2xl self-center p-3`}>{index}</p>}

                <div className="w-full flex-grow-0 flex-shrink overflow-hidden text-center">
                    <OtherTranslateComponent
                        content={truncateText(webnovel.title, 15)}
                        elementId={webnovel.id.toString()}
                        elementType='webnovel'
                        elementSubtype="title"
                        classParams={language === 'ko' 
                            ? "text-md md:text-base w-full break-keep korean truncate text-center"
                            : "text-md md:text-base w-full break-words truncate text-center"}
                    />
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] md:text-sm font-bold w-full truncate text-gray-500 text-center">
                            {webnovel.author.nickname}
                        </p>

                        <p className="text-[10px] md:text-sm font-bold w-full truncate text-gray-500 text-center">
                            {phrase(dictionary, webnovel.genre, language)}
                        </p>
                        
                        <div className="flex flex-row gap-1 text-[10px] md:text-sm text-gray-500 font-bold dark:text-gray-500 justify-center">
                            <p> {phrase(dictionary, "totalchapters", language)} {webnovel.chapters_length} {phrase(dictionary, "numchapters", language)}</p>
                            <p className="flex flex-row gap-1 items-center text-gray-500 dark:text-gray-500">
                                <FavoriteIcon sx={{ fontSize: 12 }} />
                                {webnovel.upvotes}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="relative w-full flex flex-row gap-2 justify-between">
                {/* <Button variant="link" className="!no-underline flex  text-md text-black dark:text-white  hover:text-white px-4 py-2 ">
                    Details
                </Button> */}
                {/* <Button variant="ghost" className="flex bg-[#DE2B74] text-md text-black hover:text-white px-4 py-2 rounded-none rounded-br-lg rounded-tl-lg ">
                    Read <ChevronRight className="w-4 h-4" />
                </Button> */}
            </div>
        </Link >
    )
}

export default WebnovelComponent