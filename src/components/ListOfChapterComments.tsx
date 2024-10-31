'use client'
import { Webnovel, Comment as CommentType, Chapter } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from '@/utils/phrases';
import moment from 'moment';
import { FC } from "react";

interface ListOfChapterCommentsProps {
    webnovel: Webnovel;
}

export const ListOfChapterComments: FC<ListOfChapterCommentsProps> = ({ webnovel }) => {
    const { dictionary, language } = useLanguage();
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
                        <button className="text-[10px] px-2 py-2 bg-gray-100 rounded-md">
                        <span> <i className="fa-regular fa-heart mr-1"></i> {comment.upvotes ?? 0}</span>
                        </button>
                    </div>
                </div>

                {/* Render replies recursively */}
                {comment.replies?.map((reply) => (
                    <div key={reply.id} className="pl-4 ml-4">
                       <CommentThread comment={reply} />
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
                        <h3 className="text-sm font-semibold mb-4 border-b pb-4">
                            {chapter.title}
                            {language == 'ko' ? <>{' '}에 달린 댓글</> : <>{' '}comments</>}

                            <span className="text-gray-500 text-[9px]"> Chapter {index + 1} </span> 
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
