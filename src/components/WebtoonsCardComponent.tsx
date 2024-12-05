import { getSignedUrlForWebtoonImage } from "@/utils/s3";
import { Webtoon } from "@/components/Types";
import Image from "next/image";
import Link from "next/link";

export default async function WebtoonsCardComponent({ webtoon }: { webtoon: Webtoon }) {
    const coverArt = await getSignedUrlForWebtoonImage(webtoon.root_directory + "/" + webtoon.cover_art)

    return (
        <div className="flex flex-col">
            <Link href={`/webtoons/${webtoon.id}`}>
                <Image
                    src={coverArt}
                    alt={webtoon.title}
                    width={160}
                    height={225}
                    className="w-[160px] h-[225px] md:w-[160px] md:h-[225px]" />
            </Link>
            <p className="text-sm">{webtoon.title}</p>
            <p className="text-sm">{webtoon.user.nickname}</p>
        </div>
    )
}