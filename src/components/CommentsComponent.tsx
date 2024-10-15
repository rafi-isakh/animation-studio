"use client"
import { useEffect, useRef, useState } from 'react';
import { Chapter, Comment, User, UserCreate } from '@/components/Types'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import OtherTranslateComponent from './OtherTranslateComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { Button } from '@mui/material';
import { phrase } from '@/utils/phrases';

// user could be undefined if not logged in
const CommentsComponent = ({ chapterId }: { chapterId: string }) => {
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
    const {language, dictionary} = useLanguage();
    const [repliesKey, setRepliesKey] = useState(4000);
    const [chapterTitle, setChapterTitle] = useState("");

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
                    "replies": []
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

                const comments_sans_replies = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_comments?chapter_id=${chapterId}`)
                    .then(data => data.json())

                if (Array.isArray(comments_sans_replies)) {
                    setAllComments(comments_sans_replies);
                    setRepliesKey(prevKey => prevKey + 1)
                }

                setCommentContent('');
            }
        }
    };

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
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_chapter_byid?id=${chapterId}`)
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
                    "replies": []
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
            <Button color='gray' variant='text' href={`/chapter_view/${chapterId}`} className='w-full'>
                <div className="flex flex-row !items-left justify-start flex-1">
                    <ChevronLeftIcon className="w-6 h-6" />
                    <OtherTranslateComponent key={key3} content={chapterTitle} elementId={chapterId} elementType='chapter' elementSubtype="title" />
                </div>
            </Button>
            <div className='flex flex-col'>
                <form onSubmit={handleAddComment}>
                    <div className='flex flex-row items-end'>

                        <textarea
                            value={commentContent}
                            rows={6}
                            className='textarea rounded-xl focus:ring-pink-600 w-full resize-none border border-gray-300 '
                            onChange={(e) => setCommentContent(e.target.value)}
                            placeholder={phrase(dictionary, "typeYourComment", language)}
                            
                        />
                        <br />
                        <button type="submit" className='rounded absolute'>
                            <i className="fa-solid fa-paper-plane ml-2 relative -top-[0.5rem] -right-[24rem]" aria-hidden="true"></i>
                        </button>
                    </div>
                </form>
                <div>
                    <ul>
                        {allComments.map((comment, index) => (
                            (!comment.parent_id) ? (
                                <div key={index} className='flex flex-col py-3'>
                                    <Link href={`/view_profile/${comment.user.id}`}>
                                    <li className='font-extrabold mb-2 text-slate-600'>{comment.user.nickname}</li>
                                   
                                    </Link>
                                    <li className='flex flex-row justify-between w-full'>
                                        {<OtherTranslateComponent key={key1} content={comment.content} elementId={comment.id.toString()} elementType='comment'/>}
                                        <a href="#">
                                            <i onClick={() => updateShowForm(index, !showForm[index])} className='fa-solid fa-reply mb-3'></i>
                                        </a>
                                    </li>
                                    <hr />
                                    <li className='ml-4 py-3'>
                                        {comment.replies ? comment.replies.map((reply, j) => (
                                            <div key={j}>
                                                <li className='font-extrabold mb-2 text-slate-600'>{reply.user.nickname}</li>
                                                <li className='mb-2'>
                                                {<OtherTranslateComponent key={key2} content={reply.content} elementId={reply.id.toString()} elementType='comment'/>}
                                                </li>
                                                <hr />
                                            </div>
                                        )) : <></>
                                        }
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
                                                <polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>
                                                </svg>

                                                    <textarea
                                                        value={replyContent[index]}
                                                        rows={1}
                                                        className='textarea rounded focus:ring-pink-600 w-full resize-none border border-gray-300'
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