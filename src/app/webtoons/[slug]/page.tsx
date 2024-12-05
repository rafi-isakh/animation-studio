import { getSignedUrlForWebtoonImage } from "@/utils/s3";
import WebtoonChapterListComponent from "@/components/WebtoonChapterListComponent";
import WebtoonInfoAndPictureComponent from "@/components/WebtoonInfoAndPictureComponent";

async function getWebtoonById(id: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoon_by_id?id=${id}`,
        {
            cache: "no-store"
        }
    )
    const data = await response.json()
    return data;
}

export default async function WebtoonPage({ params }: { params: { slug: string } }) {
    // slug is webtoon id
    const webtoon = await getWebtoonById(params.slug);
    const coverArt = await getSignedUrlForWebtoonImage(webtoon.root_directory + "/" + webtoon.cover_art)

    return (
        <div key={`webtoon-${params.slug}`} className="w-full min-h-screen max-w-screen-xl mx-auto">
             <WebtoonInfoAndPictureComponent webtoon={webtoon} coverArt={coverArt} />
    
             <WebtoonChapterListComponent webtoon={webtoon} slug={params.slug} coverArt={coverArt} />
        </div>
    );
}