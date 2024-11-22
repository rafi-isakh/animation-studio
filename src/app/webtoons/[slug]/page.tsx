import { WebtoonChapter } from "@/components/Types";
import { Webtoon } from "@/components/Types";
import ViewWebtoonComponent from "@/components/ViewWebtoonComponent";
import { listObjectsInWebtoonsDirectory } from "@/utils/s3";
import Link from "next/link";

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


    return (
        <div>
            <div className="flex flex-col space-y-4 justify-center items-center">
                <h1 className="text-2xl font-bold">{webtoon.title}</h1>
                <h1 className="text-xl font-bold">Episodes</h1>
                {webtoon.chapters.map((chapter: WebtoonChapter) =>
                    <Link href={`/webtoons/${params.slug}/${chapter.directory}`}>
                        <div key={`chapter-${chapter.id}`}>
                            {chapter.directory}
                        </div>
                    </Link>
                )}
            </div>
        </div>
    )
}
