import CommentsComponent from "@/components/CommentsComponent";

const Comments = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const chapterId = searchParams.chapter_id;

    if (typeof chapterId === 'string') {
    } else if (Array.isArray(chapterId)) {
        throw new Error("there should be only one chapterId param")
    } else {
        throw new Error("chapterId param should be present")
    }

    if (chapterId) {
        return (
            <CommentsComponent chapterId={chapterId} />
        )
    }
    else {
        return (<div></div>)
    }
}

export default Comments;