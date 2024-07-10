import { Webnovel } from "@/components/Types"
import Image from "next/image"

const WebNovelInfoAndPictureComponent = ({webnovel}: {webnovel: Webnovel | undefined}) => {
    return (
        <div className='flex flex-row justify-between'>
            <div className="flex flex-col space-y-4">
                <p className="text-sm">{webnovel?.genre}</p>
                <p className="text-xl">{webnovel?.title}</p>
                <p className="text-sm">{webnovel?.user.name}</p>
                <p className='mt-10 text-sm'><i className="fa-regular fa-heart"></i> {webnovel?.upvotes}</p>
            </div>
            <div>
                <Image src={`/upload/${webnovel?.cover_art}`} alt={webnovel?.title ?? "webnovel not found"} width={240} height={400} />
            </div>
        </div>
    )
}


export default WebNovelInfoAndPictureComponent;