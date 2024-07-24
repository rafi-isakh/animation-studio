import { Webnovel } from "@/components/Types"
import Image from "next/image"
import { code_to_language } from "@/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { getImageURL } from "@/utils/cloudfront"
import Link from "next/link"
import OtherTranslateComponent from "./OtherTranslateComponent"
import { useEffect, useState } from "react"

const WebNovelInfoAndPictureComponent = ({webnovel}: {webnovel: Webnovel | undefined}) => {

    const { language } = useLanguage();
    const imageSrc = getImageURL(webnovel?.cover_art)
    const firstChapter = (webnovel?.chapters && webnovel.chapters.length > 0)? webnovel.chapters[0].id: -1
    const [key, setKey] = useState(0);
    
    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language, webnovel])
    
    return webnovel && (
        
        <div className='flex flex-row justify-between'>
            <div className="flex flex-col space-y-4 w-full">
                <p className="text-sm">{webnovel?.genre}</p>
                <OtherTranslateComponent key={key} content={webnovel.title} 
                elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="title"/>
                <OtherTranslateComponent key={key} content={webnovel.description} 
                elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="description"/>
                <hr/>
                <Link href={`/view_profile/${webnovel?.user.id}`}>
                    <p className="text-sm font-bold hover:text-pink-600">{webnovel?.user.nickname}</p>
                </Link>
                <p className='mt-10 text-sm'><i className="fa-regular fa-heart"></i> {webnovel?.upvotes}</p>
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