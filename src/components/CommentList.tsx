'use client'
import { Webnovel, Chapter } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from '@/utils/phrases';
import { FC, useEffect, useState } from "react";
import CommentsComponent from "@/components/CommentsComponent";

interface CommentListProps {
    content: Webnovel;
    chapter: Chapter;
}
//chapter
export const CommentList: FC<CommentListProps> = ({ content, chapter }) => {
    const { dictionary, language } = useLanguage();
    const [sortedChapters, setSortedChapters] = useState<Chapter[]>([]);
    // Sort chapters by creation date if needed
    useEffect(() => {
        const _sortedChapters = [...(content?.chapters || [])].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setSortedChapters(_sortedChapters as Chapter[]);
    }, [content])

    return (
        <div className="relative mb-10"> 
        {/* bottom magin 10 for mobile */}
            {sortedChapters.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                    {phrase(dictionary, "noComments", language)}
                </p>
            ) : (
                sortedChapters
                    .filter(chapter => chapter.comments && chapter.comments.length > 0)
                    .map((chapter, index) => (
                            <div key={chapter.id} className="bg-gray-100 dark:bg-[#211F21] px-1 first:rounded-t-lg last:rounded-b-lg">
                                {/*CommentList is only used for webnovels so webnovelOrPost is false*/}
                                <CommentsComponent contentToAttachTo={chapter as Chapter} webnovelOrPost={false} addCommentEnabled={false} />
                            </div>
                    ))
            )}
        </div>
    );
}