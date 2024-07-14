import { Webnovel } from "@/components/Types"
import Image from "next/image"
import { code_to_language } from "@/utils"
import { useLanguage } from "@/contexts/LanguageContext"

const WebNovelInfoAndPictureComponent = ({webnovel}: {webnovel: Webnovel | undefined}) => {

    const { language } = useLanguage();

    return (
        <div className='flex flex-row justify-between'>
            <div className="flex flex-col space-y-4">
                <p className="text-sm">{webnovel?.genre}</p>
                <p className="text-xl">{webnovel?.title}</p>
                <p className="text-sm">{webnovel?.user.nickname}</p>
                <p className="text-sm">{code_to_language(webnovel?.language, language)}</p>
                <p className='mt-10 text-sm'><i className="fa-regular fa-heart"></i> {webnovel?.upvotes}</p>
            </div>
            <div>
                <Image src={`/upload/${webnovel?.cover_art}`} alt={webnovel?.title ?? "webnovel not found"} width={240} height={400} />
            </div>
        </div>
    )
}


export default WebNovelInfoAndPictureComponent;