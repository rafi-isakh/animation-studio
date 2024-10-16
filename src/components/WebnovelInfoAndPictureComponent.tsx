import { Webnovel } from "@/components/Types"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import { getCloudfrontImageURL, getImageURL } from "@/utils/cloudfront"
import Link from "next/link"
import OtherTranslateComponent from "./OtherTranslateComponent"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { phrase, code_to_lang } from "@/utils/phrases"
import Comments from "@/app/comments/page"
import CommentsComponent from "./CommentsComponent"

const WebNovelInfoAndPictureComponent = ({ webnovel }: { webnovel: Webnovel | undefined }) => {

    const { language, dictionary } = useLanguage();
    const imageSrc = getCloudfrontImageURL(webnovel?.cover_art)
    const firstChapter = (webnovel?.chapters && webnovel.chapters.length > 0) ? webnovel.chapters[0].id : -1
    const [key1, setKey1] = useState(0);
    const [key2, setKey2] = useState(10);
    const params = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setKey1(prevKey => prevKey + 1)
        setKey2(prevKey => prevKey + 1)
    }, [language, params])

    return webnovel && (

        <div className='flex flex-row space-x-4 justify-between'>
            <div className={`ml-4 ${isLoading ? 'animate-pulse' : ''}`}>
                <Link href={firstChapter != -1 ? `/chapter_view/${firstChapter}` : "#"} className="text-md font-bold">
                    <Image
                        src={imageSrc}
                        alt={webnovel?.title ?? "webnovel not found"}
                        width={262}
                        height={480}
                        className="mt-3 mb-6"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                        onLoad={() => setIsLoading(false)}
                    />
                </Link>
            </div>

            <div className="flex flex-col space-y-4 w-full">

                <OtherTranslateComponent
                    key={key1}
                    content={webnovel.title}
                    elementId={webnovel.id.toString()}
                    elementType='webnovel'
                    elementSubtype="title"
                    classParams="text-[2rem] uppercase"
                />

                {/* Author profile */}
                <Link href={`/view_profile/${webnovel.user.id}`}>
                    <p className="text-sm font-bold hover:text-pink-600">
                        <span className="text-[10px] self-center rounded-xl text-white bg-purple-500 px-2 py-1 mr-1">
                            {phrase(dictionary, "author", language)}
                        </span>
                        {webnovel.user.nickname}
                    </p>
                </Link>

                <div className="flex flex-row space-x-4 items-center text-[12px] ">
                    {/* Genre part */}
                    <p className="uppercase">{phrase(dictionary, webnovel.genre, language)}</p>

                    <p className="">
                        <i className="fas fa-globe mr-1"></i>
                        {/* {phrase(dictionary, "original", language)}:  */}
                        {phrase(dictionary, code_to_lang(webnovel.language), language)}
                    </p>
                    <p className=' flex items-center'>
                        <i className="fa-regular fa-heart mr-1"></i> {webnovel.upvotes}
                    </p>
                    <p className=' flex items-center'>
                        <i className="fa-solid fa-eye mr-1"></i> {webnovel.views}
                    </p>
                    <p className=' flex items-center'>
                        <i className="fa-solid fa-list mr-1"></i> 총 {webnovel.chapters.length} 화
                    </p>
                </div>
                <OtherTranslateComponent
                    key={key2}
                    content={webnovel.description}
                    elementId={webnovel.id.toString()}
                    elementType='webnovel'
                    elementSubtype="description"
                />
                <hr />
            </div>

        </div>
    )
}


export default WebNovelInfoAndPictureComponent;