"use client"
import { useEffect, useState } from 'react';
import { Chapter, Comment, User } from '@/components/Types'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// user could be undefined if not logged in
const CommentsComponent = ({ chapterId }: { chapterId: string }) => {
    const [commentContent, setCommentContent] = useState('');
    const [allComments, setAllComments] = useState<Comment[]>([]);
    const [chapter, setChapter] = useState<Chapter>();
    const router = useRouter();
    const { email, username } = useAuth();

    const handleAddComment = async (event: React.FormEvent) => {
        event.preventDefault();
        if (commentContent) {
            const user: User = {
                "email": email,
                "name": username
            }
            event.preventDefault();
            if (!user) {
                router.push("/signin");
            } else {
                var newComment : Comment = {
                    "user": user,
                    "content": commentContent,
                    "upvotes": 0,
                    "chapterId": chapterId
                }
                // optimistic update
                setAllComments([...allComments, newComment]);
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_comment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newComment),
                });

                // remove optimistic update if bad response
                if (!response.ok) {
                    setAllComments(allComments.filter(comment => comment !== newComment));
                } else {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_comments?chapterId=${chapterId}`)
                        .then(data => data.json())
                    if (Array.isArray(res)) {
                        setAllComments(res);
                    }
                }
                setCommentContent('');
            }
        }
    };

    useEffect(() => {
        const fetchComments = async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_comments?chapterId=${chapterId}`)
                .then(data => data.json())
            if (Array.isArray(res)) {
                setAllComments(res);
            }
        }
        const fetchChapter = async() => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_chapter_byid?id=${chapterId}`)
                .then(data => data.json());
            setChapter(res);
        }
        fetchComments();
        fetchChapter();
    }, [chapterId]);

    return (
        <div className='max-w-md flex flex-col items-left mx-auto space-y-4'>
            <Link href={`/chapter_view/${chapterId}`}><i className="fa-solid fa-chevron-left"></i> {chapter?.title}</Link>
            <div className='flex flex-col'>
                <form onSubmit={handleAddComment}>
                    <textarea
                        placeholder="Write your comment..."
                        value={commentContent}
                        rows={4}
                        className='textarea w-full textarea-bordered'
                        onChange={(e) => setCommentContent(e.target.value)}
                    />
                    <br />
                    <button type="submit" className="text-white bg-black hover:text-pink-600 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">등록</button>
                </form>
                <div>
                    <ul>
                        {allComments.map((comment, index) => (
                            <div key={index} className='flex flex-col'>
                                <li className='font-bold'>{comment.user.name}</li>
                                <li>{comment.content}</li>
                                <hr/>
                            </div>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default CommentsComponent;