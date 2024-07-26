"use client"
import { useEffect, useRef, useState } from 'react';
import { Chapter, Comment, User, UserCreate } from '@/components/Types'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import OtherTranslateComponent from './OtherTranslateComponent';
import { useLanguage } from '@/contexts/LanguageContext';

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
    const [key1, setKey1] = useState(0);
    const [key2, setKey2] = useState(10);
    const {language} = useLanguage();
    const [repliesKey, setRepliesKey] = useState(20);

    useEffect(() => {
        setKey1(prevKey => prevKey + 1)
        setKey2(prevKey => prevKey + 1)
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

                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_comment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newComment),
                });
                if (!response.ok) {
                    console.log("Error adding comment");
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_comments?chapter_id=${chapterId}`)
                .then(data => data.json())
            if (Array.isArray(res)) {
                setAllComments(res);
                setInitialFetch(true);
            }
            return res;
        }
        const fetchChapter = async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_chapter_byid?id=${chapterId}`)
                .then(data => data.json());
            setChapter(res);
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

                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_comment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newComment),
                });
                if (!response.ok) {
                    console.log("Error adding comment");
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
        <div className='max-w-md flex flex-col items-left mx-auto space-y-4'>
            <Link href={`/chapter_view/${chapterId}`}><i className="fa-solid fa-chevron-left"></i> {chapter?.title}</Link>
            <div className='flex flex-col'>
                <form onSubmit={handleAddComment}>
                    <div className='flex flex-row items-end'>
                        <textarea
                            value={commentContent}
                            rows={4}
                            className='textarea border-none rounded focus:ring-pink-600 w-full bg-gray-200 resize-none'
                            onChange={(e) => setCommentContent(e.target.value)}
                        />
                        <br />
                        <button type="submit">
                            <i className="fa-solid fa-paper-plane ml-2" aria-hidden="true"></i>
                        </button>
                    </div>
                </form>
                <div>
                    <ul>
                        {allComments.map((comment, index) => (
                            (!comment.parent_id) ? (
                                <div key={index} className='flex flex-col'>
                                    <Link href={`/view_profile/${comment.user.id}`}><li className='font-bold'>{comment.user.nickname}</li></Link>
                                    <li className='flex flex-row justify-between w-full'>
                                        {<OtherTranslateComponent key={key1} content={comment.content} elementId={comment.id.toString()} elementType='comment'/>}
                                        <a href="#"><i onClick={() => updateShowForm(index, !showForm[index])} className='fa-solid fa-reply'></i>
                                        </a>
                                    </li>
                                    <hr />
                                    <li className='ml-4'>
                                        {comment.replies ? comment.replies.map((reply, j) => (
                                            <div key={j}>
                                                <li className='font-bold'>{reply.user.nickname}</li>
                                                <li>
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
                                                <div className='flex flex-row space-x-4 ml-4'>
                                                    <textarea
                                                        value={replyContent[index]}
                                                        rows={1}
                                                        className='textarea border-none rounded focus:ring-pink-600 w-full bg-gray-200 resize-none'
                                                        onChange={(e) => updateReplyContent(index, e.target.value)}
                                                    />
                                                    <button type="submit">
                                                        <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </form>
                                        )
                                            : <hr />
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