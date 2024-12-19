"use client"
import { useEffect, useState } from 'react';
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

// user could be undefined if not logged in
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
    const [key1, setKey1] = useState(1000);
    const [key2, setKey2] = useState(2000);
    const [key3, setKey3] = useState(3000);
    const { language, dictionary } = useLanguage();
    const [repliesKey, setRepliesKey] = useState(4000);
    const [chapterTitle, setChapterTitle] = useState("");
    const MAX_CHARS = 500;

    useEffect(() => {
        setKey1(prevKey => prevKey + 1)
        setKey2(prevKey => prevKey + 1)
        setKey3(prevKey => prevKey + 1)
    }, [language])

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

    useEffect(() => {
        const fetchComments = async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_comments?chapter_id=${chapterId}`)
            const data = await response.json();
            if (Array.isArray(data)) {
                setAllComments(data);
                setInitialFetch(true);
            }
        }
        const fetchChapter = async () => {
            const response = await fetch(`/api/get_chapter_by_id?id=${chapterId}`)
            const data = await response.json();
            setChapter(data);
            setChapterTitle(data.title);
            setKey3(prevKey => prevKey + 1) // remount OtherTranslateComponent with retrieved chapter title
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

    return (
        loaded &&
        <div className='max-w-md flex flex-col items-left mx-auto space-y-4 p-4'>
            <Button
                color='gray'
                variant='text'
                onClick={() => window.history.back()}
                // href={`/chapter_view/${chapterId}`} 
                className='w-full'>
                <div className="flex flex-row !items-left justify-start flex-1">
                    <ChevronLeftIcon className="w-6 h-6" />
                    <OtherTranslateComponent content={chapterTitle} elementId={chapterId} elementType='chapter' elementSubtype="title" />
                </div>
            </Button>
            <div className='flex flex-col'>
                {/* comments  */}
                <form onSubmit={handleAddComment}>
                    <div className='flex flex-col'>

                        <textarea
                            value={commentContent}
                            rows={6}
                            className='textarea rounded-t-xl focus:ring-[#DB2777] w-full resize-none border border-gray-300 text-black dark:text-black'
                            onChange={(e) => setCommentContent(e.target.value)}
                            placeholder={phrase(dictionary, "typeYourComment", language)}

                        />
                        <div className='border-gray-400 border border-t-0 flex justify-end rounded-b-xl'>
                            <span className={`justify-start self-start mr-4 mt-[9px] ${
                                commentContent.length >= MAX_CHARS ? 'text-[#DB2777]' : 
                                commentContent.length >= MAX_CHARS * 0.8 ? 'text-yellow-500' : 
                                'text-gray-300'
                            }`}>
                                character {commentContent.length}/{MAX_CHARS}
                            </span>
                            <button type="submit" className='group/item rounded-br-xl bg-[#DB2777] px-4 py-3 group-hover/item:bg-pink-200'>

                                <i className="fa-solid fa-paper-plane group-hover/item:text-white" aria-hidden="true"></i>
                            </button>
                        </div>

                    </div>
                </form>

                <div className='mt-4'>
                    <ul>
                        {allComments.map((comment, index) => (
                            (!comment.parent_id) ? (
                                <div key={`comment-${comment.id}`} className='flex flex-col py-3'>
                                    <Link href={`/view_profile/${comment.user.id}`}>
                                        <li className='font-extrabold mb-2 text-slate-600'>{comment.user.nickname}</li>

                                    </Link>
                                    <li className='flex justify-between w-full'>
                                        <OtherTranslateComponent
                                            key={`translate-comment-${comment.id}`}
                                            content={comment.content}
                                            elementId={comment.id.toString()}
                                            elementType='comment'
                                        />
                                        <div className='flex justify-end space-x-4'>
                                            {comment.user.email_hash === createEmailHash(email) &&
                                                <a href="#">
                                                    <i onClick={() => handleDeleteComment(comment.id.toString())} className='fa-solid fa-trash mb-3'></i>
                                                </a>
                                            }
                                            <a href="#">
                                                <i onClick={() => updateShowForm(index, !showForm[index])} className='fa-solid fa-reply mb-3'></i>
                                            </a>
                                        </div>
                                    </li>
                                    <hr />
                                    <li className='ml-4 py-3'>
                                        {comment.replies ? comment.replies.map((reply) => (
                                            <div key={`reply-${reply.id}`}>
                                                <li className='font-extrabold mb-2 text-slate-600'>{reply.user.nickname}</li>
                                                <div className='flex justify-between'>
                                                    <li className='mb-2'>
                                                        <OtherTranslateComponent
                                                            key={`translate-reply-${reply.id}`}
                                                            content={reply.content}
                                                            elementId={reply.id.toString()}
                                                            elementType='comment'
                                                        />
                                                    </li>
                                                    {reply.user.email_hash === createEmailHash(email) &&
                                                        <a href="#">
                                                            <i onClick={() => handleDeleteComment(reply.id.toString())} className='fa-solid fa-trash mb-3'></i>
                                                        </a>
                                                    }
                                                </div>
                                                <hr />
                                            </div>
                                        )) : <></>}
                                    </li>
                                    <li>
                                        {showForm[index] ? (
                                            <form id={`replyForm.${index}`} onSubmit={handleReply}>
                                                <div className='flex flex-row space-x-4 ml-4 '>

                                                    <svg xmlns="http://www.w3.org/2000/svg"
                                                        width="24" height="24"
                                                        viewBox="0 0 24 24" fill="none"
                                                        stroke="currentColor" stroke-width="2"
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        className="lucide lucide-corner-down-right"
                                                    >
                                                        <polyline points="15 10 20 15 15 20" /><path d="M4 4v7a4 4 0 0 0 4 4h12" />
                                                    </svg>

                                                    <textarea
                                                        value={replyContent[index]}
                                                        rows={1}
                                                        className='textarea rounded focus:ring-[#DB2777] w-full resize-none border border-gray-300 text-black dark:text-black'
                                                        onChange={(e) => updateReplyContent(index, e.target.value)}
                                                    />
                                                    <button type="submit" className=''>
                                                        <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </form>
                                        )
                                            : <></>
                                        }
                                    </li>
                                </div>
                            ) : <></>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default CommentsComponent;