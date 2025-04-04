'use client'
import CollectionCard from "@/components/UI/CollectionCard"
import { useEffect, useRef, useState } from "react"
import { ToonyzPost } from "@/components/Types"
import moment from 'moment';
import { ScrollArea, ScrollBar } from "@/components/shadcnUI/ScrollArea";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import CardsScroll from "@/components/CardsScroll";
import useMediaQuery from '@mui/material/useMediaQuery';
interface Collection {
    id: string
    title: string
    pinCount: number
    commentCount: number
    created_at: string
    webnovel_id?: string
    images: {
        image: string
        type?: 'image' | 'video'
        thumbnail?: string
    }[]
    commentedBy: { id: string; nickname: string; picture: string }[]
}

interface CollectionGridProps {
    collections: Collection[]
}

export default function CollectionGrid({ collections }: CollectionGridProps) {
    const { dictionary, language } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const MAX_GROUPS = 10;

    return (
        <div className="relative max-w-screen-xl mx-auto">
            <h2 className="text-xl font-bold mb-3">{phrase(dictionary, "ToonyzPost", language)}</h2>
            <div className="relative group">
                <div ref={scrollRef} className="overflow-x-auto no-scrollbar">
                    <div className="flex w-full space-x-4">
                        {collections.slice(0, MAX_GROUPS).map((collection) => (
                            <CollectionCard
                                key={collection.id}
                                id={collection.id}
                                title={collection.title}
                                pinCount={collection.pinCount}
                                commentCount={collection.commentCount}
                                created_at={collection.created_at}
                                images={collection.images}
                                webnovel_id={collection.webnovel_id || ''}
                                commentedBy={collection.commentedBy}
                            />
                        ))}
                    </div>
                </div>
                {!isMobile && <CardsScroll scrollRef={scrollRef} />}
            </div>
        </div>
    )
}



export const ToonyzPostCards = () => {
    const [posts, setPosts] = useState<ToonyzPost[]>([]);

    useEffect(() => {
        const fetchPosts = async () => {
            const response = await fetch('/api/get_toonyz_posts');
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            const data = await response.json();
            setPosts(data);
        };
        fetchPosts();
    }, []);

    // Group posts by webnovel_id
    const groupedPosts = posts.reduce((acc, post) => {
        const webnovelId = post.webnovel_id || 'undefined';
        if (!acc[webnovelId]) {
            acc[webnovelId] = [];
        }
        acc[webnovelId].push(post);
        return acc;
    }, {} as Record<string, ToonyzPost[]>);

    // Transform grouped posts to match the Collection interface
    const collections = Object.entries(groupedPosts).map(([webnovelId, postsGroup]) => {
        // Use the most recent post for metadata (title, created_at)
        const mostRecentPost = [...postsGroup].sort((a, b) => {
            const dateA = a.created_at instanceof Date ? a.created_at : new Date(typeof a.created_at === 'undefined' ? 0 : String(a.created_at));
            const dateB = b.created_at instanceof Date ? b.created_at : new Date(typeof b.created_at === 'undefined' ? 0 : String(b.created_at));
            return dateB.getTime() - dateA.getTime();
        })[0];

        // Count unique users who commented on any post in this group
        const uniqueCommenters = new Set();
        const commenters: { id: string; nickname: string; picture: string }[] = [];

        postsGroup.forEach(post => {
            if (post.comments && Array.isArray(post.comments)) {
                post.comments.forEach(comment => {
                    if (comment.user && comment.user.id && !uniqueCommenters.has(comment.user.id)) {
                        uniqueCommenters.add(comment.user.id);
                        commenters.push({
                            id: comment.user.id.toString(),
                            nickname: comment.user.nickname || 'Anonymous',
                            picture: comment.user.picture || '/default-avatar.png'
                        });
                    }
                });
            }
        });

        return {
            // id: webnovelId === 'undefined' ? `group-${Math.random().toString(36).substr(2, 9)}` : webnovelId,
            id: postsGroup[0].id.toString(),
            title: mostRecentPost.title || '',
            pinCount: postsGroup.length, // Count of posts in this group
            commentCount: uniqueCommenters.size, // Count of unique users who commented
            commentedBy: commenters, // Add the commenter information
            webnovel_id: webnovelId === 'undefined' ? '' : webnovelId,
            created_at: mostRecentPost.created_at instanceof Date
                ? mostRecentPost.created_at.toISOString()
                : typeof mostRecentPost.created_at === 'object' && 'toDate' in mostRecentPost.created_at
                    ? moment(mostRecentPost.created_at).format('MM/DD/YYYY')
                    : String(mostRecentPost.created_at),
            images: postsGroup.map(post => ({
                image: post.image || post.video || '',
                type: post.image ? 'image' as const : 'video' as const
            }))
        };
    });

    // Sort collections by created_at date (newest first)
    const sortedCollections = [...collections].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <CollectionGrid collections={sortedCollections} />
    );
}