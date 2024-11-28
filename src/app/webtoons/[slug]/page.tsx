import { WebtoonChapter } from "@/components/Types";
import { Webtoon } from "@/components/Types";
import ViewWebtoonComponent from "@/components/ViewWebtoonComponent";
import moment from 'moment';
import { listObjectsInWebtoonsDirectory } from "@/utils/s3";
import Link from "next/link";
import { Heart } from "lucide-react";
import ViewWebtoonEpisodeComponent from "@/components/ViewWebtoonEpisodeComponent";
import Image from "next/image";
import { getImageDimensions, getSignedUrlForWebtoonImage } from "@/utils/s3";
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
    
             <ViewWebtoonEpisodeComponent webtoon={webtoon} slug={params.slug} coverArt={coverArt} />
        </div>
    );
}