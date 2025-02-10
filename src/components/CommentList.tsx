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
import ChapterCommentsComponent from "@/components/ChapterCommentsComponent";

interface CommentListProps {
    content: Webnovel | Webtoon;
    webnovelOrWebtoon: boolean;
    chapter: Chapter;
}
//chapter
export const CommentList: FC<CommentListProps> = ({ content, webnovelOrWebtoon, chapter }) => {
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
                        <div key={chapter.id} className="bg-gray-100 dark:bg-gray-900 px-1 first:rounded-t-lg last:rounded-b-lg ">
                            <ChapterCommentsComponent chapter={chapter as Chapter} webnovelOrWebtoon={webnovelOrWebtoon} addCommentEnabled={false} />
                        </div>
                    ))
            )}
        </div>
    );
}
