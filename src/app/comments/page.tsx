"use client"
import ChapterCommentsComponent from "@/components/ChapterCommentsComponent";
import { useChapter } from "@/contexts/ChapterContext";

const Comments = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const chapterId = searchParams.chapter_id;
    const webnovelOrWebtoon = searchParams.webnovel_or_webtoon;
    const { chapter } = useChapter();

    if (typeof chapterId === 'string') {
    } else if (Array.isArray(chapterId)) {
        throw new Error("there should be only one chapterId param")
    } else {
        throw new Error("chapterId param should be present")
    }

    if (chapterId) {
        return (
            <ChapterCommentsComponent chapter={chapter!} webnovelOrWebtoon={webnovelOrWebtoon! == 'true'} addCommentEnabled={true} />
        )
    }
    else {
        return (<div></div>)
    }
}

export default Comments;