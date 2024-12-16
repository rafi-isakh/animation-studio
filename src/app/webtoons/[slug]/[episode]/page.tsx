import ViewWebtoonComponent from "@/components/ViewWebtoonComponent";
import WebtoonViewerFooter from "@/components/WebtoonViewerFooter";

async function getWebtoonById(id: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoon_by_id?id=${id}`,
        {
            cache: "no-store"
        }
    )
    if (!response.ok) {
        throw new Error(`Failed to fetch webtoon with id ${id}`)
    }
    return await response.json()
}

export default async function WebtoonEpisodePage({ params }: { params: { slug: string, episode: string } }) {
    const webtoon = await getWebtoonById(params.slug)
    return (
        <div>
            <ViewWebtoonComponent webtoon={webtoon} episode={params.episode} />
            <WebtoonViewerFooter webtoon={webtoon} episode={params.episode} />
        </div>
    )
}
