'use client'
import CollectionCard from "@/components/UI/CollectionCard"
import { useEffect, useState } from "react"
import { ToonyzPost } from "@/components/Types"
import moment from 'moment';
import { ScrollArea, ScrollBar } from "@/components/shadcnUI/ScrollArea";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

interface Collection {
  id: string
  title: string
  pinCount: number
  created_at: string
  webnovel_id?: string
  images: {
    image: string
    type?: 'image' | 'video'
    thumbnail?: string
  }[]
}

interface CollectionGridProps {
  collections: Collection[]
}

export default function CollectionGrid({ collections }: CollectionGridProps) {
  const { dictionary, language } = useLanguage();
  return (
    <div className="relative max-w-screen-xl mx-auto">
      <h2 className="text-xl font-bold mb-3">{phrase(dictionary, "ToonyzPost", language)}</h2>
      <ScrollArea className="no-scrollbar">
        <div className="flex w-full space-x-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              title={collection.title}
              pinCount={collection.pinCount}
              created_at={collection.created_at}
              images={collection.images}
              webnovel_id={collection.webnovel_id || ''}
            // likedBy={collection.likedBy}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}



export const ToonyzPostCards = () => {
  const [posts, setPosts] = useState<ToonyzPost[]>([]);

  useEffect(() => {
    fetch('/api/get_toonyz_posts')
      .then(res => res.json())
      .then(data => setPosts(data));
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

    return {
      id: webnovelId === 'undefined' ? `group-${Math.random().toString(36).substr(2, 9)}` : webnovelId,
      title: mostRecentPost.title || '',
      pinCount: postsGroup.length, // Count of posts in this group
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