'use client'
import { Webnovel, Comment as CommentType, Chapter, Webtoon, WebtoonChapter } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from '@/utils/phrases';
import moment from 'moment';
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { ElementType } from "@/components/Types";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { Ellipsis, Heart, Flag, Trash, Redo2 } from "lucide-react";
import { getImageUrl } from "@/utils/urls";
import Image from "next/image";
import Link from "next/link";
import { createEmailHash } from '@/utils/cryptography';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';


interface CommentListProps {
    content: Webnovel | Webtoon;
    chapter: Chapter | WebtoonChapter;
    webnovelOrWebtoon: boolean;
}

export const CommentList: FC<CommentListProps> = ({ content, chapter, webnovelOrWebtoon }) => {
    const [allComments, setAllComments] = useState<CommentType[]>([]);
    const { dictionary, language } = useLanguage();
    const [key, setKey] = useState(0);
    const [otherTranslationType, setOtherTranslationType] = useState<ElementType>('chapter' as ElementType);
    const { email, nickname } = useUser();
    const { isLoggedIn } = useAuth();
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [openReplyDropdownId, setOpenReplyDropdownId] = useState<string | null>(null);
    const replyDropdownRef = useRef<HTMLDivElement>(null);
    const [showForm, setShowForm] = useState<{ [key: string]: boolean }>({});
    const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
<<<<<<< Updated upstream
        console.log("content", content)
        if (webnovelOrWebtoon) {

            const allComments = content.chapters.flatMap(chapter => chapter.comments || []);
            setAllComments(allComments);

            setOtherTranslationType('chapter' as ElementType);
            console.log("setting other translation type to chapter")
        }
        else {
            setOtherTranslationType('webtoon_chapter' as ElementType);
            console.log("setting other translation type to webtoon_chapter")
            setAllComments(chapter.comments || []);
        }
    }, [content, chapter, webnovelOrWebtoon])

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

    const toggleUserDropdown = (e: React.MouseEvent<HTMLButtonElement>, commentId: string) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === commentId ? null : commentId);
    };

    // Add click handler to close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const clickedElement = event.target as Node;
            
            // Check if click was outside any open dropdown
            const isOutsideDropdowns = !Object.values(dropdownRefs.current).some(
                ref => ref && ref.contains(clickedElement)
            );

            if (isOutsideDropdowns) {
                setOpenDropdownId(null);
                setOpenReplyDropdownId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

     // Helper function to store refs
     const setDropdownRef = useCallback((element: HTMLDivElement | null, id: string) => {
        if (element) {
            dropdownRefs.current[id] = element;
        }
    }, []);


    const toggleReplyDropdown = (e: React.MouseEvent<HTMLButtonElement>, replyId: string) => {
        e.stopPropagation();
        setOpenReplyDropdownId(openReplyDropdownId === replyId ? null : replyId);
    };

    const updateShowForm = (commentId: string, value: boolean) => {
        setShowForm(prev => ({
            ...prev,
            [commentId]: value
        }));
    };
    
=======
        const _sortedChapters = [...(content?.chapters || [])].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setSortedChapters(_sortedChapters as Chapter[]);
    }, [content])
>>>>>>> Stashed changes

    return (
        <div className="">
            {sortedChapters.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                    {phrase(dictionary, "noComments", language)}
                </p>
            ) : (
                sortedChapters
                    .filter(chapter => chapter.comments && chapter.comments.length > 0)
                    .map((chapter, index) => (
                        <div key={chapter.id} className="bg-gray-100 dark:bg-gray-900 first:rounded-t-lg last:rounded-b-lg p-4">
                            <div className="text-sm font-semibold mb-4 border-b  border-gray-200 dark:border-gray-700 pb-2 flex flex-row justify-between" >
                                <div className="flex flex-row gap-2 justify-center items-center">
                                    <p className="text-sm text-gray-500 self-center">
                                    {/* chapter title */}
                                     <OtherTranslateComponent content={chapter.title} elementId={chapter.id.toString()} elementType={otherTranslationType} />
                                    </p>
                                    {/* comment count*/}
                                    <p className="text-sm text-gray-500 self-center justify-center">({chapter.comments.length})</p>
                                </div>
                            </div>
                            {chapter.comments.map((comment) => (
                                comment.parent_id === null ? (
                                    <div key={`comment-${comment.id}`} className="mb-4">
                                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
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
                                                    <div className="flex flex-col">
                                                        <span className="font-extrabold text-slate-600">
                                                            {comment.user.nickname
                                                                ? (comment.user.nickname.length > 20
                                                                    ? `${comment.user.nickname.slice(0, 20)}...`
                                                                    : comment.user.nickname)
                                                                : 'Anonymous'
                                                            }
                                                        </span>
                                                        <div className="text-[10px] text-gray-500">
                                                            {moment(new Date(comment.created_at)).format('YYYY/MM/DD')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="relative flex flex-row gap-2 items-center"  ref={(el) => setDropdownRef(el, `comment-${comment.id}`)}>
                                                    <button
                                                        onClick={(e) => toggleUserDropdown(e, comment.id.toString())}
                                                        className=" bg-transparent text-black rounded-full hover:opacity-80 transition duration-150 ease-in-out">
                                                        <Ellipsis size={20} className="text-gray-600" />
                                                    </button>
                                                    {openDropdownId === comment.id.toString() && (
                                                        <div
                                                            id={`user-dropdown-${comment.id}`}
                                                            ref={userDropdownRef}
                                                            className={`absolute no-underline rounded-md md:border-0 border border-gray-400 
                                                                    right-0 top-5 mt-2 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y
                                                                  divide-gray-100 shadow w-32 dark:divide-gray-600`}>
                                                            <ul className="py-2 text-sm text-gray-700 dark:text-black no-underline" aria-labelledby="dropdownLargeButton">
                                                                <li className="px-3 py-2 hover:bg-gray-200  dark:hover:bg-gray-600 group/user-dropdown transition duration-150 ease-in-out">
                                                                    <Tooltip title={phrase(dictionary, "preparing", language)} followCursor>
                                                                        <Link href="#" className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black">
                                                                            <Flag size={20} className="dark:text-white text-black" />
                                                                            {phrase(dictionary, "report", language)}
                                                                        </Link>
                                                                    </Tooltip>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm text-gray-500 py-5">{comment.content}</p>
                                            
                                            </div>

                                            <div className="flex flex-row gap-2 items-center">
                                                <button className="flex flex-row gap-1 items-center 
                                                             text-[10px]
                                                            dark:text-gray-700 text-gray-700">
                                                    <Heart size={16} className='text-gray-600' />
                                                    <span className='text-[#DB2777] text-sm'>{comment.upvotes} </span>
                                                    {/* {comment.upvotes ?? 0} */}
                                                </button>

                                                <Link
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        updateShowForm(comment.id.toString(), !showForm[comment.id.toString()])
                                                    }}
                                                    className='flex flex-row gap-1 items-center hover:opacity-80 transition duration-150 ease-in-out'>
                                                    <Redo2 size={16} className='text-gray-600' />
                                                    {/* Reply */}
                                                    <span className='text-gray-600 text-sm'>
                                                        {chapter.comments.filter(reply => reply.parent_id === comment.id).length}
                                                    </span>
                                                </Link>
                                            </div>


                                            {showForm[comment.id.toString()] ? (
                                                <div className="mt-2">
                                                    {chapter.comments
                                                        .filter(reply => reply.parent_id === comment.id)
                                                        .map(reply => (
                                                            <div
                                                                key={`reply-${reply.id}`}
                                                                className="ml-10 p-2 border-l-2 border-gray-300 mb-3 bg-gray-50 dark:bg-gray-800"
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
                                                                        <div className="flex flex-col">
                                                                            <span className="font-extrabold text-slate-600">
                                                                                {comment.user.nickname
                                                                                    ? (comment.user.nickname.length > 20
                                                                                        ? `${comment.user.nickname.slice(0, 20)}...`
                                                                                        : comment.user.nickname)
                                                                                    : 'Anonymous'
                                                                                }
                                                                            </span>
                                                                            <div className="text-[10px] text-gray-500">
                                                                                {moment(new Date(comment.created_at)).format('YYYY/MM/DD')}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="relative flex flex-row gap-2 items-center" ref={(el) => setDropdownRef(el, `reply-${reply.id}`)}>
                                                                        <button
                                                                            onClick={(e) => toggleReplyDropdown(e, reply.id.toString())}
                                                                            className="bg-transparent text-black rounded-full hover:opacity-80 transition duration-150 ease-in-out">
                                                                            <Ellipsis size={20} className="text-gray-600" />
                                                                        </button>
                                                                        {openReplyDropdownId === reply.id.toString() && (
                                                                            <div
                                                                                id={`reply-dropdown-${reply.id}`}
                                                                                ref={replyDropdownRef}
                                                                                className={`absolute no-underline rounded-md md:border-0 border border-gray-400 
                                                                                  right-0 top-5 mt-2 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y
                                                                                divide-gray-100 shadow w-32 dark:divide-gray-600`}>
                                                                                <ul className="py-2 text-sm text-gray-700 dark:text-black no-underline" aria-labelledby="dropdownLargeButton">
                                                                                    <li className="px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-600 group/user-dropdown transition duration-150 ease-in-out">
                                                                                        <Tooltip title={phrase(dictionary, "preparing", language)} followCursor>
                                                                                            <Link href="#" className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black">
                                                                                                <Flag size={20} className="dark:text-white text-black" />
                                                                                                {phrase(dictionary, "report", language)}
                                                                                            </Link>
                                                                                        </Tooltip>
                                                                                    </li>

                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-gray-700 py-5">{reply.content}</p>
                                                                <div className="flex justify-start gap-2 mt-2">
                                                                    <button className="flex flex-row items-center gap-1">
                                                                        <Heart size={16} className='text-gray-600' />

                                                                        <span className='text-[#DB2777] text-sm'>{reply.upvotes ?? 0} </span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )
                                                : <></>
                                            }
                                        </div>
                                    </div>
                                ) : null
                            ))}
                        </div>
                    ))
            )}
        </div>
    );
}
