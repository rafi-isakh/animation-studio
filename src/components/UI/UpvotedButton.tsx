import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Heart } from "lucide-react";
import { Comment, User } from '@/components/Types';

const getStoredUpvotes = (user: User) => {
    try {
        const stored = user.upvoted_comments;
        return stored ? new Set<string>(JSON.parse(stored) as string[]) : new Set<string>();
    } catch (error) {
        console.error('Error parsing upvoted comments:', error);
        return new Set<string>();
    }
};

export const UpvoteButton = ({ 
    upvotedComments,
    setAllComments, 
    commentId, 
    upvotes,
}: { 
    upvotedComments: string[],
    setAllComments: Dispatch<SetStateAction<Comment[]>>,
    commentId: string, 
    upvotes: number,
}) => {
    // const [upvotedComments, setUpvotedComments] = useState<Set<string>>(getStoredUpvotes(user));
    const [upvoted, setUpvoted] = useState(false);
    
    useEffect(() => {
        setUpvoted(upvotedComments?.includes(commentId));
    }, [upvotedComments]);

    const handleUpvoteComment = async (commentId: string) => {
        const response = await fetch(`/api/upvote_comment?id=${commentId}`);
        if (!response.ok) {
            console.error("Error upvoting comment");
            return;
        }
        const data = await response.json();
        const updatedComment = data.comment;

        setAllComments((prevComments: Comment[]) =>
            prevComments.map((comment: Comment) =>
                comment.id.toString() === commentId
                    ? { ...comment, upvotes: updatedComment.upvotes } as Comment
                    : comment
            )
        );
    };

    return (
        <button onClick={() => handleUpvoteComment(commentId)} className="flex flex-row gap-1 items-center cursor-pointer">
            {upvoted ? (
                <svg width="16" height="15" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z" fill="#DB2777" />
                </svg>
            ) : (
                <Heart size={16} className="text-gray-600" />
            )}
            <span className="text-[#DB2777] text-sm">{upvotes}</span>
        </button>
    );
};

export default UpvoteButton;