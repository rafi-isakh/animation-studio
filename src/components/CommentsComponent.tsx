"use client"
import { useEffect, useRef, useState } from 'react';
import { Chapter, Comment, User, UserCreate } from '@/components/Types'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

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

    const handleAddComment = async (event: React.FormEvent) => {
        event.preventDefault();
        if (commentContent) {
            const user: User = {
                "email": email,
                "nickname": nickname,
                "bio": "",
                "id": -1
            }
            if (!isLoggedIn) {
                return;
            } else {
                var newComment: Comment = {
                    "id": -1, // throwaway, won't use in backend
                    "parent_id": -1, // no parent, this isn't a reply
                    "user": user,
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
        }
        fetchReplies();
    }, [initialFetch])

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
            const user: User = {
                "email": email,
                "nickname": nickname,
                "bio": "",
                "id": -1
            }
            if (!isLoggedIn) {
                return;
            } else {
                const parent_comment_id = allComments[index].id;
                var newComment: Comment = {
                    "id": -1,
                    "parent_id": parent_comment_id,
                    "user": user,
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
                    setLoaded(true);
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
                                    <li className='font-bold'>{comment.user.nickname}</li>
                                    <li className='flex flex-row justify-between w-full'>{comment.content}
                                        <a href="#"><i onClick={() => updateShowForm(index, !showForm[index])} className='fa-solid fa-reply'></i>
                                        </a>
                                    </li>
                                    <hr />
                                    <li className='ml-4'>
                                        {comment.replies ? comment.replies.map((reply, j) => (
                                            <div key={j}>
                                                <li className='font-bold'>{reply.user.nickname}</li>
                                                <li>{reply.content}</li>
                                                <hr />
                                            </div>
                                        )) : <></>
                                        }
                                    </li>
                                    <li>
                                        {showForm[index] ? (
                                            <form id={`replyForm.${index}`} onSubmit={handleReply}>
                                                <div className='flex flex-row space-x-4'>
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