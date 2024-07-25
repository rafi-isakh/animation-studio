import { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getImageURL } from "@/utils/cloudfront"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { Oleo_Script_Swash_Caps } from '@next/font/google'
import { useLanguage } from "@/contexts/LanguageContext"
const oleoScriptSwashCaps = Oleo_Script_Swash_Caps({ subsets: ['latin'], weight: '400' })

const WebnovelComponent = ({ webnovel, index, ranking, width, height }: { webnovel: Webnovel, index: number, ranking: boolean, width: number, height: number }) => {
    const imageSrc = getImageURL(webnovel.cover_art);
    const [key, setKey] = useState(0);
    const { language } = useLanguage();

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language, webnovel])

    return (
        <div>
            <Link href={`/view_webnovels?id=${webnovel.id}`}>
                <Image src={imageSrc} width={width} height={height} alt={webnovel.cover_art} className="rounded"
                    placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
                />
            </Link>
            <div className="flex flex-row mt-2 space-x-4">
                <div>
                    {ranking && <p className={`text-6xl ${oleoScriptSwashCaps.className}`}>{index + 1}</p>}
                </div>
                <div className="mt-1">
                    <p className="text-lg">{webnovel.user.nickname}</p>
                    <Link href={`/view_webnovels?id=${webnovel.id}`}><OtherTranslateComponent key={key} content={webnovel.title}
                        elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="title" classParams="text-lg" /></Link>
                </div>
            </div>
        </div>
    )
}

export default WebnovelComponent