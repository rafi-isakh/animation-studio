import { getImageDimensions, getSignedUrlForWebtoonImage } from "@/utils/s3";
import { Webtoon } from "@/components/Types";
import Image from "next/image";
import Link from "next/link";

export default async function WebtoonsCardComponent({ webtoon }: { webtoon: Webtoon }) {
    console.log(webtoon)
    const coverArt = await getSignedUrlForWebtoonImage(webtoon.root_directory + "/" + webtoon.cover_art)
    const {width, height} = await getImageDimensions(coverArt)

    return (
        <Link href={`/webtoons/${webtoon.id}`}>
            <Image src={coverArt} alt={webtoon.title} width={width ? width / 3 : 0} height={height ? height / 3 : 0} />
        </Link>
    )
}