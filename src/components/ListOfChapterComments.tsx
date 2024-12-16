'use client'
import { Webnovel, Comment as CommentType, Chapter } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from '@/utils/phrases';
import moment from 'moment';
import { FC, useEffect, useState } from "react";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";

interface ListOfChapterCommentsProps {
    webnovel: Webnovel;
}

export const ListOfChapterComments: FC<ListOfChapterCommentsProps> = ({ webnovel }) => {
    const { dictionary, language } = useLanguage();
    const [key, setKey] = useState(0);

    useEffect(() => {
        setKey(prev => prev + 1);
    }, [language])

    // Sort chapters by creation date if needed
    const sortedChapters = [...webnovel.chapters].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const chapterIndexMap = new Map(
        sortedChapters.map((chapter, index) => [chapter.id.toString(), index + 1])
    );

    const CommentThread: FC<{ comment: CommentType }> = ({ comment }) => {
        return (
            <div className="mb-4 gap-3">
                <div className="border-b">
                    <div className="flex flex-row justify-between items-center gap-2 mb-1">
                        <span className="text-[16px] font-semibold">
                            {comment.user.nickname ?? 'Anonymous'}{'   '}
                        </span>
                        <div className="text-[10px] mt-1">
                            {moment(new Date(comment?.created_at)).format('YYYY/MM/DD')}
                        </div>
                    </div>
                    <p className="text-gray-700 py-3">{comment.content ?? ''}</p>
                    <div className="flex justify-end self-end gap-2 mb-3">
                        <button className="text-[10px] px-2 py-2 bg-gray-100 rounded-md  dark:text-gray-700 text-gray-700">
                            <span><i className="fa-regular fa-heart mr-1  dark:text-gray-700 text-gray-700"></i> {comment.upvotes ?? 0}</span>
                        </button>
                    </div>
                </div>


                {/* Render replies */}

                {comment.replies?.map((reply, index) => (
                    <div key={index} className="ml-10 p-2 border-l-2 border-gray-300 mb-3 bg-gray-50 rounded-lg shadow-sm">
                        <div className="flex flex-row items-center justify-between">
                            <span className="font-extrabold text-slate-600">{reply.user.nickname}</span>
                            <div className="text-[10px] text-gray-500">
                                {moment(new Date(reply.created_at)).format('YYYY/MM/DD')}
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{reply.content}</p>
                        <div className="flex justify-end gap-2 mt-2">
                            <button className="text-[10px] px-2 py-2 bg-gray-200 rounded-md  dark:text-gray-700 text-gray-700">
                                <span><i className="fa-regular fa-heart mr-1 dark:text-gray-700 text-gray-700"></i> {reply.upvotes ?? 0}</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="">
            {sortedChapters.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                    {phrase(dictionary, "noComments", language)}
                </p>
            ) : (
                sortedChapters.map((chapter, index) => (
                    <div key={chapter.id} className="border rounded-lg p-4 mb-4">
                        <h3 className="text-sm font-semibold mb-4 border-b pb-4 flex flex-row justify-between" >
                            {phrase(dictionary, "comments", language)} <OtherTranslateComponent content={chapter.title} elementId={chapter.id.toString()} elementType="chapter" />
                        </h3>
                        {(!chapter.comments || chapter.comments.length === 0) ? (
                            <p className="text-gray-500 text-sm text-center py-8 ">
                                {phrase(dictionary, "noComments", language)}
                            </p>
                        ) : (
                            chapter.comments.map((comment) => (
                                <CommentThread key={comment.id} comment={comment} />
                            ))
                        )}

                    </div>
                ))
            )}
        </div>
    );
}
