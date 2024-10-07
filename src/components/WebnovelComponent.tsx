import { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getCloudfrontImageURL } from "@/utils/cloudfront"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { Oleo_Script_Swash_Caps } from 'next/font/google'
import { useLanguage } from "@/contexts/LanguageContext"
const oleoScriptSwashCaps = Oleo_Script_Swash_Caps({ subsets: ['latin'], weight: '400' })

const WebnovelComponent = ({ webnovel, index, ranking, width, height }: { webnovel: Webnovel, index: number, ranking: boolean, width: number, height: number }) => {
    const imageSrc = getCloudfrontImageURL(webnovel.cover_art);
    const [key, setKey] = useState(0);
    const { language } = useLanguage();

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language, webnovel])

    return (
        <div className="overflow-hidden">
            <div className="h-[200px] md:h-[350px] overflow-hidden flex items-center">
                <Link href={`/view_webnovels?id=${webnovel.id}`}>
                    <Image src={imageSrc} width={width} height={height} alt={webnovel.cover_art} className="rounded-xl"
                        placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
                    />
                </Link>
            </div>
            <div className="flex flex-row mt-2 space-x-4">
                <div>
                    {ranking && <p className={`text-4xl translate-y-1.5 md:text-6xl ${oleoScriptSwashCaps.className}`}>{index + 1}</p>}
                </div>
                <div className="mt-1">
                    <p className="text-sm md:text-lg font-bold">{webnovel.user.nickname}</p>
                    <Link href={`/view_webnovels?id=${webnovel.id}`}><OtherTranslateComponent key={key} content={webnovel.title}
                        elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="title" classParams="text-sm md:text-lg max-w-32 md:max-w-48 whitespace-nowrap truncate" /></Link>
                </div>
            </div>
        </div>
    )
}

export default WebnovelComponent