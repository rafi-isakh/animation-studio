import { Webnovel } from "@/components/Types"
import Image from "next/image"
import { code_to_language } from "@/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import Link from "next/link"

const WebNovelInfoAndPictureComponent = ({webnovel}: {webnovel: Webnovel | undefined}) => {

    const { language } = useLanguage();

    return (
        <div className='flex flex-row justify-between'>
            <div className="flex flex-col space-y-4 w-full">
                <p className="text-sm">{webnovel?.genre}</p>
                <p className="text-xl">{webnovel?.title}</p>
                <hr/>
                <Link href={`/profile/?email=${webnovel?.user.email}`}><p className="text-sm hover:text-pink-600">{webnovel?.user.nickname}</p></Link>
                <p className='mt-10 text-sm'><i className="fa-regular fa-heart"></i> {webnovel?.upvotes}</p>
            </div>
            <div className="ml-4">
                <Image src={`/upload/${webnovel?.cover_art}`} alt={webnovel?.title ?? "webnovel not found"} width={240} height={400} />
            </div>
        </div>
    )
}


export default WebNovelInfoAndPictureComponent;