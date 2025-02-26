"use client"
import { useEffect, useState, useRef } from 'react';
import { Chapter, Comment, ToonyzPost } from '@/components/Types'
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
import { Send, Redo2, CornerDownRight, Heart } from 'lucide-react';
import moment from 'moment';
import { getImageUrl } from '@/utils/urls';
import CommentsDropdownButton from '@/components/UI/CommentsDropdownButton';
import UpvoteButton from '@/components/UI/UpvotedButton';

const ToonyzPostCommentWrapper = ({
    // chapter, 
    post,
}: {
    // chapter?: Chapter,
    post?: ToonyzPost,
}) => {
    const [commentContent, setCommentContent] = useState('');
    const { email, upvotedComments, setUpvotedComments } = useUser();
    const { isLoggedIn } = useAuth();
    const [replyContent, setReplyContent] = useState<string[]>([]);
    const [showForm, setShowForm] = useState<Boolean[]>([]);
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
    const [textareaRows, setTextareaRows] = useState(1);


    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            // Prevent form submission on Enter
            e.preventDefault();
            // Increase rows up to a maximum of 5
            setTextareaRows(prev => Math.min(prev + 1, 5));
        } else if (e.key === 'Backspace' && commentContent.split('\n').length < textareaRows) {
            // Decrease rows when deleting content, but keep minimum of 2
            setTextareaRows(prev => Math.max(prev - 1, 2));
        }
    };


    // Add helper to get the current item's ID and comments
    const getCurrentItem = () => {
        if (post) {
            return {
                id: post.id,
                comments: post.comments || [],
                title: post.title
            };
        }
        return null
    };

    // Update state initializations
    const currentItem = getCurrentItem();
    const [allComments, setAllComments] = useState<Comment[]>(currentItem?.comments || []);

    useEffect(() => {
        for (let i = 0; i < allComments.length; i++) {
            updateAllReplies(i)
        }
    }, [])

    const handleAddComment = async (event: React.FormEvent) => {
        event.preventDefault();
        if (commentContent) {
            if (!isLoggedIn) {
                router.push('/signin')
            } else {
                var newComment = {
                    "parent_id": null,
                    "email": email,
                    "content": commentContent,
                    "upvotes": 0,
                    "chapter_id": post?.id,  // Add post ID
                }
                console.log(newComment)

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
                if (post) {
                    comments_sans_replies = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_post_comments?post_id=${post!.id}`)
                        .then(data => data.json())
                } else {
                    comments_sans_replies = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_post_comments?post_id=${post!.id}`)
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
        const response = await fetch(`/api/upvote_comment?id=${commentId}`);
        if (!response.ok) {
            console.error("Error upvoting comment");
        }
        const data = await response.json();
        const updatedComment = data.comment;

        setAllComments(prevComments => {
            const updatedComments = prevComments.map(comment =>
                comment.id.toString() === commentId ? { ...comment, upvotes: updatedComment.upvotes } : comment
            );
            return updatedComments;
        });
    }

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
                    "chapter_id": post?.id,  // Add post ID
                    "replies": [],

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

                updateAllReplies(index);
                updateReplyContent(index, '');
            }
        }
    }

    const updateAllReplies = async (parent_index: number) => {
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

    // Add click handler to close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
            if (replyDropdownRef.current && !replyDropdownRef.current.contains(event.target as Node)) {
                setOpenReplyDropdownId(null);
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
        <div className='md:max-w-screen-lg w-full flex flex-col items-left mx-auto'>
            <div className='flex flex-col gap-y-5'>
                {/* form to add comment */}
                <form onSubmit={handleAddComment}>
                    <div className='flex flex-col relative'>
                        <textarea
                            value={commentContent}
                            rows={textareaRows}
                            className='textarea text-base rounded-lg focus:ring-[#DB2777] w-full resize-none border border-gray-300 dark:border-gray-700 text-black dark:text-white bg-white dark:bg-[#211F21]'
                            onChange={(e) => setCommentContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={phrase(dictionary, "typeYourComment", language)}
                        />
                        <button 
                            type="submit" 
                            className='absolute right-2 bottom-2 bg-transparent text-black dark:text-white hover:opacity-75 transition-opacity'
                        >
                            <Send size={20} className="text-black dark:text-white" />
                        </button>
                    </div>
                </form>

                <div className='py-1 px-1 rounded-lg bg-gray-100 dark:bg-gray-900'>

                    <div className='flex flex-row justify-start items-center text-gray-500 dark:text-gray-500 px-3 py-3 text-sm font-bold gap-1'>
                        {/* chapter title */}
                        {/* <OtherTranslateComponent content={chapter?.title || post?.title || ''} elementId={chapter?.id.toString() || post?.id.toString() || ''} elementType="chapter" /> */}
                        <p className=' text-gray-500 dark:text-gray-500'> {phrase(dictionary, "comments", language)}{' '}</p>
                        <p className=' text-gray-500 dark:text-gray-500'> ({allComments.length})</p>
                    </div>
                    <hr />
                    {allComments.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            {phrase(dictionary, "noComments", language) || "No comments yet"}
                        </div>
                    ) : (
                        <div>
                            {allComments.map((comment, index) => (
                                (!comment.parent_id) ? (
                                    <div key={`comment-${comment.id}`} className='flex flex-col py-4 px-4'>
                                        <div className="flex flex-row gap-2 justify-between">
                                            <div className='flex flex-row gap-2 justify-start items-center'>
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
                                                    <div className='flex flex-col mb-2 text-slate-600'>
                                                        <p className='font-extrabold'> {comment.user.nickname.length > 20
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
                                                <CommentsDropdownButton
                                                    comment={comment}
                                                    user={comment.user}
                                                    email={email}
                                                    handleDeleteComment={handleDeleteComment}
                                                    createEmailHash={createEmailHash}
                                                />

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
                                                    <UpvoteButton upvotedComments={upvotedComments} setAllComments={setAllComments} commentId={comment.id.toString()} upvotes={comment.upvotes} />

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
                                        <div className='ml-4'>
                                            {/* replies */}
                                            {
                                                comment.replies ? comment.replies.map((reply) => (
                                                    <div key={`reply-${reply.id}`}>
                                                        <div className='flex flex-row justify-between'>

                                                            <div className='flex flex-row gap-2 items-center pt-1 '>
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
                                                                        <Link href={`/view_profile/${reply.user.id}`}>
                                                                            {reply.user.nickname.length > 20
                                                                                ? `${reply.user.nickname.slice(0, 20)}...`
                                                                                : reply.user.nickname
                                                                            }
                                                                        </Link>
                                                                    </p>
                                                                    <p className='text-gray-500 text-[10px]'>
                                                                        {moment(reply.created_at).format('YYYY/MM/DD hh:mm')}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="relative flex flex-row  items-center">
                                                                <CommentsDropdownButton
                                                                    comment={reply}
                                                                    user={reply.user}
                                                                    email={email}
                                                                    handleDeleteComment={handleDeleteComment}
                                                                    createEmailHash={createEmailHash}
                                                                />

                                                            </div>

                                                        </div>

                                                        <div className='flex justify-between'>
                                                            <div className='flex flex-col gap-8 py-2'>
                                                                <OtherTranslateComponent
                                                                    key={`translate-reply-${reply.id}`}
                                                                    content={reply.content}
                                                                    elementId={reply.id.toString()}
                                                                    elementType='comment'
                                                                />

                                                                <UpvoteButton upvotedComments={upvotedComments} setAllComments={setAllComments} commentId={reply.id.toString()} upvotes={reply.upvotes} />
                                                            </div>

                                                        </div >
                                                        {/* each reply has a horizontal line with margin-bottom 2 */}
                                                        <hr className='' />
                                                    </div >
                                                )) : <></>}
                                        </div >

                                        <div>
                                            {showForm[index] ? (
                                                <form id={`replyForm.${index}`} onSubmit={handleReply}>
                                                    <div className='flex flex-row space-x-4 ml-4 pt-2'>
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

export default ToonyzPostCommentWrapper;