import { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getImageURL } from "@/utils/cloudfront"

const WebnovelComponent = ({ webnovel }: { webnovel: Webnovel }) => {
    const imageSrc = getImageURL(webnovel.cover_art);
    return (
        <div>
            <Link href={`/view_webnovels?id=${webnovel.id}`}>
            <Image src={imageSrc} width={200} height={120} alt={webnovel.cover_art} className="rounded"
            placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
            />
            </Link>
            <Link href={`/view_webnovels?id=${webnovel.id}`}><h3 className="text-lg mt-2">{webnovel.title}</h3></Link>
            <h3 className="text-lg mt-2">{webnovel.user.nickname}</h3>
        </div>
    )
}

export default WebnovelComponent