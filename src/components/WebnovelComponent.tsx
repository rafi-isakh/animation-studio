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
        <Link href={`/view_webnovels/${webnovel.id}`} className="relative flex flex-col justify-center items-center">
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
                        <p className="text-[10px] md:text-sm font-bold w-full truncate text-gray-500 flex flex-col md:flex-row justify-center">
                            {webnovel.author.nickname}
                            <span className="hidden md:block"> • </span>
                            <span className="">{phrase(dictionary, webnovel.genre, language)}</span>
                        </p>
                      {/* 
                        <p className="flex flex-row gap-1 items-center text-gray-500 dark:text-gray-500">
                            <svg width="15" height="15" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z" fill="#DB2777" />
                            </svg>
                            {webnovel.upvotes}
                        </p> */}

                        <div className="flex flex-row gap-1 text-[10px] md:text-sm text-gray-500 font-bold dark:text-gray-500 justify-center">
                            {/* <p> {phrase(dictionary, "totalchapters", language)} {webnovel.chapters_length} {phrase(dictionary, "numchapters", language)}</p> */}
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