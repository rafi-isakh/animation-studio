import { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getCloudfrontImageURL } from "@/utils/cloudfront"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { Oleo_Script_Swash_Caps } from 'next/font/google'
import { useLanguage } from "@/contexts/LanguageContext"
import { Card } from "@mui/material"
const oleoScriptSwashCaps = Oleo_Script_Swash_Caps({ subsets: ['latin'], weight: '400' })

const WebnovelComponent = ({ webnovel, index, ranking, width, height }: { webnovel: Webnovel, index: number, ranking: boolean, width: number, height: number }) => {
    const imageSrc = getCloudfrontImageURL(webnovel.cover_art);
    const [key, setKey] = useState(0);
    const { language } = useLanguage();

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language, webnovel])

    return (
        <Link href={`/view_webnovels?id=${webnovel.id}`}>
            <Card className='p-2 rounded-xl'>
                <div className="overflow-hidden w-[325px] h-[155px]">
                    <div className="flex flex-row mt-2 space-x-4 items-center">
                        <Image src={imageSrc} width={width} height={height} alt={webnovel.cover_art} className="rounded-xl"
                            placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
                        />
                        {ranking && <p className={`text-3xl md:text-2xl`}>{index + 1}</p>}
                        <div className="mt-1">
                            <OtherTranslateComponent key={key} content={webnovel.title}
                                elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="title" classParams="text-md md:text-lg max-w-32 md:max-w-48 whitespace-nowrap truncate" />
                            <p className="text-xs md:text-sm font-bold">{webnovel.user.nickname}</p>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    )
}

export default WebnovelComponent