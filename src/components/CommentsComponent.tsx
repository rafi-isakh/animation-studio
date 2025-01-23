"use client"
import { useEffect, useState, useRef } from 'react';
import { Chapter, Comment } from '@/components/Types'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import OtherTranslateComponent from './OtherTranslateComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { Button } from '@mui/material';
import { phrase } from '@/utils/phrases';
import { createEmailHash } from '@/utils/cryptography';
import Image from 'next/image';
import { Flag, Ellipsis, CircleHelp, Trash, Send, Redo2, CornerDownRight, Heart } from 'lucide-react';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import moment from 'moment';
import { getImageUrl } from '@/utils/urls';

const CommentsComponent = ({ chapterId, webnovelOrWebtoon }: { chapterId: string, webnovelOrWebtoon: boolean }) => {
    const [commentContent, setCommentContent] = useState('');
    const [allComments, setAllComments] = useState<Comment[]>([]);
    const [chapter, setChapter] = useState<Chapter>();
    const { email, nickname } = useUser();
    const { isLoggedIn } = useAuth();
    const [replyContent, setReplyContent] = useState<string[]>([]);
    const [showForm, setShowForm] = useState<Boolean[]>([]);
    const [initialFetch, setInitialFetch] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const router = useRouter();
    const { language, dictionary } = useLanguage();
    const [repliesKey, setRepliesKey] = useState(4000);
    const [chapterTitle, setChapterTitle] = useState("");
    const MAX_CHARS = 500;
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [openReplyDropdownId, setOpenReplyDropdownId] = useState<string | null>(null);
    const replyDropdownRef = useRef<HTMLDivElement>(null);

    const handleAddComment = async (event: React.FormEvent) => {
        event.preventDefault();
        if (commentContent) {
            if (!isLoggedIn) {
                router.push('/signin')
            } else {
                var newComment = {
                    "id": null,
                    "parent_id": null,
                    "email": email,
                    "content": commentContent,
                    "upvotes": 0,
                    "chapter_id": chapterId,
                    "replies": [],
                    "webnovel_or_webtoon": webnovelOrWebtoon
                }

                const response = await fetch(`/api/add_comment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newComment),
                });
                if (!response.ok) {
                    console.error("Error adding comment");
                }
                let comments_sans_replies;
                if (webnovelOrWebtoon) {
                    comments_sans_replies = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_comments?chapter_id=${chapterId}`)
                        .then(data => data.json())
                }
                else {
                    comments_sans_replies = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webtoon_comments?chapter_id=${chapterId}`)
                        .then(data => data.json())
                }

                if (Array.isArray(comments_sans_replies)) {
                    setAllComments(comments_sans_replies);
                    setRepliesKey(prevKey => prevKey + 1)
                }
                setCommentContent('');
            }
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const commentsBackup = JSON.parse(JSON.stringify(allComments));
        const updatedComments = allComments.filter(comment => comment.id.toString() !== commentId);
        for (const comment of updatedComments) {
            const updatedReplies = comment.replies?.filter(reply => reply.id.toString() !== commentId);
            comment.replies = updatedReplies;
        }
        console.log(updatedComments)
        setAllComments(updatedComments);
        const response = await fetch(`/api/delete_comment?id=${commentId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            setAllComments(commentsBackup);
            console.error("Error deleting comment");
        }
    }

    const handleUpvoteComment = async (commentId: string) => {
    }

    useEffect(() => {
        const fetchComments = async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_comments?chapter_id=${chapterId}&webnovel_or_webtoon=${webnovelOrWebtoon}`)
            const data = await response.json();
            if (Array.isArray(data)) {
                setAllComments(data);
                setInitialFetch(true);
            }
        }
        const fetchChapter = async () => {
            const response = await fetch(`/api/get_chapter_by_id?id=${chapterId}&webnovel_or_webtoon=${webnovelOrWebtoon}`)
            const data = await response.json();
            setChapter(data);
            setChapterTitle(data.title);
        }
        fetchComments();
        fetchChapter();

    }, [chapterId]);

    useEffect(() => {
        const fetchReplies = async () => {
            allComments.map((comment, index) => {
                setAllReplies(index); //fetches in this fn
            })
            setLoaded(true);
        }
        fetchReplies();
    }, [initialFetch, repliesKey])

    const updateShowForm = (index: number, value: boolean) => {
        setShowForm(prevState => {
            const newState = [...prevState];
            newState[index] = value;
            return newState;
        });
    };

    const updateReplyContent = (index: number, value: string) => {
        setReplyContent(prevState => {
            const newState = [...prevState];
            newState[index] = value;
            return newState;
        });
    };

    const handleReply = async (event: React.FormEvent) => {
        event.preventDefault();
        const index = event.currentTarget.id.split('.')[1] as unknown as number
        const commentContent = replyContent[index]
        if (commentContent) {
            if (!isLoggedIn) {
                router.push('/signin')
            } else {
                const parent_comment_id = allComments[index].id;
                var newComment = {
                    "id": null,
                    "parent_id": parent_comment_id,
                    "email": email,
                    "content": commentContent,
                    "upvotes": 0,
                    "chapter_id": chapterId,
                    "replies": [],
                    "webnovel_or_webtoon": webnovelOrWebtoon
                }

                const response = await fetch(`/api/add_comment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newComment),
                });

                if (!response.ok) {
                    console.error("Error adding comment");
                }

                setAllReplies(index);
                updateReplyContent(index, '');
            }
        }
    }

    const setAllReplies = async (parent_index: number) => {
        const parent_comment_id = allComments[parent_index].id;
        if (parent_comment_id != -1) {
            const parent_replies = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/${parent_comment_id}/replies`)
                .then(data => data.json());
            if (parent_replies.length > 0) {
                setAllComments(prevComments => {
                    // Create a new array of comments with updated replies
                    const updatedComments = prevComments.map(comment => ({
                        ...comment,
                        replies: comment.id === parent_comment_id ? parent_replies : comment.replies
                    }));
                    return updatedComments;
                });
            }
        }
    }

    const toggleUserDropdown = (e: React.MouseEvent<HTMLButtonElement>, commentId: string) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === commentId ? null : commentId);
    };

    // Add click handler to close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleReplyDropdown = (e: React.MouseEvent<HTMLButtonElement>, replyId: string) => {
        e.stopPropagation();
        setOpenReplyDropdownId(openReplyDropdownId === replyId ? null : replyId);
    };


    return (
        loaded &&
        <div className='md:max-w-screen-md w-full flex flex-col items-left mx-auto space-y-4 p-4'>
            <Button
                color='gray'
                variant='text'
                onClick={() => window.history.back()}
                // href={`/chapter_view/${chapterId}`} 
                className='w-full'>
                <div className="flex flex-row !items-left justify-start flex-1">
                    <ChevronLeftIcon className="w-6 h-6" />
                    <OtherTranslateComponent content={chapterTitle} elementId={chapterId} elementType={webnovelOrWebtoon ? 'chapter' : 'webtoon_chapter'} elementSubtype="title" />
                </div>
            </Button>
            <div className='flex flex-col'>
                {/* comments  */}
                <form onSubmit={handleAddComment}>
                    <div className='flex flex-col'>

                        <textarea
                            value={commentContent}
                            rows={6}
                            className='textarea rounded-t-xl focus:ring-[#DB2777] w-full resize-none border border-gray-300 text-black dark:text-white bg-white dark:bg-black'
                            onChange={(e) => setCommentContent(e.target.value)}
                            placeholder={phrase(dictionary, "typeYourComment", language)}

                        />
                        <div className='border-gray-300 border border-t-0 flex justify-end rounded-b-xl'>
                            <span className={`justify-start self-start mr-4 mt-[9px] ${commentContent.length >= MAX_CHARS ? 'text-[#DB2777]' :
                                commentContent.length >= MAX_CHARS * 0.8 ? 'text-yellow-500' :
                                    'text-gray-400'
                                }`}>
                                character {commentContent.length}/{MAX_CHARS}
                            </span>
                            <button type="submit" className='group/item rounded-br-xl bg-[#DB2777] px-4 py-3 group-hover/item:bg-[#FFE2DC]'>
                                <Send size={20} className="dark:text-white text-white" />
                            </button>
                        </div>

                    </div>
                </form>

                <div className='mt-10'>
                    <p className='uppercase text-gray-300'> comment ({allComments.length}) </p>
                    <hr className='border-gray-300 mb-4' />
                    {allComments.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            {phrase(dictionary, "noComments", language) || "No comments yet"}
                        </div>
                    ) : (
                        <div>
                            {allComments.map((comment, index) => (
                                (!comment.parent_id) ? (
                                    <div key={`comment-${comment.id}`} className='flex flex-col py-3'>
                                        <div className="flex flex-row gap-2 justify-between">
                                            <div className='flex flex-row gap-2 items-center'>
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

                                                <Link href={`/view_profile/${comment.user.id}`}>
                                                    <div className='flex flex-col font-extrabold mb-2 text-slate-600'>
                                                        <p> {comment.user.nickname.length > 20
                                                            ? `${comment.user.nickname.slice(0, 20)}...`
                                                            : comment.user.nickname
                                                        }
                                                        </p>
                                                        <span className='text-gray-500 text-[10px]'>
                                                            {moment(comment.created_at).format('YYYY/MM/DD hh:mm')}
                                                        </span>
                                                    </div>
                                                </Link>
                                            </div>

                                            <div className="relative flex flex-row gap-2 items-center">
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
                                                                    top-5 mt-2 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y
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
                                                            <li className="px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-600 group/user-dropdown transition duration-150 ease-in-out">
                                                                {comment.user.email_hash === createEmailHash(email) &&
                                                                    <Link
                                                                        href="#"
                                                                        onClick={() => handleDeleteComment(comment.id.toString())}
                                                                        className='flex items-center gap-2 dark:text-white text-black
                                                                         dark:group-hover/user-dropdown:text-black'>
                                                                        <Trash size={20} className="dark:text-white text-black" />
                                                                        {phrase(dictionary, "delete", language)}
                                                                    </Link>
                                                                }
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className='flex justify-between w-full py-4'>
                                            <div className='flex flex-col gap-8'>
                                                <OtherTranslateComponent
                                                    key={`translate-comment-${comment.id}`}
                                                    content={comment.content}
                                                    elementId={comment.id.toString()}
                                                    elementType='comment'
                                                />

                                                <div className="flex flex-row gap-4 items-center">
                                                    <div className='flex flex-row gap-1 items-center'>
                                                        <Heart onClick={() => handleUpvoteComment(comment.id.toString())} size={16} className='text-gray-600' />
                                                        {/* <span className='text-gray-600'> {phrase(dictionary, "likes", language)} </span> */}
                                                        <span className='text-[#DB2777] text-sm'>{comment.upvotes} </span>
                                                    </div>

                                                    <Link
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            updateShowForm(index, !showForm[index])
                                                        }}
                                                        className='flex flex-row gap-2 items-center hover:opacity-80 transition duration-150 ease-in-out'>
                                                        <Redo2 size={16} className='text-gray-600' />
                                                        {/* Reply */}
                                                        <span className='text-gray-600 text-sm'>  {phrase(dictionary, "reply", language)}</span>
                                                    </Link>
                                                </div>


                                            </div>
                                            <div className='flex justify-end space-x-4'>
                                            </div>
                                        </div>
                                        <hr />
                                        <div className='ml-4 py-3'>
                                            {/* replies */}
                                            {
                                                comment.replies ? comment.replies.map((reply) => (
                                                    <div key={`reply-${reply.id}`}>
                                                        <div className='flex flex-row justify-between'>

                                                            <div className='flex flex-row gap-2 items-center'>
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
                                                                <div className='flex flex-col mb-2 text-slate-600'>
                                                                    <p className='font-extrabold text-slate-600'>
                                                                        {reply.user.nickname.length > 20
                                                                            ? `${reply.user.nickname.slice(0, 20)}...`
                                                                            : reply.user.nickname
                                                                        }
                                                                    </p>
                                                                    <p className='text-gray-500 text-[10px]'>
                                                                        {moment(reply.created_at).format('YYYY/MM/DD hh:mm')}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="relative flex flex-row gap-2 items-center">
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
                                                                            top-5 mt-2 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y
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
                                                                            <li className="px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-600 group/user-dropdown transition duration-150 ease-in-out">
                                                                                {reply.user.email_hash === createEmailHash(email) &&
                                                                                    <Link
                                                                                        href="#"
                                                                                        onClick={() => handleDeleteComment(reply.id.toString())}
                                                                                        className='flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black'>
                                                                                        <Trash size={20} className="dark:text-white text-black" />
                                                                                        {phrase(dictionary, "delete", language)}
                                                                                    </Link>
                                                                                }
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>

                                                        </div>

                                                        <div className='flex justify-between py-5'>
                                                            <div className='flex flex-col gap-8'>
                                                                <OtherTranslateComponent
                                                                    key={`translate-reply-${reply.id}`}
                                                                    content={reply.content}
                                                                    elementId={reply.id.toString()}
                                                                    elementType='comment'
                                                                />

                                                                <p className='flex flex-row gap-2 items-center'>
                                                                    <Heart size={16} className='text-gray-600' />
                                                                    {/* <span className='text-gray-600'> {phrase(dictionary, "likes", language)} </span> */}
                                                                    <span className='text-[#DB2777]'>{reply.upvotes} </span>
                                                                </p>
                                                            </div >

                                                        </div >
                                                        {/* each reply has a horizontal line with margin-bottom 2 */}
                                                        < hr className='mb-2' />
                                                    </div >
                                                )) : <></>}
                                        </div >
                                        <div>
                                            {showForm[index] ? (
                                                <form id={`replyForm.${index}`} onSubmit={handleReply}>
                                                    <div className='flex flex-row space-x-4 ml-4 '>
                                                        {/* arrow icon in reply form */}
                                                        <CornerDownRight size={25} className='text-black dark:text-white' />
                                                        {/* reply textarea */}
                                                        <textarea
                                                            value={replyContent[index]}
                                                            rows={1}
                                                            className='textarea rounded focus:ring-[#DB2777] w-full bg-white dark:bg-black
                                                                        resize-none border border-gray-300 text-black dark:text-white'
                                                            onChange={(e) => updateReplyContent(index, e.target.value)}
                                                        />
                                                        {/* send button */}
                                                        <button type="submit">
                                                            <Send size={20} className="dark:text-white text-black" />
                                                        </button>
                                                    </div>
                                                </form>
                                            )
                                                : <></>
                                            }
                                        </div>
                                    </div >
                                ) : <></>
                            ))}
                        </div >
                    )}
                </div >
            </div >
        </div >
    )
}

export default CommentsComponent;