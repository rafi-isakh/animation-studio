"use client"
import { useState } from 'react';
import { Comment, User } from '@/components/Types'
import { useRouter } from 'next/navigation'

// user could be undefined if not logged in
const CommentComponent = ({ webnovelId, user }: { webnovelId: string, user: User }) => {
    const [commentContent, setCommentContent] = useState('');
    const [allComments, setAllComments] = useState<Comment[]>([]);
    const router = useRouter();

    const handleAddComment = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) {
            console.log('pushin')
            router.push("/signin");
        } else {
            var newComment = {
                "user": user,
                "content": commentContent,
                "upvotes": 0,
                "webnovel_id": webnovelId
            }
            // optimistic update
            setAllComments([...allComments, newComment]);
            const response = await fetch('http://localhost:5000/api/add_comment', {
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
                await fetchComments();
            }

            setCommentContent('');
        }
    };

    const fetchComments = async () => {
        const res = await fetch(`http://localhost:5000/api/get_comments?webnovelId=${webnovelId}`)
            .then(data => data.json())
        if (Array.isArray(res)) {
            setAllComments(res);
        }
    }

    return (
        <div>
            <form onSubmit={handleAddComment}>
                <textarea
                    placeholder="Write your comment..."
                    value={commentContent}
                    className='textarea textarea-lg textarea-bordered'
                    onChange={(e) => setCommentContent(e.target.value)}
                />
                <br/>
                <button className='btn' type='submit'>Submit</button>
            </form>
            <div>
                <h2>Comments:</h2>
                <ul>
                    {allComments.map((comment) => (
                        <div>
                            <li>{comment.user.name}</li>
                            <li>{comment.content}</li>
                        </div>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default CommentComponent;