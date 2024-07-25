import { Webnovel } from "@/components/Types"
import Image from "next/image"
import { code_to_language } from "@/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { getImageURL } from "@/utils/cloudfront"
import Link from "next/link"
import OtherTranslateComponent from "./OtherTranslateComponent"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { phrase } from "@/utils/phrases"

const WebNovelInfoAndPictureComponent = ({webnovel}: {webnovel: Webnovel | undefined}) => {

    const { language, dictionary } = useLanguage();
    const imageSrc = getImageURL(webnovel?.cover_art)
    const firstChapter = (webnovel?.chapters && webnovel.chapters.length > 0)? webnovel.chapters[0].id: -1
    const [key1, setKey1] = useState(0);
    const [key2, setKey2] = useState(10);
    const params = useSearchParams();
    
    useEffect(() => {
        setKey1(prevKey => prevKey + 1)
        setKey2(prevKey => prevKey + 1)
    }, [language, params])
    
    return webnovel && (
        
        <div className='flex flex-row justify-between'>
            <div className="flex flex-col space-y-4 w-full">
                <p className="text-sm">{phrase(dictionary, webnovel.genre, language)}</p>
                <OtherTranslateComponent key={key1} content={webnovel.title} 
                    elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="title" classParams="text-xl"/>
                <OtherTranslateComponent key={key2} content={webnovel.description} 
                    elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="description"/>
                <hr/>
                <Link href={`/view_profile/${webnovel.user.id}`}>
                    <p className="text-sm font-bold hover:text-pink-600">{webnovel.user.nickname}</p>
                </Link>
                <p className='mt-10 text-sm'><i className="fa-regular fa-heart"></i> {webnovel.upvotes}</p>
                <p className='mt-4 text-sm'><i className="fa-solid fa-eye"></i> {webnovel.views}</p>
            </div>
            <div className="ml-4">
                <Link href={firstChapter != -1 ? `/chapter_view/${firstChapter}` : "#"} className="text-md font-bold">
                    <Image className='rounded' src={imageSrc} alt={webnovel?.title ?? "webnovel not found"} width={240} height={400} 
                placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
                />
                </Link>
            </div>
        </div>
    )
}


export default WebNovelInfoAndPictureComponent;