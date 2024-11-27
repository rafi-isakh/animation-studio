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


async function getWebtoonById(id: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoon_by_id?id=${id}`,
        {
            cache: "no-store"
        }
    )
    const data = await response.json()
    console.log(data)
    return data;
}

export default async function WebtoonPage({ params }: { params: { slug: string } }) {
    // slug is webtoon id
    const webtoon = await getWebtoonById(params.slug);
    const formattedDate = moment(webtoon.created_at).format('MM/DD/YYYY hh:mm');
    const coverArt = await getSignedUrlForWebtoonImage(webtoon.root_directory + "/" + webtoon.cover_art)
    const { width, height } = await getImageDimensions(coverArt)
    console.log(width, height)

    return (
        <div key={`webtoon-${params.slug}`} className="w-full min-h-screen max-w-screen-xl mx-auto">
            <div className="relative flex flex-col md:h-[439px] h-auto justify-center items-center">
                {/* Blurred background */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-10 backdrop-blur-[300px]"
                    style={{ 
                        backgroundImage: `url(${coverArt})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
                
                {/* Existing content container */}
                <div className="relative z-10 flex md:flex-row flex-col justify-evenly items-center md:h-[439px] h-auto space-y-1 bg-[#929292]/10 w-full">
                    <div className="flex flex-col gap-2 p-10 w-[450px]">
                        <div className="px-5 md:px-0 space-y-2">
                            <span className="text-sm text-gray-400">Genre</span>
                            <h1 className="text-2xl font-bold">{webtoon.title}</h1>
                            <p>{webtoon.user.username}</p>
                            <ul className="flex flex-row gap-2">
                                <li className="text-sm text-gray-100 rounded-xl px-2 py-1 bg-gray-300">#hashtag</li>
                                <li className="text-sm text-gray-100 rounded-xl px-2 py-1 bg-gray-300">#hashtag</li>
                                <li className="text-sm text-gray-100 rounded-xl px-2 py-1 bg-gray-300">#Genre</li>
                            </ul>
                            <p className="text-sm text-gray-400">{formattedDate}</p>
                            <p className="text-sm text-gray-400 mb-5">
                                {webtoon.description}
                            </p>
                    
                            <div className="flex flex-row gap-2">
                                <button className="bg-gray-300 text-white rounded-md px-10 py-1">
                                    Start To Read Episode 1 &gt;
                                </button>
                                <button className="border-2 border-gray-300 text-white rounded-md px-2">
                                    <Heart size={22} className="text-gray-300"/> 
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="w-[270px] md:h-[350px] h-auto min-h-[350px] order-first md:order-last md:pt-0 pt-5"> 
                        <Image 
                            src={coverArt} 
                            alt={webtoon.title} 
                            width={270} 
                            height={350}
                            className="object-cover w-full h-full"
                        />
                    </div>
                </div>
            </div>
            <ViewWebtoonEpisodeComponent webtoon={webtoon} slug={params.slug} coverArt={coverArt} />
        </div>
    );
}