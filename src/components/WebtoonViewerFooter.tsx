import Link from "next/link"
import { WebtoonChapter } from "./Types"
import { MessageCircle } from "lucide-react"

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

    const getCurrentChapterId = (currentChapterId: string) => {
        const index = webtoon.chapters.findIndex((ch: WebtoonChapter) => ch.directory === currentChapterId);
        return webtoon.chapters[index].id;
    }
    
    const getCurrentChapterCommentsLength = (currentChapterId: string) => {
        const index = webtoon.chapters.findIndex((ch: WebtoonChapter) => ch.directory === currentChapterId);
        return webtoon.chapters[index].comments.length;
    }

    return (
        <div className="z-50 fixed w-full justify-center bg-white text-black dark:text-black border-t bottom-0 left-2 pt-2 pb-2 right-2 md:mr-0 mr-[15px] md:ml-0 transition-transform duration-300">
            <div className="max-w-lg text-black dark:text-black flex flex-wrap items-center justify-evenly mx-auto p-2">
                <Link href={`/webtoons/${props.webtoonId}/${getPrevChapterId(props.episode)}`}>Prev</Link>
                <Link href={`/comments?chapter_id=${getCurrentChapterId(props.episode).toString()}&webnovel_or_webtoon=false`}> 
                {/*webnovel_or_webtoon=false means webtoon*/}
                        <p className='hover:text-[#DB2777] relative'>
                        <MessageCircle size={16} />
                        <span className='absolute -top-[1px] -right-1 text-[9px] bg-[#DB2777] text-white rounded-full px-1'>{getCurrentChapterCommentsLength(props.episode)}</span>
                        </p>
                    </Link>
                  
                   
                <Link href={`/webtoons/${props.webtoonId}/${getNextChapterId(props.episode)}`}>Next</Link>
            </div>
        </div>
    )

}