import React from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/utils/urls';
import { ToonyzPost } from '@/components/Types';

interface PhotoCardsProps {
  images?: string[];
  posts?: ToonyzPost[];
}

const PhotoCards = ({ images, posts }: PhotoCardsProps) => {
  // If posts are provided, extract image URLs from them
  const imageUrls = posts 
    ? posts.map(post => post.image).filter((img): img is string => !!img)
    : images || [];

  // Ensure we have at least 4 elements in the array, use empty strings as fallbacks
  const safeImages = [...imageUrls, '', '', '', ''].slice(0, 4);

  return (
    <div className="w-full bg-black flex justify-start items-center border-0 shadow-none">
      <div className="relative w-full h-96 perspective-1000">
        {/* First Photo */}
        {safeImages[0] && (
          <div className="absolute w-24 h-24 rounded-3xl shadow-xl bg-blue-100 overflow-hidden 
                        top-5 left-32 z-40 -rotate-6 transition-all duration-500 ease-in-out
                        hover:-translate-y-3">
            <div className="relative w-full h-full">
              <Image
                src={getImageUrl(safeImages[0])}
                alt={posts?.[0]?.title || "image"}
                fill
                sizes="(max-width: 768px) 100vw, 256px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Second Photo */}
        {safeImages[1] && (
          <div className="absolute w-24 h-24 rounded-3xl shadow-xl bg-blue-100 overflow-hidden 
                        top-2 left-10 z-30 rotate-3 transition-all duration-500 ease-in-out
                        hover:-translate-y-3">
            <div className="relative w-full h-full">
              <Image
                src={getImageUrl(safeImages[1])}
                alt={posts?.[1]?.title || "Water feature with lilies"}
                fill
                sizes="(max-width: 768px) 100vw, 256px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Third Photo */}
        {safeImages[2] && (
          <div className="absolute w-24 h-24 rounded-3xl shadow-xl bg-blue-100 overflow-hidden 
                        top-20 left-44 z-20 -rotate-6 transition-all duration-500 ease-in-out
                        hover:-translate-y-3">
            <div className="relative w-full h-full">
              <Image
                src={getImageUrl(safeImages[2])}
                alt={posts?.[2]?.title || "Lily arrangement"}
                fill
                sizes="(max-width: 768px) 100vw, 256px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Fourth Photo */}
        {safeImages[3] && (
          <div className="absolute w-24 h-24 rounded-3xl shadow-xl bg-blue-100 overflow-hidden 
                        top-1 left-120 z-10 rotate-12 transition-all duration-500 ease-in-out
                        hover:-translate-y-3">
            <div className="relative w-full h-full">
              <Image
                src={getImageUrl(safeImages[3])}
                alt={posts?.[3]?.title || "Field of lilies"}
                fill
                sizes="(max-width: 768px) 100vw, 256px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoCards;