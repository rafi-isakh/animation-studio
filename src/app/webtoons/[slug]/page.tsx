import { getSignedUrlForWebtoonImage } from "@/utils/s3";
import WebtoonChapterListComponent from "@/components/WebtoonChapterListComponent";
import WebtoonInfoAndPictureComponent from "@/components/WebtoonInfoAndPictureComponent";
import { Webtoon } from "@/components/Types";

async function getWebtoonById(id: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoon_by_id?id=${id}`)
    const data = await response.json()
    return data;
}

async function getWebtoons() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoons`)
    const data = await response.json()
    return data;
}

export default async function WebtoonPage({ params }: { params: { slug: string } }) {
    // slug is webtoon id
    const webtoon = await getWebtoonById(params.slug);
    const coverArt = await getSignedUrlForWebtoonImage(webtoon.root_directory + "/" + webtoon.cover_art)
    const webtoons = await getWebtoons();
    const coverArtUrls = await Promise.all(webtoons.map(async (webtoon: Webtoon) => await getSignedUrlForWebtoonImage(webtoon.root_directory + "/" + webtoon.cover_art)))

    return (
        <div
            key={`webtoon-${params.slug}`}
            className="w-full min-h-screen md:max-w-screen-lg mx-auto">
            <div className="flex md:flex-row flex-col justify-between items-start">
                <WebtoonInfoAndPictureComponent webtoon={webtoon} coverArt={coverArt} />
                <WebtoonChapterListComponent webtoon={webtoon} slug={params.slug} coverArt={coverArt} webtoons={webtoons} coverArtUrls={coverArtUrls} />
            </div>
        </div>
    );
}