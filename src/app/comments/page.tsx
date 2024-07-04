"use client"

import CommentsComponent from "@/components/CommentsComponent";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const Comments = () => {
    const searchParams = useSearchParams();
    const chapterId = searchParams.get('chapter_id')

    return (
        <CommentsComponent chapterId={chapterId}/>
    )
}

export default Comments;