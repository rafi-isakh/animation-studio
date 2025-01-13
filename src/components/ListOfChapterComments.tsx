'use client'
import { Webnovel, Comment as CommentType, Chapter, Webtoon, WebtoonChapter } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from '@/utils/phrases';
import moment from 'moment';
import { FC, useEffect, useState } from "react";
import { ElementType } from "@/components/Types";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react";
import { getImageUrl } from "@/utils/urls";
import Image from "next/image";

interface ListOfChapterCommentsProps {
    content: Webnovel | Webtoon;
    chapter: Chapter | WebtoonChapter;
    webnovelOrWebtoon: boolean;
}


export const ListOfChapterComments: FC<ListOfChapterCommentsProps> = ({ content, chapter, webnovelOrWebtoon }) => {
    const { dictionary, language } = useLanguage();
    const [key, setKey] = useState(0);
    const [otherTranslationType, setOtherTranslationType] = useState<ElementType>('chapter' as ElementType);
    const { email, nickname } = useUser();
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        console.log("content", content)
        if (webnovelOrWebtoon) {
            setOtherTranslationType('chapter' as ElementType);
            console.log("setting other translation type to chapter")
        }
        else {
            setOtherTranslationType('webtoon_chapter' as ElementType);
            console.log("setting other translation type to webtoon_chapter")
        }
    }, [content])

    useEffect(() => {
        setKey(prev => prev + 1);
    }, [language])

    // Sort chapters by creation date if needed
    const sortedChapters = [...(content?.chapters || [])].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const chapterIndexMap = new Map(
        sortedChapters.map((chapter, index) => [chapter.id.toString(), index + 1])
    );

    const CommentThread: FC<{ comment: CommentType }> = ({ comment }) => {
        return (
            <div className="mb-4 gap-3">
                <div className="border-b">
                    <div className="flex flex-row justify-start items-center gap-2 mb-1">
                    {comment.user.picture ? (
                        <Image
                            src={getImageUrl(comment.user.picture)}
                            alt={comment.user.nickname || 'User'}
                            width={32}
                            height={32}
                            className='rounded-full w-8 h-8 self-center'
                        />
                        ) : (
                            <div className="bg-gray-400 rounded-full w-8 h-8 flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-gray-100 rounded-full"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                        )}
                        
                        <div className="flex flex-col text-[16px] font-semibold">
                            <p>  
                                {comment.user.nickname 
                                    ? (comment.user.nickname.length > 20 
                                        ? `${comment.user.nickname.slice(0, 20)}...`
                                        : comment.user.nickname)
                                        : 'Anonymous'
                                }
                            </p>
                            <div className="text-[10px] mt-1">
                            {moment(new Date(comment?.created_at)).format('YYYY/MM/DD')}
                          </div>
                        </div>
                    </div>
                    <p className="text-gray-700 py-10">{comment.content ?? ''}</p>
                    <div className="flex justify-end self-end gap-2 mb-3">
                        <button className="flex flex-row gap-2 items-center 
                                             text-[10px]  px-2 py-2
                                            bg-gray-100 rounded-md 
                                            dark:text-gray-700 text-gray-700">
                           <Heart size={10} className='text-gray-600' /> {comment.upvotes ?? 0}
                        </button>
                    </div>
                </div>

                {/* Render replies */}
                {comment.replies && comment.replies.length > 0 ? (
                    comment.replies.map((reply) => (
                        <div 
                            key={`reply-${reply.id}`} 
                            className="ml-10 p-2 border-l-2 border-gray-300 mb-3 bg-gray-50 "
                             >
                            <div className="flex flex-row items-center justify-between">
                                <span className="font-extrabold text-slate-600">
                                    {reply.user.nickname 
                                        ? (reply.user.nickname.length > 20 
                                            ? `${reply.user.nickname.slice(0, 20)}...`
                                            : reply.user.nickname)
                                        : 'Anonymous'
                                    }
                                </span>
                                <div className="text-[10px] text-gray-500">
                                    {moment(new Date(reply.created_at)).format('YYYY/MM/DD')}
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 mt-2">{reply.content}</p>
                            <div className="flex justify-end gap-2 mt-2">
                                <button 
                                    className="flex flex-row gap-2 items-center text-[10px] px-2 py-2 bg-gray-200 rounded-md dark:text-gray-700 text-gray-700"
                                >
                                    <Heart size={10} className='text-gray-600' />{reply.upvotes ?? 0}
                                </button>
                            </div>
                        </div>
                    ))
                ) : null}
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
                            {phrase(dictionary, "comments", language)} <OtherTranslateComponent content={chapter.title} elementId={chapter.id.toString()} elementType={otherTranslationType} />
                        </h3>
                        {(!chapter.comments || chapter.comments.length === 0) ? (
                            <p className="text-gray-500 text-sm text-center py-8 ">
                                {phrase(dictionary, "noComments", language)}
                            </p>
                        ) : (
                            chapter.comments.map((comment) => (
                                comment.parent_id === null ? (
                                    <div key={`comment-${comment.id}`} className="mb-4">
                                        <div className="p-2 border-b border-gray-200">
                                            <div className="flex flex-row items-center justify-between">
                                      
                                          <div className="flex flex-row gap-2">
                                            {comment.user.picture ? (
                                                    <Image
                                                        src={getImageUrl(comment.user.picture)}
                                                        alt={comment.user.nickname || 'User'}
                                                        width={32}
                                                        height={32}
                                                        className='rounded-full w-8 h-8 self-center'
                                                    />
                                                    ) : (
                                                        <div className="bg-gray-400 rounded-full w-8 h-8 flex items-center justify-center">
                                                            <svg
                                                                className="w-8 h-8 text-gray-100 rounded-full"
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                                            </svg>
                                                        </div>
                                                    )}
                                                      
                                                <span className="font-extrabold text-slate-600">
                                                    {comment.user.nickname 
                                                        ? (comment.user.nickname.length > 20 
                                                            ? `${comment.user.nickname.slice(0, 20)}...`
                                                            : comment.user.nickname)
                                                        : 'Anonymous'
                                                    }
                                                </span>
                                               </div>
                                                <div className="text-[10px] text-gray-500">
                                                    {moment(new Date(comment.created_at)).format('YYYY/MM/DD')}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-2 py-5">{comment.content}</p>
                                            <button className="flex flex-row gap-2 items-center 
                                                             text-[10px] mb-2
                                                            dark:text-gray-700 text-gray-700">
                                            <Heart size={10} className='text-gray-600' /> {comment.upvotes ?? 0}
                                            </button>

                                            <div className="mt-2">
                                                {chapter.comments
                                                    .filter(reply => reply.parent_id === comment.id)
                                                    .map(reply => (
                                                        <div 
                                                            key={`reply-${reply.id}`} 
                                                            className="ml-10 p-2 border-l-2 border-gray-300 mb-3 bg-gray-50"
                                                        >
                                                            <div className="flex flex-row items-center justify-between">

                                                            <div className="flex flex-row gap-2">
                                                                {reply.user.picture ? (
                                                                    <Image
                                                                        src={getImageUrl(reply.user.picture)}
                                                                        alt={reply.user.nickname || 'User'}
                                                                        width={32}
                                                                        height={32}
                                                                    className='rounded-full w-8 h-8 self-center'
                                                                />
                                                                ) : (
                                                                    <div className="bg-gray-400 rounded-full w-8 h-8 flex items-center justify-center">
                                                                        <svg
                                                                            className="w-8 h-8 text-gray-100 rounded-full"
                                                                            fill="currentColor"
                                                                            viewBox="0 0 20 20"
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                        >
                                                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                                
                                                                
                                                                <span className="font-extrabold text-slate-600">
                                                                    {reply.user.nickname 
                                                                        ? (reply.user.nickname.length > 20 
                                                                            ? `${reply.user.nickname.slice(0, 20)}...`
                                                                            : reply.user.nickname)
                                                                        : 'Anonymous'
                                                                    }
                                                                </span>
                                                             </div>
                                                                <div className="text-[10px] text-gray-500">
                                                                    {moment(new Date(reply.created_at)).format('YYYY/MM/DD')}
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-gray-700 mt-2">{reply.content}</p>
                                                            <div className="flex justify-end gap-2 mt-2">
                                                                <button className="flex flex-row gap-2 items-center text-[10px] px-2 py-2 bg-gray-200 rounded-md dark:text-gray-700 text-gray-700">
                                                                    <Heart size={10} className='text-gray-600' />
                                                                    {reply.upvotes ?? 0}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    </div>
                                ) : null
                            ))
                        )}

                    </div>
                ))
            )}
        </div>
    );
}
