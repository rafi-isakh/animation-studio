'use client'
import { Webnovel, Comment as CommentType, Chapter, Webtoon, WebtoonChapter } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from '@/utils/phrases';
import moment from 'moment';
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { ElementType } from "@/components/Types";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { useUser } from "@/contexts/UserContext";
import { Heart, Redo2 } from "lucide-react";
import { getImageUrl } from "@/utils/urls";
import Image from "next/image";
import Link from "next/link";
import { createEmailHash } from '@/utils/cryptography';
import CommentsDropdownButton from '@/components/UI/CommentsDropdownButton';
import ChapterCommentsComponent from "./ChapterCommentsComponent";

interface CommentListProps {
    content: Webnovel | Webtoon;
    webnovelOrWebtoon: boolean;
}

export const CommentList: FC<CommentListProps> = ({ content, webnovelOrWebtoon }) => {
    const { dictionary, language } = useLanguage();
    const [sortedChapters, setSortedChapters] = useState<Chapter[]>([]);
    // Sort chapters by creation date if needed
    useEffect(() => {
        const _sortedChapters = [...(content?.chapters || [])].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setSortedChapters(_sortedChapters as Chapter[]);
        console.log('sortedChapters', _sortedChapters)
    }, [content])

    return (
        <div>
            {sortedChapters.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                    {phrase(dictionary, "noComments", language)}
                </p>
            ) : (
                sortedChapters
                    .filter(chapter => chapter.comments && chapter.comments.length > 0)
                    .map((chapter, index) => (
                        <div key={chapter.id}>
                            <div className="text-sm font-semibold mb-4 border-b  border-gray-200 dark:border-gray-700 pb-2 flex flex-row justify-between" >
                                <div className="flex flex-row gap-2 justify-center items-center">
                                    <p className="text-sm text-gray-500 self-center">
                                        {/* chapter title */}
                                        <OtherTranslateComponent content={chapter.title} elementId={chapter.id.toString()} elementType="chapter" />
                                    </p>
                                    {/* comment count*/}
                                    <p className="text-sm text-gray-500 self-center justify-center">({chapter.comments.length})</p>
                                </div>
                            </div>
                            <ChapterCommentsComponent chapter={chapter as Chapter} webnovelOrWebtoon={webnovelOrWebtoon} addCommentEnabled={false} />
                        </div>
                    ))
            )}
        </div>
    );
}
