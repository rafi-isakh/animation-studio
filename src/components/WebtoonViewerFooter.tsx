import Link from "next/link"
import { WebtoonChapter } from "./Types"

const getWebtoonById = async (id: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webtoon_by_id?id=${id}`,
        {
            cache: "no-store"
        }
    )
    return await response.json()
}

export default async function WebtoonViewerFooter(props: { webtoonId: string, episode: string }) {
    const webtoon = await getWebtoonById(props.webtoonId)

    const getNextChapterId = (currentChapterId: string) => {
        const index = webtoon.chapters.findIndex((ch: WebtoonChapter) => ch.directory === currentChapterId);
        if (index === webtoon.chapters.length - 1) {
            return currentChapterId; // Stay on the same chapter if it's the last one
        }
        return webtoon.chapters[index + 1].directory;
    }

    const getPrevChapterId = (currentChapterId: string) => {
        const index = webtoon.chapters.findIndex((ch: WebtoonChapter) => ch.directory === currentChapterId);
        if (index === 0) {
            return currentChapterId; // Stay on the same chapter if it's the first one
        }
        return webtoon.chapters[index - 1].directory;
    }

    return (
        <div className="z-50 fixed w-full justify-center bg-white text-black dark:text-black border-t bottom-0 left-2 pt-2 pb-2 right-2 md:mr-0 mr-[15px] md:ml-0 transition-transform duration-300">
            <div className="max-w-lg text-black dark:text-black flex flex-wrap items-center justify-evenly mx-auto p-2">
                <Link href={`/webtoons/${props.webtoonId}/${getPrevChapterId(props.episode)}`}>Prev</Link>
                <Link href={`/webtoons/${props.webtoonId}/${getNextChapterId(props.episode)}`}>Next</Link>
            </div>
        </div>
    )

}