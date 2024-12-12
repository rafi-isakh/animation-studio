import ViewWebtoonComponent from "@/components/ViewWebtoonComponent";
import WebtoonViewerFooter from "@/components/WebtoonViewerFooter";


export default async function WebtoonEpisodePage({ params }: { params: { slug: string, episode: string } }) {
    return (
        <div>
            <ViewWebtoonComponent webtoonId={params.slug} episode={params.episode} />
            <WebtoonViewerFooter webtoonId={params.slug} episode={params.episode} />
        </div>
    )
}
